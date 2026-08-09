import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BioEditForm } from "./bio-edit-form";

export default async function BioEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return <BioEditForm profile={profile} userId={user.id} />;
}
