import "server-only";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

// VAPID values are pasted into env vars by hand and have repeatedly picked up
// stray characters. Sanitize them; if a value still isn't a valid key, fall
// back to the known-good keypair below so sending can't break on a bad paste.
// (The public key is non-secret; the private key can only push to subscriptions
// whose endpoint+keys are already stored in our RLS-protected database.)
const cleanKey = (s?: string) => (s || "").replace(/[^A-Za-z0-9_-]/g, "");
const cleanSubject = (s?: string) => (s || "").trim().replace(/[^\x20-\x7E]/g, "");
const keyBytes = (s: string) => {
  try {
    return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").length;
  } catch {
    return 0;
  }
};

const VAPID_PUBLIC_FALLBACK = "BFWdIvMmNGlPQtqwWOuyMqJSax-uylrgzcM2m70RRyjEx0GAzvZE52yl8bjpYXKAh8wtWcd0WmLcpnV3tHOWOTE";
const VAPID_PRIVATE_FALLBACK = "nCz-ZK3-n4Orm18qrd-ymC9_fHqFUYekZ3fVBZ-ixf8";

let vapidPublic = cleanKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
if (keyBytes(vapidPublic) !== 65) vapidPublic = VAPID_PUBLIC_FALLBACK;
let vapidPrivate = cleanKey(process.env.VAPID_PRIVATE_KEY);
if (keyBytes(vapidPrivate) !== 32) vapidPrivate = VAPID_PRIVATE_FALLBACK;

const VAPID_PUBLIC = vapidPublic;
const VAPID_PRIVATE = vapidPrivate;
const VAPID_SUBJECT = cleanSubject(process.env.VAPID_SUBJECT) || "mailto:brian@theotiumgroup.com";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  configured = true;
  return true;
}

// Service-role client so we can read every subscription and prune stale ones.
function adminClient() {
  return createClient(SUPABASE_URL!, SERVICE_ROLE!, { auth: { persistSession: false } });
}

export function pushConfigured(): boolean {
  return !!(VAPID_PUBLIC && VAPID_PRIVATE && SERVICE_ROLE && SUPABASE_URL);
}

type PushPayload = { title: string; body: string; url?: string; tag?: string };

/** Send a notification to every stored subscription. Prunes dead endpoints. */
export async function sendPushToAll(payload: PushPayload): Promise<{ ok: boolean; sent: number; removed: number; reason?: string }> {
  if (!pushConfigured() || !ensureConfigured()) {
    return { ok: false, sent: 0, removed: 0, reason: "push not configured" };
  }
  const supabase = adminClient();
  const { data: subs, error } = await supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth");
  if (error || !subs) return { ok: false, sent: 0, removed: 0, reason: error?.message ?? "no subscriptions" };

  const body = JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? "/home", tag: payload.tag });
  const stale: string[] = [];
  let sent = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body);
        sent++;
      } catch (err: unknown) {
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) stale.push(s.id);
      }
    })
  );

  if (stale.length) await supabase.from("push_subscriptions").delete().in("id", stale);
  return { ok: true, sent, removed: stale.length };
}

/** Send a push to a single member's own devices (used for the "test" button). */
export async function sendPushToMember(memberId: string, payload: PushPayload): Promise<{ ok: boolean; sent: number; reason?: string }> {
  if (!pushConfigured() || !ensureConfigured()) return { ok: false, sent: 0, reason: "Push isn't fully configured on the server yet." };
  const supabase = adminClient();
  const { data: subs, error } = await supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("member_id", memberId);
  if (error) return { ok: false, sent: 0, reason: error.message };
  if (!subs || subs.length === 0) return { ok: false, sent: 0, reason: "No registered device found for this account." };

  const body = JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? "/home", tag: payload.tag });
  let sent = 0;
  let lastError: string | undefined;
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body);
      sent++;
    } catch (err: unknown) {
      lastError = (err as { body?: string; message?: string })?.body || (err as { message?: string })?.message || "send failed";
    }
  }
  return { ok: sent > 0, sent, reason: sent > 0 ? undefined : lastError };
}
