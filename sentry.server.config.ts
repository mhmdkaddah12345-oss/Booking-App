// Runs once when a Node.js server instance boots (API routes, Server
// Components). Loaded via instrumentation.ts's register(), not imported
// directly anywhere else.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  // Silent no-op when SENTRY_DSN isn't set (e.g. local dev without it
  // configured) — Sentry's SDK already treats an empty dsn as "disabled",
  // no extra guard needed here.
});
