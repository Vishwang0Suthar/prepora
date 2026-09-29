import dns from "node:dns/promises";

const PRIVATE_HOSTNAMES = new Set(["localhost", "localhost.localdomain"]);

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);

  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    return false;
  }

  const [a, b] = parts;

  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

export async function validateCompanyUrl(
  input: string,
  allowLocalhost = false,
): Promise<URL> {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    throw new Error("INVALID_COMPANY_URL");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("UNSUPPORTED_URL_PROTOCOL");
  }

  url.hash = "";

  if (!allowLocalhost && PRIVATE_HOSTNAMES.has(url.hostname)) {
    throw new Error("PRIVATE_URL_NOT_ALLOWED");
  }

  if (!allowLocalhost) {
    try {
      const addresses = await dns.lookup(url.hostname, {
        all: true,
      });

      for (const address of addresses) {
        if (address.family === 4 && isPrivateIPv4(address.address)) {
          throw new Error("PRIVATE_URL_NOT_ALLOWED");
        }
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "PRIVATE_URL_NOT_ALLOWED"
      ) {
        throw error;
      }

      throw new Error("HOST_LOOKUP_FAILED");
    }
  }

  return url;
}
