"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase-browser";

export function RemoveProjectMemberButton({ projectId, userId }: { projectId: string; userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    setLoading(true);
    await getBrowserClient().rpc("remove_project_member", { p_project_id: projectId, p_user_id: userId });
    setLoading(false);
    router.refresh();
  }

  return (
    <button className="danger" onClick={handleRemove} disabled={loading}>
      Remove
    </button>
  );
}
