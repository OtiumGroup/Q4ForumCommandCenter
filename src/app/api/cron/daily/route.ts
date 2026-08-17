import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushToAll, pushConfigured } from "@/lib/push";
import { birthdayCountdown } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Runs once a day (Vercel Cron). Vercel automatically sends
// `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!pushConfigured()) {
    return NextResponse.json({ ok: false, error: "push not configured" });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  const { data: profiles } = await supabase.from("profiles").select("full_name, birthday").eq("status", "active");

  const birthdaysToday = (profiles ?? []).filter((p) => birthdayCountdown(p.birthday)?.days === 0);

  const results: Array<{ member: string; sent: number }> = [];
  for (const p of birthdaysToday) {
    const first = String(p.full_name || "a member").split(" ")[0];
    const r = await sendPushToAll({
      title: "🎂 Happy Birthday!",
      body: `It's ${p.full_name}'s birthday today — send ${first} some love.`,
      url: "/home",
      tag: "birthday",
    });
    results.push({ member: p.full_name, sent: r.sent });
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), birthdays: birthdaysToday.length, results });
}
