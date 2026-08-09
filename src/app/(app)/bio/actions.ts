"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: boolean; message?: string };

type BusinessEntry = {
  name: string;
  title?: string;
  description?: string;
  address?: string;
  website?: string;
  google_link?: string;
};

type KidEntry = { name: string; age?: string };

export async function updateBio(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You must be signed in." };

  const fullName = String(formData.get("full_name") || "").trim();
  const birthday = String(formData.get("birthday") || "").trim();

  if (!fullName) return { ok: false, message: "Name is required." };
  if (!birthday) return { ok: false, message: "Birthday is required." };

  const businessesRaw = String(formData.get("businesses_json") || "[]");
  const kidsRaw = String(formData.get("kids_json") || "[]");

  let businesses: BusinessEntry[] = [];
  let kids: KidEntry[] = [];
  try {
    businesses = JSON.parse(businessesRaw);
  } catch {
    businesses = [];
  }
  try {
    kids = JSON.parse(kidsRaw);
  } catch {
    kids = [];
  }

  const websitesRaw = String(formData.get("websites") || "");
  const websites = websitesRaw
    .split(/[\n,]/)
    .map((w) => w.trim())
    .filter(Boolean);

  const eoMemberSinceRaw = String(formData.get("eo_member_since") || "").trim();
  const eoMemberSince = eoMemberSinceRaw ? parseInt(eoMemberSinceRaw, 10) : null;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      birthday,
      spouse_name: String(formData.get("spouse_name") || "").trim() || null,
      kids,
      family_notes: String(formData.get("family_notes") || "").trim() || null,
      home_address: String(formData.get("home_address") || "").trim() || null,
      hometown: String(formData.get("hometown") || "").trim() || null,
      phone_home: String(formData.get("phone_home") || "").trim() || null,
      phone_cell: String(formData.get("phone_cell") || "").trim() || null,
      education: String(formData.get("education") || "").trim() || null,
      sport_played: String(formData.get("sport_played") || "").trim() || null,
      current_interests: String(formData.get("current_interests") || "").trim() || null,
      websites,
      businesses,
      eo_member_since: Number.isNaN(eoMemberSince) ? null : eoMemberSince,
      eo_offices_held: String(formData.get("eo_offices_held") || "").trim() || null,
      bio_notes: String(formData.get("bio_notes") || "").trim() || null,
    })
    .eq("id", user.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/bio");
  revalidatePath(`/bio/${user.id}`);
  revalidatePath("/home");
  return { ok: true, message: "Your bio was saved." };
}

export async function setAvatarUrl(url: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You must be signed in." };

  const { error } = await supabase.from("profiles").update({ photo_url: url }).eq("id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/bio");
  revalidatePath(`/bio/${user.id}`);
  return { ok: true };
}
