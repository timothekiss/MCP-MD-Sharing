"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDocumentAction } from "./actions";

export function NewDocumentForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [path, setPath] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createDocumentAction(projectId, path, content);
      router.push(`/projects/${projectId}/docs/${path}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Path
        <br />
        <input required placeholder="notes/example.md" value={path} onChange={(e) => setPath(e.target.value)} />
      </label>
      <label>
        Content
        <br />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        Create document
      </button>
    </form>
  );
}
