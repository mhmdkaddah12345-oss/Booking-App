// Runs for code executing in the Edge runtime (middleware.ts). Loaded via
// instrumentation.ts's register(), not imported directly anywhere else.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});
