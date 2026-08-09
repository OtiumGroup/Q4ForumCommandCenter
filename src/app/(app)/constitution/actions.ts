"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: boolean; message?: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, isAdmin: false, userId: null as string | null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return { supabase, isAdmin: profile?.role === "admin", userId: user.id };
}

export async function setConstitutionFile(filePath: string): Promise<ActionResult> {
  const { supabase, isAdmin, userId } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Admins only." };

  const { error } = await supabase.from("constitution").upsert({
    id: 1,
    file_path: filePath,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/constitution");
  return { ok: true, message: "Constitution updated." };
}
