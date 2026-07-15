import { getServiceClient } from "./supabase";
import { chunkMarkdown } from "./chunking";
import { embedTexts } from "./embeddings";

// Re-derives all search chunks for a document from its latest content.
// Called after every create/update/restore so search never serves stale text.
export async function reindexDocument(documentId: string, versionNumber: number, content: string) {
  const supabase = getServiceClient();
  const pieces = chunkMarkdown(content);

  // Compute the new chunks/embeddings before touching existing rows, so a
  // failed embedding call (e.g. OpenAI down) leaves the previous, still-valid
  // index in place instead of leaving the document unsearchable.
  const embeddings = pieces.length > 0 ? await embedTexts(pieces) : [];

  await supabase.from("chunks").delete().eq("document_id", documentId);
  if (pieces.length === 0) return;

  const rows = pieces.map((text, i) => ({
    document_id: documentId,
    version_number: versionNumber,
    chunk_index: i,
    content: text,
    embedding: embeddings[i],
  }));

  const { error } = await supabase.from("chunks").insert(rows);
  if (error) throw new Error(error.message);
}

// Indexing (chunking + embeddings) is a best-effort side effect of saving a
// document — a save must still succeed even if OpenAI is down or out of quota.
// Search results will just lag until the next successful reindex.
export async function reindexDocumentSafe(documentId: string, versionNumber: number, content: string) {
  try {
    await reindexDocument(documentId, versionNumber, content);
  } catch (err) {
    console.error(`Reindexing failed for document ${documentId} v${versionNumber}:`, err);
  }
}
