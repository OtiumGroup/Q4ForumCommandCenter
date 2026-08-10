"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
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

export async function inviteMember(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Admins only." };

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") || "").trim() || null;
  const role = formData.get("role") === "admin" ? "admin" : "member";
  const personalNote = String(formData.get("personal_note") || "").trim() || null;

  if (!email) return { ok: false, message: "Email is required." };

  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: { action: "invite", email, full_name: fullName, role, personal_note: personalNote },
  });

  if (error || data?.error) {
    return { ok: false, message: data?.error ?? error?.message ?? "Something went wrong." };
  }

  revalidatePath("/admin");
  return { ok: true, message: `Invite sent to ${email}.` };
}

export async function resendInvite(email: string): Promise<ActionResult> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Admins only." };

  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: { action: "resend", email },
  });

  if (error || data?.error) {
    return { ok: false, message: data?.error ?? error?.message ?? "Something went wrong." };
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function revokeInvite(inviteId: string): Promise<ActionResult> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Admins only." };

  const { error } = await supabase
    .from("invites")
    .update({ status: "revoked" })
    .eq("id", inviteId);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteMember(userId: string): Promise<ActionResult> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Admins only." };

  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: { action: "delete", user_id: userId },
  });

  if (error || data?.error) {
    return { ok: false, message: data?.error ?? error?.message ?? "Something went wrong." };
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function postBroadcast(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Admins only." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!title || !body) return { ok: false, message: "Title and message are both required." };

  const { error } = await supabase.from("broadcasts").insert({
    title,
    body,
    created_by: user?.id,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin");
  revalidatePath("/home");
  return { ok: true, message: "Broadcast sent to all members." };
}

export async function deleteBroadcast(id: string): Promise<ActionResult> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Admins only." };

  const { error } = await supabase.from("broadcasts").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin");
  revalidatePath("/home");
  return { ok: true };
}

export async function editMember(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Admins only." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const id = String(formData.get("id") || "");
  if (!id) return { ok: false, message: "Missing member id." };

  const fullName = String(formData.get("full_name") || "").trim() || null;
  const role = formData.get("role") === "admin" ? "admin" : "member";
  const statusRaw = String(formData.get("status") || "active");
  const status = ["active", "suspended", "invited"].includes(statusRaw) ? statusRaw : "active";

  if (id === user?.id && role !== "admin") {
    return { ok: false, message: "You can't remove your own admin access." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, role, status })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin");
  revalidatePath("/bio");
  return { ok: true, message: "Member updated." };
}

async function resetOrigin() {
  const h = await headers();
  const host = h.get("host");
  return h.get("origin") ?? (host ? `https://${host}` : "");
}

export async function sendWelcome(email: string): Promise<ActionResult> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Admins only." };
  const target = email.trim().toLowerCase();
  if (!target) return { ok: false, message: "No email on file for this member." };
  const origin = await resetOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(target, {
    redirectTo: origin ? `${origin}/reset` : undefined,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: `Welcome email sent to ${target}.` };
}

export async function sendWelcomeToAll(): Promise<ActionResult> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Admins only." };
  const origin = await resetOrigin();
  const redirectTo = origin ? `${origin}/reset` : undefined;

  const { data: rows } = await supabase.from("profiles").select("email").eq("status", "active");
  const emails = (rows ?? []).map((r) => r.email).filter((e): e is string => Boolean(e));

  let sent = 0;
  for (const email of emails) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (!error) sent++;
  }
  return { ok: true, message: `Welcome email sent to ${sent} member${sent === 1 ? "" : "s"}.` };
}
