import axios from "axios";
import { env } from "../config/env";
import type { SearchProvider, SearchQuery, SearchResult } from "./search";

interface TavilyResponse {
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
  }>;
}

export class TavilyProvider implements SearchProvider {
  async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!env.tavilyApiKey) {
      throw new Error("TAVILY_API_KEY is not configured");
    }

    const response = await axios.post<TavilyResponse>(
      "https://api.tavily.com/search",
      {
        api_key: env.tavilyApiKey,
        query: query.query,
        max_results: query.limit ?? 8,
        search_depth: "basic",
        include_answer: false,
        include_raw_content: false,
      },
      {
        timeout: 15_000,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return (response.data.results ?? [])
      .filter((result) => result.url)
      .map((result) => ({
        title: result.title ?? "",
        url: result.url!,
        snippet: result.content ?? "",
        source: "tavily",
      }));
  }
}
