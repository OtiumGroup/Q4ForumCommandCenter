"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CONSTITUTION_VERSION } from "@/lib/constitution-content";

type Result = { ok: boolean; message?: string };

export async function signConstitution(input: { type: "drawn" | "typed"; data: string }): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const data = (input.data || "").trim();
  if (!data) return { ok: false, message: "Add your signature first." };
  if (input.type !== "drawn" && input.type !== "typed") return { ok: false, message: "Invalid signature." };
  if (data.length > 500_000) return { ok: false, message: "Signature is too large — try again." };

  const { error } = await supabase.from("constitution_signatures").upsert(
    {
      member_id: user.id,
      version: CONSTITUTION_VERSION,
      signature_type: input.type,
      signature_data: data,
      signed_at: new Date().toISOString(),
    },
    { onConflict: "member_id,version" }
  );
  if (error) return { ok: false, message: error.message };

  revalidatePath("/constitution");
  revalidatePath("/admin");
  return { ok: true, message: "Signed — thank you." };
}

export async function removeMySignature(): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const { error } = await supabase
    .from("constitution_signatures")
    .delete()
    .eq("member_id", user.id)
    .eq("version", CONSTITUTION_VERSION);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/constitution");
  revalidatePath("/admin");
  return { ok: true, message: "Signature removed." };
}

export async function submitConstitutionRequest(body: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const text = (body || "").trim();
  if (text.length < 5) return { ok: false, message: "Add a bit more detail about the change." };
  if (text.length > 4000) return { ok: false, message: "Please keep it under 4,000 characters." };

  const { error } = await supabase.from("constitution_requests").insert({ member_id: user.id, body: text });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/constitution");
  revalidatePath("/admin");
  return { ok: true, message: "Sent to the moderator for the next forum." };
}

// ── Admin ───────────────────────────────────────────────────────────────
export async function setRequestStatus(
  id: string,
  status: "open" | "discussed" | "accepted" | "declined"
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("constitution_requests").update({ status }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  revalidatePath("/constitution");
  return { ok: true };
}

export async function deleteRequest(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("constitution_requests").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  revalidatePath("/constitution");
  return { ok: true };
}
