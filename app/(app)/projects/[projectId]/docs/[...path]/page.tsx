import { notFound } from "next/navigation";
import { getServerClient } from "@/lib/supabase-server";
import { DocumentEditor } from "./document-editor";
import { VersionHistory } from "./version-history";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ projectId: string; path: string[] }>;
}) {
  const { projectId, path: pathParts } = await params;
  const path = pathParts.join("/");

  const supabase = await getServerClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("id, current_version")
    .eq("project_id", projectId)
    .eq("path", path)
    .maybeSingle();

  if (!doc) notFound();

  const { data: version } = await supabase
    .from("versions")
    .select("content, version_number, message, created_at")
    .eq("document_id", doc.id)
    .eq("version_number", doc.current_version)
    .single();

  const { data: history } = await supabase
    .from("versions")
    .select("version_number, message, created_at")
    .eq("document_id", doc.id)
    .order("version_number", { ascending: false });

  return (
    <>
      <h1>{path}</h1>
      <p className="muted">
        Current version: {version?.version_number} · {new Date(version?.created_at ?? "").toLocaleString()}
      </p>

      <DocumentEditor
        projectId={projectId}
        path={path}
        content={version?.content ?? ""}
        currentVersion={doc.current_version}
      />

      <h2 style={{ marginTop: 32 }}>History</h2>
      <VersionHistory
        projectId={projectId}
        path={path}
        currentVersion={doc.current_version}
        history={history ?? []}
      />
    </>
  );
}
