import { createBrowserClient } from "@supabase/ssr";

function getRequiredEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const supabaseUrl = getRequiredEnv(process.env.SUPABASE_URL, "SUPABASE_URL");

const supabasePublishableKey = getRequiredEnv(
  process.env.SUPABASE_PUBLISHABLE_KEY,
  "UPABASE_PUBLISHABLE_KEY",
);

export function createClient() {
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
