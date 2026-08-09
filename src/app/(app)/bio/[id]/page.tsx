import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Pencil,
  Cake,
  MapPin,
  GraduationCap,
  Heart,
  Users,
  Briefcase,
  Globe,
  Trophy,
  Building2,
} from "lucide-react";

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function formatBirthday(birthday: string | null) {
  if (!birthday) return null;
  const [, month, day] = birthday.split("-").map(Number);
  const d = new Date(2000, (month ?? 1) - 1, day ?? 1);
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

type Business = {
  name: string;
  title?: string;
  description?: string;
  address?: string;
  website?: string;
  google_link?: string;
};
type Kid = { name: string; age?: string };

export default async function BioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!profile) notFound();

  const businesses = (Array.isArray(profile.businesses) ? profile.businesses : []) as Business[];
  const kids = (Array.isArray(profile.kids) ? profile.kids : []) as Kid[];
  const websites = (Array.isArray(profile.websites) ? profile.websites : []) as string[];
  const isSelf = user?.id === id;

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/bio">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> All bios
          </Link>
        </Button>
        {isSelf && (
          <Button asChild size="sm">
            <Link href="/bio/edit">
              <Pencil className="mr-1.5 h-4 w-4" /> Edit my bio
            </Link>
          </Button>
        )}
      </div>

      <Card className="mb-6 overflow-hidden py-0">
        <div className="relative h-28 bg-gradient-to-r from-primary via-primary to-sidebar sm:h-32">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, var(--accent) 0%, transparent 55%)" }} />
        </div>
        <CardContent className="flex flex-col items-center gap-4 px-6 pb-8 pt-0 text-center sm:flex-row sm:items-end sm:text-left">
          <Avatar className="-mt-14 h-28 w-28 border-4 border-card shadow-md sm:-mt-16 sm:h-32 sm:w-32">
            <AvatarImage src={profile.photo_url ?? undefined} alt={profile.full_name ?? ""} className="object-cover" />
            <AvatarFallback className="bg-secondary text-3xl text-secondary-foreground">
              {initials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="pb-1">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {profile.full_name ?? "Member"}
            </h1>
            {businesses[0] && (
              <p className="mt-1 text-muted-foreground">
                {businesses[0].title ? `${businesses[0].title} · ` : ""}
                {businesses[0].name}
              </p>
            )}
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {formatBirthday(profile.birthday) && (
                <Badge variant="secondary" className="gap-1">
                  <Cake className="h-3 w-3" /> {formatBirthday(profile.birthday)}
                </Badge>
              )}
              {profile.eo_member_since && (
                <Badge variant="secondary" className="gap-1">
                  <Trophy className="h-3 w-3" /> EO member since {profile.eo_member_since}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {(profile.spouse_name || kids.length > 0 || profile.family_notes) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-accent" /> Family
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {profile.spouse_name && (
                <p>
                  <span className="text-muted-foreground">Spouse: </span>
                  {profile.spouse_name}
                </p>
              )}
              {kids.length > 0 && (
                <p>
                  <span className="text-muted-foreground">Kids: </span>
                  {kids.map((k) => `${k.name}${k.age ? ` (${k.age})` : ""}`).join(", ")}
                </p>
              )}
              {profile.family_notes && <p className="text-muted-foreground">{profile.family_notes}</p>}
            </CardContent>
          </Card>
        )}

        {(profile.hometown ||
          profile.education ||
          profile.sport_played ||
          profile.current_interests ||
          profile.home_address) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="h-4 w-4 text-accent" /> Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {profile.home_address && (
                <p className="flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" /> {profile.home_address}
                </p>
              )}
              {profile.hometown && (
                <p>
                  <span className="text-muted-foreground">Born &amp; raised: </span>
                  {profile.hometown}
                </p>
              )}
              {profile.education && (
                <p className="flex items-start gap-1.5">
                  <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" /> {profile.education}
                </p>
              )}
              {profile.sport_played && (
                <p>
                  <span className="text-muted-foreground">Grew up playing: </span>
                  {profile.sport_played}
                </p>
              )}
              {profile.current_interests && (
                <p>
                  <span className="text-muted-foreground">Current interests: </span>
                  {profile.current_interests}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {businesses.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4 text-accent" /> Business
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {businesses.map((b, i) => (
                <div key={i} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{b.name}</p>
                    {b.title && <span className="text-sm text-muted-foreground">— {b.title}</span>}
                  </div>
                  {b.description && <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>}
                  <div className="mt-1 flex flex-wrap gap-3 text-sm">
                    {b.address && <span className="text-muted-foreground">{b.address}</span>}
                    {b.website && (
                      <a href={b.website} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">
                        Website
                      </a>
                    )}
                    {b.google_link && (
                      <a href={b.google_link} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">
                        Leave a review
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {(websites.length > 0 || profile.eo_offices_held) && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4 text-accent" /> More
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {websites.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {websites.map((w) => (
                    <a key={w} href={w} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">
                      {w}
                    </a>
                  ))}
                </div>
              )}
              {profile.eo_offices_held && (
                <p>
                  <span className="text-muted-foreground">EO offices held: </span>
                  {profile.eo_offices_held}
                </p>
              )}
              {profile.bio_notes && <p className="text-muted-foreground">{profile.bio_notes}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
