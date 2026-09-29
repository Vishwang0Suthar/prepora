import { z } from "zod";

export const companyBriefSchema = z.object({
  summary: z.string(),
  what_they_do: z.string(),
  sources: z.array(z.string().url()),
});

export type CompanyBrief = z.infer<typeof companyBriefSchema>;
