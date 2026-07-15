"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase-browser";
import { useLocale } from "../locale-context";

export function RemoveOrgMemberButton({ orgId, userId }: { orgId: string; userId: string }) {
  const router = useRouter();
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    setLoading(true);
    await getBrowserClient().rpc("remove_org_member", { p_org_id: orgId, p_user_id: userId });
    setLoading(false);
    router.refresh();
  }

  return (
    <button className="danger" onClick={handleRemove} disabled={loading}>
      {t("org.remove")}
    </button>
  );
}
