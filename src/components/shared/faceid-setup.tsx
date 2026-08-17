"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ScanFace, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Passkey = { id: string; friendly_name?: string; created_at: string; last_used_at?: string };

// Narrow types for the experimental passkey API (avoids `any`).
type PasskeyAuth = {
  registerPasskey: () => Promise<{ data: Passkey | null; error: { message: string } | null }>;
  passkey: {
    list: () => Promise<{ data: Passkey[] | null; error: { message: string } | null }>;
    delete: (args: { passkeyId: string }) => Promise<{ error: { message: string } | null }>;
  };
};

export function FaceIdSetup() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  function auth(): PasskeyAuth {
    return createClient().auth as unknown as PasskeyAuth;
  }

  async function refresh() {
    try {
      const { data } = await auth().passkey.list();
      setPasskeys(data ?? []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- WebAuthn support + passkey list only readable after mount */
    const ok = typeof window !== "undefined" && !!window.PublicKeyCredential;
    setSupported(ok);
    if (ok) void refresh();
    else setLoading(false);
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enroll() {
    setBusy(true);
    try {
      const { error } = await auth().registerPasskey();
      if (error) toast.error(error.message || "Couldn't set up Face ID.");
      else {
        toast.success("Face ID is set up on this device 🔐");
        await refresh();
      }
    } catch {
      toast.error("Couldn't set up Face ID.");
    }
    setBusy(false);
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await auth().passkey.delete({ passkeyId: id });
      toast.success("Removed.");
      await refresh();
    } catch {
      toast.error("Couldn't remove that passkey.");
    }
    setBusy(false);
  }

  if (supported === false) {
    return <p className="text-sm text-muted-foreground">This device doesn&apos;t support Face ID / passkeys.</p>;
  }

  return (
    <div className="space-y-3">
      {passkeys.length > 0 && (
        <ul className="space-y-2">
          {passkeys.map((pk) => (
            <li key={pk.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <span className="text-foreground">
                {pk.friendly_name || "Passkey"}
                <span className="text-muted-foreground"> · added {new Date(pk.created_at).toLocaleDateString()}</span>
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(pk.id)} disabled={busy} aria-label="Remove passkey">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button onClick={enroll} disabled={busy || loading}>
        <ScanFace className="mr-1.5 h-4 w-4" />
        {passkeys.length > 0 ? "Add this device too" : "Set up Face ID on this device"}
      </Button>
      <p className="text-[13px] text-muted-foreground">
        After setup, you&apos;ll see a &quot;Sign in with Face ID&quot; button on the login screen — no email code needed.
      </p>
    </div>
  );
}
