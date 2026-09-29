import { extractRelevantLinks } from "../src/scraper/links";

const html = `
  <a href="https://about.gitlab.com/company/contact/">Contact</a>
  <a href="https://about.gitlab.com/company/">Company</a>
  <a href="https://about.gitlab.com/careers/">Careers</a>
  <a href="https://about.gitlab.com/jobs/">Jobs</a>
  <a href="https://handbook.gitlab.com/handbook/hiring/">Hiring Handbook</a>
  <a href="https://handbook.gitlab.com/handbook/hiring/interviewing/">Interviewing</a>
  <a href="https://about.gitlab.com/company/team/e-group/">E Group</a>
  <a href="https://about.gitlab.com/interview-process/">Interview Process</a>
  <a href="https://example.com/interview/">External domain</a>
  <a href="https://about.gitlab.com/de-de/careers/">German locale</a>
`;

const result = extractRelevantLinks(html, "https://about.gitlab.com");

console.log(result);
