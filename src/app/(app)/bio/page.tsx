import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, Briefcase } from "lucide-react";

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

type Business = { name: string; title?: string };

export default async function BioDirectoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, photo_url, birthday, businesses, current_interests")
    .order("full_name", { ascending: true, nullsFirst: false });

  const members = profiles ?? [];
  const hasBio = (m: (typeof members)[number]) =>
    Boolean(m.full_name && (m.birthday || m.current_interests || (Array.isArray(m.businesses) && m.businesses.length > 0)));
  const featured = members.filter(hasBio);
  const pending = members.filter((m) => !hasBio(m));

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">The members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {featured.length > 0 ? `${featured.length} ${featured.length === 1 ? "member" : "members"} of the Q4 forum.` : "Get to know the forum."}
          </p>
        </div>
        <Button asChild>
          <Link href="/bio/edit"><Pencil className="mr-1.5 h-4 w-4" /> Edit my bio</Link>
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {featured.map((m) => {
          const biz = (Array.isArray(m.businesses) ? m.businesses : []) as Business[];
          const primary = biz[0] ?? null;
          return (
            <Link key={m.id} href={`/bio/${m.id}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-secondary shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-accent/20">
                {m.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photo_url} alt={m.full_name ?? ""} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary font-display text-5xl font-semibold text-primary-foreground">
                    {initials(m.full_name)}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                {m.id === user?.id && (
                  <span className="absolute right-3 top-3 rounded-full bg-accent/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-accent-foreground">You</span>
                )}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-display text-lg font-semibold leading-tight text-white drop-shadow-sm">{m.full_name}</p>
                  {primary && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-white/85">
                      <Briefcase className="h-3 w-3 shrink-0" />
                      <span className="truncate">{primary.title ? `${primary.title} · ` : ""}{primary.name}</span>
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {pending.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Yet to complete a bio</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pending.map((m) => (
              <Card key={m.id} className="border-dashed opacity-80">
                <CardContent className="flex items-center gap-4 py-5">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={m.photo_url ?? undefined} alt={m.full_name ?? ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground">{initials(m.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{m.full_name ?? "New member"}</p>
                    <p className="text-sm text-muted-foreground">{m.id === user?.id ? "Add your bio to appear above" : "Invitation pending"}</p>
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
