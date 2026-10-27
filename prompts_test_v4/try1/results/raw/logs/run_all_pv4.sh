set -e
cd "C:/Ureka/ureca_project2/LLM_Test"
T="--test prompts_test_v4 --try try1"
ITEMS=PI,CE,UI,AR,CF,SR,HR,AD,NC,MC,MT
LOG=prompts_test_v4/try1/results/raw/logs
D=$(date +%Y%m%d_%H%M)
# 생성 — 새 안 v5_i1만. 기준선은 v5 try1의 Q4_K_M + v4_base 결과(EC2 T4, Judge v5-try1-n100)를 그대로 쓴다(같은 100 서브셋 문항).
node scripts/run/run_item.js qwen3:4b-instruct $ITEMS --size 100 $T --variant v5_i1 > $LOG/gen_i1_$D.log 2>&1
R=$(ls prompts_test_v4/try1/results/raw | grep '_v5_i1_.*_PI-CE')
# 배치 매니페스트(로컬, 루브릭 미포함)
node scripts/judge/build_batch_manifest.js --batch pv4-try1 $T --runs $R
echo ALL_DONE
