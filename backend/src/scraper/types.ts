export interface ScrapedPage {
  url: string;
  title: string;
  text: string;
  status: number;
  contentType: string;
}

export interface CrawlResult {
  pages: ScrapedPage[];
  pagesUsed: string[];
}
