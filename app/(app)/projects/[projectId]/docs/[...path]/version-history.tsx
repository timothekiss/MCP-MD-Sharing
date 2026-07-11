"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { restoreVersionAction } from "../../actions";
import { getBrowserClient } from "@/lib/supabase-browser";

interface HistoryEntry {
  version_number: number;
  message: string | null;
  created_at: string;
}

export function VersionHistory({
  projectId,
  path,
  currentVersion,
  history,
}: {
  projectId: string;
  path: string;
  currentVersion: number;
  history: HistoryEntry[];
}) {
  const router = useRouter();
  const [previewVersion, setPreviewVersion] = useState<number | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handlePreview(versionNumber: number) {
    if (previewVersion === versionNumber) {
      setPreviewVersion(null);
      return;
    }
    const supabase = getBrowserClient();
    const { data: doc } = await supabase
      .from("documents")
      .select("id")
      .eq("project_id", projectId)
      .eq("path", path)
      .single();
    const { data } = await supabase
      .from("versions")
      .select("content")
      .eq("document_id", doc!.id)
      .eq("version_number", versionNumber)
      .single();
    setPreviewContent(data?.content ?? "");
    setPreviewVersion(versionNumber);
  }

  async function handleRestore(versionNumber: number) {
    setBusy(true);
    setError(null);
    try {
      await restoreVersionAction(projectId, path, versionNumber, currentVersion);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error && <p className="error">{error}</p>}
      {history.map((h) => (
        <div key={h.version_number}>
          <div className="list-item">
            <div>
              <strong>v{h.version_number}</strong>
              {h.version_number === currentVersion && <span className="badge" style={{ marginLeft: 8 }}>current</span>}
              <div className="muted">
                {h.message ?? "—"} · {new Date(h.created_at).toLocaleString()}
              </div>
            </div>
            <div className="row">
              <button onClick={() => handlePreview(h.version_number)}>
                {previewVersion === h.version_number ? "Hide" : "View"}
              </button>
              {h.version_number !== currentVersion && (
                <button onClick={() => handleRestore(h.version_number)} disabled={busy}>
                  Restore
                </button>
              )}
            </div>
          </div>
          {previewVersion === h.version_number && <pre className="card">{previewContent}</pre>}
        </div>
      ))}
    </div>
  );
}
