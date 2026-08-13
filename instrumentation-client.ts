// Runs in the browser on every page load — Next.js convention (this exact
// filename at the project root), no import needed anywhere else.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  // A DSN identifies which Sentry project errors go to — it's meant to be
  // public (same idea as a Google Analytics tracking ID), which is why it's
  // safe to embed in the client bundle via NEXT_PUBLIC_.
});

// Lets Sentry track client-side route transitions (App Router navigations)
// as part of its performance tracing — required export, not optional.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
