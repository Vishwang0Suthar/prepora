import { z } from "zod";

export const createKitRequestSchema = z.object({
  company: z.string().trim().min(1).max(200),

  company_url: z.string().trim().url(),

  role: z.string().trim().min(1).max(200),

  location: z.string().trim().max(200),

  jd_text: z.string().trim().min(50).max(100_000),

  days_available: z.number().int().min(1).max(60),
});

export type CreateKitRequestInput = z.infer<typeof createKitRequestSchema>;
