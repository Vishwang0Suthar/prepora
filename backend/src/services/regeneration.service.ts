import type {
  Flashcard,
  InterviewKit,
  Question,
  QuestionCategory,
} from "../types/kit";

import { checkCoverage } from "./coverage.service";
import { getKit, updateKitJson } from "./kit.service";
import { buildFinalKit, KitValidationError } from "./final-kit.service";

import { generateCompanyBrief } from "./company-brief.service";
import { generateForRequirement } from "./question-generation.service";
import { allocateSchedule } from "./schedule.service";

import { researchCompany } from "../research/company";
import { buildCompanyResearchContext } from "../research/context";

interface LoadedKit {
  kit: InterviewKit;
}

function normalizeQuestion(question: Question): Question {
  return {
    ...question,
    origin: question.origin ?? "generated",
    pinned: question.pinned ?? false,
  };
}

function normalizeFlashcard(flashcard: Flashcard): Flashcard {
  return {
    ...flashcard,
    origin: flashcard.origin ?? "generated",
    pinned: flashcard.pinned ?? false,
  };
}

function normalizeKit(kit: InterviewKit, jdText: string): InterviewKit {
  return {
    ...kit,

    source: {
      ...kit.source,

      // Preserve the JD already stored inside kit_json.
      // For older kits, fall back to the canonical JD
      // stored in the kits table.
      jd_text: kit.source?.jd_text ?? jdText,

      // Keep jd_chars consistent with the actual JD.
      jd_chars: (kit.source?.jd_text ?? jdText).length,
    },

    questions: kit.questions.map(normalizeQuestion),

    flashcards: kit.flashcards.map(normalizeFlashcard),
  };
}

async function loadKit(kitId: string, userId: string): Promise<LoadedKit> {
  const row = await getKit(kitId, userId);

  if (!row) {
    throw new KitValidationError("KIT_NOT_FOUND", "Kit not found.");
  }

  if (!row.kit_json) {
    throw new KitValidationError(
      "KIT_NOT_READY",
      "Kit is not ready for regeneration.",
    );
  }

  return {
    kit: normalizeKit(row.kit_json as InterviewKit, row.jd_text),
  };
}

async function persistKit(
  kitId: string,
  userId: string,
  kit: InterviewKit,
): Promise<InterviewKit> {
  const jdText = kit.source.jd_text;

  if (!jdText) {
    throw new KitValidationError(
      "JD_TEXT_MISSING",
      "Original job description is missing from the kit.",
    );
  }

  const validated = buildFinalKit({
    company: kit.source.company,
    company_url: kit.source.company_url,
    role: kit.source.role,
    location: kit.source.location,

    // Always preserve the original JD.
    jd_text: jdText,

    companyBrief: kit.company_brief,

    seniority: kit.role.seniority,

    responsibilities: kit.role.responsibilities,

    requirements: kit.role.requirements,

    questions: kit.questions,

    flashcards: kit.flashcards,

    schedule: kit.schedule,

    coverage: kit.coverage,

    pagesUsed: kit.source.pages_used,
  });

  await updateKitJson(kitId, userId, validated);

  return validated;
}

/**
 * A generated item can be replaced only when
 * it has NOT been edited and NOT been pinned.
 *
 * Everything else is user-owned content and
 * must survive regeneration.
 */
function isRegeneratable(item: { origin: string; pinned: boolean }): boolean {
  return item.origin === "generated" && item.pinned === false;
}

/**
 * Regenerate questions belonging to one category.
 *
 * Only generated + unpinned questions are replaced.
 * Edited, manual, and pinned questions survive.
 *
 * Flashcards are intentionally untouched because the
 * regeneration boundary is the question category.
 */
export async function regenerateQuestionCategory(
  kitId: string,
  userId: string,
  category: QuestionCategory,
): Promise<{
  questions: Question[];
}> {
  const { kit } = await loadKit(kitId, userId);

  const requirements = kit.role.requirements.filter((requirement) =>
    kit.questions.some(
      (question) =>
        question.category === category &&
        question.requirement_ids.includes(requirement.id),
    ),
  );

  if (requirements.length === 0) {
    throw new KitValidationError(
      "CATEGORY_NOT_FOUND",
      `No requirements found for question category "${category}".`,
    );
  }

  const generatedQuestions: Question[] = [];

  for (const requirement of requirements) {
    const generated = await generateForRequirement({
      requirement,
      role: kit.role.title,
      seniority: kit.role.seniority,
      companyBrief: kit.company_brief,
    });

    for (const question of generated.questions) {
      if (question.category !== category) {
        continue;
      }

      generatedQuestions.push({
        id: `q_${crypto.randomUUID()}`,
        requirement_ids: [requirement.id],
        category: question.category,
        prompt: question.prompt,
        answer_outline: question.answer_outline,
        difficulty: question.difficulty,
        origin: "generated",
        pinned: false,
      });
    }
  }

  if (generatedQuestions.length === 0) {
    throw new KitValidationError(
      "CATEGORY_GENERATION_EMPTY",
      `No ${category} questions were generated.`,
    );
  }

  const preservedQuestions = kit.questions.filter(
    (question) => question.category !== category || !isRegeneratable(question),
  );

  kit.questions = [...preservedQuestions, ...generatedQuestions];

  kit.coverage = checkCoverage(
    kit.role.requirements,
    kit.questions,
    kit.coverage.passes + 1,
  );

  kit.schedule = allocateSchedule(
    kit.questions,
    kit.role.requirements,
    kit.schedule.days_available,
  );

  const validated = await persistKit(kitId, userId, kit);

  return {
    questions: validated.questions.filter(
      (question) => question.category === category,
    ),
  };
}

/**
 * Regenerate the company brief.
 *
 * Research is refreshed first so the new brief
 * is based on current company information.
 */
export async function regenerateCompanyBrief(
  kitId: string,
  userId: string,
): Promise<InterviewKit["company_brief"]> {
  const { kit } = await loadKit(kitId, userId);

  const research = await researchCompany(
    kit.source.company,
    kit.source.company_url,
  );

  const researchContext = buildCompanyResearchContext(
    research.crawl,
    research.hiring,
    research.discussion,
  );

  const companyBrief = await generateCompanyBrief(
    kit.source.company,
    researchContext.text,
    researchContext.sources,
  );

  kit.company_brief = companyBrief;

  /*
   * Update the source research metadata
   * without changing the original company identity
   * or JD.
   */
  kit.source.pages_used = researchContext.pagesUsed;

  kit.source.researched_at = new Date().toISOString();

  const validated = await persistKit(kitId, userId, kit);

  return validated.company_brief;
}

/**
 * Regenerate questions/flashcards for one
 * requirement while preserving user-owned content.
 *
 * The requirement itself is the regeneration
 * boundary. We do not replace material belonging
 * to other requirements.
 */
export async function regenerateRequirement(
  kitId: string,
  userId: string,
  requirementId: string,
): Promise<{
  questions: Question[];
  flashcards: Flashcard[];
}> {
  const { kit } = await loadKit(kitId, userId);

  const requirement = kit.role.requirements.find(
    (item) => item.id === requirementId,
  );

  if (!requirement) {
    throw new KitValidationError(
      "REQUIREMENT_NOT_FOUND",
      `Requirement "${requirementId}" not found.`,
    );
  }

  const generated = await generateForRequirement({
    requirement,
    role: kit.role.title,
    seniority: kit.role.seniority,
    companyBrief: kit.company_brief,
  });

  const generatedQuestions: Question[] = generated.questions.map(
    (question) => ({
      id: `q_${crypto.randomUUID()}`,
      requirement_ids: [requirement.id],
      category: question.category,
      prompt: question.prompt,
      answer_outline: question.answer_outline,
      difficulty: question.difficulty,
      origin: "generated",
      pinned: false,
    }),
  );

  const generatedFlashcards: Flashcard[] = generated.flashcards.map(
    (flashcard) => ({
      id: `f_${crypto.randomUUID()}`,
      front: flashcard.front,
      back: flashcard.back,
      requirement_ids: [requirement.id],
      origin: "generated",
      pinned: false,
    }),
  );

  /*
   * Preserve edited, manual, and pinned questions.
   * Replace only generated + unpinned questions
   * belonging to this requirement.
   */
  const preservedQuestions = kit.questions.filter(
    (question) =>
      !question.requirement_ids.includes(requirementId) ||
      !isRegeneratable(question),
  );

  const preservedFlashcards = kit.flashcards.filter(
    (flashcard) =>
      !flashcard.requirement_ids.includes(requirementId) ||
      !isRegeneratable(flashcard),
  );

  kit.questions = [...preservedQuestions, ...generatedQuestions];

  kit.flashcards = [...preservedFlashcards, ...generatedFlashcards];

  /*
   * Regeneration can change the question set,
   * therefore rebuild coverage from the new
   * question set.
   */
  kit.coverage = checkCoverage(
    kit.role.requirements,
    kit.questions,
    kit.coverage.passes + 1,
  );

  /*
   * Regeneration can change the question set,
   * therefore rebuild the deterministic schedule.
   */
  kit.schedule = allocateSchedule(
    kit.questions,
    kit.role.requirements,
    kit.schedule.days_available,
  );

  const validated = await persistKit(kitId, userId, kit);

  return {
    questions: validated.questions.filter((question) =>
      question.requirement_ids.includes(requirementId),
    ),

    flashcards: validated.flashcards.filter((flashcard) =>
      flashcard.requirement_ids.includes(requirementId),
    ),
  };
}

/**
 * Regenerate only the deterministic schedule.
 *
 * No LLM call is required.
 */
export async function regenerateSchedule(
  kitId: string,
  userId: string,
): Promise<InterviewKit["schedule"]> {
  const { kit } = await loadKit(kitId, userId);

  kit.schedule = allocateSchedule(
    kit.questions,
    kit.role.requirements,
    kit.schedule.days_available,
  );

  const validated = await persistKit(kitId, userId, kit);

  return validated.schedule;
}
