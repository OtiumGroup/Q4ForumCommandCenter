import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminPanel, type AdminOverview } from "./admin-panel";
import { CONSTITUTION_VERSION } from "@/lib/constitution-content";

function isUpcoming(iso: string) {
  return new Date(iso) >= new Date(new Date().toDateString());
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/home");

  const [
    { data: members },
    { data: invites },
    { data: broadcasts },
    { data: meetings },
    { data: goals },
    { data: events },
    { data: eventRsvps },
    { data: meetingRsvps },
    { data: photos },
    { count: booksCount },
    { count: documentsCount },
    { count: resourcesCount },
    { data: authStatus },
    { data: conRequests },
    { data: conSignatures },
  ] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, role, status, photo_url, created_at").order("created_at", { ascending: true }),
    supabase.from("invites").select("id, email, full_name, role, status, personal_note, created_at").order("created_at", { ascending: false }),
    supabase.from("broadcasts").select("id, title, body, created_at").order("created_at", { ascending: false }),
    supabase.from("meetings").select("id, title, starts_at, theme, agenda").order("starts_at", { ascending: true }),
    supabase.from("goals").select("id, member_id, title, status, needs_help, due_date, created_at"),
    supabase.from("events").select("id, title, source, starts_at, address, created_at").order("starts_at", { ascending: true }),
    supabase.from("event_rsvps").select("event_id, status"),
    supabase.from("meeting_rsvps").select("meeting_id, status"),
    supabase.from("gallery_photos").select("id, uploader_id, created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("media_items").select("id", { count: "exact", head: true }),
    supabase.from("documents").select("id", { count: "exact", head: true }),
    supabase.from("eo_resources").select("id", { count: "exact", head: true }),
    supabase.rpc("admin_member_auth_status"),
    supabase.from("constitution_requests").select("id, member_id, body, status, created_at").order("created_at", { ascending: false }),
    supabase.from("constitution_signatures").select("member_id").eq("version", CONSTITUTION_VERSION),
  ]);

  const setUp = new Set(
    ((authStatus as { id: string; last_sign_in_at: string | null }[] | null) ?? [])
      .filter((a) => a.last_sign_in_at)
      .map((a) => a.id)
  );

  const mem = members ?? [];
  const nameById = new Map(mem.map((m) => [m.id, m.full_name] as const));
  const todayStr = new Date().toLocaleDateString("en-CA");

  const goalList = goals ?? [];
  const isOverdue = (g: { due_date: string | null; status: string }) => !!g.due_date && g.status !== "done" && g.due_date < todayStr;

  const upcomingMeetings = (meetings ?? []).filter((m) => isUpcoming(m.starts_at));
  const upcomingEvents = (events ?? []).filter((e) => isUpcoming(e.starts_at));

  const nextMeetingRow = upcomingMeetings[0] ?? null;
  const nextMeeting = nextMeetingRow
    ? {
        id: nextMeetingRow.id,
        title: nextMeetingRow.title,
        theme: nextMeetingRow.theme ?? null,
        starts_at: nextMeetingRow.starts_at,
        hasAgenda: Array.isArray(nextMeetingRow.agenda) && nextMeetingRow.agenda.length > 0,
        attending: (meetingRsvps ?? []).filter((r) => r.meeting_id === nextMeetingRow.id && r.status === "attending").length,
      }
    : null;

  const needsHelp = goalList
    .filter((g) => g.needs_help && g.status !== "done")
    .slice(0, 6)
    .map((g) => ({ goalId: g.id, title: g.title, memberId: g.member_id, memberName: nameById.get(g.member_id) ?? "Member" }));

  const invitedMembers = mem
    .filter((m) => m.status === "invited")
    .map((m) => ({ id: m.id, full_name: m.full_name, email: m.email }));

  const notOnboarded = mem
    .filter((m) => m.status !== "suspended" && !setUp.has(m.id))
    .map((m) => ({ id: m.id, full_name: m.full_name, email: m.email }));

  const signedIds = new Set(((conSignatures as { member_id: string }[] | null) ?? []).map((s) => s.member_id));
  const constitutionTotal = mem.filter((m) => m.status !== "suspended").length;
  const constitutionSigned = mem.filter((m) => m.status !== "suspended" && signedIds.has(m.id)).length;
  const openConRequests = ((conRequests as { id: string; member_id: string; body: string; status: string; created_at: string }[] | null) ?? []).filter((r) => r.status === "open" || r.status === "discussed");
  const modificationRequests = openConRequests.map((r) => ({
    id: r.id,
    memberId: r.member_id,
    memberName: nameById.get(r.member_id) ?? "A member",
    body: r.body,
    status: r.status,
    created_at: r.created_at,
  }));

  const eventAttending = new Map<string, number>();
  (eventRsvps ?? []).forEach((r) => {
    if (r.status === "attending") eventAttending.set(r.event_id, (eventAttending.get(r.event_id) ?? 0) + 1);
  });

  type Activity = { id: string; text: string; sub: string; when: string; kind: "member" | "goal" | "event" | "photo" | "broadcast" };
  const activity: Activity[] = [
    ...mem.map((m) => ({ id: `m-${m.id}`, text: `${m.full_name ?? "A member"} joined`, sub: "Member", when: m.created_at, kind: "member" as const })),
    ...goalList.map((g) => ({ id: `g-${g.id}`, text: `${nameById.get(g.member_id) ?? "A member"} set a goal`, sub: g.title, when: g.created_at, kind: "goal" as const })),
    ...(events ?? []).map((e) => ({ id: `e-${e.id}`, text: "Event added", sub: e.title, when: e.created_at, kind: "event" as const })),
    ...(photos ?? []).map((p) => ({ id: `p-${p.id}`, text: `${nameById.get(p.uploader_id) ?? "A member"} added a photo`, sub: "Gallery", when: p.created_at, kind: "photo" as const })),
    ...(broadcasts ?? []).map((b) => ({ id: `br-${b.id}`, text: "Broadcast posted", sub: b.title, when: b.created_at, kind: "broadcast" as const })),
  ]
    .sort((a, b) => (a.when < b.when ? 1 : -1))
    .slice(0, 10);

  const overview: AdminOverview = {
    stats: {
      activeMembers: mem.filter((m) => m.status === "active").length,
      suspendedMembers: mem.filter((m) => m.status === "suspended").length,
      invitedMembers: invitedMembers.length,
      pendingInvites: (invites ?? []).filter((i) => i.status === "pending").length,
      upcomingMeetings: upcomingMeetings.length,
      upcomingEvents: upcomingEvents.length,
      totalGoals: goalList.length,
      needsHelp: goalList.filter((g) => g.needs_help && g.status !== "done").length,
      overdueGoals: goalList.filter(isOverdue).length,
      photos: (photos ?? []).length,
      books: booksCount ?? 0,
      documents: documentsCount ?? 0,
      resources: resourcesCount ?? 0,
      onboarded: mem.filter((m) => setUp.has(m.id)).length,
      notOnboarded: notOnboarded.length,
      constitutionSigned,
      constitutionTotal,
      openRequests: openConRequests.length,
    },
    needsHelp,
    invitedMembers,
    notOnboarded,
    modificationRequests,
    nextMeeting,
    activity,
  };

  const eventsForAdmin = (events ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    source: e.source as "eo" | "member",
    starts_at: e.starts_at,
    address: e.address ?? null,
    attending: eventAttending.get(e.id) ?? 0,
  }));

  return (
    <AdminPanel
      currentUserId={user.id}
      members={mem.map((m) => ({ ...m, onboarded: setUp.has(m.id) }))}
      invites={invites ?? []}
      broadcasts={broadcasts ?? []}
      meetings={meetings ?? []}
      events={eventsForAdmin}
      overview={overview}
    />
  );
}
