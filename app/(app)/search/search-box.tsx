"use client";

import { useState } from "react";
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

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await searchAction(query);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="What are you looking for?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1 }}
          autoFocus
        />
        <button type="submit" disabled={loading || !query}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {results && results.length === 0 && <p className="muted">No results.</p>}

      {results?.map((r) => (
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
