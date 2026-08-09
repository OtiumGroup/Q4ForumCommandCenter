"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: boolean; message?: string };

function toTimestamp(date: FormDataEntryValue | null, time: FormDataEntryValue | null) {
  const d = String(date ?? "");
  const t = String(time ?? "") || "00:00";
  if (!d) return null;
  const iso = new Date(`${d}T${t}`);
  return Number.isNaN(iso.getTime()) ? null : iso.toISOString();
}

export async function createEvent(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You must be signed in." };

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const startsAt = toTimestamp(formData.get("date"), formData.get("time"));
  const endsAt = toTimestamp(formData.get("date"), formData.get("end_time"));
  const address = String(formData.get("address") || "").trim() || null;
  const link = String(formData.get("link") || "").trim() || null;
  const source = formData.get("source") === "eo" ? "eo" : "member";
  const notifyForum = formData.get("notify_forum") === "on";

  if (!title) return { ok: false, message: "A title is required." };
  if (!startsAt) return { ok: false, message: "A valid date is required." };

  const { error } = await supabase.from("events").insert({
    title,
    description,
    starts_at: startsAt,
    ends_at: endsAt,
    address,
    link,
    source,
    notify_forum: notifyForum,
    created_by: user.id,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/events");
  revalidatePath("/home");
  return { ok: true, message: notifyForum ? "Event created and the forum was notified." : "Event created." };
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/events");
  revalidatePath("/home");
  return { ok: true };
}

export async function setRsvp(
  eventId: string,
  status: "attending" | "interested" | "not_attending"
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You must be signed in." };

  const { error } = await supabase
    .from("event_rsvps")
    .upsert(
      { event_id: eventId, member_id: user.id, status, updated_at: new Date().toISOString() },
      { onConflict: "event_id,member_id" }
    );

  if (error) return { ok: false, message: error.message };

  revalidatePath("/events");
  return { ok: true };
}
