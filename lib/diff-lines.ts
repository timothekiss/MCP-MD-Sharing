import { diffLines } from "diff";

export interface DiffRow {
  left: string | null;
  right: string | null;
  kind: "same" | "removed" | "added" | "modified";
}

function splitLines(text: string): string[] {
  const lines = text.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}

// Aligns two texts line-by-line for a side-by-side view. A removed block
// immediately followed by an added block of similar size is treated as
// "modified" (paired old/new lines), rather than a separate delete + insert.
export function computeSideBySideDiff(oldText: string, newText: string): DiffRow[] {
  const parts = diffLines(oldText, newText);
  const rows: DiffRow[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (!part.added && !part.removed) {
      for (const line of splitLines(part.value)) rows.push({ left: line, right: line, kind: "same" });
      continue;
    }

    if (part.removed) {
      const removedLines = splitLines(part.value);
      const next = parts[i + 1];

      if (next?.added) {
        const addedLines = splitLines(next.value);
        const max = Math.max(removedLines.length, addedLines.length);
        for (let j = 0; j < max; j++) {
          rows.push({
            left: j < removedLines.length ? removedLines[j] : null,
            right: j < addedLines.length ? addedLines[j] : null,
            kind: "modified",
          });
        }
        i++; // the paired added part has been consumed
      } else {
        for (const line of removedLines) rows.push({ left: line, right: null, kind: "removed" });
      }
      continue;
    }

    // An added part with no preceding removed part to pair with
    for (const line of splitLines(part.value)) rows.push({ left: null, right: line, kind: "added" });
  }

  return rows;
}
