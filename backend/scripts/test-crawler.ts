import { crawlCompany } from "../src/scraper/crawler";

async function main() {
  const result = await crawlCompany("https://about.gitlab.com");

  console.log("\nPages crawled:\n");

  for (const page of result.pages) {
    console.log(`- ${page.url}`);
  }

  console.log("\nTotal pages:", result.pages.length);
}

main().catch((error) => {
  console.error("Crawler test failed:", error);
  process.exit(1);
});
