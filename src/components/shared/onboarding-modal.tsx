"use client";

import { useRef, useState } from "react";
import {
  CalendarClock, Users, Tent, Target, Library, Share, Plus,
  Smartphone, Monitor, ArrowRight, ArrowLeft, Check,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { completeOnboarding } from "@/app/(app)/onboarding-actions";

function Feature({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-accent">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-[13px] text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

export function OnboardingModal({ initialOpen, firstName }: { initialOpen: boolean; firstName?: string | null }) {
  const [open, setOpen] = useState(initialOpen);
  const [step, setStep] = useState(0);
  const saved = useRef(false);
  const isIOS = typeof navigator !== "undefined" && /iP(hone|ad|od)/.test(navigator.userAgent);

  function finish() {
    if (!saved.current) {
      saved.current = true;
      void completeOnboarding();
    }
    setOpen(false);
  }

  const last = 2;
  const next = () => (step < last ? setStep(step + 1) : finish());
  const back = () => setStep(Math.max(0, step - 1));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) finish(); }}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        {/* Brand banner */}
        <div className="relative flex items-center gap-3 bg-gradient-to-br from-primary to-primary/85 px-6 py-5">
          <div aria-hidden className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(circle at 88% 12%, var(--accent) 0%, transparent 45%)" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/q4-mark.png" alt="Q4" className="relative h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-black/10" />
          <div className="relative leading-tight">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">EO Fort Worth · Q4 Forum</p>
            <p className="font-display text-lg font-semibold text-primary-foreground">Command Center</p>
          </div>
        </div>

        <div className="px-6 py-5">
          {step === 0 && (
            <div className="space-y-3">
              <DialogTitle className="font-display text-2xl font-semibold tracking-tight">
                Welcome{firstName ? `, ${firstName}` : ""} 👋
              </DialogTitle>
              <DialogDescription className="text-[14px] leading-relaxed text-muted-foreground">
                This is our private home base — built to <span className="font-medium text-foreground">streamline the forum</span> and put everything in one place. No more digging through group texts and email threads: our meetings, member bios, the annual retreat, our constitution, goals, and the full EO resource library all live right here.
              </DialogDescription>
              <p className="text-[13px] text-muted-foreground">
                One repository for everything Q4 — so you always know where to find it.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <DialogTitle className="font-display text-xl font-semibold tracking-tight">Everything in one place</DialogTitle>
                <DialogDescription className="text-[13px] text-muted-foreground">Here&apos;s what you&apos;ll find inside:</DialogDescription>
              </div>
              <div className="space-y-3.5">
                <Feature icon={CalendarClock} title="Meetings & agendas">Dates, locations, and every agenda — kept forever.</Feature>
                <Feature icon={Users} title="Member bios">Get to know each other beyond the boardroom.</Feature>
                <Feature icon={Tent} title="Forum retreat">Vote on where to go and plan the whole trip together.</Feature>
                <Feature icon={Target} title="Goals & accountability">Track what matters and lend a hand.</Feature>
                <Feature icon={Library} title="Resources & constitution">The full EO library and our governing docs.</Feature>
              </div>
              <p className="rounded-lg bg-secondary/60 px-3 py-2.5 text-[12.5px] text-secondary-foreground">
                It&apos;s a shared repository — you&apos;re always in control of what you share, and you can edit or remove your own info anytime.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
                  <Smartphone className="h-5 w-5" />
                </span>
                <div>
                  <DialogTitle className="font-display text-xl font-semibold tracking-tight">Add it to your home screen</DialogTitle>
                  <DialogDescription className="text-[13px] text-muted-foreground">So it opens like a real app.</DialogDescription>
                </div>
              </div>
              <div className="space-y-3">
                <div className={`rounded-xl border p-3.5 ${isIOS ? "border-accent/40 bg-accent/5" : "border-border"}`}>
                  <p className="flex items-center gap-2 text-sm font-semibold"><Smartphone className="h-4 w-4 text-accent" /> On your iPhone (Safari)</p>
                  <p className="mt-1 inline-flex flex-wrap items-center gap-1 text-[13px] text-muted-foreground">
                    Tap <Share className="inline h-3.5 w-3.5" /> <span className="font-medium">Share</span>, then <span className="font-medium">&quot;Add to Home Screen.&quot;</span>
                  </p>
                </div>
                <div className={`rounded-xl border p-3.5 ${!isIOS ? "border-accent/40 bg-accent/5" : "border-border"}`}>
                  <p className="flex items-center gap-2 text-sm font-semibold"><Monitor className="h-4 w-4 text-accent" /> On desktop (Chrome / Edge)</p>
                  <p className="mt-1 inline-flex flex-wrap items-center gap-1 text-[13px] text-muted-foreground">
                    Click the <Plus className="inline h-3.5 w-3.5" /> <span className="font-medium">install icon</span> in the address bar.
                  </p>
                </div>
              </div>
              <p className="text-[12.5px] text-muted-foreground">
                No rush — you can find these steps anytime under <span className="font-medium text-foreground">Settings → Install the app</span>.
              </p>
            </div>
          )}

          {/* Footer: dots + nav */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-accent" : "w-1.5 bg-border"}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={back}><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
              )}
              {step < last ? (
                <>
                  <Button variant="ghost" size="sm" onClick={finish} className="text-muted-foreground">Skip</Button>
                  <Button size="sm" onClick={next}>Next <ArrowRight className="ml-1 h-4 w-4" /></Button>
                </>
              ) : (
                <Button size="sm" onClick={finish}><Check className="mr-1 h-4 w-4" /> Get started</Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
