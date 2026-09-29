import { validateCompanyUrl } from "./url";
import { canFetch } from "./robots";
import { fetchPage } from "./fetcher";
import { cleanHtml } from "./cleaner";
import { extractRelevantLinks } from "./links";
import type { CrawlResult, ScrapedPage } from "./types";

const MAX_PAGES = 8;
const MAX_ATTEMPTS = 15;

// Sibling hosts worth probing for hiring content. Only the ROOT of each is
// seeded; link scoring decides which paths on them are worth following.
const RESEARCH_SUBDOMAINS = ["handbook", "jobs", "careers"];

const RESEARCH_LINK_TERMS = [
  "interview",
  "interviewing",
  "hiring",
  "recruiting",
  "recruitment",
  "candidate",
  "application",
  "career",
  "careers",
  "job",
  "jobs",
];

function isLocalOrIp(hostname: string): boolean {
  const host = hostname.toLowerCase();

  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
    host.includes(":")
  );
}

function getRootDomain(hostname: string): string {
  const host = hostname.toLowerCase();

  if (isLocalOrIp(host)) {
    return host;
  }

  const parts = host.split(".");

  if (parts.length <= 2) {
    return host;
  }

  return parts.slice(-2).join(".");
}

function getAllowedHosts(rootUrl: URL): Set<string> {
  const allowed = new Set([rootUrl.hostname.toLowerCase()]);

  // Local/IP hosts (e.g. the batch grader's http://localhost:8099) have no
  // sibling subdomains, so don't invent any.
  if (isLocalOrIp(rootUrl.hostname)) {
    return allowed;
  }

  const rootDomain = getRootDomain(rootUrl.hostname);

  for (const subdomain of RESEARCH_SUBDOMAINS) {
    allowed.add(`${subdomain}.${rootDomain}`);
  }

  return allowed;
}

function buildResearchSubdomainUrls(rootUrl: URL): string[] {
  if (isLocalOrIp(rootUrl.hostname)) {
    return [];
  }

  const rootDomain = getRootDomain(rootUrl.hostname);

  return RESEARCH_SUBDOMAINS.map(
    (subdomain) => `${rootUrl.protocol}//${subdomain}.${rootDomain}/`,
  );
}

function isResearchSubdomain(candidateUrl: string, rootUrl: URL): boolean {
  try {
    if (isLocalOrIp(rootUrl.hostname)) {
      return false;
    }

    const candidate = new URL(candidateUrl);
    const rootDomain = getRootDomain(rootUrl.hostname);

    return (
      candidate.hostname !== rootUrl.hostname &&
      getRootDomain(candidate.hostname) === rootDomain &&
      RESEARCH_SUBDOMAINS.some(
        (subdomain) => candidate.hostname === `${subdomain}.${rootDomain}`,
      )
    );
  } catch {
    return false;
  }
}

function isResearchRelevantPath(url: string): boolean {
  try {
    const parsed = new URL(url);
    const searchablePath = `${parsed.pathname} ${parsed.search}`.toLowerCase();

    return RESEARCH_LINK_TERMS.some((term) => searchablePath.includes(term));
  } catch {
    return false;
  }
}

function filterCrawlLinks(
  links: string[],
  rootUrl: URL,
  allowedHosts: Set<string>,
): string[] {
  return links.filter((link) => {
    try {
      const parsed = new URL(link);

      if (!allowedHosts.has(parsed.hostname.toLowerCase())) {
        return false;
      }

      // On sibling research hosts, only follow links that look hiring-related.
      // This keeps us out of the rest of a huge handbook.
      if (isResearchSubdomain(link, rootUrl)) {
        return isResearchRelevantPath(link);
      }

      return true;
    } catch {
      return false;
    }
  });
}

function normalizeUrl(url: string): string {
  const parsed = new URL(url);

  parsed.hash = "";

  if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  return parsed.toString();
}

export async function crawlCompany(
  companyUrl: string,
  options?: { allowLocalhost?: boolean },
): Promise<CrawlResult> {
  const rootUrl = await validateCompanyUrl(
    companyUrl,
    options?.allowLocalhost ?? false,
  );

  const allowedHosts = getAllowedHosts(rootUrl);

  const queue = [normalizeUrl(rootUrl.toString())];
  const queued = new Set(queue);

  // URLs we have requested (or decided to skip).
  const visited = new Set<string>();

  // Final URLs after redirects. Two different requests can land on the same
  // page (e.g. jobs.example.com redirecting to example.com/jobs).
  const landed = new Set<string>();

  const pages: ScrapedPage[] = [];

  let attempts = 0;
  let siblingsSeeded = false;

  while (
    queue.length > 0 &&
    pages.length < MAX_PAGES &&
    attempts < MAX_ATTEMPTS
  ) {
    const currentUrl = queue.shift();

    if (!currentUrl) {
      continue;
    }

    queued.delete(currentUrl);

    if (visited.has(currentUrl)) {
      continue;
    }

    visited.add(currentUrl);
    attempts++;

    try {
      const allowed = await canFetch(currentUrl);

      if (!allowed) {
        continue;
      }

      const fetched = await fetchPage(currentUrl);

      const landedUrl = normalizeUrl(fetched.url);
      const landedHost = new URL(fetched.url).hostname.toLowerCase();

      // The very first page may legitimately redirect (example.com ->
      // www.example.com). Trust that one redirect and allow the new host.
      if (pages.length === 0 && !allowedHosts.has(landedHost)) {
        if (getRootDomain(landedHost) === getRootDomain(rootUrl.hostname)) {
          allowedHosts.add(landedHost);
        }
      }

      // A redirect must not carry us onto a host we never allowed.
      if (!allowedHosts.has(landedHost)) {
        continue;
      }

      // Two requests, same final page.
      if (landed.has(landedUrl)) {
        continue;
      }

      landed.add(landedUrl);
      visited.add(landedUrl);

      const cleaned = cleanHtml(fetched.html);

      pages.push({
        url: fetched.url,
        title: cleaned.title,
        text: cleaned.text,
        status: fetched.status,
        contentType: fetched.contentType,
      });

      const discoveredLinks = extractRelevantLinks(fetched.html, fetched.url);

      const filteredLinks = filterCrawlLinks(
        discoveredLinks,
        rootUrl,
        allowedHosts,
      );

      // Seed sibling research hosts once, after the first successful page.
      const siblingResearchLinks = !siblingsSeeded
        ? buildResearchSubdomainUrls(rootUrl)
        : [];

      siblingsSeeded = true;

      const prioritizedLinks = [...siblingResearchLinks, ...filteredLinks];

      for (const link of prioritizedLinks) {
        const normalizedLink = normalizeUrl(link);

        if (!visited.has(normalizedLink) && !queued.has(normalizedLink)) {
          queue.push(normalizedLink);
          queued.add(normalizedLink);
        }
      }
    } catch (error) {
      console.warn(
        `Failed to crawl ${currentUrl}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  return {
    pages,
    pagesUsed: pages.map((page) => page.url),
  };
}
