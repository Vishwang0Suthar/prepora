// material-generation.service.ts
// import { randomUUID } from "crypto";
// import type { Flashcard, Question, Requirement } from "../types/kit";
// import { generateForRequirement } from "./question-generation.service";

// interface MaterialGenerationInput {
//   role: string;
//   seniority: string;
//   companyBrief: {
//     summary: string;
//     what_they_do: string;
//   };
//   requirements: Requirement[];
// }

// export interface MaterialGenerationResult {
//   questions: Question[];
//   flashcards: Flashcard[];
// }

// export async function generateInterviewMaterial(
//   input: MaterialGenerationInput,
// ): Promise<MaterialGenerationResult> {
//   const questions: Question[] = [];
//   const flashcards: Flashcard[] = [];

//   for (const requirement of input.requirements) {
//     const generated = await generateForRequirement({
//       requirement,
//       role: input.role,
//       seniority: input.seniority,
//       companyBrief: input.companyBrief,
//     });

//     for (const question of generated.questions) {
//       questions.push({
//         id: `q_${randomUUID()}`,
//         requirement_ids: [requirement.id],
//         category: question.category,
//         prompt: question.prompt,
//         answer_outline: question.answer_outline,
//         difficulty: question.difficulty,
//         origin: "generated",
//         pinned: false,
//       });
//     }

//     for (const flashcard of generated.flashcards) {
//       flashcards.push({
//         id: `f_${randomUUID()}`,
//         front: flashcard.front,
//         back: flashcard.back,
//         requirement_ids: [requirement.id],
//         origin: "generated",
//         pinned: false,
//       });
//     }
//   }

//   return {
//     questions,
//     flashcards,
//   };
// }

// material-generation.service.ts
import { randomUUID } from "crypto";

import type { Flashcard, Question, Requirement } from "../types/kit";

import { generateForRequirementsBatch } from "./question-generation.service";

interface MaterialGenerationInput {
  role: string;

  seniority: string;

  companyBrief: {
    summary: string;
    what_they_do: string;
  };

  requirements: Requirement[];
}

export interface MaterialGenerationResult {
  questions: Question[];
  flashcards: Flashcard[];
}

const REQUIREMENTS_PER_BATCH = 5;

function validateGeneratedQuestion(question: {
  prompt: string;
  answer_outline: string;
}): void {
  if (!question.prompt.trim()) {
    throw new Error("QUESTION_GENERATION_EMPTY_PROMPT");
  }

  if (!question.answer_outline.trim()) {
    throw new Error("QUESTION_GENERATION_EMPTY_ANSWER");
  }
}

function validateGeneratedFlashcard(flashcard: {
  front: string;
  back: string;
}): void {
  if (!flashcard.front.trim() || !flashcard.back.trim()) {
    throw new Error("FLASHCARD_GENERATION_INVALID_OUTPUT");
  }
}

function chunkRequirements(
  requirements: Requirement[],
  chunkSize: number,
): Requirement[][] {
  const chunks: Requirement[][] = [];

  for (let index = 0; index < requirements.length; index += chunkSize) {
    chunks.push(requirements.slice(index, index + chunkSize));
  }

  return chunks;
}

export async function generateInterviewMaterial(
  input: MaterialGenerationInput,
): Promise<MaterialGenerationResult> {
  const questions: Question[] = [];
  const flashcards: Flashcard[] = [];

  const requirementBatches = chunkRequirements(
    input.requirements,
    REQUIREMENTS_PER_BATCH,
  );

  /*
   * Generate batches sequentially.
   *
   * We intentionally do not use Promise.all() here.
   * The objective is to reduce the number of LLM calls while
   * avoiding unnecessary concurrent pressure on the provider.
   *
   * Example:
   *
   * 12 requirements
   * → batch of 5
   * → batch of 5
   * → batch of 2
   * → 3 LLM calls
   */
  for (const requirementBatch of requirementBatches) {
    const generated = await generateForRequirementsBatch({
      requirements: requirementBatch,
      role: input.role,
      seniority: input.seniority,
      companyBrief: input.companyBrief,
    });

    /*
     * The batch generator validates that every supplied requirement
     * appears exactly once. We still resolve each result by ID here
     * rather than relying on array ordering.
     */
    for (const requirement of requirementBatch) {
      const requirementResult = generated.items.find(
        (item) => item.requirement_id === requirement.id,
      );

      if (!requirementResult) {
        throw new Error(
          `QUESTION_GENERATION_MISSING_REQUIREMENT_RESULT:${requirement.id}`,
        );
      }

      for (const question of requirementResult.questions) {
        validateGeneratedQuestion(question);

        questions.push({
          id: `q_${randomUUID()}`,
          requirement_ids: [requirement.id],
          category: question.category,
          prompt: question.prompt,
          answer_outline: question.answer_outline,
          difficulty: question.difficulty,
          origin: "generated",
          pinned: false,
        });
      }

      for (const flashcard of requirementResult.flashcards) {
        validateGeneratedFlashcard(flashcard);

        flashcards.push({
          id: `f_${randomUUID()}`,
          front: flashcard.front,
          back: flashcard.back,
          requirement_ids: [requirement.id],
          origin: "generated",
          pinned: false,
        });
      }
    }
  }

  return {
    questions,
    flashcards,
  };
}
