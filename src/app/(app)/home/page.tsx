import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Bell, CalendarDays } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user?.id ?? "")
    .single();

  const { data: broadcasts } = await supabase
    .from("broadcasts")
    .select("id, title, body, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening in the forum.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-accent" /> Admin notices
            </CardTitle>
            <CardDescription>Broadcasts from your moderator.</CardDescription>
          </CardHeader>
          <CardContent>
            {broadcasts && broadcasts.length > 0 ? (
              <ul className="space-y-4">
                {broadcasts.map((b) => (
                  <li key={b.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <p className="text-sm font-medium">{b.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{b.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No notices yet — check back soon.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-accent" /> Calendar
            </CardTitle>
            <CardDescription>Meetings &amp; events at a glance.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your upcoming meetings and events will show up here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
