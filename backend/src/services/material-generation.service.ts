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

import { generateForRequirement } from "./question-generation.service";

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

export async function generateInterviewMaterial(
  input: MaterialGenerationInput,
): Promise<MaterialGenerationResult> {
  const questions: Question[] = [];
  const flashcards: Flashcard[] = [];

  for (const requirement of input.requirements) {
    const generated = await generateForRequirement({
      requirement,
      role: input.role,
      seniority: input.seniority,
      companyBrief: input.companyBrief,
    });

    for (const question of generated.questions) {
      /*
       * Validate the pair before mapping it into
       * the canonical Question type.
       *
       * prompt and answer_outline intentionally
       * come from the SAME generated question
       * object.
       */
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

    for (const flashcard of generated.flashcards) {
      if (!flashcard.front.trim() || !flashcard.back.trim()) {
        throw new Error("FLASHCARD_GENERATION_INVALID_OUTPUT");
      }

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

  return {
    questions,
    flashcards,
  };
}
