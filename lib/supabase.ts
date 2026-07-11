import { createClient } from "@supabase/supabase-js";

// The MCP server authenticates callers with its own API keys (see lib/auth.ts),
// not Supabase Auth sessions, so it talks to Postgres with the service role key
// and enforces project access itself (see lib/permissions.ts) instead of relying on RLS.
export function getServiceClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
