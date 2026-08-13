"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Next.js's last-resort error boundary — only renders when something throws
// during root layout render itself (everyday page-level errors use each
// route's own error.tsx, or just get caught by React). Sentry's own
// captureRequestError (wired in instrumentation.ts) covers server-side
// errors; this covers the client-render equivalent.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          fontFamily: "system-ui, sans-serif",
          background: "#fbf3ec",
          color: "#3a2c24",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <p style={{ fontSize: "18px", fontWeight: 600 }}>Something went wrong.</p>
        <p style={{ fontSize: "14px", color: "#745e4f" }}>Please refresh the page or try again shortly.</p>
      </body>
    </html>
  );
}
