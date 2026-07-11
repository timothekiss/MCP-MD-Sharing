import { getServiceClient } from "./supabase";
import { chunkMarkdown } from "./chunking";
import { embedTexts } from "./embeddings";

// Re-derives all search chunks for a document from its latest content.
// Called after every create/update/restore so search never serves stale text.
export async function reindexDocument(documentId: string, versionNumber: number, content: string) {
  const supabase = getServiceClient();

  await supabase.from("chunks").delete().eq("document_id", documentId);

  const pieces = chunkMarkdown(content);
  if (pieces.length === 0) return;

  const embeddings = await embedTexts(pieces);

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
