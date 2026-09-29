import { classifyPages } from "../scraper/classifier";

import type { ScrapedPage } from "../scraper/types";

export interface HiringResearch {
  pages: ScrapedPage[];
  urls: string[];
  text: string;
}

const MAX_RESEARCH_CHARS = 60_000;

export function researchHiringPages(pages: ScrapedPage[]): HiringResearch {
  const { hiringPages } = classifyPages(pages);

  const text = hiringPages
    .map((page) => `URL: ${page.url}\nTITLE: ${page.title}\n${page.text}`)
    .join("\n\n")
    .slice(0, MAX_RESEARCH_CHARS);

  return {
    pages: hiringPages,
    urls: hiringPages.map((page) => page.url),
    text,
  };
}
