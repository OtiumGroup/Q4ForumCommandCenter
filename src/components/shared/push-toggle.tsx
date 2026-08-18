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

  const configured = !!VAPID_PUBLIC_KEY;

  async function enable() {
    if (!configured) {
      toast.error("Push isn't switched on yet — the admin needs to finish setup.");
      return;
    }
    const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
    if (isIOS && !standalone) {
      toast.error("On iPhone, open the app from your Home Screen first, then enable here.");
      return;
    }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm === "denied") {
        toast.error("Notifications are blocked for this app in your device settings.");
        setBusy(false);
        return;
      }
      if (perm !== "granted") {
        toast.error("Notifications weren't allowed.");
        setBusy(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;

      // Clear any stale subscription (e.g. from an earlier attempt or an old
      // key) so a fresh subscribe can't fail with "different applicationServerKey".
      try {
        const existing = await reg.pushManager.getSubscription();
        if (existing) await existing.unsubscribe();
      } catch {
        /* ignore */
      }

      let appKey: Uint8Array;
      try {
        appKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY!);
        if (appKey.length !== 65) throw new Error("bad length");
      } catch {
        toast.error("Notifications key looks misconfigured — the admin needs to re-check the VAPID public key in the app settings.");
        setBusy(false);
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appKey as BufferSource,
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
    } catch (e) {
      const msg = (e as { message?: string })?.message || "unknown error";
      toast.error("Couldn't enable notifications: " + msg);
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

  if (!configured) {
    return (
      <p className="rounded-md bg-secondary/60 px-3 py-2 text-[13px] text-secondary-foreground">
        Push notifications are being set up — check back shortly.
      </p>
    );
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
