"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: boolean; message?: string };

export async function saveGoal(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You must be signed in." };

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const area = ["business", "personal", "life"].includes(String(formData.get("area")))
    ? String(formData.get("area"))
    : "business";
  const status = ["not_started", "on_track", "at_risk", "done"].includes(String(formData.get("status")))
    ? String(formData.get("status"))
    : "not_started";
  const dueDate = String(formData.get("due_date") || "") || null;
  const details = String(formData.get("details") || "").trim() || null;
  const needsHelp = formData.get("needs_help") === "on";

  if (!title) return { ok: false, message: "A title is required." };

  const payload = {
    member_id: user.id,
    area,
    title,
    details,
    due_date: dueDate,
    status,
    needs_help: needsHelp,
    updated_at: new Date().toISOString(),
  };

  const { error } = id
    ? await supabase.from("goals").update(payload).eq("id", id)
    : await supabase.from("goals").insert(payload);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/goals");
  return { ok: true, message: "Goal saved." };
}

export async function setGoalStatus(id: string, status: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("goals")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/goals");
  return { ok: true };
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/goals");
  return { ok: true };
}
