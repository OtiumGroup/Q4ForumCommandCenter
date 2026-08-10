import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Handles email-link confirmations (invite + password recovery).
// Verifying here — in a Route Handler, not a Server Component — is what
// lets the resulting session actually persist to cookies, so the page we
// redirect to (and its form submission) is properly authenticated.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/home";
  const next = nextParam.startsWith("/") ? nextParam : "/home";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }
  return NextResponse.redirect(new URL("/forgot?error=invalid", origin));
}
