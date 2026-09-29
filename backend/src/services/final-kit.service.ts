import { interviewKitSchema } from "../validators/kit.validator";
import type { InterviewKit } from "../types/kit";

export interface FinalKitInput {
  company: string;
  company_url: string;
  role: string;
  location: string;
  jd_text: string;
  companyBrief: {
    summary: string;
    what_they_do: string;
    sources: string[];
  };
  seniority: string;
  responsibilities: string[];
  requirements: InterviewKit["role"]["requirements"];
  questions: InterviewKit["questions"];
  flashcards: InterviewKit["flashcards"];
  schedule: InterviewKit["schedule"];
  coverage: InterviewKit["coverage"];
  pagesUsed: string[];
}

export class KitValidationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "KitValidationError";
  }
}

/**
 * Cross-field checks that a shape-only schema (Zod) cannot express:
 * every reference between arrays must point at something that actually exists.
 */
function assertReferentialIntegrity(input: FinalKitInput): void {
  const requirementIds = new Set(
    input.requirements.map((requirement) => requirement.id),
  );

  const questionIds = new Set(input.questions.map((question) => question.id));

  for (const question of input.questions) {
    for (const requirementId of question.requirement_ids) {
      if (!requirementIds.has(requirementId)) {
        throw new KitValidationError(
          "DANGLING_REQUIREMENT_REFERENCE",
          `Question "${question.id}" references requirement "${requirementId}", which does not exist.`,
        );
      }
    }
  }

  for (const flashcard of input.flashcards) {
    for (const requirementId of flashcard.requirement_ids) {
      if (!requirementIds.has(requirementId)) {
        throw new KitValidationError(
          "DANGLING_REQUIREMENT_REFERENCE",
          `Flashcard "${flashcard.id}" references requirement "${requirementId}", which does not exist.`,
        );
      }
    }
  }

  for (const day of input.schedule.days) {
    for (const questionId of day.question_ids) {
      if (!questionIds.has(questionId)) {
        throw new KitValidationError(
          "DANGLING_QUESTION_REFERENCE",
          `Schedule day ${day.day} references question "${questionId}", which does not exist.`,
        );
      }
    }
  }

  // Every generated question must appear in the schedule exactly once.
  const scheduledQuestionIds = input.schedule.days.flatMap(
    (day) => day.question_ids,
  );

  const scheduledQuestionIdSet = new Set(scheduledQuestionIds);

  if (scheduledQuestionIds.length !== input.questions.length) {
    throw new KitValidationError(
      "SCHEDULE_QUESTION_COUNT_MISMATCH",
      "Schedule must contain every question exactly once.",
    );
  }

  if (scheduledQuestionIdSet.size !== input.questions.length) {
    throw new KitValidationError(
      "DUPLICATE_SCHEDULE_QUESTION",
      "A question appears more than once in the schedule.",
    );
  }

  for (const question of input.questions) {
    if (!scheduledQuestionIdSet.has(question.id)) {
      throw new KitValidationError(
        "UNSCHEDULED_QUESTION",
        `Question "${question.id}" is not scheduled.`,
      );
    }
  }

  for (const requirementId of input.coverage.uncovered_requirement_ids) {
    if (!requirementIds.has(requirementId)) {
      throw new KitValidationError(
        "DANGLING_REQUIREMENT_REFERENCE",
        `Coverage report references requirement "${requirementId}", which does not exist.`,
      );
    }
  }
}

export function buildFinalKit(input: FinalKitInput): InterviewKit {
  assertReferentialIntegrity(input);

  const candidate = {
    source: {
      company: input.company,
      company_url: input.company_url,
      role: input.role,
      location: input.location,
      jd_text: input.jd_text,
      jd_chars: input.jd_text.length,
      researched_at: new Date().toISOString(),
      pages_used: input.pagesUsed,
    },

    company_brief: input.companyBrief,

    role: {
      title: input.role,
      seniority: input.seniority,
      responsibilities: input.responsibilities,
      requirements: input.requirements,
    },

    questions: input.questions,

    flashcards: input.flashcards,

    schedule: input.schedule,

    coverage: input.coverage,
  };

  const parsed = interviewKitSchema.safeParse(candidate);

  if (!parsed.success) {
    throw new KitValidationError(
      "KIT_STRUCTURE_INVALID",
      `Generated kit failed structure validation: ${parsed.error.message}`,
    );
  }

  return parsed.data;
}
