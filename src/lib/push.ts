import "server-only";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:brian@theotiumgroup.com";
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
