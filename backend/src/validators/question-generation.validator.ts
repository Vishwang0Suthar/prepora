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

export const questionGenerationSchema = z.object({
  questions: z.array(generatedQuestionSchema),
  flashcards: z.array(generatedFlashcardSchema),
});

export type QuestionGeneration = z.infer<typeof questionGenerationSchema>;
