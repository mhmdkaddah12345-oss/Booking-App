// Next.js calls register() once per server runtime on boot — this is where
// server-side and edge-runtime error tracking gets wired up. Client-side
// setup is the separate instrumentation-client.ts file (Next.js convention,
// loaded automatically, no explicit import needed anywhere).
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Reports errors thrown inside Server Components / route handlers that
// Next.js catches internally and would otherwise never reach Sentry.
export const onRequestError = Sentry.captureRequestError;
