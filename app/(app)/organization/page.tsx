import { getServerClient } from "@/lib/supabase-server";
import { getLocale } from "@/lib/i18n/get-locale";
import { t, type TranslationKey } from "@/lib/i18n/dictionary";
import { AddOrgMemberForm } from "./add-member-form";
import { RemoveOrgMemberButton } from "./remove-member-button";
import { CreateOrgForm } from "../create-org-form";

export default async function OrganizationPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = getLocale(user);

  const { data: memberships } = await supabase
    .from("memberships")
    .select("organization_id, role, organizations(name)")
    .eq("user_id", user!.id);

  const canCreateOrg = (memberships ?? []).some((m) => m.role === "owner" || m.role === "admin");

  return (
    <>
      <h1>{t(locale, "org.title")}</h1>
      {(memberships ?? []).map((m) => (
        <OrgSection
          key={m.organization_id}
          orgId={m.organization_id}
          orgName={(m.organizations as unknown as { name: string } | null)?.name ?? "Organization"}
        />
      ))}

      {canCreateOrg && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>{t(locale, "org.newOrganization")}</h3>
          <CreateOrgForm redirectTo="/organization" />
        </div>
      )}
    </>
  );
}

async function OrgSection({ orgId, orgName }: { orgId: string; orgName: string }) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = getLocale(user);
  const { data: members, error } = await supabase.rpc("list_org_members", { p_org_id: orgId });

  return (
    <div className="card">
      <h2>{orgName}</h2>
      {error && <p className="error">{error.message}</p>}
      {(members ?? []).map((m: { user_id: string; email: string; role: string }) => (
        <div className="list-item" key={m.user_id}>
          <div>
            {m.email}{" "}
            <span className={`badge badge-${m.role}`}>{t(locale, `role.${m.role}` as TranslationKey)}</span>
          </div>
          <RemoveOrgMemberButton orgId={orgId} userId={m.user_id} />
        </div>
      ))}
      <div style={{ marginTop: 16 }}>
        <AddOrgMemberForm orgId={orgId} />
      </div>
    </div>
  );
}
