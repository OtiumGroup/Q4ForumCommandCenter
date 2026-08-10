"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, HelpCircle, X } from "lucide-react";
import { setMeetingRsvp } from "../actions";

const OPTIONS = [
  { value: "attending", label: "I'll be there", icon: Check },
  { value: "interested", label: "Maybe", icon: HelpCircle },
  { value: "not_attending", label: "Can't make it", icon: X },
] as const;

export function MeetingRsvp({ meetingId, myStatus }: { meetingId: string; myStatus: string | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((o) => {
        const active = myStatus === o.value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              const r = await setMeetingRsvp(meetingId, o.value);
              setSaving(false);
              if (r.ok) router.refresh();
              else toast.error(r.message ?? "Could not save your RSVP.");
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {o.label}
          </button>
        );
      })}
    </div>
  );
}
