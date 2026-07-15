import { getServerClient } from "@/lib/supabase-server";
import { getLocale } from "@/lib/i18n/get-locale";
import { t, type TranslationKey } from "@/lib/i18n/dictionary";
import { AddProjectMemberForm } from "./add-member-form";
import { RemoveProjectMemberButton } from "./remove-member-button";

export default async function ProjectMembersPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = getLocale(user);

  const { data: members, error } = await supabase.rpc("list_project_members", { p_project_id: projectId });

  return (
    <>
      <h1>{t(locale, "members.title")}</h1>
      {error && <p className="error">{error.message}</p>}
      {(members ?? []).map((m: { user_id: string; email: string; role: string }) => (
        <div className="list-item" key={m.user_id}>
          <div>
            {m.email}{" "}
            <span className={`badge badge-${m.role}`}>{t(locale, `role.${m.role}` as TranslationKey)}</span>
          </div>
          <RemoveProjectMemberButton projectId={projectId} userId={m.user_id} />
        </div>
      ))}

      <div className="card" style={{ marginTop: 24 }}>
        <h3>{t(locale, "members.add")}</h3>
        <p className="muted">{t(locale, "members.hint")}</p>
        <AddProjectMemberForm projectId={projectId} />
      </div>
    </>
  );
}
