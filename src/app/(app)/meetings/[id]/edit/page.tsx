import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgendaForm } from "./agenda-form";

export default async function EditAgendaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: meeting }, { data: me }, { data: others }] = await Promise.all([
    supabase.from("meetings").select("*").eq("id", id).single(),
    supabase.from("profiles").select("role").eq("id", user?.id ?? "").single(),
    supabase.from("meetings").select("id, title, starts_at, theme, agenda").neq("id", id).order("starts_at", { ascending: false }),
  ]);

  if (!meeting) notFound();
  if (me?.role !== "admin") redirect(`/meetings/${id}`);

  const copyable = (others ?? [])
    .filter((m) => Array.isArray(m.agenda) && m.agenda.length > 0)
    .map((m) => ({
      id: m.id,
      label: `${m.theme || m.title} · ${new Date(m.starts_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`,
      agenda: m.agenda as { time?: string; title: string; speaker?: string; detail?: string }[],
    }));

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
      copyable={copyable}
    />
  );
}
