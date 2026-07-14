"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIosSafari() {
  const ua = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return isIos && !isStandalone;
}

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [iosEligible, setIosEligible] = useState(false);

  useEffect(() => {
    setIosEligible(isIosSafari());

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferredPrompt(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (deferredPrompt) {
    return (
      <button
        onClick={async () => {
          await deferredPrompt.prompt();
          await deferredPrompt.userChoice;
          setDeferredPrompt(null);
        }}
        className="rounded-full px-4 py-1.5 text-sm font-medium text-zinc-600 ring-1 ring-zinc-300 transition-colors hover:bg-zinc-100"
      >
        Install app
      </button>
    );
  }

  if (iosEligible) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowIosHelp((v) => !v)}
          className="rounded-full px-4 py-1.5 text-sm font-medium text-zinc-600 ring-1 ring-zinc-300 transition-colors hover:bg-zinc-100"
        >
          Install app
        </button>
        {showIosHelp && (
          <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl bg-white p-4 text-left text-sm text-zinc-600 shadow-lg ring-1 ring-zinc-200">
            <p className="font-medium text-zinc-800">To install Maw3ed:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>
                Tap the <span className="font-medium">Share</span> icon in Safari
              </li>
              <li>
                Scroll down and tap <span className="font-medium">Add to Home Screen</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIosHelp(false)}
              className="mt-3 text-xs font-medium text-zinc-400 hover:text-zinc-600"
            >
              Close
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
