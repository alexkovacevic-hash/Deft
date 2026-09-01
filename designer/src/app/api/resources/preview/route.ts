import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handleApiError, studioGuard } from "@/lib/api";

const schema = z.object({ url: z.string().url() });

const BLOCKED_HOSTS = /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1)/i;

function meta(html: string, ...names: string[]): string | null {
  for (const name of names) {
    const pattern = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']`,
      "i"
    );
    const alt = new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`,
      "i"
    );
    const match = html.match(pattern) ?? html.match(alt);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function decode(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

/**
 * Best-effort Open Graph lookup so shared links get a title, blurb and image
 * without the designer typing them. Failure here is never fatal — the caller
 * falls back to manual entry.
 */
export async function POST(req: Request) {
  try {
    await studioGuard("resources.manage");
    const { url } = schema.parse(await req.json());

    const target = new URL(url);
    if (!/^https?:$/.test(target.protocol)) throw new ApiError(422, "Only http and https links are supported.");
    if (BLOCKED_HOSTS.test(target.hostname)) throw new ApiError(422, "That host is not reachable.");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(target.toString(), {
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": "DeftDesigner/1.0 (+link preview)" },
      });
      if (!res.ok) return NextResponse.json({ preview: null });

      const html = (await res.text()).slice(0, 400_000);
      const title = meta(html, "og:title", "twitter:title") ?? html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? null;
      const description = meta(html, "og:description", "twitter:description", "description");
      const image = meta(html, "og:image", "twitter:image");
      const siteName = meta(html, "og:site_name");

      return NextResponse.json({
        preview: {
          title: title ? decode(title).slice(0, 200) : null,
          description: description ? decode(description).slice(0, 500) : null,
          imageUrl: image ? new URL(decode(image), target).toString() : null,
          siteName: siteName ? decode(siteName) : target.hostname.replace(/^www\./, ""),
        },
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    if (error instanceof ApiError) return handleApiError(error);
    // Network failures are expected for some sites; degrade to manual entry.
    return NextResponse.json({ preview: null });
  }
}
