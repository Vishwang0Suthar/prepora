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
  });

export const createQuestionSchema = z.object({
  prompt: z.string().trim().min(1).max(10_000),

  answer_outline: z.string().trim().min(1).max(20_000),

  category: questionCategorySchema,

  difficulty: difficultySchema,

  requirement_ids: z.array(z.string().min(1)),

  pinned: z.boolean().default(false),
});

export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
