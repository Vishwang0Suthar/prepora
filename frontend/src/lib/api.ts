import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ApiRequestOptions extends RequestInit {
  body?: BodyInit | null;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    window.location.href = "/login";
    throw new Error("UNAUTHORIZED");
  }

  const headers = new Headers(options.headers);

  headers.set("Authorization", `Bearer ${session.access_token}`);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    window.location.href = "/login";
    throw new Error("UNAUTHORIZED");
  }

  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    // Response has no JSON body.
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "Request failed";

    throw new Error(message);
  }

  return data as T;
}
