"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formInputToUtcISO } from "@/lib/time";

type ActionResult = { ok: boolean; message?: string };
export type AgendaBlock = { time?: string; title: string; speaker?: string; detail?: string };

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

export async function createMeeting(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Admins only." };

  const title = String(formData.get("title") || "Forum Meeting").trim();
  const startsAt = formInputToUtcISO(String(formData.get("date") || ""), String(formData.get("time") || ""));
  const endsAt = formInputToUtcISO(String(formData.get("date") || ""), String(formData.get("end_time") || ""));
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
  const startsAt = formInputToUtcISO(String(formData.get("date") || ""), String(formData.get("time") || ""));
  const endsAt = formInputToUtcISO(String(formData.get("date") || ""), String(formData.get("end_time") || ""));
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

export async function saveAgenda(
  meetingId: string,
  data: { theme: string; facilitator: string; location: string; notes: string; agenda: AgendaBlock[] }
): Promise<ActionResult> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Only admins can edit the agenda." };

  const agenda = (data.agenda || [])
    .filter((b) => (b.title ?? "").trim())
    .map((b) => ({
      time: (b.time ?? "").trim() || undefined,
      title: b.title.trim(),
      speaker: (b.speaker ?? "").trim() || undefined,
      detail: (b.detail ?? "").trim() || undefined,
    }));

  const { error } = await supabase
    .from("meetings")
    .update({
      theme: data.theme?.trim() || null,
      facilitator: data.facilitator?.trim() || null,
      location: data.location?.trim() || null,
      notes: data.notes?.trim() || null,
      agenda,
    })
    .eq("id", meetingId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/meetings/${meetingId}`);
  revalidatePath(`/meetings/${meetingId}/edit`);
  revalidatePath("/meetings");
  return { ok: true, message: "Agenda saved." };
}

export async function setMeetingRsvp(meetingId: string, status: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You must be signed in." };
  if (!["attending", "interested", "not_attending"].includes(status)) {
    return { ok: false, message: "Invalid status." };
  }

  const { error } = await supabase
    .from("meeting_rsvps")
    .upsert({ meeting_id: meetingId, member_id: user.id, status, updated_at: new Date().toISOString() });

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/meetings/${meetingId}`);
  revalidatePath("/meetings");
  return { ok: true };
}
