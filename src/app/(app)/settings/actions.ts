"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: boolean; message?: string };

export async function setNotificationPref(
  key: "email_notifications" | "in_app_notifications",
  value: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You must be signed in." };

  const { error } = await supabase.from("profiles").update({ [key]: value }).eq("id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/settings");
  return { ok: true };
}

export async function changePassword(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (password.length < 8) return { ok: false, message: "Use at least 8 characters." };
  if (password !== confirm) return { ok: false, message: "Passwords don't match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: "Could not update your password." };

  return { ok: true, message: "Password updated." };
}

export async function changeEmail(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email || !email.includes("@") || !email.includes(".")) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You must be signed in." };
  if (email === user.email) return { ok: false, message: "That's already your email." };

  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { ok: false, message: error.message };

  return {
    ok: true,
    message: "Confirmation link sent — check your inbox at the new address. Your email changes once you click it.",
  };
}
