// import axios from "axios";
// import * as cheerio from "cheerio";

// import { env } from "../config/env";

// import type { SearchProvider, SearchQuery, SearchResult } from "./search";

// export class SearXNGProvider implements SearchProvider {
//   async search(query: SearchQuery): Promise<SearchResult[]> {
//     const limit = Math.min(query.limit ?? 8, 20);

//     const response = await axios.get<string>(`${env.searxngUrl}/search`, {
//       timeout: 10_000,
//       params: {
//         q: query.query,
//         language: "en",
//         safesearch: 1,
//       },
//       headers: {
//         "User-Agent": "PreporaBot/1.0",
//       },
//     });

//     const $ = cheerio.load(response.data);

//     const results: SearchResult[] = [];

//     $(".result").each((_index, element) => {
//       if (results.length >= limit) {
//         return false;
//       }

//       const titleElement = $(element).find("h3 a").first();

//       const link = titleElement.attr("href");
//       const title = titleElement.text().trim();

//       const snippet = $(element).find(".content").text().trim();

//       if (!link || !title) {
//         return;
//       }

//       try {
//         results.push({
//           title,
//           url: new URL(link, env.searxngUrl).toString(),
//           snippet,
//           source: new URL(link, env.searxngUrl).hostname,
//         });
//       } catch {
//         // Ignore malformed result URLs.
//       }
//     });

//     return results;
//   }
// }
