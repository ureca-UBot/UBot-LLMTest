'use strict';
// "제공 Context"를 문서 블록 단위로 나눈다. 전체 Context를 NLI premise 하나로
// 넣으면 여러 FAQ가 섞여 오판이 커서(test2 calibration), 근거 판정은 반드시 블록
// 단위로 한다.
//
// 블록 형식은 빈 줄로 구분된 두 가지를 받는다.
//   [FAQ-018] 질문 문장\n답변 문장...          (test_set3~)
//   [FAQ-018] Q. 질문 A. 답변                  (test_set2)
// 첫 줄의 [ID]만 식별자로 쓰고 나머지는 원문 그대로 raw에 둔다. CF 시험 문서의
// 우선순위·시행일 줄도 raw에 포함된다.

const HEAD_RE = /^\[([^\]\s]+)\]\s*/;

// Returns [] for empty context, otherwise [{ id, raw }].
function splitContextBlocks(contextText) {
  const text = (contextText || '').trim();
  if (!text || text === 'EMPTY') return [];
  return text
    .split(/\n\s*\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((block) => {
      const m = block.match(HEAD_RE);
      return { id: m ? m[1] : null, raw: block };
    });
}

function findBlocksByIds(blocks, ids) {
  const idSet = new Set(ids);
  return blocks.filter((b) => idSet.has(b.id));
}

module.exports = { splitContextBlocks, findBlocksByIds };
