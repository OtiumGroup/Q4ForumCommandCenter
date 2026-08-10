"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveAgenda, type AgendaBlock } from "../../actions";

type Block = { time: string; title: string; speaker: string; detail: string };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function AgendaForm({
  meeting,
}: {
  meeting: {
    id: string;
    title: string;
    starts_at: string;
    theme: string | null;
    facilitator: string | null;
    location: string | null;
    notes: string | null;
    agenda: AgendaBlock[];
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [theme, setTheme] = useState(meeting.theme ?? "");
  const [facilitator, setFacilitator] = useState(meeting.facilitator ?? "");
  const [location, setLocation] = useState(meeting.location ?? "");
  const [notes, setNotes] = useState(meeting.notes ?? "");
  const [blocks, setBlocks] = useState<Block[]>(
    meeting.agenda.length > 0
      ? meeting.agenda.map((b) => ({ time: b.time ?? "", title: b.title ?? "", speaker: b.speaker ?? "", detail: b.detail ?? "" }))
      : [{ time: "", title: "", speaker: "", detail: "" }]
  );

  function update(i: number, field: keyof Block, val: string) {
    setBlocks((prev) => prev.map((b, idx) => (idx === i ? { ...b, [field]: val } : b)));
  }
  function add() {
    setBlocks((prev) => [...prev, { time: "", title: "", speaker: "", detail: "" }]);
  }
  function remove(i: number) {
    setBlocks((prev) => prev.filter((_, idx) => idx !== i));
  }

  function save() {
    startTransition(async () => {
      const res = await saveAgenda(meeting.id, { theme, facilitator, location, notes, agenda: blocks });
      if (res.ok) {
        toast.success(res.message ?? "Saved.");
        router.push(`/meetings/${meeting.id}`);
      } else {
        toast.error(res.message ?? "Could not save.");
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
      <div className="mb-5">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/meetings/${meeting.id}`}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to agenda</Link>
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Build the agenda</h1>
        <p className="mt-1 text-sm text-muted-foreground">{meeting.title} · {fmtDate(meeting.starts_at)}</p>
      </div>

      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="theme">Meeting theme / title</Label>
            <Input id="theme" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="e.g. Q4 Planning & Accountability" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facilitator">Facilitator / Moderator</Label>
            <Input id="facilitator" value={facilitator} onChange={(e) => setFacilitator(e.target.value)} placeholder="Who's leading" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Venue / address" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Overview / notes</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anything members should know up front (optional)." />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Schedule</Label>
            <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="mr-1.5 h-4 w-4" /> Add block</Button>
          </div>
          <div className="space-y-3">
            {blocks.map((b, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3">
                <div className="flex gap-2">
                  <Input value={b.time} onChange={(e) => update(i, "time", e.target.value)} placeholder="Time (e.g. 1:00 PM)" className="w-40" />
                  <Input value={b.title} onChange={(e) => update(i, "title", e.target.value)} placeholder="Agenda item" className="flex-1" />
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove block" onClick={() => remove(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="mt-2 flex gap-2">
                  <Input value={b.speaker} onChange={(e) => update(i, "speaker", e.target.value)} placeholder="Speaker / who's up (optional)" className="w-56" />
                  <Input value={b.detail} onChange={(e) => update(i, "detail", e.target.value)} placeholder="Detail (optional)" className="flex-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button asChild variant="ghost"><Link href={`/meetings/${meeting.id}`}>Cancel</Link></Button>
          <Button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save agenda"}</Button>
        </div>
      </div>
    </div>
  );
}
