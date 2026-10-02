"""GPU·모델 서버·외부 접속 없이 기존 파일 검사와 순차 측정 검증."""
import contextlib
import hashlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch, MagicMock

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
from run_t4 import Automation, AutomationError, CleanupError, Interrupted, parse_args, completed_state, write_json

CFG = {"arrival": {"factors": [0.25, 0.5, 0.75, 1, 1.25]}, "repeats": {"extra": 2}}

def completed_steps():
    return [{"key": "optimal", "parallel": 2}, {"key": "B|spike"}, {"key": "B|arrival|stop"},
            {"key": "C|p2|rep2|round", "status": "done"}, {"key": "C|p2|rep3|round", "status": "done"}]

class FakeAutomation(Automation):
    def __init__(self, args, project):
        super().__init__(args, project)
        self.events = []
        self.active = True
        self.busy = False
        self.fail_measure = False
        self.fail_engine = None
        self.residual_gpu = False
        self.interrupt_measure = False
        self.stale_matrix = False
        self.ollama_missing = False
        self.gguf_unreadable = False

    def validate_host(self):
        self.events.append("validate")

    def log(self, text):
        pass

    def capture_service(self):
        self.original_service = {"exists": True, "active": True, "enabled": True,
                                 "override": "[Service]\nEnvironment=ORIGINAL=1\n", "restored": False}

    def service_exists(self):
        return True

    def wait_ollama(self):
        self.events.append("ready:ollama")

    def api(self, route, body=None):
        self.events.append("api:" + route)
        if route == "/api/tags":
            return {"models": [] if self.ollama_missing else [{"name": model, "digest": "fixture-digest"} for model in self.args.models]}
        if route == "/api/show":
            file = self.project / ("missing.gguf" if self.gguf_unreadable else "model.gguf")
            return {"modelfile": "FROM " + file.as_posix(), "details": {"quantization_level": "Q4_K_M"}}
        return {"version": "fixture"}

    def gpu_idle(self, timeout=30):
        self.events.append("gpu-idle")
        if self.busy:
            raise CleanupError("fixture residual GPU")

    def run(self, argv, **kwargs):
        words = [str(item) for item in argv]
        if any(word in {"apt-get", "pip", "install", "pull", "curl", "wget", "cmake", "git", "ubuntu-drivers"} for word in words):
            raise AssertionError("installer or downloader command")
        if words[:5] == ["sudo", "-n", "systemctl", "stop", "ollama"]:
            self.events.append("stop:ollama")
            self.active = False
        elif words[:5] == ["sudo", "-n", "systemctl", "start", "ollama"]:
            self.events.append("start:ollama")
            self.active = True
        elif words[:3] == ["sudo", "-n", "tee"]:
            self.events.append(("restore-override", kwargs["input_text"]))
        elif "--version" in words or "-c" in words:
            if words[0] == self.fail_engine:
                raise AutomationError("fixture missing engine")
            return 0, "fixture"
        elif "-e" in words:
            if "makeRunId" in words[2]:
                return 0, "fixture_run"
            if "checkRuntime" in words[2]:
                self.events.append("check-cli")
                return 0, ""
            return 0, json.dumps(CFG)
        elif len(words) > 1 and words[1].endswith("run_load_test.js"):
            self.events.append("measure:ollama")
            if self.interrupt_measure:
                raise Interrupted("fixture interruption")
            if self.residual_gpu:
                self.busy = True
            steps = self.results / "raw/fixture_run/steps.jsonl"
            steps.parent.mkdir(parents=True, exist_ok=True)
            steps.write_text("\n".join(json.dumps(item) for item in completed_steps()), encoding="utf-8")
            write_json(steps.parent / "run_meta.json", {"profile": self.args.profile})
            return int(self.fail_measure), ""
        elif len(words) > 1 and words[1].endswith("run_engines.js"):
            self.events.append("measure:native")
            config = json.loads(Path(words[words.index("--config") + 1]).read_text(encoding="utf-8"))
            rows = [{"engine": entry["engine"], "model": entry["model"],
                     "config_sha256": hashlib.sha256(json.dumps(entry, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest(),
                     "status": "done" if entry["enabled"] else "unconfigured"}
                    for entry in config["combinations"] if entry["model"] in self.args.models]
            suffix = "_quick" if self.args.profile == "quick" else ""
            report = self.results / "summary" / f"engine_matrix_{self.args.run_date}{suffix}.json"
            write_json(report, {"combinations": rows})
            if self.stale_matrix:
                import os
                os.utime(report, (1, 1))
                return 1, ""
        elif len(words) > 1 and words[1].endswith("summarize.js"):
            self.events.append("summarize")
        return 0, ""

class AutomationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.project = Path(self.temp.name) / "servingtest"
        (self.project / "scripts/config").mkdir(parents=True)
        (self.project / "model.gguf").write_bytes(b"GGUFfixture-weight")
        hf = self.project / "hf-model"
        hf.mkdir()
        write_json(hf / "config.json", {"quantization_config": {"quant_method": "awq"}})
        (hf / "model.safetensors").write_bytes(b"fixture-safe-weights")
        entries = json.loads((SCRIPTS / "config/engines.existing.example.json").read_text(encoding="utf-8"))["combinations"]
        for entry in entries:
            if entry["engine"] != "llama.cpp":
                entry["model_path"] = str(hf)
                entry["command"][0] = entry["engine"]
        self.config = self.project / "scripts/config/engines.local.json"
        write_json(self.config, {"combinations": entries})
        self.args = parse_args(["--config", str(self.config), "--models", "qwen3:4b", "--run-date", "20261001", "--profile", "quick", "--try", "smoke"])

    def tearDown(self):
        self.temp.cleanup()

    def execute(self, runner):
        with patch("run_t4.subprocess.Popen", side_effect=AssertionError("real subprocess forbidden")):
            return runner.execute()

    def test_existing_files_only_full_sequence_and_original_service_restoration(self):
        runner = FakeAutomation(self.args, self.project)
        self.assertEqual(self.execute(runner), 0)
        self.assertLess(runner.events.index("check-cli"), runner.events.index("measure:ollama"))
        self.assertLess(runner.events.index("measure:ollama"), runner.events.index("measure:native"))
        self.assertLess(runner.events.index("measure:native"), runner.events.index("summarize"))
        self.assertEqual(runner.report["status"], "done")
        self.assertTrue(all(row["status"] == "done" for row in runner.report["combinations"]))
        self.assertTrue(runner.active)
        self.assertFalse(runner.lock.exists())
        self.assertIn(("restore-override", runner.original_service["override"]), runner.events)
        self.assertTrue(set(event for event in runner.events if isinstance(event, str) and event.startswith("api:")) <= {"api:/api/version", "api:/api/tags", "api:/api/show"})

    def test_missing_engine_keeps_other_measurements_and_marks_partial(self):
        runner = FakeAutomation(self.args, self.project)
        runner.fail_engine = "vllm"
        self.assertEqual(self.execute(runner), 1)
        rows = {row["engine"]: row for row in runner.report["combinations"]}
        self.assertEqual(rows["vllm"]["status"], "unavailable")
        self.assertEqual(rows["sglang"]["status"], "done")

    def test_ollama_only_weights_do_not_become_python_engine_weights(self):
        config = json.loads(self.config.read_text(encoding="utf-8"))
        for entry in config["combinations"]:
            if entry["engine"] != "llama.cpp":
                entry["model_path"] = str(self.project / "model.gguf")
        write_json(self.config, config)
        runner = FakeAutomation(self.args, self.project)
        self.assertEqual(self.execute(runner), 1)
        rows = {row["engine"]: row for row in runner.report["combinations"]}
        self.assertEqual(rows["ollama"]["status"], "done")
        self.assertEqual(rows["llama.cpp"]["status"], "done")
        self.assertEqual(rows["vllm"]["status"], "unavailable")
        self.assertIn("safetensors", rows["vllm"]["reason"])

    def configure_python_gguf(self):
        tokenizer = self.project / "gguf-tokenizer"
        tokenizer.mkdir()
        write_json(tokenizer / "config.json", {"model_type": "qwen3"})
        write_json(tokenizer / "tokenizer_config.json", {})
        write_json(tokenizer / "tokenizer.json", {})
        config = json.loads(self.config.read_text(encoding="utf-8"))
        for entry in config["combinations"]:
            if entry["engine"] != "llama.cpp":
                entry.update(model_path="ollama://" + entry["model"], weight_format="GGUF", tokenizer_path=str(tokenizer))
        write_json(self.config, config)
        return tokenizer

    def test_python_gguf_reuses_ollama_weight_and_fingerprints_local_tokenizer(self):
        self.configure_python_gguf()
        self.args.check_only = True
        runner = FakeAutomation(self.args, self.project)
        self.assertEqual(self.execute(runner), 0)
        entries = json.loads((runner.runtime / "engines.generated.json").read_text())["combinations"]
        for entry in entries:
            self.assertEqual(entry["weight_format"], "GGUF")
            self.assertEqual(entry["quantization"], "Q4_K_M")
            self.assertEqual(entry["model_path"], str(self.project / "model.gguf"))
            if entry["engine"] != "llama.cpp":
                self.assertTrue(entry["tokenizer_revision"])
        self.assertNotIn("measure:native", runner.events)

    def test_python_gguf_missing_tokenizer_blocks_python_engines_only(self):
        tokenizer = self.configure_python_gguf()
        (tokenizer / "tokenizer.json").unlink()
        runner = FakeAutomation(self.args, self.project)
        self.assertEqual(self.execute(runner), 1)
        rows = {row["engine"]: row for row in runner.report["combinations"]}
        self.assertEqual(rows["llama.cpp"]["status"], "done")
        for engine in ("vllm", "sglang"):
            self.assertEqual(rows[engine]["status"], "unavailable")
            self.assertIn("tokenizer.json", rows[engine]["reason"])

    def test_python_gguf_wrong_tokenizer_family_is_rejected(self):
        tokenizer = self.configure_python_gguf()
        write_json(tokenizer / "config.json", {"model_type": "llama"})
        runner = FakeAutomation(self.args, self.project)
        self.assertEqual(self.execute(runner), 1)
        rows = {row["engine"]: row for row in runner.report["combinations"]}
        self.assertIn("model_type", rows["vllm"]["reason"])

    def test_ollama_gguf_read_failure_does_not_remove_ollama_measurement(self):
        runner = FakeAutomation(self.args, self.project)
        runner.gguf_unreadable = True
        self.assertEqual(self.execute(runner), 1)
        rows = {row["engine"]: row for row in runner.report["combinations"]}
        self.assertEqual(rows["ollama"]["status"], "done")
        self.assertEqual(rows["llama.cpp"]["status"], "unavailable")

    def test_missing_ollama_model_is_recorded_without_download(self):
        runner = FakeAutomation(self.args, self.project)
        runner.ollama_missing = True
        self.assertEqual(self.execute(runner), 1)
        rows = {row["engine"]: row for row in runner.report["combinations"]}
        self.assertEqual(rows["ollama"]["status"], "unavailable")
        self.assertNotIn("measure:ollama", runner.events)
        self.assertEqual(rows["sglang"]["status"], "done")

    def test_measurement_failure_continues_only_after_gpu_barrier(self):
        runner = FakeAutomation(self.args, self.project)
        runner.fail_measure = True
        self.assertEqual(self.execute(runner), 1)
        between = runner.events[runner.events.index("measure:ollama") + 1:runner.events.index("measure:native")]
        self.assertIn("stop:ollama", between)
        self.assertIn("gpu-idle", between)
        self.assertEqual(runner.report["combinations"][0]["status"], "failed")

    def test_residual_gpu_blocks_next_engine_and_service_restart(self):
        runner = FakeAutomation(self.args, self.project)
        runner.residual_gpu = True
        self.assertEqual(self.execute(runner), 1)
        self.assertNotIn("measure:native", runner.events)
        self.assertEqual(runner.report["status"], "cleanup_failed")
        self.assertFalse(runner.active)

    def test_interruption_cleans_up_before_restoration(self):
        runner = FakeAutomation(self.args, self.project)
        runner.interrupt_measure = True
        self.assertEqual(self.execute(runner), 130)
        self.assertNotIn("measure:native", runner.events)
        self.assertTrue(runner.active)
        self.assertFalse(runner.lock.exists())

    def test_check_only_never_measures(self):
        self.args.check_only = True
        runner = FakeAutomation(self.args, self.project)
        self.assertEqual(self.execute(runner), 0)
        self.assertNotIn("measure:ollama", runner.events)
        self.assertNotIn("measure:native", runner.events)
        self.assertEqual(runner.report["status"], "prepared")
        self.assertTrue(runner.active)

    def test_dry_run_does_not_query_host_or_change_files(self):
        self.args.dry_run = True
        runner = Automation(self.args, self.project)
        before = set(self.project.rglob("*"))
        with contextlib.redirect_stdout(io.StringIO()), patch.object(runner, "validate_host", side_effect=AssertionError("host query")), patch("run_t4.urlopen", side_effect=AssertionError("network")), patch("run_t4.subprocess.Popen", side_effect=AssertionError("subprocess")):
            self.assertEqual(runner.execute(), 0)
        self.assertEqual(before, set(self.project.rglob("*")))

    def test_lock_refuses_concurrent_or_stale_launch(self):
        runner = FakeAutomation(self.args, self.project)
        write_json(runner.lock, {"pid": 9876, "token": "someone-else"})
        with self.assertRaises(AutomationError):
            self.execute(runner)
        self.assertEqual(json.loads(runner.lock.read_text(encoding="utf-8"))["token"], "someone-else")
        self.assertNotIn("stop:ollama", runner.events)

    def test_native_matrix_is_absolute_and_offline_with_detected_metadata(self):
        runner = FakeAutomation(self.args, self.project)
        self.execute(runner)
        entries = json.loads((runner.runtime / "engines.generated.json").read_text(encoding="utf-8"))["combinations"]
        self.assertEqual(len(entries), 3)
        for entry in entries:
            self.assertTrue(Path(entry["model_path"]).is_absolute())
            self.assertTrue(entry["revision"].startswith("sha256:"))
            self.assertEqual(entry["version"], "fixture")
            self.assertEqual(entry["env"]["HF_HUB_OFFLINE"], "1")
        self.assertEqual(next(entry for entry in entries if entry["engine"] == "vllm")["quantization"], "awq")

    def test_stale_native_success_report_is_not_reused(self):
        runner = FakeAutomation(self.args, self.project)
        runner.stale_matrix = True
        self.assertEqual(self.execute(runner), 1)
        self.assertTrue(all(row["status"] == "failed" for row in runner.report["combinations"] if row["engine"] != "ollama"))

    def test_missing_safetensors_shard_fails_local_inspection(self):
        write_json(self.project / "hf-model/model.safetensors.index.json", {"weight_map": {"layer": "missing.safetensors"}})
        runner = FakeAutomation(self.args, self.project)
        self.assertEqual(self.execute(runner), 1)
        self.assertEqual(next(row for row in runner.report["combinations"] if row["engine"] == "vllm")["status"], "unavailable")

    def test_fingerprint_changes_when_local_weights_change(self):
        runner = FakeAutomation(self.args, self.project)
        file = self.project / "model.gguf"
        first = runner.fingerprint([file])
        file.write_bytes(b"GGUFchanged-weight-longer")
        self.assertNotEqual(first, runner.fingerprint([file]))

    def test_completion_requires_b_and_successful_c_repeats(self):
        self.assertEqual(completed_state(completed_steps(), CFG), "done")
        self.assertEqual(completed_state(completed_steps()[:-1], CFG), "incomplete")
        self.assertEqual(completed_state([], CFG), "unavailable")

    def test_no_restore_keeps_original_service_stopped(self):
        self.args.no_restore = True
        runner = FakeAutomation(self.args, self.project)
        self.assertEqual(self.execute(runner), 0)
        self.assertFalse(runner.active)
        self.assertIn(("restore-override", runner.original_service["override"]), runner.events)

    def test_child_environment_forces_offline_and_removes_token(self):
        runner = Automation(self.args, self.project)
        runner.env["HF_TOKEN"] = "fixture-secret"
        runner.env["HUGGING_FACE_HUB_TOKEN"] = "fixture-secret"
        process = MagicMock()
        process.stdout = io.StringIO("fixture output\n")
        process.wait.return_value = 0
        with patch("run_t4.subprocess.Popen", return_value=process) as popen, contextlib.redirect_stdout(io.StringIO()):
            runner.run(["fixture", "--version"], env={"HF_HUB_OFFLINE": "0"}, quiet=True, timeout=None)
        env = popen.call_args.kwargs["env"]
        self.assertEqual(env["HF_HUB_OFFLINE"], "1")
        self.assertEqual(env["TRANSFORMERS_OFFLINE"], "1")
        self.assertNotIn("HF_TOKEN", env)
        self.assertNotIn("HUGGING_FACE_HUB_TOKEN", env)

if __name__ == "__main__":
    unittest.main()
