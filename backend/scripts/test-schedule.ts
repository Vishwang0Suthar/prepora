import assert from "node:assert/strict";

import { allocateSchedule } from "../src/services/schedule.service";
import type { Question, Requirement } from "../src/types/kit";

const requirements: Requirement[] = [
  {
    id: "r1",
    text: "Distributed systems",
    kind: "technical",
    priority: "must",
  },
  {
    id: "r2",
    text: "Testing",
    kind: "technical",
    priority: "nice",
  },
];

function createQuestion(
  id: string,
  requirementId: string,
  difficulty: 1 | 2 | 3,
): Question {
  return {
    id,
    requirement_ids: [requirementId],
    category: "technical",
    prompt: `Question ${id}`,
    answer_outline: `Answer ${id}`,
    difficulty,
    origin: "generated",
    pinned: false,
  };
}

const questions: Question[] = [
  createQuestion("q1", "r2", 1),
  createQuestion("q2", "r1", 2),
  createQuestion("q3", "r1", 3),
  createQuestion("q4", "r2", 2),
  createQuestion("q5", "r1", 1),
  createQuestion("q6", "r1", 3),
  createQuestion("q7", "r2", 1),
  createQuestion("q8", "r1", 2),
  createQuestion("q9", "r2", 3),
  createQuestion("q10", "r1", 1),
];

// 1. Normal 5-day distribution.
{
  const result = allocateSchedule(questions, requirements, 5);

  assert.equal(result.days_available, 5);
  assert.equal(result.days.length, 5);

  const counts = result.days.map((day) => day.question_ids.length);

  assert.deepEqual(counts, [2, 2, 2, 2, 2]);

  const scheduledIds = result.days.flatMap((day) => day.question_ids);

  assert.equal(scheduledIds.length, questions.length);

  assert.equal(new Set(scheduledIds).size, questions.length);

  assert.equal(
    result.days.reduce((total, day) => total + day.minutes, 0),
    questions.length * 10,
  );
}

// 2. Must + higher difficulty questions are front-loaded.
{
  const result = allocateSchedule(questions, requirements, 5);

  const firstDayIds = result.days[0].question_ids;

  assert.deepEqual(firstDayIds, ["q3", "q6"]);
}

// 3. One-day schedule puts everything on Day 1.
{
  const result = allocateSchedule(questions, requirements, 1);

  assert.equal(result.days.length, 1);
  assert.equal(result.days[0].question_ids.length, questions.length);

  assert.equal(result.days[0].minutes, questions.length * 10);
}

// 4. Sixty-day schedule does not break when there
// are fewer questions than days.
{
  const result = allocateSchedule(questions, requirements, 60);

  assert.equal(result.days.length, 60);

  const scheduledIds = result.days.flatMap((day) => day.question_ids);

  assert.equal(scheduledIds.length, questions.length);

  assert.equal(new Set(scheduledIds).size, questions.length);

  const nonEmptyDays = result.days.filter((day) => day.question_ids.length > 0);

  assert.equal(nonEmptyDays.length, questions.length);

  assert.ok(
    result.days
      .filter((day) => day.question_ids.length === 0)
      .every((day) => day.minutes === 0),
  );
}

// 5. Empty question set returns valid empty days.
{
  const result = allocateSchedule([], requirements, 3);

  assert.equal(result.days_available, 3);
  assert.equal(result.days.length, 3);

  for (const day of result.days) {
    assert.deepEqual(day.question_ids, []);
    assert.equal(day.minutes, 0);
    assert.match(day.focus, /Interview preparation — Day/);
  }
}

// 6. Invalid day count is rejected.
{
  assert.throws(
    () => allocateSchedule(questions, requirements, 0),
    /DAYS_AVAILABLE_MUST_BE_POSITIVE/,
  );
}

console.log("✓ schedule tests passed");
