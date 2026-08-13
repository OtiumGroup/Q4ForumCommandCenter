"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Target, HandHeart, Pencil, Trash2, Briefcase, Heart, Sparkles, AlertTriangle, ListChecks, Bell, CheckCircle2, RotateCcw, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { saveGoal, deleteGoal, nudgeGoal, setGoalStatus } from "./actions";

type Area = "business" | "personal" | "life";
type Status = "not_started" | "on_track" | "at_risk" | "done";
type Goal = {
  id: string;
  member_id: string;
  area: Area;
  title: string;
  details: string | null;
  due_date: string | null;
  status: Status;
  needs_help: boolean;
  reminder_date: string | null;
  created_at: string;
};
type ProfileLite = { id: string; full_name: string | null; photo_url: string | null };

const AREA_ICON: Record<Area, typeof Briefcase> = { business: Briefcase, personal: Heart, life: Sparkles };
const AREA_LABEL: Record<Area, string> = { business: "Business", personal: "Personal", life: "Life" };
const STATUS_LABEL: Record<Status, string> = {
  not_started: "Not started",
  on_track: "On track",
  at_risk: "At risk",
  done: "Done",
};
const STATUS_CLASS: Record<Status, string> = {
  not_started: "bg-muted text-muted-foreground",
  on_track: "bg-success text-success-foreground",
  at_risk: "bg-warning text-warning-foreground",
  done: "bg-primary text-primary-foreground",
};

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function isOverdue(goal: Goal) {
  if (!goal.due_date || goal.status === "done") return false;
  // Compare plain YYYY-MM-DD strings so we're not mixing UTC-midnight
  // (new Date("YYYY-MM-DD")) with local-midnight (new Date().toDateString())
  // parsing — that mismatch flagged goals due "today" as overdue a day early
  // in timezones behind UTC (e.g. Fort Worth).
  const todayStr = new Date().toLocaleDateString("en-CA"); // en-CA => YYYY-MM-DD, local time
  return goal.due_date < todayStr;
}

function GoalDialog({ goal, trigger }: { goal?: Goal; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await saveGoal({ ok: false }, formData);
      if (res.ok) {
        toast.success(res.message ?? "Saved.");
        setOpen(false);
      } else {
        setError(res.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setError(null); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form action={handleSubmit}>
          {goal && <input type="hidden" name="id" value={goal.id} />}
          <DialogHeader>
            <DialogTitle>{goal ? "Edit goal" : "New goal"}</DialogTitle>
            <DialogDescription>Visible to the whole forum — that&apos;s the point.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Goal</Label>
              <Input id="title" name="title" required defaultValue={goal?.title ?? ""} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <Select name="area" defaultValue={goal?.area ?? "business"}>
                  <SelectTrigger id="area" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="life">Life</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due date</Label>
                <Input id="due_date" name="due_date" type="date" defaultValue={goal?.due_date ?? ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={goal?.status ?? "not_started"}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not started</SelectItem>
                  <SelectItem value="on_track">On track</SelectItem>
                  <SelectItem value="at_risk">At risk</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Details (optional)</Label>
              <Textarea id="details" name="details" rows={2} defaultValue={goal?.details ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder_date">Remind me on (optional)</Label>
              <Input id="reminder_date" name="reminder_date" type="date" defaultValue={goal?.reminder_date ?? ""} />
              <p className="text-xs text-muted-foreground">A gentle self-nudge — shows on your goal once the date arrives.</p>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium">I need help with this</p>
                <p className="text-xs text-muted-foreground">Flags it for the forum during meetings.</p>
              </div>
              <Switch name="needs_help" defaultChecked={goal?.needs_help ?? false} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: typeof Target;
  tone: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
        active ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-secondary/50"
      }`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-display text-xl font-semibold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </button>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
      }`}
    >
      {children}
    </button>
  );
}

function GoalRow({ goal, owner, isOwn, nudgeCount, onOpenDetail }: { goal: Goal; owner: ProfileLite | undefined; isOwn: boolean; nudgeCount: number; onOpenDetail: (id: string) => void }) {
  const [pending, startTransition] = useTransition();
  const [nudging, setNudging] = useState(false);
  const Icon = AREA_ICON[goal.area];
  const overdue = isOverdue(goal);
  const done = goal.status === "done";
  const todayStr = new Date().toLocaleDateString("en-CA");
  const reminderDue = isOwn && !!goal.reminder_date && goal.status !== "done" && goal.reminder_date <= todayStr;
  return (
    <div className={`flex items-center gap-2 rounded-xl border bg-card px-3 py-2.5 ${overdue ? "border-destructive/40" : reminderDue ? "border-accent/40" : "border-border"} ${done ? "opacity-70" : ""}`}>
      <button type="button" onClick={() => onOpenDetail(goal.id)} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left transition-colors hover:bg-secondary/40 -mx-1 px-1 py-0.5">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={owner?.photo_url ?? undefined} alt="" />
          <AvatarFallback className="bg-secondary text-[10px] text-secondary-foreground">{initials(owner?.full_name ?? null)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 shrink-0 text-accent" />
            <p className="truncate text-sm font-medium">{goal.title}</p>
            {isOwn && nudgeCount > 0 && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent" title="Nudges from the forum">
                👋 {nudgeCount}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {owner?.full_name ?? "Member"}
            {goal.due_date && (
              <span className={overdue ? "text-destructive" : undefined}>
                {" · "}
                {overdue ? "overdue " : "due "}
                {new Date(goal.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            )}
            {reminderDue && <span className="text-accent"> · ⏰ reminder</span>}
          </p>
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1.5">
        {goal.needs_help && !done && (
          <span className="hidden items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive sm:inline-flex">
            <HandHeart className="h-3 w-3" /> Help
          </span>
        )}
        <Badge className={STATUS_CLASS[goal.status]}>{STATUS_LABEL[goal.status]}</Badge>
        {!isOwn && !done && (overdue || goal.needs_help) && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            disabled={nudging}
            onClick={async () => {
              setNudging(true);
              const r = await nudgeGoal(goal.id);
              setNudging(false);
              if (r.ok) toast.success(r.message ?? "Nudge sent.");
              else toast.error(r.message ?? "Could not nudge.");
            }}
          >
            <Bell className="h-3 w-3" /> Nudge
          </Button>
        )}
        {isOwn && (
          <>
            {done ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Reopen goal"
                disabled={pending}
                onClick={() => startTransition(async () => { const r = await setGoalStatus(goal.id, "on_track"); if (!r.ok) toast.error(r.message ?? "Could not reopen."); else toast.success("Reopened."); })}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Mark complete"
                disabled={pending}
                onClick={() => startTransition(async () => { const r = await setGoalStatus(goal.id, "done"); if (!r.ok) toast.error(r.message ?? "Could not update."); else toast.success("Marked complete 🎉"); })}
              >
                <CheckCircle2 className="h-4 w-4 text-success" />
              </Button>
            )}
            <GoalDialog
              goal={goal}
              trigger={
                <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit goal">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Delete goal"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await deleteGoal(goal.id);
                  if (!r.ok) toast.error(r.message ?? "Could not delete.");
                })
              }
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function GoalDetailDialog({
  goal, owner, isOwn, open, onOpenChange,
}: {
  goal: Goal | null;
  owner: ProfileLite | undefined;
  isOwn: boolean;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [nudging, setNudging] = useState(false);
  if (!goal) return null;
  const Icon = AREA_ICON[goal.area];
  const overdue = isOverdue(goal);
  const done = goal.status === "done";
  const firstName = owner?.full_name?.split(" ")[0] ?? "them";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
            <Icon className="h-3.5 w-3.5" /> {AREA_LABEL[goal.area]}
          </p>
          <DialogTitle className="font-display text-xl leading-snug">{goal.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="inline-flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={owner?.photo_url ?? undefined} alt="" />
                <AvatarFallback className="bg-secondary text-[9px] text-secondary-foreground">{initials(owner?.full_name ?? null)}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{owner?.full_name ?? "Member"}</span>
            </span>
            <Badge className={STATUS_CLASS[goal.status]}>{STATUS_LABEL[goal.status]}</Badge>
            {goal.needs_help && !done && (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                <HandHeart className="h-3 w-3" /> Asked for help
              </span>
            )}
            {goal.due_date && (
              <span className={`text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                {overdue ? "Overdue · " : "Due "}
                {new Date(goal.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>

          <div className="rounded-lg border border-border bg-secondary/40 p-3.5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {goal.needs_help ? "The goal & where they'd like help" : "Details"}
            </p>
            <p className="whitespace-pre-wrap text-sm text-foreground">{goal.details?.trim() || "No details added yet."}</p>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:justify-start">
          {isOwn ? (
            done ? (
              <Button variant="outline" disabled={pending} onClick={() => startTransition(async () => { const r = await setGoalStatus(goal.id, "on_track"); if (r.ok) { toast.success("Reopened."); onOpenChange(false); } else toast.error(r.message ?? "Could not reopen."); })}>
                <RotateCcw className="mr-1.5 h-4 w-4" /> Reopen goal
              </Button>
            ) : (
              <Button disabled={pending} onClick={() => startTransition(async () => { const r = await setGoalStatus(goal.id, "done"); if (r.ok) { toast.success("Marked complete 🎉"); onOpenChange(false); } else toast.error(r.message ?? "Could not update."); })}>
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Mark complete
              </Button>
            )
          ) : (
            (overdue || goal.needs_help) && !done && (
              <Button variant="outline" disabled={nudging} onClick={async () => { setNudging(true); const r = await nudgeGoal(goal.id); setNudging(false); if (r.ok) toast.success(r.message ?? "Nudge sent."); else toast.error(r.message ?? "Could not nudge."); }}>
                <Bell className="mr-1.5 h-4 w-4" /> Nudge {firstName}
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type WhatFilter = "all" | "at_risk" | "needs_help" | "overdue";

export function GoalsPanel({
  goals,
  profiles,
  currentUserId,
  nudgeCounts,
  initialGoalId = null,
}: {
  goals: Goal[];
  profiles: ProfileLite[];
  currentUserId: string;
  nudgeCounts: Record<string, number>;
  initialGoalId?: string | null;
}) {
  const nameById = useMemo(() => {
    const m = new Map<string, ProfileLite>();
    profiles.forEach((p) => m.set(p.id, p));
    return m;
  }, [profiles]);

  const [who, setWho] = useState<string>("everyone"); // "everyone" | "me" | memberId
  const [what, setWhat] = useState<WhatFilter>("all");
  const [detailGoalId, setDetailGoalId] = useState<string | null>(initialGoalId);
  const [showCompleted, setShowCompleted] = useState(false);

  const activeGoals = useMemo(() => goals.filter((g) => g.status !== "done"), [goals]);
  const completedGoals = useMemo(() => goals.filter((g) => g.status === "done"), [goals]);

  const totalGoals = activeGoals.length;
  const atRisk = activeGoals.filter((g) => g.status === "at_risk").length;
  const needingHelp = activeGoals.filter((g) => g.needs_help).length;
  const overdueCount = activeGoals.filter(isOverdue).length;

  const membersWithGoals = useMemo(() => {
    const ids = Array.from(new Set(goals.map((g) => g.member_id)));
    return ids
      .map((id) => nameById.get(id))
      .filter((p): p is ProfileLite => Boolean(p) && p!.id !== currentUserId)
      .sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));
  }, [goals, nameById, currentUserId]);

  const filtered = useMemo(() => {
    return activeGoals
      .filter((g) => {
        if (who === "me") {
          if (g.member_id !== currentUserId) return false;
        } else if (who !== "everyone" && g.member_id !== who) {
          return false;
        }
        if (what === "at_risk" && g.status !== "at_risk") return false;
        if (what === "needs_help" && !g.needs_help) return false;
        if (what === "overdue" && !isOverdue(g)) return false;
        return true;
      })
      .sort((a, b) => {
        const score = (g: Goal) => (g.needs_help ? 0 : 1) + (isOverdue(g) ? 0 : 1);
        const sa = score(a);
        const sb = score(b);
        if (sa !== sb) return sa - sb;
        return (a.due_date ?? "9999-12-31").localeCompare(b.due_date ?? "9999-12-31");
      });
  }, [activeGoals, who, what, currentUserId]);

  const completedFiltered = useMemo(() => {
    return completedGoals
      .filter((g) => {
        if (who === "me") return g.member_id === currentUserId;
        if (who !== "everyone") return g.member_id === who;
        return true;
      })
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  }, [completedGoals, who, currentUserId]);

  const detailGoal = detailGoalId ? goals.find((g) => g.id === detailGoalId) ?? null : null;

  const toggle = (f: WhatFilter) => setWhat((prev) => (prev === f ? "all" : f));

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader eyebrow="Accountability" title="Goals & Accountability" description="Set goals, track them, and ask for help when you need it.">
        <GoalDialog
          trigger={
            <Button variant="secondary">
              <Plus className="mr-1.5 h-4 w-4" /> New goal
            </Button>
          }
        />
      </PageHeader>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:max-w-3xl">
        <StatCard label="All goals" value={totalGoals} icon={ListChecks} tone="bg-secondary text-accent" active={what === "all"} onClick={() => setWhat("all")} />
        <StatCard label="At risk" value={atRisk} icon={AlertTriangle} tone="bg-warning/20 text-warning-foreground" active={what === "at_risk"} onClick={() => toggle("at_risk")} />
        <StatCard label="Needs help" value={needingHelp} icon={HandHeart} tone="bg-destructive/10 text-destructive" active={what === "needs_help"} onClick={() => toggle("needs_help")} />
        <StatCard label="Overdue" value={overdueCount} icon={AlertTriangle} tone="bg-destructive/10 text-destructive" active={what === "overdue"} onClick={() => toggle("overdue")} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip active={who === "everyone"} onClick={() => setWho("everyone")}>Everyone</FilterChip>
        <FilterChip active={who === "me"} onClick={() => setWho("me")}>My goals</FilterChip>
        {membersWithGoals.map((m) => (
          <FilterChip key={m.id} active={who === m.id} onClick={() => setWho(m.id)}>
            <Avatar className="h-4 w-4">
              <AvatarImage src={m.photo_url ?? undefined} alt="" />
              <AvatarFallback className="bg-secondary text-[8px] text-secondary-foreground">{initials(m.full_name)}</AvatarFallback>
            </Avatar>
            {(m.full_name ?? "Member").split(" ")[0]}
          </FilterChip>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
              <Target className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {activeGoals.length === 0 ? "No active goals yet — add one to start tracking." : "Nothing matches this filter."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((g) => <GoalRow key={g.id} goal={g} owner={nameById.get(g.member_id)} isOwn={g.member_id === currentUserId} nudgeCount={nudgeCounts[g.id] ?? 0} onOpenDetail={setDetailGoalId} />)
        )}
      </div>

      {completedFiltered.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setShowCompleted((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showCompleted ? "rotate-180" : ""}`} />
            Completed ({completedFiltered.length})
          </button>
          {showCompleted && (
            <div className="mt-3 space-y-2">
              {completedFiltered.map((g) => (
                <GoalRow key={g.id} goal={g} owner={nameById.get(g.member_id)} isOwn={g.member_id === currentUserId} nudgeCount={nudgeCounts[g.id] ?? 0} onOpenDetail={setDetailGoalId} />
              ))}
            </div>
          )}
        </div>
      )}

      <GoalDetailDialog
        goal={detailGoal}
        owner={detailGoal ? nameById.get(detailGoal.member_id) : undefined}
        isOwn={!!detailGoal && detailGoal.member_id === currentUserId}
        open={detailGoalId !== null && detailGoal !== null}
        onOpenChange={(v) => { if (!v) setDetailGoalId(null); }}
      />
    </div>
  );
}
