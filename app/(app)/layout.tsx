import Link from "next/link";
import { getServerClient } from "@/lib/supabase-server";
import { SignOutButton } from "./sign-out-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <nav className="nav">
        <Link href="/">MCP-MD-Sharing</Link>
        <Link href="/projects">Projects</Link>
        <Link href="/organization">Organization</Link>
        <Link href="/api-keys">API Keys</Link>
        <div className="spacer" />
        <span className="muted">{user?.email}</span>
        <SignOutButton />
      </nav>
      <div className="page">{children}</div>
    </>
  );
}
