import { z } from "zod";

const generatedQuestionSchema = z.object({
  category: z.enum([
    "technical",
    "behavioural",
    "system-design",
    "company-fit",
  ]),
  prompt: z.string().min(1),
  answer_outline: z.string().min(1),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

const generatedFlashcardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
});

/**
 * Output schema for generating material for exactly one requirement.
 *
 * This remains the schema used by:
 * - requirement regeneration
 * - coverage-loop gap generation
 * - category regeneration
 */
export const questionGenerationSchema = z.object({
  questions: z.array(generatedQuestionSchema),
  flashcards: z.array(generatedFlashcardSchema),
});

export type QuestionGeneration = z.infer<typeof questionGenerationSchema>;

/**
 * Output schema for batched initial generation.
 *
 * One batch contains up to five requirements.
 * Each requirement gets its own result object so that generated
 * questions and flashcards can be deterministically associated
 * with the correct requirement.
 */
const batchRequirementGenerationSchema = z.object({
  requirement_id: z.string().min(1),

  questions: z.array(generatedQuestionSchema),

  flashcards: z.array(generatedFlashcardSchema),
});

export const questionGenerationBatchSchema = z.object({
  items: z.array(batchRequirementGenerationSchema),
});

export type QuestionGenerationBatch = z.infer<
  typeof questionGenerationBatchSchema
>;
