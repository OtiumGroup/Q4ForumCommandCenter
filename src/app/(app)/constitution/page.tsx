import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConstitutionPanel } from "./constitution-panel";
import { CONSTITUTION_VERSION } from "@/lib/constitution-content";

export default async function ConstitutionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  const [{ data: members }, { data: signatures }, { data: requests }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, photo_url, role, created_at")
      .neq("status", "suspended")
      .order("created_at", { ascending: true }),
    supabase
      .from("constitution_signatures")
      .select("member_id, signature_type, signature_data, signed_at")
      .eq("version", CONSTITUTION_VERSION),
    supabase
      .from("constitution_requests")
      .select("id, member_id, body, status, created_at")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <ConstitutionPanel
      members={(members ?? []).map((m) => ({ id: m.id, full_name: m.full_name, photo_url: m.photo_url, role: m.role }))}
      signatures={(signatures ?? []) as { member_id: string; signature_type: "drawn" | "typed"; signature_data: string; signed_at: string }[]}
      requests={requests ?? []}
      currentUserId={user.id}
      isAdmin={profile?.role === "admin"}
    />
  );
}
