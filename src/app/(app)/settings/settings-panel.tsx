"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bell, Lock, Smartphone, UserCircle, Share, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { setNotificationPref, changePassword } from "./actions";

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Update password"}
    </Button>
  );
}

export function SettingsPanel({
  email,
  emailNotifications,
  inAppNotifications,
}: {
  email: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
}) {
  const [emailNotif, setEmailNotif] = useState(emailNotifications);
  const [inAppNotif, setInAppNotif] = useState(inAppNotifications);
  const [, startTransition] = useTransition();
  const [pwPending, startPwTransition] = useTransition();
  const [pwError, setPwError] = useState<string | null>(null);

  function handlePasswordSubmit(formData: FormData) {
    setPwError(null);
    startPwTransition(async () => {
      const res = await changePassword({ ok: false }, formData);
      if (res.ok) {
        toast.success(res.message ?? "Password updated.");
      } else {
        setPwError(res.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your account, notifications, and app preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCircle className="h-4 w-4 text-accent" /> Profile
          </CardTitle>
          <CardDescription>Signed in as {email}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/bio/edit">Edit my bio</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-accent" /> Password
          </CardTitle>
          <CardDescription>You&apos;ll still confirm with an emailed code every time you sign in.</CardDescription>
        </CardHeader>
        <form action={handlePasswordSubmit}>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" name="password" type="password" minLength={8} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input id="confirm" name="confirm" type="password" minLength={8} required />
            </div>
            {pwError && <p className="text-sm text-destructive sm:col-span-2">{pwError}</p>}
          </CardContent>
          <CardFooter>
            <SubmitButton pending={pwPending} />
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-accent" /> Notifications
          </CardTitle>
          <CardDescription>Choose how you hear about forum updates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium">In-app notices</p>
              <p className="text-xs text-muted-foreground">Show admin broadcasts and events on your home screen.</p>
            </div>
            <Switch
              checked={inAppNotif}
              onCheckedChange={(checked) => {
                setInAppNotif(checked);
                startTransition(async () => {
                  const res = await setNotificationPref("in_app_notifications", checked);
                  if (!res.ok) {
                    toast.error(res.message ?? "Could not save.");
                    setInAppNotif(!checked);
                  }
                });
              }}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium">Email notices</p>
              <p className="text-xs text-muted-foreground">Get emailed when your moderator posts an update.</p>
            </div>
            <Switch
              checked={emailNotif}
              onCheckedChange={(checked) => {
                setEmailNotif(checked);
                startTransition(async () => {
                  const res = await setNotificationPref("email_notifications", checked);
                  if (!res.ok) {
                    toast.error(res.message ?? "Could not save.");
                    setEmailNotif(!checked);
                  }
                });
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-4 w-4 text-accent" /> Install the app
          </CardTitle>
          <CardDescription>Add Command Center to your home screen for one-tap access.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-border p-3 text-sm">
            <p className="mb-1 font-medium">iPhone / iPad (Safari)</p>
            <p className="flex items-center gap-1 text-muted-foreground">
              Tap <Share className="h-3.5 w-3.5" /> Share, then &quot;Add to Home Screen.&quot;
            </p>
          </div>
          <div className="rounded-md border border-border p-3 text-sm">
            <p className="mb-1 font-medium">Android (Chrome)</p>
            <p className="flex items-center gap-1 text-muted-foreground">
              Tap <MoreVertical className="h-3.5 w-3.5" /> menu, then &quot;Add to Home screen.&quot;
            </p>
          </div>
          <div className="rounded-md border border-border p-3 text-sm sm:col-span-2">
            <p className="mb-1 font-medium">Desktop (Chrome / Edge)</p>
            <p className="flex items-center gap-1 text-muted-foreground">
              Click the <Plus className="h-3.5 w-3.5" /> install icon in the address bar, or the browser menu → &quot;Install Command Center.&quot;
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
