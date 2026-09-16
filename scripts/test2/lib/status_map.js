'use strict';
// Maps the dataset's Korean "기대 응답 상태" labels to the model's English
// status enum (see the system prompt in lib/prompts.js).

const KOREAN_TO_ENUM = {
  '답변': 'ANSWER',
  '부분 답변': 'PARTIAL',
  '확인 요청': 'CLARIFY',
  '답변 보류': 'ABSTAIN',
  '충돌 고지': 'CONFLICT',
  '범위 안내': 'OUT_OF_SCOPE',
};

function expectedStatusEnum(koreanLabel) {
  return KOREAN_TO_ENUM[koreanLabel] || null;
}

module.exports = { KOREAN_TO_ENUM, expectedStatusEnum };
