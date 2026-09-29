import { crawlCompany } from "../scraper/crawler";
import { researchHiringPages } from "./hiring";
import { researchPublicDiscussion } from "./discussion.service";
import { TavilyProvider } from "./tavily";

export async function researchCompany(company: string, companyUrl: string) {
  const crawlResult = await crawlCompany(companyUrl);

  const hiringResearch = researchHiringPages(crawlResult.pages);

  const searchProvider = new TavilyProvider();

  const discussionResearch = await researchPublicDiscussion(
    company,
    searchProvider,
  );

  return {
    crawl: crawlResult,
    hiring: hiringResearch,
    discussion: discussionResearch,
  };
}
