import * as cheerio from "cheerio";

const HIGH_PRIORITY_TERMS = [
  "interview",
  "interviewing",
  "hiring",
  "handbook",
  "recruiting",
  "recruitment",
];

const MEDIUM_PRIORITY_TERMS = [
  "career",
  "careers",
  "job",
  "jobs",
  "join",
  "team",
];

const LOW_PRIORITY_TERMS = ["about", "company"];

const PENALTY_TERMS = ["contact", "e-group"];

const LOCALE_SEGMENTS = new Set([
  "af",
  "ar",
  "bg",
  "bn",
  "ca",
  "cs",
  "da",
  "de",
  "de-de",
  "el",
  "en",
  "en-gb",
  "en-us",
  "es",
  "es-es",
  "fa",
  "fi",
  "fr",
  "fr-fr",
  "he",
  "hi",
  "hr",
  "hu",
  "id",
  "it",
  "ja",
  "ja-jp",
  "ko",
  "ko-kr",
  "nl",
  "no",
  "pl",
  "pt",
  "pt-br",
  "ro",
  "ru",
  "sk",
  "sl",
  "sr",
  "sv",
  "th",
  "tr",
  "uk",
  "vi",
  "zh",
  "zh-cn",
  "zh-tw",
]);

function getRegistrableDomain(hostname: string): string {
  const parts = hostname.toLowerCase().split(".");

  if (parts.length <= 2) {
    return hostname.toLowerCase();
  }

  return parts.slice(-2).join(".");
}

function isSameRegistrableDomain(candidate: URL, base: URL): boolean {
  return (
    getRegistrableDomain(candidate.hostname) ===
    getRegistrableDomain(base.hostname)
  );
}

function isLocaleDuplicate(url: URL): boolean {
  const segments = url.pathname.toLowerCase().split("/").filter(Boolean);

  if (segments.length === 0) {
    return false;
  }

  return LOCALE_SEGMENTS.has(segments[0]);
}

function getPathScore(pathname: string): number {
  const path = pathname.toLowerCase();

  let score = 0;

  for (const term of HIGH_PRIORITY_TERMS) {
    if (path.includes(term)) {
      score += 100;
    }
  }

  for (const term of MEDIUM_PRIORITY_TERMS) {
    if (path.includes(term)) {
      score += 50;
    }
  }

  for (const term of LOW_PRIORITY_TERMS) {
    if (path.includes(term)) {
      score += 10;
    }
  }

  for (const term of PENALTY_TERMS) {
    if (path.includes(term)) {
      score -= 100;
    }
  }

  return score;
}

export function extractRelevantLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);

  const links = new Map<string, number>();

  $("a[href]").each((_index, element) => {
    const href = $(element).attr("href");

    if (!href) {
      return;
    }

    try {
      const url = new URL(href, base);

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return;
      }

      if (!isSameRegistrableDomain(url, base)) {
        return;
      }

      url.hash = "";

      if (isLocaleDuplicate(url)) {
        return;
      }

      const score = getPathScore(url.pathname);

      if (score > 0) {
        const normalizedUrl = url.toString();

        const existingScore = links.get(normalizedUrl);

        if (existingScore === undefined || score > existingScore) {
          links.set(normalizedUrl, score);
        }
      }
    } catch {
      // Ignore malformed URLs.
    }
  });

  return [...links.entries()].sort((a, b) => b[1] - a[1]).map(([url]) => url);
}
