import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RetreatPanel } from "./retreat-panel";

export default async function RetreatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  const [
    { data: retreat },
    { data: options },
    { data: votes },
    { data: flights },
    { data: activities },
    { data: schedule },
    { data: documents },
    { data: members },
  ] = await Promise.all([
    supabase.from("retreat").select("*").eq("id", 1).maybeSingle(),
    supabase.from("retreat_poll_options").select("id, label, created_by, created_at").order("created_at"),
    supabase.from("retreat_poll_votes").select("member_id, option_id"),
    supabase.from("retreat_flights").select("id, member_id, direction, airline, flight_no, when_text, notes, created_at").order("created_at"),
    supabase.from("retreat_activities").select("id, title, description, link, created_by, created_at").order("created_at"),
    supabase.from("retreat_schedule").select("id, day_label, time, title, detail, sort_order, created_at").order("day_label").order("sort_order").order("created_at"),
    supabase.from("retreat_documents").select("id, title, file_path, file_type, uploaded_by, created_at").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, photo_url").neq("status", "suspended"),
  ]);

  const paths = (documents ?? []).map((d) => d.file_path);
  let signed: Record<string, string> = {};
  if (paths.length > 0) {
    const { data: urls } = await supabase.storage.from("retreat-documents").createSignedUrls(paths, 3600);
    signed = Object.fromEntries((urls ?? []).map((u) => [u.path ?? "", u.signedUrl ?? ""]).filter(([p]) => p));
  }

  return (
    <RetreatPanel
      currentUserId={user.id}
      isAdmin={profile?.role === "admin"}
      retreat={retreat ?? { id: 1, title: "Annual Forum Retreat", status: "voting", chosen_location: null, start_date: null, end_date: null, lodging_label: null, lodging_link: null, location_notes: null }}
      options={options ?? []}
      votes={votes ?? []}
      flights={flights ?? []}
      activities={activities ?? []}
      schedule={schedule ?? []}
      documents={(documents ?? []).map((d) => ({ ...d, url: signed[d.file_path] ?? null }))}
      members={members ?? []}
    />
  );
}
