"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { UserPlus, Trash2, RefreshCw, Megaphone, Users as UsersIcon, Mail, UserCheck, Clock, Pencil, CalendarClock, PartyPopper, Target, HandHeart, AlertTriangle, Image as ImageIcon, Activity, ArrowRight, BookOpen, FolderOpen, LibraryBig, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
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
import { toast } from "sonner";
import {
  inviteMember,
  resendInvite,
  revokeInvite,
  deleteMember,
  editMember,
  postBroadcast,
  deleteBroadcast,
} from "./actions";
import { deleteEvent } from "@/app/(app)/events/actions";

type Member = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "admin" | "member";
  status: "invited" | "active" | "suspended";
  photo_url: string | null;
  created_at: string;
};

type Invite = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "member";
  status: "pending" | "accepted" | "revoked" | "expired";
  personal_note: string | null;
  created_at: string;
};

type Broadcast = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};

export type AdminOverview = {
  stats: {
    activeMembers: number;
    suspendedMembers: number;
    invitedMembers: number;
    pendingInvites: number;
    upcomingMeetings: number;
    upcomingEvents: number;
    totalGoals: number;
    needsHelp: number;
    overdueGoals: number;
    photos: number;
    books: number;
    documents: number;
    resources: number;
  };
  needsHelp: { goalId: string; title: string; memberId: string; memberName: string }[];
  invitedMembers: { id: string; full_name: string | null; email: string | null }[];
  nextMeeting: { id: string; title: string; theme: string | null; starts_at: string; hasAgenda: boolean; attending: number } | null;
  activity: { id: string; text: string; sub: string; when: string; kind: string }[];
};

type AdminEvent = { id: string; title: string; source: "eo" | "member"; starts_at: string; address: string | null; attending: number };

function statusVariant(status: string) {
  if (status === "active" || status === "accepted") return "default" as const;
  if (status === "invited" || status === "pending") return "secondary" as const;
  return "destructive" as const;
}

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Please wait…" : children}
    </Button>
  );
}

function InviteDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await inviteMember({ ok: false }, formData);
      if (res.ok) {
        toast.success(res.message ?? "Invite sent.");
        setOpen(false);
      } else {
        setError(res.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-1.5 h-4 w-4" /> Invite member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite a member</DialogTitle>
            <DialogDescription>
              They&apos;ll get an email with a link to set up their account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="member@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name (optional)</Label>
              <Input id="full_name" name="full_name" placeholder="Jane Smith" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select name="role" defaultValue="member">
                <SelectTrigger id="role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="personal_note">Personal note (optional)</Label>
              <Textarea id="personal_note" name="personal_note" placeholder="Welcome to the forum!" rows={2} />
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
              {pending ? "Please wait…" : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteMemberButton({ member }: { member: Member }) {
  const [pending, startTransition] = useTransition();
  return (
    <AlertConfirm
      trigger={
        <Button variant="ghost" size="icon" aria-label={`Remove ${member.full_name ?? member.email}`}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      }
      title="Remove this member?"
      description={`${member.full_name ?? member.email} will lose access immediately. This can't be undone.`}
      confirmLabel="Remove"
      pending={pending}
      onConfirm={() =>
        startTransition(async () => {
          const res = await deleteMember(member.id);
          if (res.ok) toast.success("Member removed.");
          else toast.error(res.message ?? "Could not remove member.");
        })
      }
    />
  );
}

function AlertConfirm({
  trigger,
  title,
  description,
  confirmLabel,
  pending,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            {pending ? "Please wait…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UsersTab({ members, currentUserId }: { members: Member[]; currentUserId: string }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => (m.full_name ?? "").toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q));
  }, [members, query]);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <UsersIcon className="h-4 w-4 text-accent" /> Members ({members.length})
          </CardTitle>
          <CardDescription>Everyone with access to the Command Center.</CardDescription>
        </div>
        <InviteDialog />
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members…" className="pl-8" />
        </div>
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{members.length === 0 ? "No members yet." : "No members match your search."}</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {m.photo_url ? <AvatarImage src={m.photo_url} alt={m.full_name ?? ""} /> : null}
                    <AvatarFallback className="bg-secondary text-sm text-secondary-foreground">
                      {initials(m.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="flex items-center gap-2 font-medium">
                      {m.full_name ?? "—"}
                      {m.role === "admin" && (
                        <Badge variant="outline" className="border-accent text-[10px] uppercase tracking-wide text-accent">
                          Admin
                        </Badge>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{m.email ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(m.status)} className="capitalize">
                    {m.status}
                  </Badge>
                  {m.status === "invited" && m.email && <ResendInviteButton email={m.email} />}
                  <EditMemberDialog member={m} currentUserId={currentUserId} />
                  {m.id !== currentUserId && <DeleteMemberButton member={m} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ResendInviteButton({ email }: { email: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Resend invite"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const r = await resendInvite(email);
          if (r.ok) toast.success("Invite resent.");
          else toast.error(r.message ?? "Could not resend.");
        })
      }
    >
      <RefreshCw className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
}

type AdminMeeting = { id: string; title: string; starts_at: string; theme: string | null; agenda: unknown };

function MeetingsTab({ meetings }: { meetings: AdminMeeting[] }) {
  const now = new Date(new Date().toDateString());
  const upcoming = meetings.filter((m) => new Date(m.starts_at) >= now);
  const list = upcoming.length > 0 ? upcoming : meetings;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4 text-accent" /> Forum meetings &amp; agendas
        </CardTitle>
        <CardDescription>Build the schedule for each forum date — members read it, print it, and RSVP.</CardDescription>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No meetings yet — add them on the Upcoming Meetings page.</p>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((m) => {
              const blocks = Array.isArray(m.agenda) ? m.agenda.length : 0;
              return (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium">{m.theme || m.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(m.starts_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                      {" · "}
                      {blocks > 0 ? `${blocks}-item agenda` : "No agenda yet"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm"><Link href={`/meetings/${m.id}`}>View</Link></Button>
                    <Button asChild size="sm">
                      <Link href={`/meetings/${m.id}/edit`}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" /> {blocks > 0 ? "Edit agenda" : "Build agenda"}
                      </Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function EditMemberDialog({ member, currentUserId }: { member: Member; currentUserId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await editMember({ ok: false }, formData);
      if (res.ok) {
        toast.success(res.message ?? "Member updated.");
        setOpen(false);
      } else {
        setError(res.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setError(null); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Edit ${member.full_name ?? member.email ?? "member"}`}>
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit}>
          <input type="hidden" name="id" value={member.id} />
          <DialogHeader>
            <DialogTitle>Edit member</DialogTitle>
            <DialogDescription>{member.email ?? "Manage this member's name, role, and access."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">Name</Label>
              <Input id="edit_full_name" name="full_name" defaultValue={member.full_name ?? ""} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit_role">Role</Label>
                <Select name="role" defaultValue={member.role}>
                  <SelectTrigger id="edit_role" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status">Status</Label>
                <Select name="status" defaultValue={member.status}>
                  <SelectTrigger id="edit_status" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Suspended members keep their profile but can&apos;t sign in.
              {member.id === currentUserId && " You can't remove your own admin access."}
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InvitesTab({ invites }: { invites: Invite[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-accent" /> Invites ({invites.length})
        </CardTitle>
        <CardDescription>Pending, accepted, and revoked invitations.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.email}</TableCell>
                <TableCell className="text-muted-foreground">{inv.full_name ?? "—"}</TableCell>
                <TableCell className="capitalize">{inv.role}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(inv.status)} className="capitalize">
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {inv.status === "pending" && (
                    <div className="flex items-center gap-1">
                      <AlertConfirm
                        trigger={
                          <Button variant="ghost" size="icon" aria-label="Resend invite" disabled={pendingId === inv.id}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        }
                        title="Resend this invite?"
                        description={`A fresh invite email will be sent to ${inv.email}.`}
                        confirmLabel="Resend"
                        pending={pendingId === inv.id}
                        onConfirm={async () => {
                          setPendingId(inv.id);
                          const res = await resendInvite(inv.email);
                          setPendingId(null);
                          if (res.ok) toast.success("Invite resent.");
                          else toast.error(res.message ?? "Could not resend invite.");
                        }}
                      />
                      <AlertConfirm
                        trigger={
                          <Button variant="ghost" size="icon" aria-label="Revoke invite" disabled={pendingId === inv.id}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        }
                        title="Revoke this invite?"
                        description={`${inv.email} will no longer be able to use this invite link. This can't be undone.`}
                        confirmLabel="Revoke"
                        pending={pendingId === inv.id}
                        onConfirm={async () => {
                          setPendingId(inv.id);
                          const res = await revokeInvite(inv.id);
                          setPendingId(null);
                          if (res.ok) toast.success("Invite revoked.");
                          else toast.error(res.message ?? "Could not revoke invite.");
                        }}
                      />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {invites.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No invites sent yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CommunicationsTab({ broadcasts }: { broadcasts: Broadcast[] }) {
  const [state, action] = useActionState(postBroadcast, { ok: false });
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message);
    }
  }, [state]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4 text-accent" /> Send a notice
          </CardTitle>
          <CardDescription>Pushed to every member&apos;s home dashboard.</CardDescription>
        </CardHeader>
        <form action={action}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required placeholder="Monthly meeting schedule is up" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea id="body" name="body" required rows={4} placeholder="Details for the forum…" />
            </div>
            {!state.ok && state.message && (
              <p className="text-sm text-destructive">{state.message}</p>
            )}
          </CardContent>
          <CardFooter>
            <SubmitButton>Notify forum</SubmitButton>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent notices</CardTitle>
          <CardDescription>Most recent first.</CardDescription>
        </CardHeader>
        <CardContent>
          {broadcasts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing sent yet.</p>
          ) : (
            <ul className="space-y-4">
              {broadcasts.map((b) => (
                <li key={b.id} className="flex items-start justify-between gap-3 border-b border-border pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{b.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{b.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete notice"
                    disabled={pendingId === b.id}
                    onClick={async () => {
                      setPendingId(b.id);
                      const res = await deleteBroadcast(b.id);
                      setPendingId(null);
                      if (!res.ok) toast.error(res.message ?? "Could not delete notice.");
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const ACTIVITY_ICON: Record<string, typeof UserPlus> = {
  member: UserPlus,
  goal: Target,
  event: PartyPopper,
  photo: ImageIcon,
  broadcast: Megaphone,
};

function StatTile({ label, value, icon: Icon, href, tone }: { label: string; value: number; icon: typeof UserPlus; href?: string; tone?: "warn" }) {
  const inner = (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-secondary/40">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone === "warn" && value > 0 ? "bg-destructive/10 text-destructive" : "bg-secondary text-accent"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-display text-xl font-semibold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function OverviewTab({ overview }: { overview: AdminOverview }) {
  const s = overview.stats;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Active members" value={s.activeMembers} icon={UserCheck} />
        <StatTile label="Pending invites" value={s.pendingInvites} icon={Clock} />
        <StatTile label="Upcoming meetings" value={s.upcomingMeetings} icon={CalendarClock} href="/meetings" />
        <StatTile label="Upcoming events" value={s.upcomingEvents} icon={PartyPopper} href="/events" />
        <StatTile label="Goals" value={s.totalGoals} icon={Target} href="/goals" />
        <StatTile label="Needs help" value={s.needsHelp} icon={HandHeart} href="/goals" tone="warn" />
        <StatTile label="Overdue goals" value={s.overdueGoals} icon={AlertTriangle} tone="warn" />
        <StatTile label="Suspended" value={s.suspendedMembers} icon={UsersIcon} tone="warn" />
        <StatTile label="Gallery photos" value={s.photos} icon={ImageIcon} href="/gallery" />
        <StatTile label="Books & podcasts" value={s.books} icon={BookOpen} href="/books" />
        <StatTile label="Documents" value={s.documents} icon={FolderOpen} href="/documents" />
        <StatTile label="EO resources" value={s.resources} icon={LibraryBig} href="/resources" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-accent" /> Needs your attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.nextMeeting ? (
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next forum</p>
                <p className="mt-0.5 font-medium">{overview.nextMeeting.theme || overview.nextMeeting.title}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(overview.nextMeeting.starts_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  {" · "}
                  {overview.nextMeeting.attending} attending
                </p>
                <div className="mt-2 flex gap-2">
                  <Button asChild size="sm" variant={overview.nextMeeting.hasAgenda ? "outline" : "default"}>
                    <Link href={`/meetings/${overview.nextMeeting.id}/edit`}>{overview.nextMeeting.hasAgenda ? "Edit agenda" : "Build agenda"}</Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost"><Link href={`/meetings/${overview.nextMeeting.id}`}>View</Link></Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming meetings scheduled.</p>
            )}

            {overview.invitedMembers.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Invited, not yet active ({overview.invitedMembers.length})</p>
                <ul className="space-y-1">
                  {overview.invitedMembers.slice(0, 5).map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{m.full_name ?? m.email}</span>
                      {m.email && <ResendInviteButton email={m.email} />}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {overview.needsHelp.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Members asking for help</p>
                <ul className="space-y-1.5">
                  {overview.needsHelp.map((g) => (
                    <li key={g.goalId} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate"><span className="font-medium">{g.memberName}</span> · {g.title}</span>
                      <Link href={`/bio/${g.memberId}`} className="shrink-0 text-xs font-medium text-accent hover:underline">Reach out</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {overview.invitedMembers.length === 0 && overview.needsHelp.length === 0 && overview.nextMeeting && (
              <p className="text-sm text-muted-foreground">All caught up — nothing needs attention right now.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-accent" /> Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing yet.</p>
            ) : (
              <ul className="space-y-3">
                {overview.activity.map((a) => {
                  const Icon = ACTIVITY_ICON[a.kind] ?? Activity;
                  return (
                    <li key={a.id} className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-accent"><Icon className="h-3.5 w-3.5" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">{a.text}</p>
                        <p className="truncate text-xs text-muted-foreground">{a.sub}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.when)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EventDeleteButton({ event }: { event: AdminEvent }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Delete ${event.title}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete event?</DialogTitle>
          <DialogDescription>&quot;{event.title}&quot; will be removed for everyone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const r = await deleteEvent(event.id);
                if (r.ok) {
                  toast.success("Event deleted.");
                  setOpen(false);
                } else {
                  toast.error(r.message ?? "Could not delete.");
                }
              })
            }
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EventsTab({ events }: { events: AdminEvent[] }) {
  const now = new Date(new Date().toDateString());
  const upcoming = events.filter((e) => new Date(e.starts_at) >= now);
  const past = events.filter((e) => new Date(e.starts_at) < now);
  const render = (list: AdminEvent[]) => (
    <ul className="divide-y divide-border">
      {list.map((e) => (
        <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{e.title}</p>
              <Badge variant={e.source === "eo" ? "default" : "secondary"} className="text-[10px] uppercase">{e.source === "eo" ? "EO" : "Member"}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(e.starts_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })} · {e.attending} attending
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm"><Link href="/events">Open</Link></Button>
            <EventDeleteButton event={e} />
          </div>
        </li>
      ))}
    </ul>
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><PartyPopper className="h-4 w-4 text-accent" /> Events ({events.length})</CardTitle>
        <CardDescription>Every EO and member event. Add or edit details on the Events page; remove any here.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {events.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Upcoming</p>
                {render(upcoming)}
              </div>
            )}
            {past.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Past</p>
                {render(past)}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminPanel({
  currentUserId,
  members,
  invites,
  broadcasts,
  meetings,
  events,
  overview,
}: {
  currentUserId: string;
  members: Member[];
  invites: Invite[];
  broadcasts: Broadcast[];
  meetings: AdminMeeting[];
  events: AdminEvent[];
  overview: AdminOverview;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your forum command center — members, meetings, events, and communications.</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Members</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <OverviewTab overview={overview} />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <UsersTab members={members} currentUserId={currentUserId} />
        </TabsContent>
        <TabsContent value="meetings" className="mt-4">
          <MeetingsTab meetings={meetings} />
        </TabsContent>
        <TabsContent value="events" className="mt-4">
          <EventsTab events={events} />
        </TabsContent>
        <TabsContent value="communications" className="mt-4">
          <CommunicationsTab broadcasts={broadcasts} />
        </TabsContent>
        <TabsContent value="invites" className="mt-4">
          <InvitesTab invites={invites} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
