"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Plus, Trash2, Users, Heart, Briefcase, Globe, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { updateBio, setAvatarUrl } from "../actions";

type Business = {
  name: string;
  title?: string;
  description?: string;
  address?: string;
  website?: string;
  google_link?: string;
};
type Kid = { name: string; age?: string };

type Profile = {
  id: string;
  full_name: string | null;
  birthday: string | null;
  photo_url: string | null;
  spouse_name: string | null;
  kids: Kid[] | null;
  family_notes: string | null;
  home_address: string | null;
  hometown: string | null;
  phone_home: string | null;
  phone_cell: string | null;
  education: string | null;
  sport_played: string | null;
  current_interests: string | null;
  websites: string[] | null;
  businesses: Business[] | null;
  eo_member_since: number | null;
  eo_offices_held: string | null;
  bio_notes: string | null;
} | null;

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function BioEditForm({ profile, userId }: { profile: Profile; userId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [kids, setKids] = useState<Kid[]>(profile?.kids ?? []);
  const [businesses, setBusinesses] = useState<Business[]>(profile?.businesses ?? []);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
      const res = await setAvatarUrl(publicUrl);
      if (!res.ok) throw new Error(res.message);
      setPhotoUrl(publicUrl);
      toast.success("Photo updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload photo.");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("kids_json", JSON.stringify(kids.filter((k) => k.name.trim())));
    formData.set("businesses_json", JSON.stringify(businesses.filter((b) => b.name.trim())));

    startTransition(async () => {
      const res = await updateBio({ ok: false }, formData);
      if (res.ok) {
        toast.success(res.message ?? "Saved.");
        router.push(`/bio/${userId}`);
      } else {
        setError(res.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">My Bio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Name, birthday, and photo are required — everything else is up to you. This is what the rest of the forum sees.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <Card className="overflow-hidden py-0">
          <div className="flex flex-col gap-6 bg-gradient-to-br from-secondary/60 to-transparent p-6 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="group relative shrink-0 self-center"
              aria-label="Change photo"
            >
              <Avatar className="h-28 w-28 border-4 border-card shadow-md transition-opacity group-hover:opacity-80">
                <AvatarImage src={photoUrl ?? undefined} alt="" className="object-cover" />
                <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                  {initials(profile?.full_name ?? null)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-transparent transition-colors group-hover:bg-black/40 group-hover:text-white">
                <Camera className="h-5 w-5" />
              </span>
              <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow ring-2 ring-card">
                {uploading ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="grid w-full flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name *</Label>
                <Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday *</Label>
                <Input id="birthday" name="birthday" type="date" defaultValue={profile?.birthday ?? ""} required />
              </div>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Click your photo to upload one — a clear headshot works best.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-accent" /> Family
            </CardTitle>
            <CardDescription>Optional.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="spouse_name">Spouse</Label>
              <Input id="spouse_name" name="spouse_name" defaultValue={profile?.spouse_name ?? ""} />
            </div>
            <div className="space-y-2">
              <Label>Kids</Label>
              {kids.map((kid, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Name"
                    value={kid.name}
                    onChange={(e) =>
                      setKids((prev) => prev.map((k, idx) => (idx === i ? { ...k, name: e.target.value } : k)))
                    }
                  />
                  <Input
                    placeholder="Age"
                    className="w-24"
                    value={kid.age ?? ""}
                    onChange={(e) =>
                      setKids((prev) => prev.map((k, idx) => (idx === i ? { ...k, age: e.target.value } : k)))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setKids((prev) => prev.filter((_, idx) => idx !== i))}
                    aria-label="Remove kid"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setKids((prev) => [...prev, { name: "", age: "" }])}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add child
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="family_notes">Parents / siblings / other</Label>
              <Textarea id="family_notes" name="family_notes" rows={2} defaultValue={profile?.family_notes ?? ""} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Heart className="h-4 w-4 text-accent" /> Personal</CardTitle>
            <CardDescription>Optional.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="home_address">Home address</Label>
              <Input id="home_address" name="home_address" defaultValue={profile?.home_address ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hometown">Born &amp; raised</Label>
              <Input id="hometown" name="hometown" defaultValue={profile?.hometown ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_home">Home phone</Label>
              <Input id="phone_home" name="phone_home" type="tel" defaultValue={profile?.phone_home ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_cell">Cell phone</Label>
              <Input id="phone_cell" name="phone_cell" type="tel" defaultValue={profile?.phone_cell ?? ""} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="education">Education</Label>
              <Input id="education" name="education" defaultValue={profile?.education ?? ""} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="sport_played">Sports played / interests growing up</Label>
              <Input id="sport_played" name="sport_played" defaultValue={profile?.sport_played ?? ""} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="current_interests">Current interests</Label>
              <Textarea id="current_interests" name="current_interests" rows={2} defaultValue={profile?.current_interests ?? ""} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Briefcase className="h-4 w-4 text-accent" /> Business</CardTitle>
            <CardDescription>Add as many as you like.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {businesses.map((biz, i) => (
              <div key={i} className="space-y-3 rounded-md border border-border p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Business name"
                    value={biz.name}
                    onChange={(e) =>
                      setBusinesses((prev) => prev.map((b, idx) => (idx === i ? { ...b, name: e.target.value } : b)))
                    }
                  />
                  <Input
                    placeholder="Your title (e.g. Founder & CEO)"
                    value={biz.title ?? ""}
                    onChange={(e) =>
                      setBusinesses((prev) => prev.map((b, idx) => (idx === i ? { ...b, title: e.target.value } : b)))
                    }
                  />
                </div>
                <Textarea
                  placeholder="What the business does"
                  rows={2}
                  value={biz.description ?? ""}
                  onChange={(e) =>
                    setBusinesses((prev) => prev.map((b, idx) => (idx === i ? { ...b, description: e.target.value } : b)))
                  }
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Address"
                    value={biz.address ?? ""}
                    onChange={(e) =>
                      setBusinesses((prev) => prev.map((b, idx) => (idx === i ? { ...b, address: e.target.value } : b)))
                    }
                  />
                  <Input
                    placeholder="Website"
                    type="url"
                    value={biz.website ?? ""}
                    onChange={(e) =>
                      setBusinesses((prev) => prev.map((b, idx) => (idx === i ? { ...b, website: e.target.value } : b)))
                    }
                  />
                </div>
                <Input
                  placeholder="Google review link"
                  type="url"
                  value={biz.google_link ?? ""}
                  onChange={(e) =>
                    setBusinesses((prev) => prev.map((b, idx) => (idx === i ? { ...b, google_link: e.target.value } : b)))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setBusinesses((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5 text-destructive" /> Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBusinesses((prev) => [...prev, { name: "" }])}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add business
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Globe className="h-4 w-4 text-accent" /> More</CardTitle>
            <CardDescription>Optional.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="websites">Websites</Label>
              <Textarea
                id="websites"
                name="websites"
                rows={2}
                placeholder="One per line"
                defaultValue={(profile?.websites ?? []).join("\n")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eo_member_since">EO member since</Label>
                <Input id="eo_member_since" name="eo_member_since" type="number" placeholder="2020" defaultValue={profile?.eo_member_since ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eo_offices_held">EO offices held</Label>
                <Input id="eo_offices_held" name="eo_offices_held" defaultValue={profile?.eo_offices_held ?? ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio_notes">Anything else</Label>
              <Textarea id="bio_notes" name="bio_notes" rows={2} defaultValue={profile?.bio_notes ?? ""} />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-3 pb-8">
          <Button type="button" variant="ghost" onClick={() => router.push("/bio")}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save bio"}
          </Button>
        </div>
      </form>
    </div>
  );
}
