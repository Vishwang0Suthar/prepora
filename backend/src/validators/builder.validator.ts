import { z } from "zod";

const questionCategorySchema = z.enum([
  "technical",
  "behavioural",
  "system-design",
  "company-fit",
]);

const difficultySchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const updateQuestionSchema = z
  .object({
    prompt: z.string().trim().min(1).max(10_000).optional(),

    answer_outline: z.string().trim().min(1).max(20_000).optional(),

    category: questionCategorySchema.optional(),

    difficulty: difficultySchema.optional(),

    requirement_ids: z.array(z.string().min(1)).optional(),

    pinned: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  })
  .refine(
    (value) => value.prompt === undefined || value.answer_outline !== undefined,
    {
      message: "answer_outline is required when prompt is changed",
      path: ["answer_outline"],
    },
  );

export const createQuestionSchema = z.object({
  prompt: z.string().trim().min(1).max(10_000),
  answer_outline: z.string().trim().min(1).max(20_000),
  category: questionCategorySchema,
  difficulty: difficultySchema,
  requirement_ids: z.array(z.string().min(1)),
  pinned: z.boolean().default(false),
});

export const reorderQuestionsSchema = z.object({
  question_ids: z.array(z.string().min(1)).min(1),
});

export const updateFlashcardSchema = z
  .object({
    front: z.string().trim().min(1).max(10_000).optional(),

    back: z.string().trim().min(1).max(20_000).optional(),

    requirement_ids: z.array(z.string().min(1)).optional(),

    pinned: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  })
  .refine((value) => value.front === undefined || value.back !== undefined, {
    message: "back is required when front is changed",
    path: ["back"],
  });

export const createFlashcardSchema = z.object({
  front: z.string().trim().min(1).max(10_000),
  back: z.string().trim().min(1).max(20_000),
  requirement_ids: z.array(z.string().min(1)),
  pinned: z.boolean().default(false),
});

export const reorderFlashcardsSchema = z.object({
  flashcard_ids: z.array(z.string().min(1)).min(1),
});

export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

export type ReorderQuestionsInput = z.infer<typeof reorderQuestionsSchema>;

export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;

export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;

export type ReorderFlashcardsInput = z.infer<typeof reorderFlashcardsSchema>;
