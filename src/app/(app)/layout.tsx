import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shared/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-suspenders: proxy.ts already gates this, but a Server
  // Component boundary should never trust the network layer alone.
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, photo_url, role, status")
    .eq("id", user.id)
    .single();

  // First real login after accepting an invite — flip 'invited' to
  // 'active' so the admin Users list reflects reality.
  if (profile?.status === "invited") {
    await supabase.from("profiles").update({ status: "active" }).eq("id", user.id);
  }

  return (
    <AppShell
      fullName={profile?.full_name ?? null}
      photoUrl={profile?.photo_url ?? null}
      isAdmin={profile?.role === "admin"}
    >
      {children}
    </AppShell>
  );
}
