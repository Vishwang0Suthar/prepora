// generation.service.ts
import { extractRequirements } from "./requirement.service";
import { generateCompanyBrief } from "./company-brief.service";
import { generateInterviewMaterial } from "./material-generation.service";
import { ensureCoverage } from "./coverage-loop.service";
import { allocateSchedule } from "./schedule.service";
import { buildFinalKit } from "./final-kit.service";
import { researchCompany } from "../research/company";
import { buildCompanyResearchContext } from "../research/context";

export interface PipelineInput {
  company: string;
  company_url: string;
  role: string;
  location: string;
  jd_text: string;
  days_available: number;
}

export async function runPipeline(
  input: PipelineInput,
  onProgress?: (step: string) => Promise<void>,
) {
  // 1. Requirement extraction
  await onProgress?.("generating_requirements");

  const extraction = await extractRequirements(input.jd_text);

  // 2. Company research
  await onProgress?.("crawling");

  const research = await researchCompany(input.company, input.company_url);

  const researchContext = buildCompanyResearchContext(
    research.crawl,
    research.hiring,
    research.discussion,
  );

  // 3. Company brief
  await onProgress?.("generating_company_brief");

  const companyBrief = await generateCompanyBrief(
    input.company,
    researchContext.text,
    researchContext.sources,
  );

  // 4. Initial questions + flashcards
  await onProgress?.("generating_questions");

  const material = await generateInterviewMaterial({
    role: extraction.role,
    seniority: extraction.seniority,
    companyBrief,
    requirements: extraction.requirements,
  });

  // 5. Coverage check + targeted gap generation
  await onProgress?.("checking_coverage");

  const covered = await ensureCoverage({
    role: extraction.role,
    seniority: extraction.seniority,
    companyBrief,
    requirements: extraction.requirements,
    questions: material.questions,
    flashcards: material.flashcards,
  });

  // 6. Deterministic schedule allocation
  await onProgress?.("generating_schedule");

  const schedule = allocateSchedule(
    covered.questions,
    extraction.requirements,
    input.days_available,
  );

  // 7. Final structure + referential-integrity validation
  await onProgress?.("validating");

  const kit = buildFinalKit({
    company: input.company,
    company_url: input.company_url,
    role: extraction.role,
    location: input.location,
    jd_text: input.jd_text,
    companyBrief,
    seniority: extraction.seniority,
    responsibilities: extraction.responsibilities,
    requirements: extraction.requirements,
    questions: covered.questions,
    flashcards: covered.flashcards,
    schedule,
    coverage: covered.coverage,
    pagesUsed: researchContext.pagesUsed,
  });

  return kit;
}
