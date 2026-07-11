import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-only client using the secret key — never import this from a
// client component. All Supabase access in this app goes through
// server-side API routes, so RLS policies aren't needed.
//
// Built lazily (only on first real use) instead of at module load time,
// so Next.js's build-time page analysis doesn't need real env vars just to
// import this file — it only needs them once a request actually comes in.
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  }
  return client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
