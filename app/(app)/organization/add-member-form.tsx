"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase-browser";

export function AddOrgMemberForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await getBrowserClient().rpc("add_org_member", {
      p_org_id: orgId,
      p_email: email,
      p_role: role,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Email
        <br />
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Role
        <br />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        Add member
      </button>
    </form>
  );
}
