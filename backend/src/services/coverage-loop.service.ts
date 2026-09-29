// coverage-loop.service.ts
import type { Flashcard, Question, Requirement } from "../types/kit";

import { checkCoverage } from "./coverage.service";
import { generateForRequirement } from "./question-generation.service";

const MAX_COVERAGE_PASSES = 3;

export interface CoverageLoopResult {
  questions: Question[];
  flashcards: Flashcard[];
  coverage: {
    uncovered_requirement_ids: string[];
    passes: number;
  };
}

export async function ensureCoverage(input: {
  role: string;
  seniority: string;
  companyBrief: {
    summary: string;
    what_they_do: string;
  };
  requirements: Requirement[];
  questions: Question[];
  flashcards: Flashcard[];
  generateForRequirementFn?: typeof generateForRequirement;
}): Promise<CoverageLoopResult> {
  const generateRequirement =
    input.generateForRequirementFn ?? generateForRequirement;

  let questions = [...input.questions];
  let flashcards = [...input.flashcards];

  for (let pass = 1; pass <= MAX_COVERAGE_PASSES; pass++) {
    const coverage = checkCoverage(input.requirements, questions, pass);

    if (coverage.uncovered_requirement_ids.length === 0) {
      return {
        questions,
        flashcards,
        coverage,
      };
    }

    const uncoveredRequirements = input.requirements.filter((requirement) =>
      coverage.uncovered_requirement_ids.includes(requirement.id),
    );

    for (const requirement of uncoveredRequirements) {
      const generated = await generateRequirement({
        requirement,
        role: input.role,
        seniority: input.seniority,
        companyBrief: input.companyBrief,
      });

      for (const question of generated.questions) {
        questions.push({
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

      for (const flashcard of generated.flashcards) {
        flashcards.push({
          id: `f_${crypto.randomUUID()}`,
          front: flashcard.front,
          back: flashcard.back,
          requirement_ids: [requirement.id],
          origin: "generated",
          pinned: false,
        });
      }
    }
  }

  const finalCoverage = checkCoverage(
    input.requirements,
    questions,
    MAX_COVERAGE_PASSES,
  );

  return {
    questions,
    flashcards,
    coverage: finalCoverage,
  };
}
