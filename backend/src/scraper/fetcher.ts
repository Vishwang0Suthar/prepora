import axios from "axios";

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 10_000;

export interface FetchResult {
  url: string;
  status: number;
  contentType: string;
  html: string;
}

export async function fetchPage(url: string): Promise<FetchResult> {
  const response = await axios.get<string>(url, {
    timeout: REQUEST_TIMEOUT_MS,

    maxContentLength: MAX_RESPONSE_BYTES,
    maxBodyLength: MAX_RESPONSE_BYTES,

    responseType: "text",

    headers: {
      "User-Agent": "PreporaBot/1.0 (+https://prepora.app)",
      Accept: "text/html,application/xhtml+xml",
    },

    validateStatus: (status) => status >= 200 && status < 400,
  });

  const rawContentType = response.headers["content-type"];

  const contentType = typeof rawContentType === "string" ? rawContentType : "";

  if (!contentType.toLowerCase().includes("text/html")) {
    throw new Error("UNSUPPORTED_CONTENT_TYPE");
  }

  return {
    url: response.request?.res?.responseUrl ?? url,
    status: response.status,
    contentType,
    html: response.data,
  };
}
