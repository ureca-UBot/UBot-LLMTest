$ErrorActionPreference = 'Stop'
# pipeline_test_v5와 같은 실행 사본(feat277-eval-20261023/backend)을 쓰고, DB·trace 경로만 v6용으로 바꾼다.
# DB는 v5 DB를 복제한 뒤 seed/eval_runner_lines.sql을 넣은 ubot_feat277_eval_lines_20261023이다.
$evalWorkspace = 'C:/Ureka/ureca_project2/LLM_Test'
$runtime = "$evalWorkspace/pipeline_test_v6/try1/results/runtime"
New-Item -ItemType Directory -Force $runtime | Out-Null
$env:SPRING_PROFILES_ACTIVE = 'local,eval'
$env:SERVER_PORT = '8082'
$env:SPRING_DATASOURCE_URL = 'jdbc:postgresql://localhost:15432/ubot_feat277_eval_lines_20261023'
$env:SPRING_DATA_REDIS_DATABASE = '14'
$env:EVAL_TRACE_PATH = "$runtime/trace_slot.jsonl"
$env:CHAT_WORKER_CONSUMER_NAME = 'eval-feat277-v6'
$env:CHAT_WORKER_CONCURRENCY = '1'
$env:AI_MODE = 'ollama'
$env:OLLAMA_CHAT_MODEL = 'qwen3:4b-instruct-2507-q4_K_M'
$env:KIWI_MODEL_PATH = 'C:/Ureka/ureca_project2/BackEnd/.kiwi/model'
Set-Location -LiteralPath "$evalWorkspace/build/feat277-eval-20261023/backend"
& ./gradlew.bat bootRun --offline --no-daemon --console=plain -x downloadKiwi *> "$runtime/backend.log"
exit $LASTEXITCODE
