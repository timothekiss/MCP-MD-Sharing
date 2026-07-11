import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase-server";
import { CreateOrgForm } from "./create-org-form";

export default async function HomePage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from("memberships")
    .select("organization_id")
    .eq("user_id", user!.id)
    .limit(1);

  if (memberships && memberships.length > 0) {
    redirect("/projects");
  }

  return (
    <>
      <h1>Welcome</h1>
      <p className="muted">You&apos;re not part of an organization yet. Create one to get started.</p>
      <CreateOrgForm />
    </>
  );
}
