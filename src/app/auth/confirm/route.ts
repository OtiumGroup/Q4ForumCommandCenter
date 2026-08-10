import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Handles email-link confirmations (invite + password recovery). Verifying
// here — in a Route Handler, not a Server Component — is what lets the
// resulting session persist to cookies, so the page we redirect to (and its
// form submission) is properly authenticated.
//
// Supports both flows:
//   • token_hash + type  → verifyOtp (browser-independent; works when an admin
//                           sends the link and the member opens it elsewhere)
//   • code               → exchangeCodeForSession (PKCE; same-browser flows)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/home";
  const next = nextParam.startsWith("/") ? nextParam : "/home";

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL("/forgot?error=invalid", origin));
}
