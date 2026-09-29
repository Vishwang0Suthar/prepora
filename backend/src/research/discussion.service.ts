import type { SearchProvider } from "./search";
import type { DiscussionResearch } from "./discussion";

const INTERVIEW_RESEARCH_TERMS = [
  "interview",
  "interviewing",
  "hiring",
  "recruiting",
  "recruitment",
  "candidate",
  "application process",
];

function isInterviewRelevant(title: string, snippet: string): boolean {
  const searchableText = `${title} ${snippet}`.toLowerCase();

  return INTERVIEW_RESEARCH_TERMS.some((term) => searchableText.includes(term));
}

export async function researchPublicDiscussion(
  company: string,
  provider: SearchProvider,
): Promise<DiscussionResearch> {
  const results = await provider.search({
    query: `"${company}" interview experience reddit hiring process`,
    limit: 8,
  });

  const filteredResults = results.filter((result) =>
    isInterviewRelevant(result.title, result.snippet),
  );

  const text = filteredResults
    .map(
      (result) =>
        `TITLE: ${result.title}\n` +
        `SOURCE: ${result.source}\n` +
        `URL: ${result.url}\n` +
        `SNIPPET: ${result.snippet}`,
    )
    .join("\n\n");

  return {
    results: filteredResults.map((result) => ({
      title: result.title,
      url: result.url,
      snippet: result.snippet,
      source: result.source,
    })),

    sources: filteredResults.map((result) => result.url),

    text,
  };
}
