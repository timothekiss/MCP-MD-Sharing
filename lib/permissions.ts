import { getServiceClient } from "./supabase";

export type ProjectRole = "reader" | "editor" | "admin";

// Mirrors the project_role_for / is_project_editor logic from the database's
// RLS policies, but evaluated explicitly for a resolved API key user since
// this server talks to Postgres with the service role (which bypasses RLS).
export async function getProjectRole(userId: string, projectId: string): Promise<ProjectRole | null> {
  const supabase = getServiceClient();

  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membership) return membership.role as ProjectRole;

  const { data: project } = await supabase
    .from("projects")
    .select("organization_id")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) return null;

  const { data: orgMembership } = await supabase
    .from("memberships")
    .select("role")
    .eq("organization_id", project.organization_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (orgMembership?.role === "owner" || orgMembership?.role === "admin") return "admin";
  return null;
}

export async function requireProjectAccess(
  userId: string,
  projectId: string,
  minRole: ProjectRole = "reader"
): Promise<ProjectRole> {
  const role = await getProjectRole(userId, projectId);
  if (!role) throw new Error("Not a member of this project");

  const rank: Record<ProjectRole, number> = { reader: 0, editor: 1, admin: 2 };
  if (rank[role] < rank[minRole]) {
    throw new Error(`Requires ${minRole} access, you have ${role}`);
  }
  return role;
}
