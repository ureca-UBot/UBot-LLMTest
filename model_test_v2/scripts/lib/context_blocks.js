'use strict';
// Splits the "제공 Context" cell into individual [ID] Q./A. blocks.
//
// Calibration finding (see README/CLAUDE notes): feeding the whole
// multi-FAQ "제공 Context" blob to the NLI classifier as one premise is
// unreliable (a correct grounded answer was misclassified as CONTRADICTION
// against a 3-FAQ concatenated context, 97% confidence). Splitting into one
// premise per source block and checking each separately fixed it (99.9%
// ENTAILMENT for the right block, clean NEUTRAL for the unrelated ones).
// Every RAG-faithfulness score in this pipeline MUST go through this
// decomposition rather than using the raw context string as premise.

const BLOCK_RE = /^\[([\w.\-]+)\]\s*Q\.\s*([\s\S]*?)\s*A\.\s*([\s\S]*)$/;

// Returns [] for EMPTY context, otherwise an array of { id, question, answer, raw }.
function splitContextBlocks(contextText) {
  const text = (contextText || '').trim();
  if (!text || text === 'EMPTY') return [];

  return text
    .split(/\n\s*\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((block) => {
      const m = block.match(BLOCK_RE);
      if (!m) return { id: null, question: null, answer: null, raw: block };
      return { id: m[1], question: m[2].trim(), answer: m[3].trim(), raw: block };
    });
}

// 버그 수정(2026-09-16 리뷰): CF(충돌) 유형에서 실제 충돌 쌍이 항상
// blocks[0]/[1]일 거라고 가정했었는데, Medium/Hard 난이도는 주의분산용
// 무관 FAQ가 섞여 블록이 5~10개까지 늘어나서 위치 가정이 깨짐(실측 확인:
// CF-0032는 컨텍스트 5블록 중 0번·3번이 진짜 충돌 쌍). `정답/관련 FAQ`
// 컬럼의 ID로 정확히 찾아야 함.
function findBlocksByIds(blocks, ids) {
  const idSet = new Set(ids);
  return blocks.filter((b) => idSet.has(b.id));
}

module.exports = { splitContextBlocks, findBlocksByIds };
