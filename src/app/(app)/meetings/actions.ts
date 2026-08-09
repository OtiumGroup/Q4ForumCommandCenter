"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: boolean; message?: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, isAdmin: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return { supabase, isAdmin: profile?.role === "admin" };
}

function toTimestamp(date: FormDataEntryValue | null, time: FormDataEntryValue | null) {
  const d = String(date ?? "");
  const t = String(time ?? "") || "00:00";
  if (!d) return null;
  const iso = new Date(`${d}T${t}`);
  return Number.isNaN(iso.getTime()) ? null : iso.toISOString();
}

export async function createMeeting(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Admins only." };

  const title = String(formData.get("title") || "Forum Meeting").trim();
  const startsAt = toTimestamp(formData.get("date"), formData.get("time"));
  const endsAt = toTimestamp(formData.get("date"), formData.get("end_time"));
  const location = String(formData.get("location") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!startsAt) return { ok: false, message: "A valid date is required." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("meetings").insert({
    title,
    starts_at: startsAt,
    ends_at: endsAt,
    location,
    notes,
    created_by: user?.id,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/meetings");
  return { ok: true, message: "Meeting added." };
}

export async function updateMeeting(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Admins only." };

  const id = String(formData.get("id") || "");
  if (!id) return { ok: false, message: "Missing meeting id." };

  const title = String(formData.get("title") || "Forum Meeting").trim();
  const startsAt = toTimestamp(formData.get("date"), formData.get("time"));
  const endsAt = toTimestamp(formData.get("date"), formData.get("end_time"));
  const location = String(formData.get("location") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!startsAt) return { ok: false, message: "A valid date is required." };

  const { error } = await supabase
    .from("meetings")
    .update({ title, starts_at: startsAt, ends_at: endsAt, location, notes })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/meetings");
  return { ok: true, message: "Meeting updated." };
}

export async function deleteMeeting(id: string): Promise<ActionResult> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Admins only." };

  const { error } = await supabase.from("meetings").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/meetings");
  return { ok: true };
}
