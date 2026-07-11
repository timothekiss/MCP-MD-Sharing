import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function splitByH2(content) {
  const lines = content.split("\n");
  const sections = [];
  let current = [];
  for (const line of lines) {
    if (/^##\s/.test(line) && current.length > 0) {
      sections.push(current.join("\n"));
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) sections.push(current.join("\n"));
  return sections;
}

function splitByWordCount(text, maxWords) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return [text];
  const chunks = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(" "));
  }
  return chunks;
}

function chunkMarkdown(content, maxWords = 500) {
  const sections = splitByH2(content).filter((s) => s.trim().length > 0);
  const base = sections.length > 1 ? sections : [content];
  return base.flatMap((s) => splitByWordCount(s, maxWords)).filter((s) => s.trim().length > 0);
}

const { data: documents, error: docsError } = await supabase
  .from("documents")
  .select("id, path, current_version, project_id");
if (docsError) throw docsError;

for (const doc of documents) {
  const { data: version, error: versionError } = await supabase
    .from("versions")
    .select("content")
    .eq("document_id", doc.id)
    .eq("version_number", doc.current_version)
    .single();
  if (versionError) throw versionError;

  const pieces = chunkMarkdown(version.content);
  await supabase.from("chunks").delete().eq("document_id", doc.id);

  if (pieces.length === 0) {
    console.log(`skip (empty): ${doc.path}`);
    continue;
  }

  const { data: embedData, error: embedError } = await supabase.functions.invoke("embed", {
    body: { texts: pieces },
  });
  if (embedError) throw new Error(`${doc.path}: ${embedError.message}`);
  if (embedData.error) throw new Error(`${doc.path}: ${embedData.error}`);

  const rows = pieces.map((text, i) => ({
    document_id: doc.id,
    version_number: doc.current_version,
    chunk_index: i,
    content: text,
    embedding: embedData.embeddings[i],
  }));

  const { error: insertError } = await supabase.from("chunks").insert(rows);
  if (insertError) throw new Error(`${doc.path}: ${insertError.message}`);

  console.log(`indexed: ${doc.path} (${pieces.length} chunks)`);
}

console.log("Done.");
