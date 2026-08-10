"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveAgenda, type AgendaBlock } from "../../actions";

type Block = { time: string; title: string; speaker: string; detail: string };
type Copyable = { id: string; label: string; agenda: AgendaBlock[] };

const TEMPLATE: Block[] = [
  { time: "11:30 AM", title: "Arrivals & lunch", speaker: "", detail: "Grab a plate and settle in." },
  { time: "12:00 PM", title: "Opening & check-ins", speaker: "", detail: "Each member shares a high and a low since last forum." },
  { time: "12:30 PM", title: "5% / life update", speaker: "", detail: "Where everyone is across business, family, and personal." },
  { time: "1:00 PM", title: "Member deep dive", speaker: "TBD", detail: "One member presents a challenge; the forum explores it." },
  { time: "2:00 PM", title: "Business & housekeeping", speaker: "", detail: "Events, SAP schedule, retreat planning." },
  { time: "2:30 PM", title: "Closing & commitments", speaker: "", detail: "One commitment each before next forum." },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function toBlocks(a: AgendaBlock[]): Block[] {
  return a.map((b) => ({ time: b.time ?? "", title: b.title ?? "", speaker: b.speaker ?? "", detail: b.detail ?? "" }));
}

export function AgendaForm({
  meeting,
  copyable = [],
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
  copyable?: Copyable[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [theme, setTheme] = useState(meeting.theme ?? "");
  const [facilitator, setFacilitator] = useState(meeting.facilitator ?? "");
  const [location, setLocation] = useState(meeting.location ?? "");
  const [notes, setNotes] = useState(meeting.notes ?? "");
  const [blocks, setBlocks] = useState<Block[]>(
    meeting.agenda.length > 0 ? toBlocks(meeting.agenda) : [{ time: "", title: "", speaker: "", detail: "" }]
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
  function move(i: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function hasContent() {
    return blocks.some((b) => b.time || b.title || b.speaker || b.detail);
  }
  function loadTemplate() {
    if (hasContent() && !window.confirm("Replace the current schedule with the standard forum template?")) return;
    setBlocks(TEMPLATE.map((b) => ({ ...b })));
  }
  function copyFrom(id: string) {
    const src = copyable.find((c) => c.id === id);
    if (!src) return;
    if (hasContent() && !window.confirm("Replace the current schedule with that meeting's agenda?")) return;
    setBlocks(toBlocks(src.agenda));
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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Label className="text-base">Schedule</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={loadTemplate}>
                <Sparkles className="mr-1.5 h-4 w-4" /> Standard template
              </Button>
              {copyable.length > 0 && (
                <Select onValueChange={copyFrom}>
                  <SelectTrigger className="h-9 w-[190px]"><SelectValue placeholder="Copy from…" /></SelectTrigger>
                  <SelectContent>
                    {copyable.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="mr-1.5 h-4 w-4" /> Add block</Button>
            </div>
          </div>

          {blocks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              No schedule yet — add a block, load the template, or copy from another meeting.
            </div>
          ) : (
            <div className="space-y-3">
              {blocks.map((b, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-accent">{i + 1}</span>
                    <div className="flex items-center gap-0.5">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Move down" disabled={i === blocks.length - 1} onClick={() => move(i, 1)}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Remove block" onClick={() => remove(i)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input value={b.time} onChange={(e) => update(i, "time", e.target.value)} placeholder="Time (e.g. 1:00 PM)" className="w-36" />
                    <Input value={b.title} onChange={(e) => update(i, "title", e.target.value)} placeholder="Agenda item" className="flex-1" />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Input value={b.speaker} onChange={(e) => update(i, "speaker", e.target.value)} placeholder="Speaker / who's up (optional)" className="w-56" />
                    <Input value={b.detail} onChange={(e) => update(i, "detail", e.target.value)} placeholder="Detail (optional)" className="flex-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 mt-4 flex items-center justify-between gap-2 border-t border-border bg-background/95 py-3 backdrop-blur">
        <p className="text-xs text-muted-foreground">{blocks.filter((b) => b.title.trim()).length} item{blocks.filter((b) => b.title.trim()).length === 1 ? "" : "s"} in the schedule</p>
        <div className="flex gap-2">
          <Button asChild variant="ghost"><Link href={`/meetings/${meeting.id}`}>Cancel</Link></Button>
          <Button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save agenda"}</Button>
        </div>
      </div>
    </div>
  );
}
