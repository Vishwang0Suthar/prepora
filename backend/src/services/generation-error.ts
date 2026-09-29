import { KitValidationError } from "./final-kit.service";

export interface NormalizedGenerationError {
  code: string;
  message: string;
}

export function normalizeGenerationError(
  error: unknown,
): NormalizedGenerationError {
  if (error instanceof KitValidationError) {
    return {
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    const message = error.message;

    // Configuration errors
    if (message === "GROQ_API_KEY is not configured") {
      return {
        code: "LLM_NOT_CONFIGURED",
        message,
      };
    }

    if (message === "TAVILY_API_KEY is not configured") {
      return {
        code: "SEARCH_NOT_CONFIGURED",
        message,
      };
    }

    // Research / fetching errors
    if (message === "UNSUPPORTED_CONTENT_TYPE") {
      return {
        code: "RESEARCH_UNSUPPORTED_CONTENT",
        message,
      };
    }

    // LLM output errors
    if (
      message === "LLM returned empty content" ||
      message === "LLM returned invalid JSON"
    ) {
      return {
        code: "LLM_INVALID_OUTPUT",
        message,
      };
    }

    // Rate limiting after the provider's retries are exhausted
    if (message.includes("429") || message.includes("rate_limit_exceeded")) {
      return {
        code: "LLM_RATE_LIMITED",
        message,
      };
    }

    return {
      code: "GENERATION_FAILED",
      message,
    };
  }

  return {
    code: "GENERATION_FAILED",
    message: "Unknown generation error",
  };
}
