"use client";

import { useActionState, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { ShieldCheck, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { passwordStep, otpStep, resendOtp, type PasswordStepState, type OtpStepState } from "./actions";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Please wait…" : children}
    </Button>
  );
}

/* The squircle mark below is a placeholder for the final 3D Q4 logo.
   When the logo image is added to /public, swap this block for an <img>. */
function BrandMark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/q4-mark.png" alt="EO Q4 Forum" className="mx-auto h-24 w-24 rounded-2xl shadow-sm" />
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/home";

  const [pwState, pwAction] = useActionState<PasswordStepState, FormData>(passwordStep, { status: "idle" });
  const [otpState, otpAction] = useActionState<OtpStepState, FormData>(otpStep, { status: "idle" });
  const [resent, setResent] = useState(false);

  const step: 1 | 2 = pwState.status === "otp_sent" ? 2 : 1;
  const email = pwState.email ?? "";

  return (
    <div className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top,var(--secondary)_0%,var(--background)_60%)] px-4 py-10">
      <div className="w-full max-w-sm duration-500 animate-in fade-in slide-in-from-bottom-2">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark />
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">EO Q4 Forum</h1>
            <p className="mt-1 text-sm text-muted-foreground">Command Center — private, members only</p>
          </div>
        </div>

        <Card className="border-border/70 shadow-lg">
          {step === 1 ? (
            <form action={pwAction}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lock className="h-4 w-4 text-accent" /> Sign in
                </CardTitle>
                <CardDescription>
                  Enter your email and password. You&apos;ll confirm with a code sent to your inbox next.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" autoComplete="current-password" required />
                </div>
                {pwState.status === "error" && <p className="text-sm text-destructive">{pwState.message}</p>}
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <SubmitButton>Continue</SubmitButton>
                <p className="text-center text-xs text-muted-foreground">
                  New member?{" "}
                  <Link href="/invite" className="text-accent underline underline-offset-2">Use your invite link</Link>
                </p>
              </CardFooter>
            </form>
          ) : (
            <form action={otpAction}>
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="next" value={next} />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-4 w-4 text-accent" /> Verify it&apos;s you
                </CardTitle>
                <CardDescription className="flex items-start gap-1.5">
                  <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. It expires shortly.</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Verification code</Label>
                  <Input id="token" name="token" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" className="text-center text-lg tracking-[0.5em]" required />
                </div>
                {otpState.status === "error" && <p className="text-sm text-destructive">{otpState.message}</p>}
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <SubmitButton>Verify &amp; sign in</SubmitButton>
                <button type="button" className="text-center text-xs text-muted-foreground underline underline-offset-2 disabled:opacity-50" disabled={resent} onClick={() => { setResent(true); void resendOtp(email); }}>
                  {resent ? "Code resent" : "Resend code"}
                </button>
              </CardFooter>
            </form>
          )}
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">Trouble signing in? Contact your forum moderator.</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
