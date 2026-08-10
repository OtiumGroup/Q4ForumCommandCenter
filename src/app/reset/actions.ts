"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SetPasswordState = { status: "idle" | "error"; message?: string };

export async function setNewPassword(_prev: SetPasswordState, formData: FormData): Promise<SetPasswordState> {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");
  if (password.length < 8) return { status: "error", message: "Use at least 8 characters." };
  if (password !== confirm) return { status: "error", message: "Passwords don't match." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Your link expired. Request a new one from the sign-in page." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { status: "error", message: "Could not set your password. Try again." };

  redirect("/home");
}
