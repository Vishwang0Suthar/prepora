import type { ScrapedPage } from "./types";

const HIRING_TERMS = [
  "career",
  "careers",
  "job",
  "jobs",
  "hiring",
  "join our team",
  "open positions",
  "open roles",
  "vacancies",
  "work with us",
];

export function isHiringPage(page: ScrapedPage): boolean {
  const haystack = `${page.url} ${page.title} ${page.text}`.toLowerCase();

  return HIRING_TERMS.some((term) => haystack.includes(term));
}

export function classifyPages(pages: ScrapedPage[]) {
  return {
    hiringPages: pages.filter(isHiringPage),
    companyPages: pages.filter((page) => !isHiringPage(page)),
  };
}
