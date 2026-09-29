import { z } from "zod";

export const updatePracticeProgressSchema = z.object({
  item_type: z.enum(["question", "flashcard"]),

  item_id: z.string().trim().min(1),

  status: z.enum(["unseen", "attempted", "completed"]),

  confidence_rating: z.number().int().min(1).max(5).nullable().optional(),
});

export type UpdatePracticeProgressInput = z.infer<
  typeof updatePracticeProgressSchema
>;
