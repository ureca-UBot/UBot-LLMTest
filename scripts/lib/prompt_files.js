'use strict';
// 프롬프트 파일 로더. 모든 프롬프트는 저장소 루트 prompts/ 아래 용도별 폴더에 텍스트로 둔다.
//
//   prompts/chatbot/   후보 LLM(상담봇) 시스템 프롬프트 — variants.json이 조합을 정한다
//   prompts/judge/     LLM Judge 루브릭(판정 단계 전용)
//   prompts/docgen/    결과 문서 생성·정리용(LLM을 쓰게 되면) — 판정 루브릭과 섞지 않는다
//
// 파일 규칙
//   - 맨 앞의 <!-- ... --> 블록은 사람이 읽는 설명이며 모델에 보내지 않는다(제거).
//   - {{include <파일>}} 줄은 같은 폴더의 다른 파일 내용으로 바꾼다(그 파일의 설명 블록도 제거).
//   - 끝의 줄바꿈은 떼고, 나머지 공백·줄바꿈은 그대로 보낸다.

const fs = require('fs');
const path = require('path');

const PROMPTS_ROOT = path.join(__dirname, '..', '..', 'prompts');
const LEADING_COMMENT = /^﻿?\s*<!--[\s\S]*?-->\r?\n?/;
const INCLUDE = /\{\{include ([^}\s]+)\}\}/g;

function readPromptFile(relPath, seen = new Set()) {
  const full = path.join(PROMPTS_ROOT, relPath);
  if (seen.has(full)) throw new Error(`프롬프트 include가 순환합니다: ${relPath}`);
  seen.add(full);
  if (!fs.existsSync(full)) throw new Error(`프롬프트 파일이 없습니다: prompts/${relPath}`);
  const text = fs.readFileSync(full, 'utf8').replace(/\r\n/g, '\n').replace(LEADING_COMMENT, '').replace(/\n+$/, '');
  const dir = path.dirname(relPath);
  return text.replace(INCLUDE, (_, name) => readPromptFile(path.join(dir, name), new Set(seen)));
}

module.exports = { PROMPTS_ROOT, readPromptFile };
