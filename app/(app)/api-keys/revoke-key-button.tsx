"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase-browser";

export function RevokeApiKeyButton({ keyId }: { keyId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRevoke() {
    setLoading(true);
    await getBrowserClient().from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", keyId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button className="danger" onClick={handleRevoke} disabled={loading}>
      Revoke
    </button>
  );
}
