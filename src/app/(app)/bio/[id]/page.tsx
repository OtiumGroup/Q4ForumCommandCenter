import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Pencil, MapPin, GraduationCap, Heart, Users, Briefcase, Star,
  Award, Cake, Phone, Building2, ExternalLink, Home,
} from "lucide-react";

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}
function cityState(addr: string | null) {
  if (!addr) return null;
  const m = addr.match(/([A-Za-z.\-' ]+),\s*([A-Za-z]{2})\b/);
  return m ? `${m[1].trim()}, ${m[2].toUpperCase()}` : null;
}
function safeUrl(u?: string | null) {
  return u && /^https?:\/\//i.test(u) ? u : null;
}
function formatBirthday(birthday: string | null) {
  if (!birthday) return null;
  const [, month, day] = birthday.split("-").map(Number);
  if (!month || !day) return null;
  return new Date(2000, month - 1, day).toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

type Business = { name: string; title?: string; description?: string; address?: string; website?: string; google_link?: string };
type Kid = { name: string; age?: string };

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">
      {children}
    </span>
  );
}
function SectionCard({ icon: Icon, title, children, className = "" }: { icon: React.ElementType; title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-[18px] w-[18px] text-accent" />
        <h2 className="font-display text-[15px] font-semibold text-foreground">{title}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default async function BioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!profile) notFound();

  const businesses = (Array.isArray(profile.businesses) ? profile.businesses : []) as Business[];
  const kids = (Array.isArray(profile.kids) ? profile.kids : []) as Kid[];
  const websites = (Array.isArray(profile.websites) ? profile.websites : []) as string[];
  const interests = (profile.current_interests ?? "")
    .split(/[,;\n]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 8);
  const isSelf = user?.id === id;
  const primary = businesses[0];
  const location = cityState(profile.home_address) ?? profile.hometown ?? null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
      <div className="mb-5 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/bio"><ArrowLeft className="mr-1.5 h-4 w-4" /> All members</Link>
        </Button>
        {isSelf && (
          <Button asChild size="sm">
            <Link href="/bio/edit"><Pencil className="mr-1.5 h-4 w-4" /> Edit my bio</Link>
          </Button>
        )}
      </div>

      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative h-28 border-b border-accent/20 bg-accent/20 sm:h-32">
          <span className="absolute right-4 top-3 font-display text-[13px] tracking-wide text-accent/80">Q4 · Forum</span>
        </div>
        <div className="px-6 pb-7">
          <div className="flex items-end justify-between">
            <Avatar className="-mt-14 h-24 w-24 border-4 border-card shadow-sm sm:h-28 sm:w-28">
              <AvatarImage src={profile.photo_url ?? undefined} alt={profile.full_name ?? ""} className="object-cover" />
              <AvatarFallback className="bg-primary font-display text-2xl text-primary-foreground">
                {initials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            {profile.phone_cell && (
              <a href={`tel:${profile.phone_cell}`} className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-transform hover:scale-[1.03]">
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
            )}
          </div>

          <div className="mt-4">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {profile.full_name ?? "Member"}
            </h1>
            {primary && (
              <p className="mt-1 text-[15px] text-muted-foreground">
                {primary.title ? `${primary.title} · ` : ""}{primary.name}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {location && <Chip><MapPin className="h-3.5 w-3.5" />{location}</Chip>}
            {profile.eo_member_since && <Chip><Award className="h-3.5 w-3.5" />EO member since {profile.eo_member_since}</Chip>}
            {formatBirthday(profile.birthday) && <Chip><Cake className="h-3.5 w-3.5" />{formatBirthday(profile.birthday)}</Chip>}
          </div>

          {(profile.education || profile.hometown || profile.eo_offices_held || profile.eo_member_since) && (
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {profile.education && (
                <div className="rounded-xl bg-secondary/50 p-3">
                  <div className="text-[11px] text-muted-foreground">Education</div>
                  <div className="mt-0.5 text-[13px] text-foreground">{profile.education}</div>
                </div>
              )}
              {profile.hometown && (
                <div className="rounded-xl bg-secondary/50 p-3">
                  <div className="text-[11px] text-muted-foreground">Roots</div>
                  <div className="mt-0.5 text-[13px] text-foreground">{profile.hometown}</div>
                </div>
              )}
              {(profile.eo_offices_held || profile.eo_member_since) && (
                <div className="rounded-xl bg-secondary/50 p-3">
                  <div className="text-[11px] text-muted-foreground">EO service</div>
                  <div className="mt-0.5 text-[13px] text-foreground">
                    {profile.eo_offices_held || `Member since ${profile.eo_member_since}`}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {businesses.length > 0 && (
          <SectionCard icon={Briefcase} title={businesses.length > 1 ? "The businesses" : "The business"} className="sm:col-span-2">
            <div className="space-y-4">
              {businesses.map((b, i) => (
                <div key={i} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{b.name}</span>
                    {b.title && <span className="text-sm text-muted-foreground">— {b.title}</span>}
                  </div>
                  {b.description && <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{b.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-3 text-[13px]">
                    {safeUrl(b.website) && <a href={safeUrl(b.website)!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent underline-offset-2 hover:underline">Website <ExternalLink className="h-3 w-3" /></a>}
                    {safeUrl(b.google_link) && <a href={safeUrl(b.google_link)!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent underline-offset-2 hover:underline">Leave a review <ExternalLink className="h-3 w-3" /></a>}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {(profile.spouse_name || kids.length > 0 || profile.family_notes) && (
          <SectionCard icon={Heart} title="Family">
            <div className="space-y-1.5 text-sm text-foreground">
              {profile.spouse_name && <p><span className="text-muted-foreground">Spouse — </span>{profile.spouse_name}</p>}
              {kids.length > 0 && <p><span className="text-muted-foreground">Kids — </span>{kids.map((k) => `${k.name}${k.age ? ` (${k.age})` : ""}`).join(", ")}</p>}
              {profile.family_notes && <p className="text-muted-foreground">{profile.family_notes}</p>}
            </div>
          </SectionCard>
        )}

        {(interests.length > 0 || profile.sport_played) && (
          <SectionCard icon={Star} title="Off the clock">
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {interests.map((t: string) => (
                  <span key={t} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">{t}</span>
                ))}
              </div>
            )}
            {profile.sport_played && <p className="mt-3 text-[13px] text-muted-foreground"><span className="text-foreground">Grew up on:</span> {profile.sport_played}</p>}
          </SectionCard>
        )}

        {(websites.length > 0 || profile.home_address) && (
          <SectionCard icon={Home} title="Details" className="sm:col-span-2">
            <div className="space-y-2 text-sm">
              {profile.home_address && <p className="flex items-start gap-1.5 text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{profile.home_address}</p>}
              {websites.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {websites.filter((w) => safeUrl(w)).map((w) => <a key={w} href={w} target="_blank" rel="noreferrer" className="text-accent underline-offset-2 hover:underline">{w}</a>)}
                </div>
              )}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
