"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PenLine, MessageSquarePlus, Printer, Check, Clock, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { SignaturePad, type SignaturePadHandle } from "@/components/shared/signature-pad";
import {
  FOUNDATION,
  SECTIONS,
  CONSTITUTION_TITLE,
  CONSTITUTION_REV,
  type ConBlock,
} from "@/lib/constitution-content";
import { signConstitution, submitConstitutionRequest, deleteRequest } from "./actions";

type Member = { id: string; full_name: string | null; photo_url: string | null; role: string };
type Signature = { member_id: string; signature_type: "drawn" | "typed"; signature_data: string; signed_at: string };
type Request = { id: string; member_id: string; body: string; status: string; created_at: string };

const SIGNATURE_FONT = "'Snell Roundhand', 'Segoe Script', 'Brush Script MT', 'Apple Chancery', cursive";

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function SectionHeading({ number, title, subtitle }: { number?: number; title: string; subtitle?: string }) {
  return (
    <div className="mb-4 border-b border-border pb-2">
      <h2 className="flex items-baseline gap-2 font-display text-xl font-semibold tracking-tight text-foreground">
        {number != null && <span className="text-base font-semibold text-accent">{number}.</span>}
        {title}
      </h2>
      {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function Block({ block }: { block: ConBlock }) {
  if (block.kind === "paragraph") {
    return <p className="leading-relaxed text-muted-foreground">{block.text}</p>;
  }
  if (block.kind === "definition") {
    return (
      <div>
        <p className="font-semibold text-foreground">{block.term}</p>
        <p className="mt-0.5 leading-relaxed text-muted-foreground">{block.text}</p>
      </div>
    );
  }
  if (block.kind === "roles") {
    return (
      <div>
        <p className="font-semibold text-foreground">Forum Positions</p>
        <p className="mt-0.5 leading-relaxed text-muted-foreground">{block.intro}</p>
        <ul className="mt-3 space-y-2">
          {block.roles.map((r) => (
            <li key={r.name} className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
              <span className="font-medium text-foreground">{r.name}</span>
              <span className="text-muted-foreground"> — {r.desc}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            {block.headers.map((h, i) => (
              <th key={h} className={`px-4 py-2.5 font-semibold ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, ri) => (
            <tr key={ri} className="border-t border-border odd:bg-card even:bg-secondary/20">
              {row.map((cell, ci) => (
                <td key={ci} className={`px-4 py-2.5 ${ci === 0 ? "text-foreground" : "text-right font-medium text-foreground"}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SignatureMark({ sig }: { sig: Signature }) {
  if (sig.signature_type === "drawn") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={sig.signature_data} alt="Signature" className="h-12 w-auto max-w-[220px] object-contain" />;
  }
  return (
    <span className="text-2xl leading-none text-foreground" style={{ fontFamily: SIGNATURE_FONT }}>
      {sig.signature_data}
    </span>
  );
}

function SignatureRow({ member, sig, isMe, onSign }: { member: Member; sig: Signature | undefined; isMe: boolean; onSign: () => void }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${sig ? "border-border bg-card" : "border-dashed border-border bg-secondary/20"} ${isMe ? "ring-1 ring-accent/40" : ""}`}>
      <Avatar className="h-9 w-9 shrink-0">
        {member.photo_url ? <AvatarImage src={member.photo_url} alt={member.full_name ?? ""} /> : null}
        <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">{initials(member.full_name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="font-medium text-foreground">
          {member.full_name} {isMe && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
        </p>
        {sig ? (
          <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <Check className="h-3 w-3" /> Signed {new Date(sig.signed_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </p>
        ) : (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> Awaiting signature
          </p>
        )}
      </div>
      <div className="ml-auto flex items-center gap-3">
        {sig ? (
          <div className="flex h-12 items-end border-b border-border/60 pb-0.5">
            <SignatureMark sig={sig} />
          </div>
        ) : isMe ? (
          <Button size="sm" onClick={onSign} className="print:hidden">
            <PenLine className="mr-1.5 h-3.5 w-3.5" /> Sign now
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}

function SignDialog({ open, onOpenChange, memberName, hasSigned }: { open: boolean; onOpenChange: (v: boolean) => void; memberName: string; hasSigned: boolean }) {
  const router = useRouter();
  const padRef = useRef<SignaturePadHandle>(null);
  const [tab, setTab] = useState("draw");
  const [typed, setTyped] = useState(memberName);
  const [pending, startTransition] = useTransition();

  function submit() {
    let payload: { type: "drawn" | "typed"; data: string } | null = null;
    if (tab === "draw") {
      const data = padRef.current?.toDataURL();
      if (!data) { toast.error("Draw your signature first."); return; }
      payload = { type: "drawn", data };
    } else {
      const name = typed.trim();
      if (!name) { toast.error("Type your name to sign."); return; }
      payload = { type: "typed", data: name };
    }
    startTransition(async () => {
      const res = await signConstitution(payload!);
      if (res.ok) { toast.success(res.message ?? "Signed."); onOpenChange(false); router.refresh(); }
      else toast.error(res.message ?? "Could not save your signature.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{hasSigned ? "Update your signature" : "Sign the Constitution"}</DialogTitle>
          <DialogDescription>By signing, you affirm that you&apos;ve read and agree to uphold the Q4 Forum Constitution.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="py-2">
          <TabsList className="w-full">
            <TabsTrigger value="draw" className="flex-1">Draw</TabsTrigger>
            <TabsTrigger value="type" className="flex-1">Type</TabsTrigger>
          </TabsList>
          <TabsContent value="draw" className="mt-3">
            <SignaturePad ref={padRef} className="h-40 w-full rounded-lg border border-border bg-white" />
            <div className="mt-2 flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => padRef.current?.clear()}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Clear
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="type" className="mt-3 space-y-3">
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type your full name" />
            <div className="flex min-h-[80px] items-center justify-center rounded-lg border border-border bg-white px-4">
              <span className="text-3xl text-foreground" style={{ fontFamily: SIGNATURE_FONT }}>{typed || "Your signature"}</span>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
          <Button onClick={submit} disabled={pending}>{pending ? "Saving…" : hasSigned ? "Update signature" : "Sign & agree"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a modification</DialogTitle>
          <DialogDescription>Propose a change to the Constitution. It goes to the moderator to discuss at the next forum — nothing changes until the group agrees.</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="e.g. Raise the late fine to $150, or change the retreat budget cap…" />
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
          <Button
            disabled={pending || body.trim().length < 5}
            onClick={() =>
              startTransition(async () => {
                const res = await submitConstitutionRequest(body);
                if (res.ok) { toast.success(res.message ?? "Sent."); setBody(""); onOpenChange(false); router.refresh(); }
                else toast.error(res.message ?? "Could not send.");
              })
            }
          >
            {pending ? "Sending…" : "Send to moderator"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConstitutionPanel({
  members,
  signatures,
  requests,
  currentUserId,
}: {
  members: Member[];
  signatures: Signature[];
  requests: Request[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const sigByMember = useMemo(() => new Map(signatures.map((s) => [s.member_id, s])), [signatures]);
  const mySig = sigByMember.get(currentUserId);
  const me = members.find((m) => m.id === currentUserId);
  const signedCount = members.filter((m) => sigByMember.has(m.id)).length;
  const openRequests = requests.filter((r) => r.status === "open" || r.status === "discussed");
  const nameById = new Map(members.map((m) => [m.id, m.full_name] as const));

  const [signOpen, setSignOpen] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">EO Fort Worth · Q4 Forum</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Constitution</h1>
          <p className="mt-1 text-sm text-muted-foreground">Our governing document · {CONSTITUTION_REV}</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-1.5 h-4 w-4" /> Download
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 print:hidden">
        {mySig ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4" /> You&apos;ve signed
          </span>
        ) : (
          <Button onClick={() => setSignOpen(true)}>
            <PenLine className="mr-1.5 h-4 w-4" /> Sign the Constitution
          </Button>
        )}
        {mySig && <Button variant="ghost" size="sm" onClick={() => setSignOpen(true)}>Update signature</Button>}
        <Button variant="outline" onClick={() => setReqOpen(true)}>
          <MessageSquarePlus className="mr-1.5 h-4 w-4" /> Request a modification
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">{signedCount} of {members.length} signed</span>
      </div>

      <article className="space-y-9">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-primary to-primary/90 px-6 py-10 text-center text-primary-foreground">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/q4-mark.png" alt="Q4" className="mx-auto mb-4 h-14 w-14 rounded-xl object-contain shadow-md" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Governing Document</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">{CONSTITUTION_TITLE}</h2>
          <p className="mt-2 text-sm text-primary-foreground/70">{CONSTITUTION_REV} · Fiscal Year 2025–2026</p>
        </div>

        <section>
          <SectionHeading title="Forum Foundation" />
          <div className="grid gap-3 sm:grid-cols-2">
            {FOUNDATION.map((f) => (
              <div key={f.label} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">{f.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">{f.value}</p>
              </div>
            ))}
          </div>
        </section>

        {SECTIONS.map((sec) => (
          <section key={sec.id}>
            <SectionHeading number={sec.number} title={sec.title} />
            <div className="space-y-4">
              {sec.blocks.map((b, i) => (
                <Block key={i} block={b} />
              ))}
            </div>
          </section>
        ))}
      </article>

      <section className="mt-12">
        <SectionHeading title="Signatures" subtitle={`Each member signs individually · ${signedCount} of ${members.length} signed`} />
        <div className="space-y-2.5">
          {members.map((m) => (
            <SignatureRow key={m.id} member={m} sig={sigByMember.get(m.id)} isMe={m.id === currentUserId} onSign={() => setSignOpen(true)} />
          ))}
        </div>
      </section>

      {openRequests.length > 0 && (
        <section className="mt-12 print:hidden">
          <SectionHeading title="Proposed changes" subtitle="Up for discussion at the next forum" />
          <div className="space-y-2.5">
            {openRequests.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{nameById.get(r.member_id) ?? "A member"}</p>
                  <Badge variant={r.status === "discussed" ? "default" : "secondary"} className="capitalize">{r.status}</Badge>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                {r.member_id === currentUserId && (
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      onClick={() =>
                        startTransition(async () => {
                          const res = await deleteRequest(r.id);
                          if (res.ok) router.refresh();
                          else toast.error(res.message ?? "Could not withdraw.");
                        })
                      }
                    >
                      <Trash2 className="mr-1 h-3 w-3" /> Withdraw
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <SignDialog open={signOpen} onOpenChange={setSignOpen} memberName={me?.full_name ?? ""} hasSigned={!!mySig} />
      <RequestDialog open={reqOpen} onOpenChange={setReqOpen} />
    </div>
  );
}
