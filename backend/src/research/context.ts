// import type { CrawlResult } from "../scraper/types";

// import type { HiringResearch } from "./hiring";
// import type { DiscussionResearch } from "./discussion";

// export interface CompanyResearchContext {
//   text: string;
//   sources: string[];
//   pagesUsed: string[];
// }

// const MAX_RESEARCH_CONTEXT_CHARS = 24_000;

// function trimSection(label: string, text: string, maxChars: number): string {
//   const trimmed = text.trim();

//   if (trimmed.length <= maxChars) {
//     return `${label}:\n${trimmed}`;
//   }

//   return (
//     `${label}:\n` +
//     `${trimmed.slice(0, maxChars)}\n` +
//     `[Research section truncated at ${maxChars} characters.]`
//   );
// }

// export function buildCompanyResearchContext(
//   crawl: CrawlResult,
//   hiring: HiringResearch,
//   discussion: DiscussionResearch,
// ): CompanyResearchContext {
//   const sections: string[] = [];

//   const hiringText = hiring.text.trim();
//   const discussionText = discussion.text.trim();

//   const totalAvailable = hiringText.length + discussionText.length;

//   if (totalAvailable > 0) {
//     const hiringBudget =
//       hiringText.length > 0
//         ? Math.floor(
//             (hiringText.length / totalAvailable) * MAX_RESEARCH_CONTEXT_CHARS,
//           )
//         : 0;

//     const discussionBudget =
//       discussionText.length > 0 ? MAX_RESEARCH_CONTEXT_CHARS - hiringBudget : 0;

//     if (hiringText) {
//       sections.push(trimSection("HIRING RESEARCH", hiringText, hiringBudget));
//     }

//     if (discussionText) {
//       sections.push(
//         trimSection(
//           "PUBLIC DISCUSSION RESEARCH",
//           discussionText,
//           discussionBudget,
//         ),
//       );
//     }
//   }

//   const sources = Array.from(new Set([...hiring.urls, ...discussion.sources]));

//   return {
//     text: sections.join("\n\n"),
//     sources,
//     pagesUsed: sources,
//   };
// }
import type { CrawlResult } from "../scraper/types";

import type { HiringResearch } from "./hiring";
import type { DiscussionResearch } from "./discussion";

export interface CompanyResearchContext {
  text: string;
  sources: string[];
  pagesUsed: string[];
}

const MAX_RESEARCH_CONTEXT_CHARS = 8_000;

function trimSection(label: string, text: string, maxChars: number): string {
  const trimmed = text.trim();

  if (trimmed.length <= maxChars) {
    return `${label}:\n${trimmed}`;
  }

  return (
    `${label}:\n` +
    `${trimmed.slice(0, maxChars)}\n` +
    `[Research section truncated at ${maxChars} characters.]`
  );
}

export function buildCompanyResearchContext(
  crawl: CrawlResult,
  hiring: HiringResearch,
  discussion: DiscussionResearch,
): CompanyResearchContext {
  const sections: string[] = [];

  const hiringText = hiring.text.trim();
  const discussionText = discussion.text.trim();

  const totalAvailable = hiringText.length + discussionText.length;

  if (totalAvailable > 0) {
    const hiringBudget =
      hiringText.length > 0
        ? Math.floor(
            (hiringText.length / totalAvailable) * MAX_RESEARCH_CONTEXT_CHARS,
          )
        : 0;

    const discussionBudget =
      discussionText.length > 0 ? MAX_RESEARCH_CONTEXT_CHARS - hiringBudget : 0;

    if (hiringText) {
      sections.push(trimSection("HIRING RESEARCH", hiringText, hiringBudget));
    }

    if (discussionText) {
      sections.push(
        trimSection(
          "PUBLIC DISCUSSION RESEARCH",
          discussionText,
          discussionBudget,
        ),
      );
    }
  }

  const sources = Array.from(
    new Set([...crawl.pagesUsed, ...hiring.urls, ...discussion.sources]),
  );

  return {
    text: sections.join("\n\n"),
    sources,
    pagesUsed: sources,
  };
}
