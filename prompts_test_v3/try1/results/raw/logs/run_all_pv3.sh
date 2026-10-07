set -e
cd "C:/Ureka/ureca_project2/LLM_Test"
T="--test prompts_test_v3 --try try1"
LOG=prompts_test_v3/try1/results/raw/logs
D=$(date +%Y%m%d_%H%M)
# 생성만 한다. LLM Judge는 따로(다른 곳에서) 실행 — SETUP 4절.
node scripts/run/run_item.js qwen3:4b PI,HR,SR --size 100 $T --variant v4_t1c > $LOG/gen_t1c_$D.log 2>&1
node scripts/run/run_item.js qwen3:4b NC,MC --size 200 --ids-file prompts_test_v3/try1/case_sets/ncmc-focus.txt $T --variant v4_t1c >> $LOG/gen_t1c_$D.log 2>&1
R1=$(ls prompts_test_v3/try1/results/raw | grep '_v4_t1c_.*PI-HR-SR$')
R2=$(ls prompts_test_v3/try1/results/raw | grep '_v4_t1c_.*NC-MC_ids-ncmc-focus$')
# 배치 매니페스트(로컬, 루브릭 미포함)까지만 만든다
node scripts/judge/build_batch_manifest.js --batch pv3-try1 $T --runs $R1,$R2
echo ALL_DONE
