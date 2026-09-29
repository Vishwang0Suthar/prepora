import axios from "axios";
import robotsParser from "robots-parser";

const ROBOTS_TIMEOUT_MS = 5_000;

export async function canFetch(targetUrl: string): Promise<boolean> {
  const url = new URL(targetUrl);

  const robotsUrl = new URL("/robots.txt", url.origin).toString();

  try {
    const response = await axios.get<string>(robotsUrl, {
      timeout: ROBOTS_TIMEOUT_MS,
      responseType: "text",
      validateStatus: (status) => status >= 200 && status < 500,
    });

    if (response.status === 404) {
      return true;
    }

    if (response.status >= 400) {
      return false;
    }

    const robots = robotsParser(robotsUrl, response.data);

    return robots.isAllowed(targetUrl, "PreporaBot") !== false;
  } catch {
    return false;
  }
}
