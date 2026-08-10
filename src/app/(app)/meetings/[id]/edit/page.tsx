import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgendaForm } from "./agenda-form";

export default async function EditAgendaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: meeting }, { data: me }] = await Promise.all([
    supabase.from("meetings").select("*").eq("id", id).single(),
    supabase.from("profiles").select("role").eq("id", user?.id ?? "").single(),
  ]);

  if (!meeting) notFound();
  if (me?.role !== "admin") redirect(`/meetings/${id}`);

  return (
    <AgendaForm
      meeting={{
        id: meeting.id,
        title: meeting.title,
        starts_at: meeting.starts_at,
        theme: meeting.theme ?? null,
        facilitator: meeting.facilitator ?? null,
        location: meeting.location ?? null,
        notes: meeting.notes ?? null,
        agenda: Array.isArray(meeting.agenda) ? meeting.agenda : [],
      }}
    />
  );
}
