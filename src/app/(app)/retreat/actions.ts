"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; message?: string };

async function me() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function done() {
  revalidatePath("/retreat");
}

// ── Poll ──────────────────────────────────────────────────────────────────
export async function addPollOption(label: string): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, message: "Please sign in." };
  const text = (label || "").trim();
  if (text.length < 2) return { ok: false, message: "Add a place name." };
  if (text.length > 80) return { ok: false, message: "Keep it short." };
  const { error } = await supabase.from("retreat_poll_options").insert({ label: text, created_by: user.id });
  if (error) return { ok: false, message: error.message };
  done();
  return { ok: true };
}

export async function deletePollOption(id: string): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, message: "Please sign in." };
  const { error } = await supabase.from("retreat_poll_options").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  done();
  return { ok: true };
}

export async function castVote(optionId: string): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, message: "Please sign in." };
  const { error } = await supabase
    .from("retreat_poll_votes")
    .upsert({ member_id: user.id, option_id: optionId, updated_at: new Date().toISOString() }, { onConflict: "member_id" });
  if (error) return { ok: false, message: error.message };
  done();
  return { ok: true };
}

export async function clearVote(): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, message: "Please sign in." };
  const { error } = await supabase.from("retreat_poll_votes").delete().eq("member_id", user.id);
  if (error) return { ok: false, message: error.message };
  done();
  return { ok: true };
}

// ── Details (admin) ─────────────────────────────────────────────────────────
export async function setRetreatDetails(input: {
  status?: "voting" | "booked";
  chosen_location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  lodging_label?: string | null;
  lodging_link?: string | null;
  location_notes?: string | null;
}): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, message: "Please sign in." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false, message: "Only the moderator can set the plan." };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of ["status", "chosen_location", "start_date", "end_date", "lodging_label", "lodging_link", "location_notes"] as const) {
    if (k in input) patch[k] = (input as Record<string, unknown>)[k] || null;
  }
  const { error } = await supabase.from("retreat").update(patch).eq("id", 1);
  if (error) return { ok: false, message: error.message };
  done();
  return { ok: true };
}

// ── Flights ─────────────────────────────────────────────────────────────────
export async function addFlight(formData: FormData): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, message: "Please sign in." };
  const direction = String(formData.get("direction") || "arrive") === "depart" ? "depart" : "arrive";
  const { error } = await supabase.from("retreat_flights").insert({
    member_id: user.id,
    direction,
    airline: String(formData.get("airline") || "") || null,
    flight_no: String(formData.get("flight_no") || "") || null,
    when_text: String(formData.get("when_text") || "") || null,
    notes: String(formData.get("notes") || "") || null,
  });
  if (error) return { ok: false, message: error.message };
  done();
  return { ok: true };
}

export async function deleteFlight(id: string): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, message: "Please sign in." };
  const { error } = await supabase.from("retreat_flights").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  done();
  return { ok: true };
}

// ── Activities ──────────────────────────────────────────────────────────────
export async function addActivity(input: { title: string; description?: string; link?: string }): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, message: "Please sign in." };
  const title = (input.title || "").trim();
  if (title.length < 2) return { ok: false, message: "Add a title." };
  const { error } = await supabase.from("retreat_activities").insert({
    title,
    description: (input.description || "").trim() || null,
    link: (input.link || "").trim() || null,
    created_by: user.id,
  });
  if (error) return { ok: false, message: error.message };
  done();
  return { ok: true };
}

export async function deleteActivity(id: string): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, message: "Please sign in." };
  const { error } = await supabase.from("retreat_activities").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  done();
  return { ok: true };
}

// ── Schedule (admin) ─────────────────────────────────────────────────────────
export async function addScheduleItem(input: {
  day_label: string;
  time?: string;
  title: string;
  detail?: string;
  sort_order?: number;
}): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, message: "Please sign in." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false, message: "Only the moderator can edit the schedule." };
  const day = (input.day_label || "").trim();
  const title = (input.title || "").trim();
  if (!day || !title) return { ok: false, message: "Day and title are required." };
  const { error } = await supabase.from("retreat_schedule").insert({
    day_label: day,
    time: (input.time || "").trim() || null,
    title,
    detail: (input.detail || "").trim() || null,
    sort_order: input.sort_order ?? 0,
  });
  if (error) return { ok: false, message: error.message };
  done();
  return { ok: true };
}

export async function deleteScheduleItem(id: string): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, message: "Please sign in." };
  const { error } = await supabase.from("retreat_schedule").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  done();
  return { ok: true };
}

// ── Documents ────────────────────────────────────────────────────────────────
export async function recordRetreatDocument(input: { title: string; file_path: string; file_type: string }): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, message: "Please sign in." };
  if (!input.file_path) return { ok: false, message: "Missing file." };
  const { error } = await supabase.from("retreat_documents").insert({
    title: (input.title || "").trim() || "Document",
    file_path: input.file_path,
    file_type: input.file_type || null,
    uploaded_by: user.id,
  });
  if (error) return { ok: false, message: error.message };
  done();
  return { ok: true };
}

export async function deleteRetreatDocument(id: string, filePath: string): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, message: "Please sign in." };
  if (filePath) await supabase.storage.from("retreat-documents").remove([filePath]);
  const { error } = await supabase.from("retreat_documents").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  done();
  return { ok: true };
}
