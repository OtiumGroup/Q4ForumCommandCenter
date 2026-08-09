"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: boolean; message?: string };

export async function recordDocument(
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
  const categoryId = String(formData.get("category_id") || "") || null;
  const filePath = String(formData.get("file_path") || "").trim();
  const fileType = String(formData.get("file_type") || "").trim() || null;

  if (!title) return { ok: false, message: "A title is required." };
  if (!filePath) return { ok: false, message: "Upload a file first." };

  const { error } = await supabase.from("documents").insert({
    title,
    description,
    category_id: categoryId,
    file_path: filePath,
    file_type: fileType,
    uploaded_by: user.id,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/documents");
  return { ok: true, message: "Document added." };
}

export async function deleteDocument(id: string, filePath: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error: storageError } = await supabase.storage.from("documents").remove([filePath]);
  if (storageError) return { ok: false, message: storageError.message };

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/documents");
  return { ok: true };
}

export async function addResourceLink(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You must be signed in." };

  const title = String(formData.get("title") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const categoryId = String(formData.get("category_id") || "") || null;

  if (!title || !url) return { ok: false, message: "A title and URL are both required." };

  const { error } = await supabase.from("resource_links").insert({
    title,
    url,
    description,
    category_id: categoryId,
    added_by: user.id,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/documents");
  return { ok: true, message: "Link added." };
}

export async function deleteResourceLink(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("resource_links").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/documents");
  return { ok: true };
}

export async function createCategory(name: string): Promise<ActionResult> {
  const supabase = await createClient();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, message: "Name is required." };

  const { error } = await supabase.from("document_categories").insert({ name: trimmed, sort_order: 99 });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/documents");
  return { ok: true };
}
