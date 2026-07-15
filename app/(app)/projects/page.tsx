import Link from "next/link";
import { getServerClient } from "@/lib/supabase-server";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/dictionary";
import { NewProjectForm } from "./new-project-form";

export default async function ProjectsPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = getLocale(user);

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, organization_id, organizations(name)")
    .order("name");

  const { data: adminMemberships } = await supabase
    .from("memberships")
    .select("organization_id, organizations(name)")
    .eq("user_id", user!.id)
    .in("role", ["owner", "admin"]);

  const adminOrgs = (adminMemberships ?? []).map((m) => ({
    id: m.organization_id,
    name: (m.organizations as unknown as { name: string } | null)?.name ?? "Organization",
  }));

  return (
    <>
      <h1>{t(locale, "projects.title")}</h1>
      {(projects ?? []).length === 0 && <p className="muted">{t(locale, "projects.none")}</p>}
      {(projects ?? []).map((p) => (
        <div className="list-item" key={p.id}>
          <div>
            <Link href={`/projects/${p.id}`}>{p.name}</Link>
            <div className="muted">{(p.organizations as unknown as { name: string } | null)?.name}</div>
          </div>
        </div>
      ))}

      {adminOrgs.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>{t(locale, "projects.new")}</h3>
          <NewProjectForm orgs={adminOrgs} />
        </div>
      )}
    </>
  );
}
