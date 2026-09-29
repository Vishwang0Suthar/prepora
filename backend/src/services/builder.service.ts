import type { Flashcard, InterviewKit, Question } from "../types/kit";

import { getKit, updateKitJson } from "./kit.service";

import { buildFinalKit, KitValidationError } from "./final-kit.service";

export interface UpdateQuestionInput {
  prompt?: string;
  answer_outline?: string;
  category?: "technical" | "behavioural" | "system-design" | "company-fit";
  difficulty?: 1 | 2 | 3;
  requirement_ids?: string[];
  pinned?: boolean;
}

export interface CreateQuestionInput {
  prompt: string;
  answer_outline: string;
  category: "technical" | "behavioural" | "system-design" | "company-fit";
  difficulty: 1 | 2 | 3;
  requirement_ids: string[];
  pinned?: boolean;
}
export interface ReorderQuestionsInput {
  question_ids: string[];
}

export interface UpdateFlashcardInput {
  front?: string;
  back?: string;
  requirement_ids?: string[];
  pinned?: boolean;
}

export interface CreateFlashcardInput {
  front: string;
  back: string;
  requirement_ids: string[];
  pinned?: boolean;
}

export interface ReorderFlashcardsInput {
  flashcard_ids: string[];
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

function normalizeKit(kit: InterviewKit): InterviewKit {
  return {
    ...kit,
    questions: kit.questions.map(normalizeQuestion),
    flashcards: kit.flashcards.map(normalizeFlashcard),
  };
}

function validateRequirementIds(kit: InterviewKit, requirementIds: string[]) {
  const validRequirementIds = new Set(
    kit.role.requirements.map((requirement) => requirement.id),
  );

  for (const requirementId of requirementIds) {
    if (!validRequirementIds.has(requirementId)) {
      throw new KitValidationError(
        "DANGLING_REQUIREMENT_REFERENCE",
        `Requirement "${requirementId}" does not exist.`,
      );
    }
  }
}
function validateExactIdSet(
  existingIds: string[],
  requestedIds: string[],
  entityName: string,
) {
  if (existingIds.length !== requestedIds.length) {
    throw new KitValidationError(
      `INVALID_${entityName.toUpperCase()}_ORDER`,
      `Reorder must contain every ${entityName} exactly once.`,
    );
  }

  const existingSet = new Set(existingIds);
  const requestedSet = new Set(requestedIds);

  if (requestedSet.size !== requestedIds.length) {
    throw new KitValidationError(
      `INVALID_${entityName.toUpperCase()}_ORDER`,
      `Reorder contains duplicate ${entityName} IDs.`,
    );
  }

  for (const id of requestedIds) {
    if (!existingSet.has(id)) {
      throw new KitValidationError(
        `INVALID_${entityName.toUpperCase()}_ORDER`,
        `Unknown ${entityName} ID "${id}".`,
      );
    }
  }

  if (requestedSet.size !== existingSet.size) {
    throw new KitValidationError(
      `INVALID_${entityName.toUpperCase()}_ORDER`,
      `Reorder must contain every ${entityName} exactly once.`,
    );
  }
}
async function loadKit(kitId: string, userId: string): Promise<InterviewKit> {
  const row = await getKit(kitId, userId);

  if (!row) {
    throw new KitValidationError("KIT_NOT_FOUND", "Kit not found.");
  }

  if (!row.kit_json) {
    throw new KitValidationError(
      "KIT_NOT_READY",
      "Kit is not ready for editing.",
    );
  }

  return normalizeKit(row.kit_json as InterviewKit);
}

async function persistKit(
  kitId: string,
  userId: string,
  kit: InterviewKit,
): Promise<InterviewKit> {
  const validated = buildFinalKit({
    company: kit.source.company,
    company_url: kit.source.company_url,
    role: kit.source.role,
    location: kit.source.location,
    jd_text: "",
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

export async function updateQuestion(
  kitId: string,
  userId: string,
  questionId: string,
  input: UpdateQuestionInput,
): Promise<Question> {
  const kit = await loadKit(kitId, userId);

  const questionIndex = kit.questions.findIndex(
    (question) => question.id === questionId,
  );

  if (questionIndex === -1) {
    throw new KitValidationError(
      "QUESTION_NOT_FOUND",
      `Question "${questionId}" not found.`,
    );
  }

  const existingQuestion = kit.questions[questionIndex];

  if (input.requirement_ids) {
    validateRequirementIds(kit, input.requirement_ids);
  }
  if (input.prompt !== undefined && input.answer_outline === undefined) {
    throw new KitValidationError(
      "ANSWER_OUTLINE_REQUIRED",
      "answer_outline is required when prompt is changed.",
    );
  }
  const updatedQuestion: Question = {
    ...existingQuestion,
    ...input,
    origin: "edited",
    pinned: input.pinned ?? existingQuestion.pinned,
  };

  kit.questions[questionIndex] = updatedQuestion;

  const validated = await persistKit(kitId, userId, kit);

  const persistedQuestion = validated.questions.find(
    (question) => question.id === questionId,
  );

  if (!persistedQuestion) {
    throw new KitValidationError(
      "QUESTION_NOT_FOUND",
      `Question "${questionId}" was not found after persistence.`,
    );
  }

  return persistedQuestion;
}

export async function createQuestion(
  kitId: string,
  userId: string,
  input: CreateQuestionInput,
): Promise<Question> {
  const kit = await loadKit(kitId, userId);

  validateRequirementIds(kit, input.requirement_ids);

  const question: Question = {
    id: `q_manual_${crypto.randomUUID()}`,
    requirement_ids: input.requirement_ids,
    category: input.category,
    prompt: input.prompt,
    answer_outline: input.answer_outline,
    difficulty: input.difficulty,
    origin: "manual",
    pinned: input.pinned ?? false,
  };

  kit.questions.push(question);

  /*
   * buildFinalKit requires every question to
   * appear in the schedule exactly once.
   *
   * Add a manually-created question to the
   * least-loaded schedule day.
   */
  if (kit.schedule.days.length === 0) {
    throw new KitValidationError(
      "SCHEDULE_EMPTY",
      "Cannot add a question because the kit has no schedule days.",
    );
  }

  const targetDayIndex = kit.schedule.days.reduce(
    (bestIndex, day, index, days) => {
      if (day.question_ids.length < days[bestIndex].question_ids.length) {
        return index;
      }

      return bestIndex;
    },
    0,
  );

  const targetDay = kit.schedule.days[targetDayIndex];

  targetDay.question_ids.push(question.id);

  /*
   * The generated schedule allocates 10 minutes
   * per question. Keep the schedule internally
   * consistent when manually adding one.
   */
  targetDay.minutes += 10;

  const validated = await persistKit(kitId, userId, kit);

  const persistedQuestion = validated.questions.find(
    (item) => item.id === question.id,
  );

  if (!persistedQuestion) {
    throw new KitValidationError(
      "QUESTION_NOT_FOUND",
      `Question "${question.id}" was not found after persistence.`,
    );
  }

  return persistedQuestion;
}

export async function deleteQuestion(
  kitId: string,
  userId: string,
  questionId: string,
): Promise<{
  deleted_question_id: string;
}> {
  const kit = await loadKit(kitId, userId);

  const questionExists = kit.questions.some(
    (question) => question.id === questionId,
  );

  if (!questionExists) {
    throw new KitValidationError(
      "QUESTION_NOT_FOUND",
      `Question "${questionId}" not found.`,
    );
  }

  kit.questions = kit.questions.filter(
    (question) => question.id !== questionId,
  );

  kit.schedule.days = kit.schedule.days.map((day) => {
    const hadQuestion = day.question_ids.includes(questionId);

    return {
      ...day,
      question_ids: day.question_ids.filter((id) => id !== questionId),
      minutes: hadQuestion ? Math.max(0, day.minutes - 10) : day.minutes,
    };
  });

  await persistKit(kitId, userId, kit);

  return {
    deleted_question_id: questionId,
  };
}

export async function reorderQuestions(
  kitId: string,
  userId: string,
  questionIds: string[],
): Promise<Question[]> {
  const kit = await loadKit(kitId, userId);

  const existingIds = kit.questions.map((question) => question.id);

  validateExactIdSet(existingIds, questionIds, "question");

  const questionMap = new Map(
    kit.questions.map((question) => [question.id, question]),
  );

  kit.questions = questionIds.map((questionId) => {
    const question = questionMap.get(questionId);

    if (!question) {
      throw new KitValidationError(
        "QUESTION_NOT_FOUND",
        `Question "${questionId}" not found.`,
      );
    }

    return question;
  });

  const validated = await persistKit(kitId, userId, kit);

  return validated.questions;
}

export async function createFlashcard(
  kitId: string,
  userId: string,
  input: CreateFlashcardInput,
): Promise<Flashcard> {
  const kit = await loadKit(kitId, userId);

  validateRequirementIds(kit, input.requirement_ids);

  const flashcard: Flashcard = {
    id: `f_manual_${crypto.randomUUID()}`,
    front: input.front,
    back: input.back,
    requirement_ids: input.requirement_ids,
    origin: "manual",
    pinned: input.pinned ?? false,
  };

  kit.flashcards.push(flashcard);

  const validated = await persistKit(kitId, userId, kit);

  const persistedFlashcard = validated.flashcards.find(
    (item) => item.id === flashcard.id,
  );

  if (!persistedFlashcard) {
    throw new KitValidationError(
      "FLASHCARD_NOT_FOUND",
      `Flashcard "${flashcard.id}" was not found after persistence.`,
    );
  }

  return persistedFlashcard;
}

export async function updateFlashcard(
  kitId: string,
  userId: string,
  flashcardId: string,
  input: UpdateFlashcardInput,
): Promise<Flashcard> {
  const kit = await loadKit(kitId, userId);

  const flashcardIndex = kit.flashcards.findIndex(
    (flashcard) => flashcard.id === flashcardId,
  );

  if (flashcardIndex === -1) {
    throw new KitValidationError(
      "FLASHCARD_NOT_FOUND",
      `Flashcard "${flashcardId}" not found.`,
    );
  }

  if (input.requirement_ids) {
    validateRequirementIds(kit, input.requirement_ids);
  }

  const existingFlashcard = kit.flashcards[flashcardIndex];
  if (input.front !== undefined && input.back === undefined) {
    throw new KitValidationError(
      "FLASHCARD_BACK_REQUIRED",
      "back is required when front is changed.",
    );
  }
  kit.flashcards[flashcardIndex] = {
    ...existingFlashcard,
    ...input,
    origin: "edited",
    pinned: input.pinned ?? existingFlashcard.pinned,
  };

  const validated = await persistKit(kitId, userId, kit);

  const persistedFlashcard = validated.flashcards.find(
    (flashcard) => flashcard.id === flashcardId,
  );

  if (!persistedFlashcard) {
    throw new KitValidationError(
      "FLASHCARD_NOT_FOUND",
      `Flashcard "${flashcardId}" was not found after persistence.`,
    );
  }

  return persistedFlashcard;
}

export async function deleteFlashcard(
  kitId: string,
  userId: string,
  flashcardId: string,
): Promise<{
  deleted_flashcard_id: string;
}> {
  const kit = await loadKit(kitId, userId);

  const flashcardExists = kit.flashcards.some(
    (flashcard) => flashcard.id === flashcardId,
  );

  if (!flashcardExists) {
    throw new KitValidationError(
      "FLASHCARD_NOT_FOUND",
      `Flashcard "${flashcardId}" not found.`,
    );
  }

  kit.flashcards = kit.flashcards.filter(
    (flashcard) => flashcard.id !== flashcardId,
  );

  await persistKit(kitId, userId, kit);

  return {
    deleted_flashcard_id: flashcardId,
  };
}

export async function reorderFlashcards(
  kitId: string,
  userId: string,
  flashcardIds: string[],
): Promise<Flashcard[]> {
  const kit = await loadKit(kitId, userId);

  const existingIds = kit.flashcards.map((flashcard) => flashcard.id);

  validateExactIdSet(existingIds, flashcardIds, "flashcard");

  const flashcardMap = new Map(
    kit.flashcards.map((flashcard) => [flashcard.id, flashcard]),
  );

  kit.flashcards = flashcardIds.map((flashcardId) => {
    const flashcard = flashcardMap.get(flashcardId);

    if (!flashcard) {
      throw new KitValidationError(
        "FLASHCARD_NOT_FOUND",
        `Flashcard "${flashcardId}" not found.`,
      );
    }

    return flashcard;
  });

  const validated = await persistKit(kitId, userId, kit);

  return validated.flashcards;
}
