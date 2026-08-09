"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type VerifyState = { status: "idle" | "verified" | "error"; message?: string };
export type SetPasswordState = { status: "idle" | "error"; message?: string };

export async function verifyInviteToken(tokenHash: string): Promise<VerifyState> {
  if (!tokenHash) return { status: "error", message: "This invite link is missing its token." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "invite",
  });

  if (error) {
    return {
      status: "error",
      message: "This invite link is invalid or has expired. Ask your moderator to resend it.",
    };
  }

  return { status: "verified" };
}

export async function setInvitePassword(
  _prev: SetPasswordState,
  formData: FormData
): Promise<SetPasswordState> {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (password.length < 8) {
    return { status: "error", message: "Use at least 8 characters." };
  }
  if (password !== confirm) {
    return { status: "error", message: "Passwords don't match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { status: "error", message: "Could not set your password. Try again." };
  }

  await supabase.rpc("mark_invite_accepted");

  redirect("/home");
}
