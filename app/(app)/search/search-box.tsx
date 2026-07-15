"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { searchAction } from "./actions";
import { useLocale } from "../locale-context";

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
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runSearch(nextProjectId: string) {
    if (!query) return;
    setLoading(true);
    setError(null);

    try {
      const data = await searchAction(query, nextProjectId || undefined);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runSearch(projectId);
  }

  function handleProjectChange(nextProjectId: string) {
    setProjectId(nextProjectId);
    // Re-run immediately if there's already a query, instead of waiting for another click.
    if (results) runSearch(nextProjectId);
  }

  // Flat list, sorted by project name then file path (both alphabetical) — no section grouping.
  const sortedResults = useMemo(() => {
    if (!results) return [];
    return [...results].sort(
      (a, b) =>
        a.project_name.localeCompare(b.project_name) ||
        a.path.localeCompare(b.path) ||
        a.chunk_index - b.chunk_index
    );
  }, [results]);

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <input
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1 }}
            autoFocus
          />
          <select value={projectId} onChange={(e) => handleProjectChange(e.target.value)}>
            <option value="">{t("search.allProjects")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={loading || !query}>
            {loading ? t("search.searching") : t("search.search")}
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {results && results.length === 0 && <p className="muted">{t("search.noResults")}</p>}

      {sortedResults.map((r) => (
        <div className="card" key={`${r.document_id}-${r.chunk_index}`}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <Link href={`/projects/${r.project_id}/docs/${r.path}`}>{r.path}</Link>
            <span className="badge">{r.project_name}</span>
          </div>
          <p className="muted" style={{ whiteSpace: "pre-wrap" }}>
            {r.content}
          </p>
        </div>
      ))}
    </>
  );
}
