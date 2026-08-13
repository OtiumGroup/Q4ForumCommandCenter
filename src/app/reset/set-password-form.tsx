"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { setNewPassword, type SetPasswordState } from "./actions";
import { passwordChecks, isStrongPassword } from "@/lib/password";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending || disabled}>
      {pending ? "Please wait…" : "Set password & continue"}
    </Button>
  );
}

export function SetPasswordForm() {
  const [state, action] = useActionState<SetPasswordState, FormData>(setNewPassword, { status: "idle" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const checks = passwordChecks(password);
  const strong = isStrongPassword(password);
  const matches = confirm.length > 0 && password === confirm;
  const canSubmit = strong && matches;

  return (
    <form action={action}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="h-4 w-4 text-accent" /> Choose your password
        </CardTitle>
        <CardDescription>You&apos;ll use this along with an emailed code every time you sign in.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <ul className="space-y-1.5 rounded-lg border border-border bg-secondary/40 p-3">
          {checks.map((c) => (
            <li key={c.label} className={`flex items-center gap-2 text-[13px] ${c.ok ? "text-foreground" : "text-muted-foreground"}`}>
              {c.ok ? <Check className="h-3.5 w-3.5 text-accent" /> : <Circle className="h-3.5 w-3.5 opacity-40" />}
              {c.label}
            </li>
          ))}
        </ul>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {confirm.length > 0 && !matches && <p className="text-[13px] text-destructive">Passwords don&apos;t match yet.</p>}
        </div>

        {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
      </CardContent>
      <CardFooter>
        <SubmitButton disabled={!canSubmit} />
      </CardFooter>
    </form>
  );
}
