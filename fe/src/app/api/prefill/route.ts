import { NextRequest } from "next/server";

function extractMeta(html: string, ...names: string[]): string {
  for (const name of names) {
    const pattern = new RegExp(
      `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']{1,600})["']`,
      "i"
    );
    const reverse = new RegExp(
      `<meta[^>]+content=["']([^"']{1,600})["'][^>]+(?:name|property)=["']${name}["']`,
      "i"
    );
    const m = html.match(pattern) ?? html.match(reverse);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

function extractTitle(html: string): string {
  return html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1]?.trim() ?? "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 6000);
}

export async function POST(req: NextRequest) {
  let url: string;
  try {
    ({ url } = await req.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  // Basic URL validation
  let parsed: URL;
  try {
    parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(parsed.href, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EUAIActHelper/1.0; +compliance-check)",
        Accept: "text/html",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return Response.json({ error: `Site returned ${response.status}` }, { status: 422 });
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return Response.json({ error: "URL did not return an HTML page" }, { status: 422 });
    }

    const html = await response.text();

    const title = extractTitle(html);
    const siteName = extractMeta(html, "og:site_name");
    const ogTitle = extractMeta(html, "og:title");
    const description = extractMeta(html, "og:description", "description", "twitter:description");
    const bodyText = stripHtml(html);

    return Response.json({ title, siteName, ogTitle, description, bodyText, url: parsed.href });
  } catch (err) {
    const msg = err instanceof Error && err.name === "AbortError"
      ? "Request timed out — the site took too long to respond"
      : "Could not fetch the URL";
    return Response.json({ error: msg }, { status: 422 });
  }
}
