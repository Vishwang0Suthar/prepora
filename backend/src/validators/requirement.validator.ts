import { z } from "zod";

export const requirementSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  kind: z.enum(["technical", "behavioural", "domain"]),
  priority: z.enum(["must", "nice"]),
});

export const requirementExtractionSchema = z.object({
  role: z.string(),
  seniority: z.string(),
  responsibilities: z.array(z.string().min(1)),
  requirements: z.array(requirementSchema),
});

export type RequirementExtraction = z.infer<typeof requirementExtractionSchema>;
