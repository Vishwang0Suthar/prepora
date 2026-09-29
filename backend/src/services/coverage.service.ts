// coverage.service.ts
import type { Question, Requirement } from "../types/kit";

export interface CoverageResult {
  uncovered_requirement_ids: string[];
  passes: number;
}

export function checkCoverage(
  requirements: Requirement[],
  questions: Question[],
  passes: number,
): CoverageResult {
  const coveredRequirementIds = new Set(
    questions.flatMap((question) => question.requirement_ids),
  );

  const uncoveredRequirementIds = requirements
    .filter((requirement) => !coveredRequirementIds.has(requirement.id))
    .map((requirement) => requirement.id);

  return {
    uncovered_requirement_ids: uncoveredRequirementIds,
    passes,
  };
}
