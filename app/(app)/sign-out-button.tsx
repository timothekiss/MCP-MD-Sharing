"use client";

import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase-browser";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await getBrowserClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return <button onClick={handleSignOut}>Sign out</button>;
}
