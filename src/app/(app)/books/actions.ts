"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: boolean; message?: string };

export async function addMediaItem(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You must be signed in." };

  const type = formData.get("type") === "audiobook" || formData.get("type") === "podcast"
    ? formData.get("type")
    : "book";
  const title = String(formData.get("title") || "").trim();
  const authorOrHost = String(formData.get("author_or_host") || "").trim() || null;
  const topic = String(formData.get("topic") || "").trim() || null;
  const coverImageUrl = String(formData.get("cover_image_url") || "").trim() || null;
  const sourceUrl = String(formData.get("source_url") || "").trim() || null;
  const externalLink = String(formData.get("external_link") || "").trim() || sourceUrl;
  const description = String(formData.get("description") || "").trim() || null;

  if (!title) return { ok: false, message: "A title is required." };

  const { error } = await supabase.from("media_items").insert({
    type,
    title,
    author_or_host: authorOrHost,
    topic,
    cover_image_url: coverImageUrl,
    source_url: sourceUrl,
    external_link: externalLink,
    description,
    added_by: user.id,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/books");
  return { ok: true, message: "Added to the library." };
}

export async function deleteMediaItem(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("media_items").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/books");
  return { ok: true };
}

type LinkMetadata = {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${property}["']`, "i"),
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match?.[1]) return match[1];
  }
  return null;
}

/**
 * Best-effort Open Graph scrape so pasting a link (e.g. an Audible page)
 * can prefill title/cover/description. Purely a convenience — every
 * field stays editable, and a failure here never blocks manual entry.
 */
export async function fetchLinkMetadata(url: string): Promise<{ ok: boolean; data?: LinkMetadata; message?: string }> {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { ok: false, message: "Enter a valid http(s) link." };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; EOQ4CommandCenter/1.0)" },
    });
    clearTimeout(timeout);

    if (!res.ok) return { ok: false, message: "Could not read that link." };

    const html = await res.text();
    const title = extractMeta(html, "og:title") ?? html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? null;
    const description = extractMeta(html, "og:description") ?? extractMeta(html, "description");
    const image = extractMeta(html, "og:image");
    const siteName = extractMeta(html, "og:site_name");

    return { ok: true, data: { title, description, image, siteName } };
  } catch {
    return { ok: false, message: "Could not fetch details from that link — enter them manually." };
  }
}
