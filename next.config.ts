import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// No SENTRY_AUTH_TOKEN configured (would need a Sentry account token to
// upload source maps at build time) — errors still get captured and
// reported without it, just with minified/less-readable stack traces.
export default withSentryConfig(nextConfig, {
  silent: true,
});
