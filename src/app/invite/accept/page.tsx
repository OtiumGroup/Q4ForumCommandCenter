import { createClient } from "@/lib/supabase/server";
import { verifyInviteToken } from "./actions";
import { SetPasswordForm } from "./set-password-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string }>;
}) {
  const { token_hash } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let error: string | null = null;

  if (!user) {
    const result = await verifyInviteToken(token_hash ?? "");
    if (result.status === "error") {
      error = result.message ?? "This invite link is invalid.";
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top,var(--sidebar)_0%,var(--background)_65%)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-lg font-semibold">
            Q4
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome</h1>
          <p className="text-sm text-muted-foreground">Set a password to finish joining the forum.</p>
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
                <Link href="/login" className="text-sm underline underline-offset-2">
                  Back to sign in
                </Link>
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
