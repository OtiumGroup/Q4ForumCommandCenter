"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Target, HandHeart, Pencil, Trash2, Briefcase, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { saveGoal, setGoalStatus, deleteGoal } from "./actions";

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

function MyGoalCard({ goal }: { goal: Goal }) {
  const [pending, startTransition] = useTransition();
  const Icon = AREA_ICON[goal.area];

  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div>
              <p className="font-medium">{goal.title}</p>
              {goal.details && <p className="mt-0.5 text-sm text-muted-foreground">{goal.details}</p>}
              {goal.due_date && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Due {new Date(goal.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <GoalDialog goal={goal} trigger={
              <Button variant="ghost" size="icon" aria-label="Edit goal">
                <Pencil className="h-4 w-4" />
              </Button>
            } />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete goal"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await deleteGoal(goal.id);
                  if (!res.ok) toast.error(res.message ?? "Could not delete goal.");
                })
              }
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={goal.status}
            onValueChange={(status) =>
              startTransition(async () => {
                const res = await setGoalStatus(goal.id, status);
                if (!res.ok) toast.error(res.message ?? "Could not update status.");
              })
            }
          >
            <SelectTrigger className={`h-7 w-auto gap-1 rounded-full border-0 px-2.5 text-xs ${STATUS_CLASS[goal.status]}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Not started</SelectItem>
              <SelectItem value="on_track">On track</SelectItem>
              <SelectItem value="at_risk">At risk</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          {goal.needs_help && (
            <Badge variant="destructive" className="gap-1">
              <HandHeart className="h-3 w-3" /> Needs help
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function GoalsPanel({
  goals,
  profiles,
  currentUserId,
}: {
  goals: Goal[];
  profiles: ProfileLite[];
  currentUserId: string;
}) {
  const nameById = useMemo(() => {
    const m = new Map<string, ProfileLite>();
    profiles.forEach((p) => m.set(p.id, p));
    return m;
  }, [profiles]);

  const myGoals = goals.filter((g) => g.member_id === currentUserId);
  const areas: Area[] = ["business", "personal", "life"];

  const forumGoals = [...goals].sort((a, b) => (a.needs_help === b.needs_help ? 0 : a.needs_help ? -1 : 1));
  const goalsByMember = useMemo(() => {
    const m = new Map<string, Goal[]>();
    forumGoals.forEach((g) => {
      const list = m.get(g.member_id) ?? [];
      list.push(g);
      m.set(g.member_id, list);
    });
    return m;
  }, [forumGoals]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Goals &amp; Accountability</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set goals, track them, and ask for help when you need it.
          </p>
        </div>
        <GoalDialog trigger={
          <Button>
            <Plus className="mr-1.5 h-4 w-4" /> New goal
          </Button>
        } />
      </div>

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">My Goals</TabsTrigger>
          <TabsTrigger value="forum">Forum</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-4 space-y-6">
          {areas.map((area) => {
            const areaGoals = myGoals.filter((g) => g.area === area);
            if (areaGoals.length === 0) return null;
            const Icon = AREA_ICON[area];
            return (
              <div key={area}>
                <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" /> {AREA_LABEL[area]}
                </h2>
                <div className="space-y-2">
                  {areaGoals.map((g) => (
                    <MyGoalCard key={g.id} goal={g} />
                  ))}
                </div>
              </div>
            );
          })}
          {myGoals.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
                <Target className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No goals yet — add one to start tracking.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="forum" className="mt-4 space-y-4">
          {Array.from(goalsByMember.entries()).map(([memberId, memberGoals]) => {
            const profile = nameById.get(memberId);
            return (
              <Card key={memberId}>
                <CardHeader className="flex-row items-center gap-3 space-y-0 py-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.photo_url ?? undefined} alt="" />
                    <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
                      {initials(profile?.full_name ?? null)}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-sm font-medium">{profile?.full_name ?? "Member"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {memberGoals.map((g) => {
                    const Icon = AREA_ICON[g.area];
                    return (
                      <div key={g.id} className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{g.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {g.needs_help && (
                            <Badge variant="destructive" className="gap-1">
                              <HandHeart className="h-3 w-3" /> Needs help
                            </Badge>
                          )}
                          <Badge className={STATUS_CLASS[g.status]}>{STATUS_LABEL[g.status]}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
          {goalsByMember.size === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center text-sm text-muted-foreground">
                No goals shared yet.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
