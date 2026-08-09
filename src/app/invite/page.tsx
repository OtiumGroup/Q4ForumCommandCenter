import Link from "next/link";
import { Mail } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function InvitePage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top,var(--sidebar)_0%,var(--background)_65%)] px-4 py-10">
      <Card className="w-full max-w-sm border-border/70 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-4 w-4 text-accent" /> Invite required
          </CardTitle>
          <CardDescription>
            Membership in the EO Q4 Forum Command Center is invite-only. Use the personal invite
            link your moderator emailed you to set up your account. If you&apos;ve lost it, ask
            them to resend it from the Admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className="text-sm underline underline-offset-2">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
