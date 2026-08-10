"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { FORUM_POSITIONS } from "@/lib/constitution-content";

type Result = { ok: boolean; message?: string };

const VALID_KEYS = new Set(FORUM_POSITIONS.map((p) => p.key));

export async function assignPosition(key: string, memberId: string | null): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };

  // Must be admin (RLS enforces this too, but check for a clean message).
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false, message: "Only the moderator can assign positions." };

  if (!VALID_KEYS.has(key)) return { ok: false, message: "Unknown position." };

  const { error } = await supabase
    .from("forum_positions")
    .update({ member_id: memberId, updated_at: new Date().toISOString() })
    .eq("key", key);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/positions");
  revalidatePath("/admin");
  return { ok: true, message: "Position updated." };
}
