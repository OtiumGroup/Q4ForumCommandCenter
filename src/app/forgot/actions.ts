"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type ForgotState = { status: "idle" | "sent" | "error"; message?: string };

export async function sendReset(_prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return { status: "error", message: "Enter your email." };

  const supabase = await createClient();
  const h = await headers();
  const host = h.get("host");
  const origin = h.get("origin") ?? (host ? `https://${host}` : "");
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: origin ? `${origin}/auth/confirm?next=/reset` : undefined });

  // Always report success — don't reveal whether an account exists.
  return { status: "sent" };
}
