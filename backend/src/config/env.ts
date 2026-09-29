import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",

  supabaseUrl: requiredEnv("SUPABASE_URL"),
  supabaseSecretKey: requiredEnv("SUPABASE_SECRET_KEY"),

  llmProvider: process.env.LLM_PROVIDER ?? "groq",
  llmApiKey: process.env.GROQ_API_KEY ?? "",
  llmModel: process.env.LLM_MODEL ?? "openai/gpt-oss-20b",
  searchProvider: process.env.SEARCH_PROVIDER ?? "tavily",
  tavilyApiKey: process.env.TAVILY_API_KEY ?? "",

  searchApiKey: process.env.SEARCH_API_KEY ?? "",
  searchEngineId: process.env.SEARCH_ENGINE_ID ?? "",
};
