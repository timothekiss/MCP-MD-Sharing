"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase-browser";

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function CreateApiKeyForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const rawKey = "mcpmd_" + randomHex(24);
    const keyHash = await sha256Hex(rawKey);
    const supabase = getBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("api_keys").insert({
      user_id: user!.id,
      name,
      key_prefix: rawKey.slice(0, 12),
      key_hash: keyHash,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    setCreatedKey(rawKey);
    setName("");
    router.refresh();
  }

  if (createdKey) {
    return (
      <div>
        <p>Copy this key now — it won&apos;t be shown again:</p>
        <pre className="card">{createdKey}</pre>
        <button onClick={() => setCreatedKey(null)}>Done</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name
        <br />
        <input required placeholder="My laptop" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        Create key
      </button>
    </form>
  );
}
