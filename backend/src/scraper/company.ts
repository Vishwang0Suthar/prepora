import { crawlCompany } from "../scraper/crawler";
import { researchHiringPages } from "../research/hiring";

export interface CompanyResearch {
  pages: Awaited<ReturnType<typeof crawlCompany>>["pages"];

  pagesUsed: string[];

  hiring: ReturnType<typeof researchHiringPages>;
}

export async function researchCompany(
  companyUrl: string,
  options?: {
    allowLocalhost?: boolean;
  },
): Promise<CompanyResearch> {
  const crawl = await crawlCompany(companyUrl, options);

  const hiring = researchHiringPages(crawl.pages);

  return {
    pages: crawl.pages,
    pagesUsed: crawl.pagesUsed,
    hiring,
  };
}
