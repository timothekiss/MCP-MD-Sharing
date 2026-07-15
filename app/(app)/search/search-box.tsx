"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { searchAction } from "./actions";

interface Result {
  document_id: string;
  project_id: string;
  project_name: string;
  path: string;
  chunk_index: number;
  content: string;
  score: number;
}

interface Project {
  id: string;
  name: string;
}

export function SearchBox({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await searchAction(query, projectId || undefined);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  // Group by project (alphabetical), then order files within each project alphabetically by path.
  const groups = useMemo(() => {
    if (!results) return [];
    const byProject = new Map<string, Result[]>();
    for (const r of results) {
      const key = r.project_name;
      if (!byProject.has(key)) byProject.set(key, []);
      byProject.get(key)!.push(r);
    }
    for (const items of byProject.values()) {
      items.sort((a, b) => a.path.localeCompare(b.path) || a.chunk_index - b.chunk_index);
    }
    return Array.from(byProject.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [results]);

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <input
            placeholder="What are you looking for?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1 }}
            autoFocus
          />
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={loading || !query}>
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {results && results.length === 0 && <p className="muted">No results.</p>}

      {groups.map(([projectName, items]) => (
        <div key={projectName} style={{ marginTop: 20 }}>
          <h3>{projectName}</h3>
          {items.map((r) => (
            <div className="card" key={`${r.document_id}-${r.chunk_index}`}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <Link href={`/projects/${r.project_id}/docs/${r.path}`}>{r.path}</Link>
              </div>
              <p className="muted" style={{ whiteSpace: "pre-wrap" }}>
                {r.content}
              </p>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
