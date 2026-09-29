import * as cheerio from "cheerio";

const MAX_TEXT_CHARS = 30_000;

export interface CleanPage {
  title: string;
  text: string;
}

export function cleanHtml(html: string): CleanPage {
  const $ = cheerio.load(html);

  $("script, style, noscript, iframe, svg").remove();

  $("nav, header, footer, aside").remove();

  const title = $("title").first().text().trim();

  const text = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_CHARS);

  return {
    title,
    text,
  };
}
