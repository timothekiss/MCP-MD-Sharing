"use server";

import { getServerClient } from "@/lib/supabase-server";
import { search } from "@/lib/search";

// Reuses the exact same permission-scoped search the MCP server's `search`
// tool uses (lib/search.ts) — it resolves the caller's real accessible
// projects itself, so results can never include anything the signed-in
// user isn't a member of.
export async function searchAction(query: string) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const results = await search(user.id, query, undefined, 20);

  const projectIds = [...new Set(results.map((r) => r.project_id))];
  const { data: projects } = await supabase.from("projects").select("id, name").in("id", projectIds);
  const projectNames = new Map((projects ?? []).map((p) => [p.id, p.name]));

  return results.map((r) => ({ ...r, project_name: projectNames.get(r.project_id) ?? "Unknown project" }));
}
