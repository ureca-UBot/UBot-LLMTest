# input_format_test — 조회 결과 입력 형식 비교

test_set4r는 AR·UI·CF 조회 결과를 JSON에서 "라벨 = 값" 줄 목록으로 바꿨다(`scripts/lib/user_info_text.js`). 이때 세 가지가 함께 바뀌었다.
- 값을 풀어 썼다: `is_open:false` → "영업 중 아님", `freshness:stale` → "오래된 정보(현재 상태로 확정할 수 없음)".
- 키를 한글 라벨로 바꿨다.
- 매장 목록을 매장마다 묶지 않고 속성마다 한 줄로 펼쳤다.

pv5-try2 분석([failure_analysis](../prompts_test_v5/try2/results/summary/failure_analysis.md) 4-2절)에서는 같은 v4_base인데도 일부 AR 템플릿이 크게 떨어졌다. "영업 중이고 유심 재발급도 되는 곳"은 6/6 → 0/6이었다. 이 하락이 형식 탓인지 가르기 위해, 문항·프롬프트·모델·PC를 고정하고 **조회 결과 형식만** 바꿔 비교한다. 조회할 테이블은 계속 늘어나므로, 값 조정은 백엔드가 하고 여기서는 형식에 따른 모델 성능만 본다.

## 1. 조건

- 모델 `qwen3:4b-instruct` Q4_K_M(digest `0edcdef34593`), temperature 0, 이 PC(Ollama 0.40.2).
- 프롬프트 `v4_base`, 출력 스키마는 prompts_test_v5와 같다.
- 항목 AR · UI, 항목당 100건 = 형식당 200건.
- 문항·정답·FAQ는 test_set4r와 같다(`build_test_set4r.js`의 1~4번 수정 그대로). 5번(조회 결과 변환)만 다르다.
- 넘기는 정보는 세 형식 모두 같다. 인증 실패 응답의 개인 값과 실패한 조회의 정보 시점·기준 시각을 뺀다. 1번(옛 JSON)은 `fixture` 표시도 원래대로 남는다.

## 2. 형식

| | 데이터셋 | try | 예 (AR-0061의 매장 하나) |
|---|---|---|---|
| 1. 옛 JSON | `test_set4r_json` | `json` | `{"name":"가상 새봄1점","distance_m":500,"is_open":true,"services":["요금제 변경"],"parking":false}` |
| 2. 지금 형식(속성마다 한 줄) | `test_set4r` | prompts_test_v5 `try2` v4_base 재사용 | `가상 새봄1점 거리 = 500m` / `가상 새봄1점 현재 영업 여부 = 영업 중` / … |
| 3. JSON 구조 + 값만 풀어 씀 | `test_set4r_jsonr` | `jsonr` | `{"name":"가상 새봄1점","distance_m":"500m","is_open":"영업 중","services":"요금제 변경","parking":"불가"}` |

- 3번은 키(영어)와 구조가 1번과 같다. 값 문자열은 2번과 같다.
- 매장 검색이 성공하면 2번은 "현재 위치 확인 = 됨"을 넣는다. 3번도 같은 정보를 `location_confirmed`로 넣는다.

데이터셋 만들기:

```powershell
node scripts/run/build_test_set4r.js --user-info-format json
node scripts/run/build_test_set4r.js --user-info-format json-readable
node scripts/run/build_test_set4r.js --check   # 기존 test_set4r가 바뀌지 않았는지
```

## 3. 실행 순서

```powershell
# 1. 생성 → 결정론 채점 (형식당 200건)
node scripts/run/run_item.js qwen3:4b-instruct 'AR,UI' --size 100 --test input_format_test --try json
node scripts/run/run_item.js qwen3:4b-instruct 'AR,UI' --size 100 --test input_format_test --try jsonr

# 2. 판정 — 아래 4절
```

## 4. 판정

- **먼저 Judge 없이 본다.** 형식 2의 v4_base Judge 결과(pv5-try2)가 있으므로, 형식 1·3의 답변을 템플릿별로 형식 2와 나란히 읽는다. 매장 선택 템플릿은 고른 매장·거리로 맞고 틀림을 바로 가릴 수 있다.
- 차이가 보이는 경우에만 형식 1·3을 Judge한다(최대 400건). 배치는 try마다 따로 만든다.

## 5. 알려진 한계

- 형식 2는 하루 전(2026-10-12)에 생성한 run이다. 같은 PC·같은 Ollama·같은 모델이고 temperature 0이라 재현성은 높지만, 같은 시점 생성은 아니다.
- 항목당 100건이고 템플릿당 2~8건이다. 템플릿 하나의 차이로 결론 내지 않는다.
- 백엔드는 지금 조회 결과를 텍스트로 넘긴다(매장: `[매장 ID] 이름 | 주소 | 전화 | 영업시간 | 거리`, 사용자 정보: `이름: …`). 세 형식 중 어느 것과도 같지 않다. 이 비교 결과로 백엔드 입력 형식을 정한다.
