import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Pencil, MapPin, Heart, Star, Briefcase,
  Award, Cake, Phone, Building2, ExternalLink, Home,
} from "lucide-react";
import { AddressLink } from "@/components/shared/address-link";

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
function SocialLink({ href, icon: Icon, label }: { href?: string | null; icon: React.ElementType; label: string }) {
  const safe = safeUrl(href);
  if (!safe) return null;
  return (
    <a href={safe} target="_blank" rel="noreferrer" aria-label={label}
       className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent">
      <Icon className="h-4 w-4" />
    </a>
  );
}
function IconLinkedIn({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}
function IconInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}
function IconFacebook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
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
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-[13px] font-medium text-accent">
      {children}
    </span>
  );
}
function SectionCard({ icon: Icon, title, children, className = "" }: { icon: React.ElementType; title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-[18px] w-[18px] text-accent" />
        <h2 className="font-display text-base font-semibold uppercase tracking-wide text-foreground">{title}</h2>
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
  // Most recently added business populates as the headline (last in the list); show newest-first.
  const orderedBiz = [...businesses].reverse();
  const kids = (Array.isArray(profile.kids) ? profile.kids : []) as Kid[];
  const websites = (Array.isArray(profile.websites) ? profile.websites : []) as string[];
  const interests = (profile.current_interests ?? "")
    .split(/[,;\n]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 8);
  const isSelf = user?.id === id;
  const primary = orderedBiz[0] ?? null;
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
          <span className="absolute right-4 top-3 font-display text-sm tracking-wide text-accent/80">Q4 · Forum</span>
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
              <a href={`tel:${profile.phone_cell}`} className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-transform hover:scale-[1.03]">
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
            )}
          </div>

          <div className="mt-4">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {profile.full_name ?? "Member"}
            </h1>
            {primary && (
              <p className="mt-1 text-base text-muted-foreground">
                {primary.title ? `${primary.title} · ` : ""}{primary.name}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {location && <Chip><MapPin className="h-3.5 w-3.5" />{location}</Chip>}
            {profile.eo_member_since && <Chip><Award className="h-3.5 w-3.5" />EO member since {profile.eo_member_since}</Chip>}
            {formatBirthday(profile.birthday) && <Chip><Cake className="h-3.5 w-3.5" />{formatBirthday(profile.birthday)}</Chip>}
          </div>

          {(profile.linkedin || profile.instagram || profile.facebook) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <SocialLink href={profile.linkedin} icon={IconLinkedIn} label="LinkedIn" />
              <SocialLink href={profile.instagram} icon={IconInstagram} label="Instagram" />
              <SocialLink href={profile.facebook} icon={IconFacebook} label="Facebook" />
            </div>
          )}

          {(profile.education || profile.hometown || profile.eo_offices_held || profile.eo_member_since) && (
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {profile.education && (
                <div className="rounded-xl bg-secondary/50 p-3">
                  <div className="text-xs text-muted-foreground">Education</div>
                  <div className="mt-0.5 text-sm text-foreground">{profile.education}</div>
                </div>
              )}
              {profile.hometown && (
                <div className="rounded-xl bg-secondary/50 p-3">
                  <div className="text-xs text-muted-foreground">Roots</div>
                  <div className="mt-0.5 text-sm text-foreground">{profile.hometown}</div>
                </div>
              )}
              {(profile.eo_offices_held || profile.eo_member_since) && (
                <div className="rounded-xl bg-secondary/50 p-3">
                  <div className="text-xs text-muted-foreground">EO service</div>
                  <div className="mt-0.5 text-sm text-foreground">
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
        {orderedBiz.length > 0 && (
          <SectionCard icon={Briefcase} title={orderedBiz.length > 1 ? "The businesses" : "The business"} className="sm:col-span-2">
            <div className="space-y-4">
              {orderedBiz.map((b, i) => (
                <div key={i} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{b.name}</span>
                    {b.title && <span className="text-sm text-muted-foreground">— {b.title}</span>}
                  </div>
                  {b.description && <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted-foreground">{b.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
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
            <div className="space-y-1.5 text-[15px] text-foreground">
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
                  <span key={t} className="rounded-full bg-accent/10 px-3 py-1 text-[13px] font-medium text-accent">{t}</span>
                ))}
              </div>
            )}
            {profile.sport_played && <p className="mt-3 text-sm text-muted-foreground"><span className="text-foreground">Grew up on:</span> {profile.sport_played}</p>}
          </SectionCard>
        )}

        {(websites.length > 0 || profile.home_address) && (
          <SectionCard icon={Home} title="Details" className="sm:col-span-2">
            <div className="space-y-2 text-[15px]">
              {profile.home_address && <AddressLink address={profile.home_address} className="text-muted-foreground hover:text-foreground" />}
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
