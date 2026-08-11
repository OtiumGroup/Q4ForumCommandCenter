"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { sendReset, type ForgotState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Sending…" : "Email me a link"}
    </Button>
  );
}

export default function ForgotPage() {
  const [state, action] = useActionState<ForgotState, FormData>(sendReset, { status: "idle" });
  return (
    <div className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top,var(--sidebar)_0%,var(--background)_65%)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="relative mb-1 h-20 w-20">
            <div aria-hidden className="absolute -inset-3 -z-10 rounded-full bg-accent/20 blur-2xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/q4-mark.png" alt="Q4" className="q4-float h-20 w-20 rounded-2xl object-cover shadow-[0_16px_32px_-8px_rgba(38,35,29,0.45),0_6px_14px_-4px_rgba(154,119,72,0.4)] ring-1 ring-black/5" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Set or reset your password</h1>
          <p className="text-sm text-muted-foreground">We&apos;ll email you a secure link.</p>
        </div>
        <Card className="border-border/70 shadow-lg">
          {state.status === "sent" ? (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> Check your inbox
                </CardTitle>
                <CardDescription>If that email is on the forum, a link is on its way. It expires in an hour.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/login" className="text-sm text-accent underline underline-offset-2">Back to sign in</Link>
              </CardContent>
            </>
          ) : (
            <form action={action}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-4 w-4 text-accent" /> Your email
                </CardTitle>
                <CardDescription>Enter the email your forum uses.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
                </div>
                {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <SubmitButton />
                <Link href="/login" className="text-xs text-muted-foreground underline underline-offset-2">Back to sign in</Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
