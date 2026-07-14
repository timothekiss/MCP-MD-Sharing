import Link from "next/link";
import { getServerClient } from "@/lib/supabase-server";
import { NewDocumentForm } from "./new-document-form";
import { UploadMdForm } from "./upload-md-form";

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await getServerClient();

  const { data: project } = await supabase.from("projects").select("id, name").eq("id", projectId).single();
  const { data: documents } = await supabase
    .from("documents")
    .select("id, path, current_version, created_at")
    .eq("project_id", projectId)
    .order("path");

  return (
    <>
      <h1>{project?.name ?? "Project"}</h1>
      <p>
        <Link href={`/projects/${projectId}/members`}>Manage members</Link>
      </p>

      {(documents ?? []).length === 0 && <p className="muted">No documents yet.</p>}
      {(documents ?? []).map((d) => (
        <div className="list-item" key={d.id}>
          <Link href={`/projects/${projectId}/docs/${d.path}`}>{d.path}</Link>
          <span className="badge">v{d.current_version}</span>
        </div>
      ))}

      <div style={{ marginTop: 24 }}>
        <h3>Add MD</h3>
        <UploadMdForm projectId={projectId} />
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>New document</h3>
        <NewDocumentForm projectId={projectId} />
      </div>
    </>
  );
}
