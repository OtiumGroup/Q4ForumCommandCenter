"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PasswordStepState = {
  status: "idle" | "otp_sent" | "error";
  email?: string;
  message?: string;
};

export type OtpStepState = {
  status: "idle" | "error";
  message?: string;
};

/**
 * Step 1 of login — verify email + password.
 *
 * On success we do NOT leave the user signed in yet. We immediately sign
 * the just-created session back out and instead send a one-time email
 * code. The app only ever considers a visitor "logged in" (i.e. holding a
 * session cookie proxy.ts will accept) once they've also passed step 2.
 * This gives us real two-factor auth — something you know (password) and
 * something you have (inbox access) — instead of password-only.
 */
export async function passwordStep(
  _prevState: PasswordStepState,
  formData: FormData
): Promise<PasswordStepState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { status: "error", message: "Enter your email and password." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return {
      status: "error",
      message: "Incorrect email or password.",
    };
  }

  // Password verified — signInWithPassword has established the cookie-backed
  // session, so the member is in. iOS/Safari will offer to save this password
  // and auto-fill it with Face ID / Touch ID on future logins. (Two-factor
  // email codes were removed in favor of this smoother, device-native flow;
  // the otpStep/resendOtp helpers below remain if we ever reinstate 2FA.)
  redirect("/home");
}

/**
 * Step 2 of login — verify the 6-digit email code. Success here is what
 * actually establishes the real, cookie-backed Supabase session.
 */
export async function otpStep(
  _prevState: OtpStepState,
  formData: FormData
): Promise<OtpStepState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const token = String(formData.get("token") || "").trim();

  if (!email || token.length < 6) {
    return { status: "error", message: "Enter the 6-digit code from your email." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    return { status: "error", message: "That code is incorrect or expired." };
  }

  // Always land members on the home dashboard after signing in.
  redirect("/home");
}

export async function resendOtp(email: string) {
  const supabase = await createClient();
  await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
