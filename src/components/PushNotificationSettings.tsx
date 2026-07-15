"use client";

import { useEffect, useState } from "react";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "checking" | "unsupported" | "enabled" | "disabled";

export default function PushNotificationSettings() {
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_PUBLIC_KEY) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? "enabled" : "disabled");
    });
  }, []);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notification permission was not granted.");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!) as BufferSource,
      });
      await fetch("/api/owner/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      setStatus("enabled");
    } catch {
      setError("Something went wrong enabling notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/owner/push-unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("disabled");
    } finally {
      setBusy(false);
    }
  }

  if (status === "unsupported") {
    return <p className="text-sm text-zinc-500">Not supported on this browser/device.</p>;
  }
  if (status === "checking") {
    return <p className="text-sm text-zinc-500">Checking...</p>;
  }

  return (
    <div>
      {status === "enabled" ? (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-green-700">Notifications are on for this device.</span>
          <button onClick={disable} disabled={busy} className={secondaryButtonClass}>
            {busy ? "..." : "Turn off"}
          </button>
        </div>
      ) : (
        <button onClick={enable} disabled={busy} className={primaryButtonClass}>
          {busy ? "Enabling..." : "Enable notifications on this device"}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
