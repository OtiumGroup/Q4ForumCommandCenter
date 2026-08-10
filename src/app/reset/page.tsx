import { createClient } from "@/lib/supabase/server";
import { verifyRecoveryToken } from "./actions";
import { SetPasswordForm } from "./set-password-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token_hash?: string }> }) {
  const { token_hash } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let error: string | null = null;
  if (!user) {
    const result = await verifyRecoveryToken(token_hash ?? "");
    if (result.status === "error") error = result.message ?? "This link is invalid.";
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top,var(--sidebar)_0%,var(--background)_65%)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/q4-mark.png" alt="Q4" className="h-12 w-12 rounded-xl object-contain shadow-sm" />
          <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome to the Command Center</h1>
          <p className="text-sm text-muted-foreground">Set your password to finish getting set up.</p>
        </div>
        <Card className="border-border/70 shadow-lg">
          {error ? (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldAlert className="h-4 w-4 text-destructive" /> Link invalid
                </CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/forgot" className="text-sm text-accent underline underline-offset-2">Send me a new link</Link>
              </CardContent>
            </>
          ) : (
            <SetPasswordForm />
          )}
        </Card>
      </div>
    </div>
  );
}
