import { getServiceClient } from "./supabase";
import { embedTexts } from "./embeddings";
import { listProjectsForUser } from "./documents";
import { requireProjectAccess } from "./permissions";

export interface SearchResult {
  document_id: string;
  project_id: string;
  path: string;
  chunk_index: number;
  content: string;
  score: number;
}

// Hybrid (vector + full-text) search, scoped to whichever projects the user
// can actually access — either one specific project (access-checked) or
// every project they belong to.
export async function search(
  userId: string,
  query: string,
  projectId?: string,
  limit = 10
): Promise<SearchResult[]> {
  let projectIds: string[];

  if (projectId) {
    await requireProjectAccess(userId, projectId, "reader");
    projectIds = [projectId];
  } else {
    const projects = await listProjectsForUser(userId);
    projectIds = projects.map((p) => p.id);
  }

  if (projectIds.length === 0) return [];

  const [embedding] = await embedTexts([query]);

  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("search_chunks", {
    p_project_ids: projectIds,
    p_query: query,
    p_query_embedding: embedding,
    p_match_count: limit,
  });

  if (error) throw new Error(error.message);
  return data as SearchResult[];
}
