import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FORUM_POSITIONS } from "@/lib/constitution-content";

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default async function PositionsPage() {
  const supabase = await createClient();
  const [{ data: rows }, { data: members }] = await Promise.all([
    supabase.from("forum_positions").select("key, member_id"),
    supabase.from("profiles").select("id, full_name, photo_url").neq("status", "suspended"),
  ]);

  const memberById = new Map((members ?? []).map((m) => [m.id, m] as const));
  const assignmentByKey = new Map((rows ?? []).map((r) => [r.key, r.member_id] as const));
  const assignedCount = FORUM_POSITIONS.filter((p) => assignmentByKey.get(p.key)).length;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        eyebrow="Roles & Responsibilities"
        title="Forum Positions"
        description={`Who holds each role this fiscal year — ${assignedCount} of ${FORUM_POSITIONS.length} assigned.`}
      />

      <div className="space-y-3">
        {FORUM_POSITIONS.map((p) => {
          const mid = assignmentByKey.get(p.key);
          const m = mid ? memberById.get(mid) : null;
          return (
            <div key={p.key} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold tracking-tight">{p.name}</h2>
                {m ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      {m.photo_url ? <AvatarImage src={m.photo_url} alt={m.full_name ?? ""} /> : null}
                      <AvatarFallback className="bg-secondary text-[10px] text-secondary-foreground">{initials(m.full_name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{m.full_name}</span>
                  </div>
                ) : (
                  <span className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground">Unassigned</span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-2.5 py-1 text-[11px] text-secondary-foreground">
                  <span className="font-semibold uppercase tracking-wide text-muted-foreground">Term</span> {p.term}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-2.5 py-1 text-[11px] text-secondary-foreground">
                  <span className="font-semibold uppercase tracking-wide text-muted-foreground">Selection</span> {p.selection}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Positions are assigned by the moderator and run July 1, 2026 – June 30, 2027.
      </p>
    </div>
  );
}
