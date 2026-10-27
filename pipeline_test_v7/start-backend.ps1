param([Parameter(Mandatory = $true)][ValidateSet('always', 'on-broken')][string]$Mode)
$ErrorActionPreference = 'Stop'
# pipeline_test_v6과 같은 소스(feat277-eval-20261023)를 복사한 schema-final-eval-20261023 사본을 쓴다.
# 바뀐 곳은 OllamaClient 한 파일(도구 경로 최종 답변 스키마 강제, LLM_FINAL_SCHEMA_MODE)뿐이다.
# DB는 v6 DB(ubot_feat277_eval_lines_20261023)를 모드별로 복제했다. Redis는 모드별로 비어 있는 DB를 쓴다.
$evalWorkspace = 'C:/Ureka/ureca_project2/LLM_Test'
$runtime = "$evalWorkspace/pipeline_test_v7/try1/results/runtime/$Mode"
New-Item -ItemType Directory -Force $runtime | Out-Null
$db = if ($Mode -eq 'always') { 'ubot_schema_always_20261023' } else { 'ubot_schema_onbroken_20261023' }
$redis = if ($Mode -eq 'always') { '12' } else { '13' }
$env:LLM_FINAL_SCHEMA_MODE = $Mode
$env:SPRING_PROFILES_ACTIVE = 'local,eval'
$env:SERVER_PORT = '8082'
$env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:15432/$db"
$env:SPRING_DATA_REDIS_DATABASE = $redis
$env:EVAL_TRACE_PATH = "$runtime/trace_slot.jsonl"
$env:CHAT_WORKER_CONSUMER_NAME = "eval-schema-$Mode"
$env:CHAT_WORKER_CONCURRENCY = '1'
$env:AI_MODE = 'ollama'
$env:OLLAMA_CHAT_MODEL = 'qwen3:4b-instruct-2507-q4_K_M'
$env:KIWI_MODEL_PATH = 'C:/Ureka/ureca_project2/BackEnd/.kiwi/model'
Set-Location -LiteralPath "$evalWorkspace/build/schema-final-eval-20261023/backend"
& ./gradlew.bat bootRun --offline --no-daemon --console=plain -x downloadKiwi *> "$runtime/backend.log"
exit $LASTEXITCODE
