'use strict';
// 부하 발생 방식 세 가지.
//
// 1) runClosedLoop — 동시 사용자 N명 고정
//    가상 사용자 N명이 각자 "질문 → 답 받기 → 바로 다음 질문"을 반복한다.
//    각 사용자의 첫 요청은 워밍업으로 보고 버린다. N명 모두 첫 요청을 끝낸 시점부터
//    측정 구간이 시작되고, (측정 시간 경과 AND 최소 요청 수 충족) 또는 최대 단계 시간에
//    도달하면 새 요청을 멈춘다. 이미 보낸 요청은 끝까지 기다린다.
//
// 2) runOpenLoop — 도착률 고정
//    서버가 느려져도 사용자는 계속 들어온다는 가정. 초당 rate건의 속도로(포아송 도착)
//    요청을 보내고, 앞 요청이 끝났는지와 상관없이 다음 요청을 보낸다.
//
// 3) runSpike — N건을 한순간에 보낸다.
//
// send(item)은 stream_client 결과(절대 throw하지 않음)를 돌려줘야 한다.

const { performance } = require('perf_hooks');
const { mulberry32 } = require('./prompt_pool');

const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

async function runClosedLoop({ users, cursor, send, measureMs, minRequests, maxStepMs, onRecord }) {
  const t0 = performance.now();
  const rel = () => performance.now() - t0;
  const records = [];
  let warmupEndRel = null;
  let windowEndRel = null;
  let firstDone = 0;
  let warmupFailed = false;
  let releaseWarmup;
  const warmupBarrier = new Promise((resolve) => { releaseWarmup = resolve; });
  let stop = false;
  let capped = false;
  let measuredDone = 0;

  const checkStop = () => {
    if (stop) return;
    const now = rel();
    if (now >= maxStepMs) {
      stop = true;
      capped = true;
      windowEndRel = now;
      releaseWarmup();
      return;
    }
    if (warmupEndRel !== null && now - warmupEndRel >= measureMs && measuredDone >= minRequests) {
      stop = true;
      windowEndRel = now;
    }
  };

  // 오래 걸리는 요청만 걸려 있어도 시간 조건을 확인할 수 있게 주기적으로 검사한다.
  const ticker = setInterval(checkStop, 250);

  async function worker(userIdx) {
    let first = true;
    while (!stop) {
      const item = cursor.next();
      const startRel = rel();
      const inWindow = !first && warmupEndRel !== null && startRel >= warmupEndRel;
      const res = await send(item);
      const rec = {
        ...res,
        case_id: item.caseId,
        case_type: item.type,
        input_chars: item.inputChars,
        user_idx: userIdx,
        warmup: first,
        in_window: inWindow,
        t_start_rel: startRel,
        t_end_rel: rel(),
      };
      records.push(rec);
      if (onRecord) onRecord(rec);
      if (inWindow) measuredDone += 1;
      if (first) {
        first = false;
        firstDone += 1;
        if (!res.ok) {
          warmupFailed = true;
          stop = true;
          windowEndRel = rel();
          releaseWarmup();
        }
        checkStop();
        if (firstDone === users && !warmupFailed && !stop) {
          warmupEndRel = rel();
          releaseWarmup();
        }
        // 빠른 사용자가 다른 사용자 워밍업 중 본 요청을 보내지 않게 한다.
        await warmupBarrier;
      }
      checkStop();
    }
  }

  await Promise.all(Array.from({ length: users }, (_, i) => worker(i)));
  clearInterval(ticker);
  if (windowEndRel === null) windowEndRel = rel();

  return {
    records,
    window: { startMs: warmupEndRel !== null ? warmupEndRel : 0, endMs: windowEndRel },
    warmupReached: warmupEndRel !== null,
    warmupFailed,
    warmupMs: records.filter((r) => r.warmup).reduce((n, r) => Math.max(n, r.t_end_rel), 0),
    warmupSummary: {
      n_requests: records.filter((r) => r.warmup).length,
      n_ok: records.filter((r) => r.warmup && r.ok).length,
      n_fail: records.filter((r) => r.warmup && !r.ok).length,
    },
    capped,
    elapsedMs: rel(),
  };
}

async function runOpenLoop({ rate, durationMs, cursor, send, seed, maxInFlight, onRecord }) {
  const rand = mulberry32(seed);
  const t0 = performance.now();
  const rel = () => performance.now() - t0;
  const records = [];
  const pending = new Set();
  let dropped = 0;
  let maxSeen = 0;

  // 포아송 도착: 간격 ~ 지수분포(평균 1/rate초). 절대 시각 기준으로 예약해 누적 오차를 막는다.
  let nextAt = 0;
  while (true) {
    nextAt += (-Math.log(1 - rand()) / rate) * 1000;
    if (nextAt >= durationMs) break;
    await sleep(nextAt - rel());
    if (pending.size >= maxInFlight) {
      dropped += 1;
      continue;
    }
    const item = cursor.next();
    const startRel = rel();
    const p = send(item).then((res) => {
      const rec = {
        ...res,
        case_id: item.caseId,
        case_type: item.type,
        input_chars: item.inputChars,
        warmup: false,
        in_window: true,
        t_start_rel: startRel,
        t_end_rel: rel(),
      };
      records.push(rec);
      if (onRecord) onRecord(rec);
      pending.delete(p);
    });
    pending.add(p);
    if (pending.size > maxSeen) maxSeen = pending.size;
  }
  // 다음 예약이 구간 밖에 있어도 관측 종료 시각까지 유지한다. 그렇지 않으면
  // 처리량의 분모(durationMs)보다 GPU 모니터 구간이 짧아져 평균을 비교할 수 없다.
  // 타이머 반올림으로 조금 일찍 깨어나는 경우도 종료 시각까지 다시 기다린다.
  while (rel() < durationMs) await sleep(durationMs - rel());
  await Promise.all([...pending]);

  // 처리량은 "보낸 요청을 다 처리할 때까지 걸린 시간" 기준으로 센다. 보내는 시간(durationMs)만으로
  // 나누면 끝에 걸린 요청이 빠져서, 느린 모델일수록 처리량이 0에 가깝게 잘못 나온다.
  return {
    records,
    window: { startMs: 0, endMs: Math.max(durationMs, rel()) },
    dropped,
    maxInFlight: maxSeen,
    drainMs: Math.max(0, rel() - durationMs),
    elapsedMs: rel(),
  };
}

async function runSpike({ users, cursor, send, onRecord }) {
  const t0 = performance.now();
  const rel = () => performance.now() - t0;
  const records = [];
  await Promise.all(
    Array.from({ length: users }, async (_, i) => {
      const item = cursor.next();
      const res = await send(item);
      const rec = {
        ...res,
        case_id: item.caseId,
        case_type: item.type,
        input_chars: item.inputChars,
        user_idx: i,
        warmup: false,
        in_window: true,
        t_start_rel: 0,
        t_end_rel: rel(),
      };
      records.push(rec);
      if (onRecord) onRecord(rec);
    }),
  );
  return { records, window: { startMs: 0, endMs: rel() }, elapsedMs: rel() };
}

module.exports = { runClosedLoop, runOpenLoop, runSpike, sleep };
