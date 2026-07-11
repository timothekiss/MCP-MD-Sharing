import { createHash } from "node:crypto";
import { getServiceClient } from "./supabase";

export interface AuthenticatedUser {
  userId: string;
  apiKeyId: string;
}

function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

// Verifies a personal API key (format: mcpmd_<random>) against the hash
// stored in api_keys, and returns the resolved user, or null if invalid/revoked.
export async function verifyApiKey(authHeader: string | null): Promise<AuthenticatedUser | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;

  const rawKey = authHeader.slice("Bearer ".length).trim();
  if (!rawKey.startsWith("mcpmd_")) return null;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, user_id, revoked_at")
    .eq("key_hash", hashKey(rawKey))
    .maybeSingle();

  if (error || !data || data.revoked_at) return null;

  return { userId: data.user_id, apiKeyId: data.id };
}
