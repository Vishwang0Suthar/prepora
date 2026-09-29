import assert from "node:assert/strict";

import { normalizeGenerationError } from "../src/services/generation-error";

import { KitValidationError } from "../src/services/final-kit.service";

// 1. Kit validation errors preserve their specific code.
{
  const error = new KitValidationError(
    "KIT_STRUCTURE_INVALID",
    "Invalid kit structure.",
  );

  const normalized = normalizeGenerationError(error);

  assert.equal(normalized.code, "KIT_STRUCTURE_INVALID");

  assert.equal(normalized.message, "Invalid kit structure.");
}

// 2. Missing Groq configuration.
{
  const normalized = normalizeGenerationError(
    new Error("GROQ_API_KEY is not configured"),
  );

  assert.equal(normalized.code, "LLM_NOT_CONFIGURED");
}

// 3. Missing Tavily configuration.
{
  const normalized = normalizeGenerationError(
    new Error("TAVILY_API_KEY is not configured"),
  );

  assert.equal(normalized.code, "SEARCH_NOT_CONFIGURED");
}

// 4. Unsupported research content.
{
  const normalized = normalizeGenerationError(
    new Error("UNSUPPORTED_CONTENT_TYPE"),
  );

  assert.equal(normalized.code, "RESEARCH_UNSUPPORTED_CONTENT");
}

// 5. Invalid LLM output.
{
  const normalized = normalizeGenerationError(
    new Error("LLM returned invalid JSON"),
  );

  assert.equal(normalized.code, "LLM_INVALID_OUTPUT");
}

// 6. LLM rate limit.
{
  const normalized = normalizeGenerationError(
    new Error("429 rate_limit_exceeded"),
  );

  assert.equal(normalized.code, "LLM_RATE_LIMITED");
}

// 7. Unknown Error object.
{
  const normalized = normalizeGenerationError(
    new Error("Something unexpected happened"),
  );

  assert.equal(normalized.code, "GENERATION_FAILED");

  assert.equal(normalized.message, "Something unexpected happened");
}

// 8. Completely unknown thrown value.
{
  const normalized = normalizeGenerationError("unexpected failure");

  assert.equal(normalized.code, "GENERATION_FAILED");

  assert.equal(normalized.message, "Unknown generation error");
}

console.log("✓ generation error tests passed");
