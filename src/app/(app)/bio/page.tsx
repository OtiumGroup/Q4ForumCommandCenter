import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function BioDirectoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, photo_url, birthday, businesses")
    .order("full_name", { ascending: true, nullsFirst: false });

  const members = profiles ?? [];
  const complete = members.filter((m) => m.full_name && m.birthday && m.photo_url);
  const incomplete = members.filter((m) => !(m.full_name && m.birthday && m.photo_url));

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Member Bios</h1>
          <p className="mt-1 text-sm text-muted-foreground">Get to know the forum.</p>
        </div>
        <Button asChild>
          <Link href="/bio/edit">
            <Pencil className="mr-1.5 h-4 w-4" /> Edit my bio
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {complete.map((m) => {
          const primaryBusiness = Array.isArray(m.businesses) && m.businesses.length > 0 ? m.businesses[0] : null;
          return (
            <Link key={m.id} href={`/bio/${m.id}`}>
              <Card className="h-full transition-colors hover:border-accent">
                <CardContent className="flex items-center gap-4 py-5">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={m.photo_url ?? undefined} alt={m.full_name ?? ""} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {initials(m.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{m.full_name}</p>
                    {primaryBusiness && (
                      <p className="text-sm text-muted-foreground">
                        {primaryBusiness.title ? `${primaryBusiness.title} · ` : ""}
                        {primaryBusiness.name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {incomplete.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Haven&apos;t finished their bio yet
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {incomplete.map((m) => (
              <Card key={m.id} className="border-dashed opacity-70">
                <CardContent className="flex items-center gap-4 py-5">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={m.photo_url ?? undefined} alt={m.full_name ?? ""} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {initials(m.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{m.full_name ?? "New member"}</p>
                    <p className="text-sm text-muted-foreground">
                      {m.id === user?.id ? "Finish your bio to appear here" : "Profile incomplete"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
