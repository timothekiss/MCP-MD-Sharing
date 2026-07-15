import { getServerClient } from "@/lib/supabase-server";
import { Sidebar } from "./sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="shell">
      <Sidebar userEmail={user?.email} />
      <div className="main">
        <div className="page">{children}</div>
      </div>
    </div>
  );
}
