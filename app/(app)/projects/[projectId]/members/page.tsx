import { getServerClient } from "@/lib/supabase-server";
import { AddProjectMemberForm } from "./add-member-form";
import { RemoveProjectMemberButton } from "./remove-member-button";

export default async function ProjectMembersPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await getServerClient();

  const { data: members, error } = await supabase.rpc("list_project_members", { p_project_id: projectId });

  return (
    <>
      <h1>Project members</h1>
      {error && <p className="error">{error.message}</p>}
      {(members ?? []).map((m: { user_id: string; email: string; role: string }) => (
        <div className="list-item" key={m.user_id}>
          <div>
            {m.email} <span className={`badge badge-${m.role}`}>{m.role}</span>
          </div>
          <RemoveProjectMemberButton projectId={projectId} userId={m.user_id} />
        </div>
      ))}

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Add member</h3>
        <p className="muted">The person must already be a member of the organization.</p>
        <AddProjectMemberForm projectId={projectId} />
      </div>
    </>
  );
}
