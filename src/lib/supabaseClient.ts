import { createClient } from "@supabase/supabase-js";

// Server-only client using the secret key — never import this from a
// client component. All Supabase access in this app goes through
// server-side API routes, so RLS policies aren't needed.
export const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
