"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { savePushSubscription, deletePushSubscription } from "@/app/(app)/push-actions";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function PushToggle() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [standalone, setStandalone] = useState(true);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- browser capability + subscription state can only be read after mount */
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setStandalone(!!isStandalone);
    if (ok) {
      navigator.serviceWorker.ready
        .then(async (reg) => {
          const sub = await reg.pushManager.getSubscription();
          setSubscribed(!!sub);
        })
        .catch(() => {});
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  async function enable() {
    if (!VAPID_PUBLIC_KEY) {
      toast.error("Notifications aren't set up yet — check back soon.");
      return;
    }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.error("Notifications weren't allowed.");
        setBusy(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const json = sub.toJSON();
      if (!json.keys?.p256dh || !json.keys?.auth) {
        toast.error("Couldn't set up notifications on this device.");
        setBusy(false);
        return;
      }
      const r = await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        userAgent: navigator.userAgent,
      });
      if (r.ok) {
        setSubscribed(true);
        toast.success("Notifications on for this device 🔔");
      } else {
        toast.error("Couldn't save. Try again.");
      }
    } catch {
      toast.error("Couldn't enable notifications.");
    }
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast.success("Notifications off for this device.");
    } catch {
      toast.error("Couldn't turn off.");
    }
    setBusy(false);
  }

  if (supported === false) {
    return <p className="text-sm text-muted-foreground">This device or browser doesn&apos;t support push notifications.</p>;
  }

  return (
    <div className="space-y-3">
      {!standalone && (
        <p className="rounded-md bg-secondary/60 px-3 py-2 text-[13px] text-secondary-foreground">
          On iPhone, add the app to your home screen first (see &quot;Install the app&quot; below), then open it from your home screen to enable notifications.
        </p>
      )}
      {subscribed ? (
        <Button variant="outline" onClick={disable} disabled={busy}>
          <BellOff className="mr-1.5 h-4 w-4" /> Turn off on this device
        </Button>
      ) : (
        <Button onClick={enable} disabled={busy}>
          <Bell className="mr-1.5 h-4 w-4" /> Enable notifications
        </Button>
      )}
    </div>
  );
}
