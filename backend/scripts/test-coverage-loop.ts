import assert from "node:assert/strict";

import { ensureCoverage } from "../src/services/coverage-loop.service";

import type { Flashcard, Question, Requirement } from "../src/types/kit";

async function main() {
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
      priority: "must",
    },
  ];

  const initialQuestions: Question[] = [
    {
      id: "q1",
      requirement_ids: ["r1"],
      category: "technical",
      prompt: "Explain TypeScript.",
      answer_outline: "Type system and compile-time checks.",
      difficulty: 1,
      origin: "generated",
      pinned: false,
    },
    {
      id: "q2",
      requirement_ids: ["r2"],
      category: "technical",
      prompt: "Explain React.",
      answer_outline: "Component-based UI library.",
      difficulty: 1,
      origin: "generated",
      pinned: false,
    },
  ];

  const initialFlashcards: Flashcard[] = [];

  const generatedRequirementIds: string[] = [];

  const fakeGenerateForRequirement = async ({
    requirement,
  }: {
    requirement: Requirement;
  }) => {
    generatedRequirementIds.push(requirement.id);

    return {
      questions: [
        {
          category: "technical" as const,
          prompt: `Generated question for ${requirement.id}`,
          answer_outline: `Generated answer for ${requirement.id}`,
          difficulty: 2 as const,
        },
      ],
      flashcards: [
        {
          front: `What is ${requirement.text}?`,
          back: `Core concept of ${requirement.text}.`,
        },
      ],
    };
  };

  const result = await ensureCoverage({
    role: "Software Engineer",
    seniority: "Mid-level",

    companyBrief: {
      summary: "Test company",
      what_they_do: "Build software",
    },

    requirements,

    questions: initialQuestions,

    flashcards: initialFlashcards,

    generateForRequirementFn: fakeGenerateForRequirement,
  });

  assert.deepEqual(generatedRequirementIds, ["r3"]);

  assert.equal(result.coverage.passes, 2);

  assert.deepEqual(result.coverage.uncovered_requirement_ids, []);

  assert.equal(result.questions.length, 3);

  assert.equal(result.flashcards.length, 1);

  assert.equal(
    result.questions.some((question) =>
      question.requirement_ids.includes("r3"),
    ),
    true,
  );

  console.log("✓ coverage gap-loop test passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
