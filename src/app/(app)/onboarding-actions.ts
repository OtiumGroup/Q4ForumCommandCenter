"use server";

import { createClient } from "@/lib/supabase/server";

// Marks the current user as having completed (or dismissed) the first-run
// onboarding, so the welcome modal only ever shows once per account.
export async function completeOnboarding(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  await supabase.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("id", user.id);
  return { ok: true };
}
