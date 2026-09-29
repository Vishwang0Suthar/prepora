import assert from "node:assert/strict";

import { checkCoverage } from "../src/services/coverage.service";
import type { Question, Requirement } from "../src/types/kit";

const requirements: Requirement[] = [
  {
    id: "r1",
    text: "TypeScript",
    kind: "technical",
    priority: "must",
  },
  {
    id: "r2",
    text: "React",
    kind: "technical",
    priority: "must",
  },
  {
    id: "r3",
    text: "PostgreSQL",
    kind: "technical",
    priority: "nice",
  },
];

function createQuestion(id: string, requirementIds: string[]): Question {
  return {
    id,
    requirement_ids: requirementIds,
    category: "technical",
    prompt: `Question ${id}`,
    answer_outline: `Answer ${id}`,
    difficulty: 1,
    origin: "generated",
    pinned: false,
  };
}

// 1. All requirements covered.
{
  const questions = [
    createQuestion("q1", ["r1"]),
    createQuestion("q2", ["r2"]),
    createQuestion("q3", ["r3"]),
  ];

  const result = checkCoverage(requirements, questions, 1);

  assert.deepEqual(result.uncovered_requirement_ids, []);

  assert.equal(result.passes, 1);
}

// 2. One requirement is uncovered.
{
  const questions = [
    createQuestion("q1", ["r1"]),
    createQuestion("q2", ["r2"]),
  ];

  const result = checkCoverage(requirements, questions, 1);

  assert.deepEqual(result.uncovered_requirement_ids, ["r3"]);

  assert.equal(result.passes, 1);
}

// 3. Multiple requirements are uncovered.
{
  const questions = [createQuestion("q1", ["r1"])];

  const result = checkCoverage(requirements, questions, 2);

  assert.deepEqual(result.uncovered_requirement_ids, ["r2", "r3"]);

  assert.equal(result.passes, 2);
}

// 4. A question can cover multiple requirements.
{
  const questions = [createQuestion("q1", ["r1", "r2", "r3"])];

  const result = checkCoverage(requirements, questions, 1);

  assert.deepEqual(result.uncovered_requirement_ids, []);
}

// 5. No questions means every requirement is uncovered.
{
  const result = checkCoverage(requirements, [], 0);

  assert.deepEqual(result.uncovered_requirement_ids, ["r1", "r2", "r3"]);

  assert.equal(result.passes, 0);
}

// 6. No requirements means nothing is uncovered.
{
  const questions = [createQuestion("q1", ["r1"])];

  const result = checkCoverage([], questions, 1);

  assert.deepEqual(result.uncovered_requirement_ids, []);

  assert.equal(result.passes, 1);
}

console.log("✓ coverage tests passed");
