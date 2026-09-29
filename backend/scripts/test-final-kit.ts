import assert from "node:assert/strict";

import {
  buildFinalKit,
  KitValidationError,
} from "../src/services/final-kit.service";

import type { FinalKitInput } from "../src/services/final-kit.service";

function createValidInput(): FinalKitInput {
  return {
    company: "Test Company",

    company_url: "https://example.com",

    role: "Software Engineer",

    location: "Remote",

    jd_text: "Software engineering role requiring TypeScript and React.",

    companyBrief: {
      summary: "A software company.",
      what_they_do: "Build software.",
      sources: ["https://example.com"],
    },

    seniority: "Mid-level",

    responsibilities: ["Build software"],

    requirements: [
      {
        id: "r1",
        text: "TypeScript",
        kind: "technical",
        priority: "must",
      },
    ],

    questions: [
      {
        id: "q1",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "Explain TypeScript.",
        answer_outline: "Type system.",
        difficulty: 1,
        origin: "generated",
        pinned: false,
      },
    ],

    flashcards: [
      {
        id: "f1",
        requirement_ids: ["r1"],
        front: "What is TypeScript?",
        back: "A typed superset of JavaScript.",
        origin: "generated",
        pinned: false,
      },
    ],

    schedule: {
      days_available: 1,

      days: [
        {
          day: 1,
          focus: "TypeScript",
          question_ids: ["q1"],
          minutes: 10,
        },
      ],
    },

    coverage: {
      uncovered_requirement_ids: [],
      passes: 1,
    },

    pagesUsed: ["https://example.com"],
  };
}

function assertValidationError(input: FinalKitInput, expectedCode: string) {
  assert.throws(
    () => buildFinalKit(input),
    (error: unknown) => {
      assert.ok(error instanceof KitValidationError);
      assert.equal(error.code, expectedCode);

      return true;
    },
  );
}

// 1. Valid kit should pass.
{
  const validKit = buildFinalKit(createValidInput());

  assert.equal(validKit.questions.length, 1);
}

// 2. Question → nonexistent requirement.
{
  const input = createValidInput();

  input.questions[0].requirement_ids = ["missing"];

  assertValidationError(input, "DANGLING_REQUIREMENT_REFERENCE");
}

// 3. Flashcard → nonexistent requirement.
{
  const input = createValidInput();

  input.flashcards[0].requirement_ids = ["missing"];

  assertValidationError(input, "DANGLING_REQUIREMENT_REFERENCE");
}

// 4. Schedule → nonexistent question.
{
  const input = createValidInput();

  input.schedule.days[0].question_ids = ["missing"];

  assertValidationError(input, "DANGLING_QUESTION_REFERENCE");
}

// 5. Coverage → nonexistent requirement.
{
  const input = createValidInput();

  input.coverage.uncovered_requirement_ids = ["missing"];

  assertValidationError(input, "DANGLING_REQUIREMENT_REFERENCE");
}

// 6. Invalid schema value should be rejected.
{
  const input = createValidInput();

  input.questions[0].difficulty = 99 as 1 | 2 | 3;

  assertValidationError(input, "KIT_STRUCTURE_INVALID");
}

// 7. Schedule must contain every question exactly once.
{
  const input = createValidInput();

  input.questions.push({
    id: "q2",
    requirement_ids: ["r1"],
    category: "technical",
    prompt: "Second question",
    answer_outline: "Answer",
    difficulty: 2,
    origin: "generated",
    pinned: false,
  });

  assertValidationError(input, "SCHEDULE_QUESTION_COUNT_MISMATCH");
}

// 8. Duplicate scheduled question IDs are rejected.
{
  const input = createValidInput();

  input.questions.push({
    id: "q2",
    requirement_ids: ["r1"],
    category: "technical",
    prompt: "Second question",
    answer_outline: "Answer",
    difficulty: 2,
    origin: "generated",
    pinned: false,
  });

  input.schedule.days[0].question_ids = ["q1", "q1"];

  assertValidationError(input, "DUPLICATE_SCHEDULE_QUESTION");
}

// 9. A generated question cannot be omitted
// from the schedule.
{
  const input = createValidInput();

  input.questions.push({
    id: "q2",
    requirement_ids: ["r1"],
    category: "technical",
    prompt: "Second question",
    answer_outline: "Answer",
    difficulty: 2,
    origin: "generated",
    pinned: false,
  });

  input.schedule.days[0].question_ids = ["q1"];

  assertValidationError(input, "SCHEDULE_QUESTION_COUNT_MISMATCH");
}

console.log("✓ final-kit validation tests passed");
