import { createClient } from "@/lib/supabase/server";
import { SetPasswordForm } from "./set-password-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

// The session is established by /auth/confirm (a Route Handler) before the
// member lands here, so we only need to confirm it's present and show the form.
export default async function ResetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top,var(--sidebar)_0%,var(--background)_65%)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="relative mb-1 h-20 w-20">
            <div aria-hidden className="absolute -inset-3 -z-10 rounded-full bg-accent/20 blur-2xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/q4-mark.png" alt="Q4" className="q4-float h-20 w-20 rounded-2xl object-cover shadow-[0_16px_32px_-8px_rgba(38,35,29,0.45),0_6px_14px_-4px_rgba(154,119,72,0.4)] ring-1 ring-black/5" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome to the Command Center</h1>
          <p className="text-sm text-muted-foreground">Set your password to finish getting set up.</p>
        </div>
        <Card className="border-border/70 shadow-lg">
          {user ? (
            <SetPasswordForm />
          ) : (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldAlert className="h-4 w-4 text-destructive" /> Link expired
                </CardTitle>
                <CardDescription>This set-password link is invalid or has already been used.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/forgot" className="text-sm text-accent underline underline-offset-2">Send me a new link</Link>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
