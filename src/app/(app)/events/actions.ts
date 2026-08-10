"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formInputToUtcISO } from "@/lib/time";

type ActionResult = { ok: boolean; message?: string };

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
  const startsAt = formInputToUtcISO(String(formData.get("date") || ""), String(formData.get("time") || ""));
  const endsAt = formInputToUtcISO(String(formData.get("date") || ""), String(formData.get("end_time") || ""));
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
