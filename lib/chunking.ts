// Splits markdown into ~500-word chunks along ## section boundaries, so each
// chunk stays topically coherent for embedding. Falls back to plain word-count
// splitting for files with no ## headers, or sections that are still too long.

function splitByH2(content: string): string[] {
  const lines = content.split("\n");
  const sections: string[] = [];
  let current: string[] = [];

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

function splitByWordCount(text: string, maxWords: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return [text];

  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(" "));
  }
  return chunks;
}

export function chunkMarkdown(content: string, maxWords = 500): string[] {
  const sections = splitByH2(content).filter((s) => s.trim().length > 0);
  const base = sections.length > 1 ? sections : [content];
  return base.flatMap((s) => splitByWordCount(s, maxWords)).filter((s) => s.trim().length > 0);
}
