import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  runPipeline,
  type PipelineInput,
} from "../src/services/generation.service";

import { normalizeGenerationError } from "../src/services/generation-error";

const batchCaseSchema = z.object({
  id: z.string().trim().min(1).optional(),
  company: z.string().trim().min(1).max(200),
  company_url: z.string().trim().url(),
  role: z.string().trim().min(1).max(200),
  location: z.string().trim().max(200),
  jd_text: z.string().trim().min(50).max(100_000),
  days_available: z.number().int().min(1).max(60),
});

const batchCasesSchema = z.array(batchCaseSchema);

type BatchCase = z.infer<typeof batchCaseSchema>;
interface BatchSuccess {
  id: string;
  status: "ok";
  kit: Awaited<ReturnType<typeof runPipeline>>;
  error: null;
}

interface BatchFailure {
  id: string;
  status: "failed";
  kit: null;
  error: {
    code: string;
    message: string;
  };
}

type BatchResult = BatchSuccess | BatchFailure;

interface BatchOutput {
  version: "1.0";
  generated_at: string;
  kits: BatchResult[];
}

function getArgument(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);

  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function printUsage(): void {
  console.error(
    "Usage: npm run evaluate -- --input <cases.json> --output <kits.json>",
  );
}

async function loadCases(inputPath: string): Promise<BatchCase[]> {
  const raw = await fs.readFile(inputPath, "utf8");
  const parsed: unknown = JSON.parse(raw);

  const result = batchCasesSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error(`INVALID_INPUT: ${JSON.stringify(result.error.flatten())}`);
  }

  return result.data;
}

function getCaseId(testCase: BatchCase, index: number): string {
  return testCase.id ?? `case-${index + 1}`;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const inputPath = getArgument(args, "--input");
  const outputPath = getArgument(args, "--output");

  if (!inputPath || !outputPath) {
    printUsage();
    process.exit(1);
  }

  const cases = await loadCases(path.resolve(inputPath));

  const results: BatchResult[] = [];

  console.log(`Running ${cases.length} evaluation case(s)...`);

  for (let index = 0; index < cases.length; index++) {
    const testCase = cases[index];
    const id = getCaseId(testCase, index);

    console.log(`\n[${index + 1}/${cases.length}] ${id}`);

    try {
      const kit = await runPipeline({
        company: testCase.company,
        company_url: testCase.company_url,
        role: testCase.role,
        location: testCase.location,
        jd_text: testCase.jd_text,
        days_available: testCase.days_available,
      });

      results.push({
        id,
        status: "ok",
        kit,
        error: null,
      });

      console.log("  ✓ completed");
    } catch (error) {
      const normalized = normalizeGenerationError(error);

      results.push({
        id,
        status: "failed",
        kit: null,
        error: {
          code: normalized.code,
          message: normalized.message,
        },
      });

      console.error(`  ✗ failed: ${normalized.code} - ${normalized.message}`);
    }
  }

  const resolvedOutputPath = path.resolve(outputPath);

  const output: BatchOutput = {
    version: "1.0",
    generated_at: new Date().toISOString(),
    kits: results,
  };

  await fs.writeFile(
    resolvedOutputPath,
    JSON.stringify(output, null, 2),
    "utf8",
  );

  const successful = results.filter((result) => result.status === "ok").length;

  const failed = results.length - successful;

  console.log("\nBatch complete.");
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Output: ${resolvedOutputPath}`);
}

main().catch((error) => {
  console.error(
    "Evaluation runner failed:",
    error instanceof Error ? error.message : error,
  );

  process.exit(1);
});
