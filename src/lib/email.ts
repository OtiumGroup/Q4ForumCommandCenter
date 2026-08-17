import "server-only";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.BROADCAST_FROM || "EO Q4 Command Center <noreply@theotiumgroup.net>";
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://q4-forum-command-center.vercel.app";

export function emailConfigured(): boolean {
  return !!RESEND_API_KEY;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Emails a broadcast to opted-in members via Resend. Best-effort; never throws. */
export async function sendBroadcastEmail(
  recipients: { email: string; name: string | null }[],
  title: string,
  body: string
): Promise<{ ok: boolean; sent: number }> {
  if (!RESEND_API_KEY || recipients.length === 0) return { ok: false, sent: 0 };

  const html = (name: string | null) => `
    <div style="font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#24211B;max-width:520px;margin:0 auto;padding:20px">
      <p style="font-size:12px;letter-spacing:2px;color:#2E6B4F;font-weight:700;text-transform:uppercase;margin:0 0 6px">EO Q4 Forum · Command Center</p>
      <h1 style="font-size:21px;margin:0 0 12px;font-weight:600">${escapeHtml(title)}</h1>
      ${name ? `<p style="font-size:14px;color:#6E6656;margin:0 0 12px">Hi ${escapeHtml(name.split(" ")[0])},</p>` : ""}
      <div style="font-size:15px;line-height:1.55;white-space:pre-wrap">${escapeHtml(body)}</div>
      <p style="margin:22px 0 0"><a href="${APP_URL}/home" style="background:#1C3D2B;color:#F4F1EA;padding:11px 18px;border-radius:9px;text-decoration:none;font-weight:600;display:inline-block">Open the Command Center</a></p>
      <p style="font-size:12px;color:#8a8375;margin:24px 0 0;border-top:1px solid #E1D9C9;padding-top:12px">You're receiving this because email notices are on. Turn them off anytime in Settings.</p>
    </div>`;

  let sent = 0;
  await Promise.all(
    recipients.map(async (r) => {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: FROM, to: r.email, subject: title, html: html(r.name) }),
        });
        if (res.ok) sent++;
      } catch {
        /* best-effort */
      }
    })
  );
  return { ok: true, sent };
}
