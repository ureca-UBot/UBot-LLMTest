'use strict';
// Splits a Korean sentence blob (either the dataset's "필수 포함 사실" column
// or a model's generated "answer") into individual sentence-level fact units,
// so RAG-faithfulness NLI checks compare one claim at a time instead of one
// long paragraph. Deliberately conservative: only splits on a sentence-ending
// terminator (다./요./까?/다!/etc.) followed by whitespace or end-of-string,
// so it won't cut on things like "1.5GB" or "SYN-P01".

function splitFactUnits(text) {
  const s = (text || '').trim();
  if (!s) return [];
  const parts = s
    .split(/(?<=[가-힣])[.!?](?:\s+|$)/)
    .map((p) => p.trim())
    .filter(Boolean)
    // re-attach the terminator that the lookbehind split consumed, for
    // readability in logs/output (not required for the NLI call itself).
    .map((p) => (/[.!?]$/.test(p) ? p : p + '.'));
  return parts.length > 0 ? parts : [s];
}

module.exports = { splitFactUnits };
