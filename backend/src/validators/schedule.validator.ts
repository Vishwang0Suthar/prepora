import { z } from "zod";

export const scheduleDaySchema = z.object({
  day: z.number().int().min(1),
  focus: z.string().min(1),
  question_ids: z.array(z.string().min(1)),
  minutes: z.number().int().min(0),
});

export const scheduleSchema = z.object({
  days_available: z.number().int().min(1).max(60),
  days: z.array(scheduleDaySchema),
});

export type Schedule = z.infer<typeof scheduleSchema>;
