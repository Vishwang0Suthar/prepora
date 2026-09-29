// import Groq from "groq-sdk";
// import { env } from "../config/env";
// import type { GenerateJsonOptions, LLMProvider } from "./provider";

// export class GroqProvider implements LLMProvider {
//   private readonly client: Groq;

//   constructor() {
//     if (!env.llmApiKey) {
//       throw new Error("GROQ_API_KEY is not configured");
//     }

//     this.client = new Groq({
//       apiKey: env.llmApiKey,
//     });
//   }

//   async generateJSON<T>(options: GenerateJsonOptions): Promise<T> {
//     const systemChars = options.system.length;
//     const userChars = options.user.length;
//     const totalChars = systemChars + userChars;

//     // Rough diagnostic only:
//     // ~4 characters per token for English text.
//     const estimatedInputTokens = Math.ceil(totalChars / 4);

//     console.log(
//       `[LLM] model=${env.llmModel} ` +
//         `system_chars=${systemChars} ` +
//         `user_chars=${userChars} ` +
//         `total_chars=${totalChars} ` +
//         `estimated_input_tokens=${estimatedInputTokens}`,
//     );

//     const response = await this.client.chat.completions.create({
//       model: env.llmModel,
//       temperature: 0,
//       messages: [
//         {
//           role: "system",
//           content: options.system,
//         },
//         {
//           role: "user",
//           content: options.user,
//         },
//       ],
//       response_format: {
//         type: "json_schema",
//         json_schema: {
//           name: "prepora_output",
//           strict: true,
//           schema: options.schema,
//         },
//       },
//     });

//     const content = response.choices[0]?.message?.content;

//     if (!content) {
//       throw new Error("LLM returned empty content");
//     }

//     try {
//       return JSON.parse(content) as T;
//     } catch {
//       throw new Error("LLM returned invalid JSON");
//     }
//   }
// }
import Groq from "groq-sdk";

import { env } from "../config/env";

import type { GenerateJsonOptions, LLMProvider } from "./provider";

const MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 2_500;

/*
 * Keep enough room for structured JSON responses without allowing
 * an individual generation to grow unnecessarily large.
 *
 * Groq recommends max_completion_tokens for controlling generated
 * output length.
 */
const DEFAULT_MAX_COMPLETION_TOKENS = 4096;

function getRetryDelayMs(error: unknown): number {
  if (error && typeof error === "object" && "headers" in error) {
    const headers = (
      error as {
        headers?: Record<string, string>;
      }
    ).headers;

    const retryAfter = headers?.["retry-after"];

    if (retryAfter) {
      const seconds = Number(retryAfter);

      if (Number.isFinite(seconds)) {
        return Math.max(seconds * 1000, DEFAULT_RETRY_DELAY_MS);
      }
    }
  }

  const message = error instanceof Error ? error.message : String(error);

  const match = message.match(/try again in ([\d.]+)s/i);

  if (match) {
    const seconds = Number(match[1]);

    if (Number.isFinite(seconds)) {
      return Math.max(seconds * 1000, DEFAULT_RETRY_DELAY_MS);
    }
  }

  return DEFAULT_RETRY_DELAY_MS;
}

function isRateLimitError(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error) {
    return (error as { status?: number }).status === 429;
  }

  const message = error instanceof Error ? error.message : String(error);

  return message.includes("429") || message.includes("rate_limit_exceeded");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GroqProvider implements LLMProvider {
  private readonly client: Groq;

  constructor() {
    if (!env.llmApiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    this.client = new Groq({
      apiKey: env.llmApiKey,
    });
  }

  async generateJSON<T>(options: GenerateJsonOptions): Promise<T> {
    const systemChars = options.system.length;
    const userChars = options.user.length;
    const totalChars = systemChars + userChars;

    /*
     * Rough diagnostic only:
     * ~4 characters per token for English text.
     */
    const estimatedInputTokens = Math.ceil(totalChars / 4);

    console.log(
      `[LLM] model=${env.llmModel} ` +
        `system_chars=${systemChars} ` +
        `user_chars=${userChars} ` +
        `total_chars=${totalChars} ` +
        `estimated_input_tokens=${estimatedInputTokens} ` +
        `max_completion_tokens=${DEFAULT_MAX_COMPLETION_TOKENS}`,
    );

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: env.llmModel,

          temperature: 0,

          /*
           * Explicitly bound the generated response.
           *
           * Previously this was omitted, which allowed the
           * model/provider default to terminate structured JSON
           * generation before a complete document was produced.
           */
          max_completion_tokens: DEFAULT_MAX_COMPLETION_TOKENS,

          messages: [
            {
              role: "system",
              content: options.system,
            },
            {
              role: "user",
              content: options.user,
            },
          ],

          response_format: {
            type: "json_schema",
            json_schema: {
              name: "prepora_output",
              strict: true,
              schema: options.schema,
            },
          },
        });

        const content = response.choices[0]?.message?.content;

        if (!content) {
          throw new Error("LLM returned empty content");
        }

        try {
          return JSON.parse(content) as T;
        } catch {
          throw new Error("LLM returned invalid JSON");
        }
      } catch (error) {
        /*
         * Only retry rate-limit errors.
         *
         * A normal validation/generation failure should be
         * surfaced immediately instead of repeating the exact
         * same request.
         */
        if (!isRateLimitError(error) || attempt === MAX_RETRIES) {
          throw error;
        }

        const delayMs = getRetryDelayMs(error);

        console.log(
          `[LLM] rate limited; retrying in ` +
            `${Math.ceil(delayMs / 1000)}s ` +
            `(attempt ${attempt + 1}/${MAX_RETRIES})`,
        );

        await sleep(delayMs);
      }
    }

    throw new Error("LLM request failed after retries");
  }
}
