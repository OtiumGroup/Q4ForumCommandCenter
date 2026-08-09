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

export async function recordEoResource(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Admins only." };

  const title = String(formData.get("title") || "").trim();
  const categoryId = String(formData.get("category_id") || "") || null;
  const filePath = String(formData.get("file_path") || "").trim();
  const fileType = String(formData.get("file_type") || "").trim() || null;

  if (!title) return { ok: false, message: "A title is required." };
  if (!filePath) return { ok: false, message: "Upload a file first." };

  const { error } = await supabase.from("eo_resources").insert({
    title,
    category_id: categoryId,
    file_path: filePath,
    file_type: fileType,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/resources");
  return { ok: true, message: "Resource added." };
}

export async function deleteEoResource(id: string, filePath: string): Promise<ActionResult> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Admins only." };

  const { error: storageError } = await supabase.storage.from("eo-resources").remove([filePath]);
  if (storageError) return { ok: false, message: storageError.message };

  const { error } = await supabase.from("eo_resources").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/resources");
  return { ok: true };
}

export async function createEoCategory(name: string): Promise<ActionResult> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Admins only." };

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, message: "Name is required." };

  const { error } = await supabase.from("eo_resource_categories").insert({ name: trimmed, sort_order: 99 });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/resources");
  return { ok: true };
}
