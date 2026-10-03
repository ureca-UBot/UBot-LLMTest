"""Ubuntu 24.04/T4: 설치된 엔진·로컬 모델만 검사하고 순차 측정한다."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import shlex
import shutil
import signal
import subprocess
import sys
import threading
import time
from datetime import datetime
from urllib.request import Request, urlopen
from uuid import uuid4
from zoneinfo import ZoneInfo

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT = SCRIPT_DIR.parent
ENGINES = ("ollama", "llama.cpp", "vllm", "sglang")
MODELS = ("gemma3:4b", "qwen3:4b", "qwen3:8b", "qwen3:14b")
OVERRIDE = "/etc/systemd/system/ollama.service.d/zz-load-test.conf"

class AutomationError(RuntimeError):
    pass

class CleanupError(AutomationError):
    pass

class Interrupted(AutomationError):
    pass

def iso_now():
    return datetime.now(ZoneInfo("Asia/Seoul")).isoformat()


def write_json(file, value):
    file.parent.mkdir(parents=True, exist_ok=True)
    temporary = file.with_name(file.name + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.chmod(0o600)
    temporary.replace(file)


def read_json(file, default=None):
    return json.loads(file.read_text(encoding="utf-8")) if file.is_file() else default


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="GPU 조회·서비스 변경·결과 쓰기 없이 계획 출력")
    parser.add_argument("--check-only", action="store_true", help="엔진·모델만 검사하고 측정하지 않음; Ollama 서비스 상태 복원")
    parser.add_argument("--profile", choices=("full", "quick"), default="full")
    parser.add_argument("--engines", default=",".join(ENGINES))
    parser.add_argument("--models", default=",".join(MODELS))
    parser.add_argument("--run-date", default=os.environ.get("RUN_DATE") or datetime.now(ZoneInfo("Asia/Seoul")).strftime("%Y%m%d"))
    parser.add_argument("--try", dest="try_tag", default=os.environ.get("LLM_TEST_TRY") or "try1")
    local = SCRIPT_DIR / "config/engines.local.json"
    parser.add_argument("--config", type=Path, default=local if local.is_file() else SCRIPT_DIR / "config/engines.existing.example.json")
    parser.add_argument("--node", default=os.environ.get("NODE_BIN") or "node", help="이미 설치된 Node.js 실행 파일")
    parser.add_argument("--no-restore", action="store_true", help="종료 후 테스트 설정만 복원하고 Ollama는 중지 상태 유지")
    args = parser.parse_args(argv)
    engines = [item.strip() for item in args.engines.split(",")]
    if not engines or any(item not in ENGINES for item in engines):
        parser.error("엔진은 ollama,llama.cpp,vllm,sglang 중 선택하세요")
    args.engines = [engine for engine in ENGINES if engine in engines]
    models = [item.strip() for item in args.models.split(",")]
    if not models or any(item not in MODELS for item in models) or len(set(models)) != len(models):
        parser.error("모델은 gemma3:4b,qwen3:4b,qwen3:8b,qwen3:14b 중 중복 없이 선택하세요")
    args.models = [model for model in MODELS if model in models]
    if not re.fullmatch(r"\d{8}", args.run_date) or not re.fullmatch(r"[A-Za-z0-9_-]+", args.try_tag):
        parser.error("날짜는 YYYYMMDD, try는 영문·숫자·밑줄·하이픈만 허용합니다")
    args.config = args.config.resolve()
    return args

def completed_state(records, cfg):
    """프로세스 exit 0만으로 측정 완료를 판정하지 않는다."""
    steps = {record.get("key"): record for record in records}
    if "optimal" not in steps:
        return "unavailable"
    parallel = steps["optimal"]["parallel"]
    arrivals = "B|arrival|stop" in steps or all(
        f"B|arrival|f{factor:g}" in steps for factor in cfg["arrival"]["factors"])
    repeats = all(steps.get(f"C|p{parallel}|rep{repeat}|round", {}).get("status") == "done"
                  for repeat in range(2, 2 + cfg["repeats"]["extra"]))
    return "done" if "B|spike" in steps and arrivals and repeats else "incomplete"


class Automation:
    def __init__(self, args, project=PROJECT):
        self.args = args
        self.project = Path(project)
        self.scripts = self.project / "scripts"
        self.runtime = self.project / ".t4-state"
        self.results = self.project / args.try_tag / "results"
        self.lock = self.project / ".t4-automation.lock"
        self.token = uuid4().hex
        self.report_path = self.results / "summary" / f"automation_{args.run_date}_{args.profile}.json"
        self.report = {"started_at": iso_now(), "run_date": args.run_date, "try": args.try_tag,
                       "profile": args.profile, "mode": "existing_only", "status": "pending", "stages": [],
                       "combinations": [{"engine": engine, "model": model, "status": "pending"}
                                        for engine in args.engines for model in args.models]}
        self.child = None
        self.log_file = None
        self.interrupted = False
        self.original_service = None
        self.service_touched = False
        self.preparation = {"engines": {}, "ollama_models": {}}
        self.node = args.node
        self.env = {**os.environ, "TZ": "Asia/Seoul", "LLM_TEST_TRY": args.try_tag,
                    "LLM_T4_LEASE": self.token, "CUDA_VISIBLE_DEVICES": "0",
                    "HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1",
                    "HF_HUB_DISABLE_TELEMETRY": "1", "OLLAMA_HOST": "http://127.0.0.1:11434"}
        self.version_cache = {}
        self.weight_cache = {}
        self.fingerprints = {}

    def redact(self, text):
        token = self.env.get("HF_TOKEN")
        return text.replace(token, "[REDACTED]") if token else text

    def log(self, text):
        text = self.redact(str(text))
        print(text, flush=True)
        if self.log_file:
            self.log_file.write(text + "\n")
            self.log_file.flush()

    def save(self):
        write_json(self.report_path, self.report)

    def run(self, argv, *, check=True, quiet=False, env=None, input_text=None, cwd=None, timeout=600):
        """설치 명령 없이 검사·측정 명령만 실행한다."""
        if self.interrupted:
            raise Interrupted("중단 요청")
        if not quiet:
            self.log("$ " + shlex.join([str(item) for item in argv]))
        effective_env = {**self.env, **(env or {})}
        effective_env.pop("HF_TOKEN", None)
        effective_env.pop("HUGGING_FACE_HUB_TOKEN", None)
        effective_env.update(HF_HUB_OFFLINE="1", TRANSFORMERS_OFFLINE="1")
        process = subprocess.Popen([str(item) for item in argv], cwd=cwd or self.project.parent,
                                   env=effective_env, stdin=subprocess.PIPE if input_text is not None else subprocess.DEVNULL,
                                   stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
                                   encoding="utf-8", errors="replace", start_new_session=True)
        self.child = process
        expired = threading.Event()
        def expire():
            expired.set()
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
        timer = threading.Timer(timeout, expire) if timeout else None
        if timer:
            timer.start()
        output = ""
        try:
            if input_text is not None:
                process.stdin.write(input_text)
                process.stdin.close()
            while True:
                piece = process.stdout.readline(8192)
                if not piece:
                    break
                piece = self.redact(piece)
                output = (output + piece)[-32000:]
                if not quiet:
                    self.log(piece.rstrip("\r\n"))
            code = process.wait()
        except BaseException:
            # Node 측정기는 TERM을 받아 자신이 소유한 서버/worker를 먼저 정리한다.
            try:
                process.send_signal(signal.SIGTERM)
                process.wait(timeout=90)
            except (ProcessLookupError, subprocess.TimeoutExpired):
                try:
                    os.killpg(process.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
                process.wait()
            raise
        finally:
            if timer:
                timer.cancel()
            process.stdout.close()
            self.child = None
        if check and (code != 0 or expired.is_set()):
            raise AutomationError(f"명령 실패 (exit={code}, timeout={expired.is_set()}): "
                                  f"{shlex.join([str(item) for item in argv])}\n{output[-1500:]}")
        return code, output

    def stage(self, name, action):
        row = {"name": name, "started_at": iso_now(), "status": "running"}
        self.report["stages"].append(row)
        self.save()
        self.log(f"\n[{name}] 시작")
        try:
            result = action()
            row["status"] = "done"
            return result
        except BaseException as error:
            row.update(status="interrupted" if isinstance(error, Interrupted) else "failed",
                       reason=self.redact(str(error))[-2000:])
            raise
        finally:
            row["ended_at"] = iso_now()
            self.save()

    def acquire(self):
        try:
            with self.lock.open("x", encoding="utf-8") as file:
                json.dump({"pid": os.getpid(), "token": self.token, "started_at": iso_now()}, file)
        except FileExistsError:
            raise AutomationError(f"자동 실행 잠금이 있습니다: {self.lock}. "
                                  "기록된 PID가 종료됐는지와 GPU 해제를 확인한 뒤 이 잠금만 정리하세요.")

    def release(self):
        if read_json(self.lock, {}).get("token") == self.token:
            self.lock.unlink()

    def validate_host(self):
        if sys.platform != "linux" or platform.machine() != "x86_64":
            raise AutomationError("실제 검사는 Ubuntu 24.04 x86_64 T4 서버에서 실행하세요. PowerShell에서는 --dry-run만 가능합니다")
        release = dict(line.split("=", 1) for line in Path("/etc/os-release").read_text().splitlines() if "=" in line)
        if release.get("ID", "").strip('"') != "ubuntu" or release.get("VERSION_ID", "").strip('"') != "24.04":
            raise AutomationError("Ubuntu 24.04 LTS가 필요합니다")
        if Path("/proc/1/comm").read_text().strip() != "systemd":
            raise AutomationError("systemd가 실행 중인 서버가 필요합니다")
        self.run(["sudo", "-n", "true"], quiet=True, timeout=10)
        code, version = self.run([self.node, "--version"], check=False, quiet=True, timeout=10)
        if code != 0 or not re.match(r"v(?:2[0-9]|[3-9][0-9])\.", version.strip()):
            raise AutomationError("이미 설치된 Node.js 20 이상이 필요합니다. --node /절대/경로/node 로 지정할 수 있습니다")
        self.report["node_version"] = version.strip()
        code, value = self.run(["nvidia-smi", "--query-gpu=name,driver_version", "--format=csv,noheader"], check=False, quiet=True, timeout=10)
        lines = [line for line in value.splitlines() if line.strip()]
        if code != 0 or len(lines) != 1 or "T4" not in lines[0].split(",")[0]:
            raise AutomationError("동작하는 NVIDIA 드라이버와 T4 한 장이 필요합니다. 자동 설치·수정하지 않습니다")
        self.report["gpu"] = {"name": lines[0].split(",")[0].strip(), "driver_version": lines[0].split(",")[1].strip()}
        self.report["free_disk_gib"] = round(shutil.disk_usage(self.project).free / 1024 ** 3, 2)

    def service_exists(self):
        _, value = self.run(["systemctl", "show", "ollama", "--property=LoadState", "--value"], check=False, quiet=True)
        return value.strip() == "loaded"

    def capture_service(self):
        state_file = self.runtime / "ollama_original_state.json"
        previous = read_json(state_file)
        if previous and not previous.get("restored"):
            self.original_service = previous
            self.log("이전 중단 실행의 Ollama 원래 상태를 재사용합니다.")
            return
        exists = self.service_exists()
        active = self.run(["systemctl", "is-active", "--quiet", "ollama"], check=False, quiet=True)[0] == 0 if exists else False
        enabled = self.run(["systemctl", "is-enabled", "--quiet", "ollama"], check=False, quiet=True)[0] == 0 if exists else False
        code, override = self.run(["sudo", "-n", "cat", "--", OVERRIDE], check=False, quiet=True)
        self.original_service = {"exists": exists, "active": active, "enabled": enabled,
                                 "override": override if code == 0 else None, "restored": False}
        write_json(state_file, self.original_service)

    def stop_ollama(self):
        if self.service_exists():
            self.service_touched = True
            self.run(["sudo", "-n", "systemctl", "stop", "ollama"], timeout=90)

    def gpu_idle(self, timeout=30):
        until = time.monotonic() + timeout
        while True:
            code, value = self.run(["nvidia-smi", "--query-compute-apps=pid,process_name,used_memory",
                                    "--format=csv,noheader,nounits"], check=False, quiet=True, timeout=10)
            if code != 0:
                raise CleanupError("GPU 해제 상태를 조회할 수 없습니다. 다음 엔진을 기동하지 않습니다.")
            if not value.strip():
                self.run(["nvidia-smi", "--query-gpu=memory.used,memory.total", "--format=csv,noheader,nounits"], quiet=True)
                return
            if time.monotonic() >= until:
                raise CleanupError("다른 GPU compute 프로세스가 남아 전환 중단: " + value.strip())
            time.sleep(0.5)

    def api(self, route, body=None):
        from urllib.request import Request
        data = json.dumps(body).encode() if body is not None else None
        request = Request("http://127.0.0.1:11434" + route, data=data,
                          headers={"Content-Type": "application/json"})
        with urlopen(request, timeout=15) as response:
            return json.load(response)

    def wait_ollama(self):
        until = time.monotonic() + 90
        while True:
            try:
                self.api("/api/version")
                return
            except Exception:
                if time.monotonic() >= until:
                    raise AutomationError("Ollama readiness 시간 초과")
                time.sleep(0.5)

    def fingerprint(self, files):
        """최초 검사 때 실제 파일 SHA256을 기록하고 크기·mtime가 같을 때 재사용한다."""
        manifest = []
        for file in sorted(files):
            file = Path(file).resolve()
            before = file.stat()
            key = str(file)
            signature = [before.st_size, before.st_mtime_ns]
            cached = self.fingerprints.get(key, {})
            if cached.get("signature") == signature:
                digest = cached["sha256"]
            else:
                h = hashlib.sha256()
                with file.open("rb") as stream:
                    while block := stream.read(8 * 1024 * 1024):
                        h.update(block)
                after = file.stat()
                if [after.st_size, after.st_mtime_ns] != signature:
                    raise AutomationError(f"검사 중 모델 파일이 변경됐습니다: {file}")
                digest = h.hexdigest()
                self.fingerprints[key] = {"signature": signature, "sha256": digest}
            manifest.append({"file": file.name, "bytes": before.st_size, "sha256": digest})
        return "sha256:" + hashlib.sha256(json.dumps(manifest, separators=(",", ":")).encode()).hexdigest()

    def inspect_ollama(self):
        if not self.service_exists():
            self.preparation["engines"]["ollama"] = {"ready": False, "reason": "Ollama systemd 서비스가 없습니다"}
            return
        try:
            self.gpu_idle()
            self.service_touched = True
            self.run(["sudo", "-n", "systemctl", "start", "ollama"], timeout=90)
            self.wait_ollama()
            version = self.api("/api/version")["version"]
            self.preparation["engines"]["ollama"] = {"ready": True, "version": version}
            tags = {item["name"]: item for item in self.api("/api/tags").get("models", [])}
            for model in self.args.models:
                weight = {"ready": model in tags, "digest": tags.get(model, {}).get("digest")}
                self.preparation["ollama_models"][model] = weight
                if not weight["ready"]:
                    weight["reason"] = "Ollama에 기존 모델 태그가 없습니다. 자동으로 받지 않습니다"
                    continue
                try:
                    show = self.api("/api/show", {"model": model})
                    weight["quantization"] = show.get("details", {}).get("quantization_level")
                    for line in show.get("modelfile", "").splitlines():
                        if line.upper().startswith("FROM "):
                            parts = shlex.split(line)
                            source = Path(parts[1]) if len(parts) > 1 else Path("")
                            if source.is_absolute() and source.is_file():
                                with source.open("rb") as stream:
                                    if stream.read(4) != b"GGUF":
                                        raise AutomationError("Ollama FROM 파일이 GGUF가 아닙니다")
                                weight.update(gguf_ready=True, model_path=str(source), revision=self.fingerprint([source]))
                            break
                    if not weight.get("gguf_ready"):
                        weight["gguf_reason"] = "Ollama GGUF 원본 경로를 읽을 수 없습니다. model_path에 읽기 가능한 GGUF 절대 경로를 지정하세요"
                except (AutomationError, OSError, ValueError, KeyError) as error:
                    weight.update(gguf_ready=False, gguf_reason=self.redact(str(error)))
        except (AutomationError, OSError, ValueError, KeyError) as error:
            self.preparation["engines"]["ollama"] = {"ready": False, "reason": self.redact(str(error))}
        finally:
            self.stop_ollama()
            self.gpu_idle()

    def runtime_version(self, entry):
        command = entry["command"]
        key = (entry["engine"], tuple(command))
        if key not in self.version_cache:
            args = command + ["--version"] if entry["engine"] == "llama.cpp" else [command[0], "-c", f"import importlib.metadata; print(importlib.metadata.version('{entry['engine']}'))"]
            _, value = self.run(args, quiet=True, timeout=30)
            lines = [line.strip() for line in value.splitlines() if line.strip()]
            if not lines:
                raise AutomationError("엔진 버전을 확인할 수 없습니다")
            actual = next((line for line in lines if re.search(r"version|build", line, re.I)), lines[0]) if entry["engine"] == "llama.cpp" else lines[-1]
            if entry.get("version") not in (None, "auto", actual) and entry["version"] not in value:
                raise AutomationError(f"설정 버전 {entry['version']}과 실제 버전 {actual}이 다릅니다")
            self.version_cache[key] = actual
        expected = entry.get("version")
        if expected not in (None, "auto", self.version_cache[key]) and expected not in self.version_cache[key]:
            raise AutomationError(f"설정 버전 {expected}과 실제 버전 {self.version_cache[key]}이 다릅니다")
        return self.version_cache[key]

    def inspect_weight(self, entry):
        value = entry["model_path"]
        if value.startswith("ollama://"):
            if entry["engine"] != "llama.cpp" and entry.get("weight_format") != "GGUF":
                raise AutomationError("Python 엔진에서 ollama://를 쓰려면 weight_format=GGUF와 로컬 tokenizer_path를 지정하세요")
            weight = self.preparation["ollama_models"].get(value[len("ollama://"):], {})
            if not weight.get("gguf_ready"):
                raise AutomationError(weight.get("gguf_reason") or weight.get("reason") or "Ollama GGUF 원본이 없습니다")
            if not weight.get("quantization"):
                raise AutomationError("Ollama GGUF 양자화 값을 확인할 수 없습니다")
            resolved = {"model_path": weight["model_path"], "revision": weight["revision"], "quantization": weight["quantization"], "weight_format": "GGUF"}
            if entry["engine"] != "llama.cpp":
                resolved.update(self.inspect_gguf_tokenizer(entry))
            return resolved
        path = Path(value)
        if not path.is_absolute():
            raise AutomationError("model_path는 서버의 로컬 절대 경로여야 합니다")
        gguf = entry["engine"] == "llama.cpp" or entry.get("weight_format") == "GGUF"
        key = (gguf, str(path), entry.get("tokenizer_path") if entry["engine"] != "llama.cpp" and gguf else None)
        if key in self.weight_cache:
            expected = entry.get("quantization")
            if expected and expected != "auto" and expected != self.weight_cache[key]["quantization"]:
                raise AutomationError("같은 모델 파일의 양자화 설정이 실제 검사 결과와 다릅니다")
            return self.weight_cache[key]
        if gguf:
            if not path.is_file():
                raise AutomationError(f"GGUF 파일이 없습니다: {path}")
            with path.open("rb") as stream:
                if stream.read(4) != b"GGUF":
                    raise AutomationError("지정된 파일이 GGUF가 아닙니다")
            quant = entry.get("quantization")
            if not quant or quant == "auto" or "REPLACE" in quant:
                raise AutomationError("직접 지정한 GGUF는 실제 quantization 값을 설정하세요. Ollama GGUF는 ollama://태그로 자동 확인합니다")
            weight = {"model_path": str(path), "revision": self.fingerprint([path]), "quantization": quant, "weight_format": "GGUF"}
            if entry["engine"] != "llama.cpp":
                weight.update(self.inspect_gguf_tokenizer(entry))
        else:
            config = path / "config.json"
            files = sorted(path.glob("*.safetensors")) if path.is_dir() else []
            if not config.is_file() or not files:
                raise AutomationError(f"config.json과 safetensors 가중치가 있는 로컬 디렉터리가 필요합니다: {path}. Ollama GGUF 경로와 별도로 확인하세요")
            model_config = read_json(config)
            index = path / "model.safetensors.index.json"
            if index.is_file():
                shards = set(read_json(index).get("weight_map", {}).values())
                if any(Path(name).is_absolute() or ".." in Path(name).parts for name in shards):
                    raise AutomationError("가중치 shard는 지정한 모델 디렉터리 안에 있어야 합니다")
                if not shards or any(not (path / name).is_file() for name in shards):
                    raise AutomationError("safetensors index에 있는 가중치 shard가 누락됐습니다")
            quant = model_config.get("quantization_config", {}).get("quant_method", "none")
            explicit = entry.get("quantization")
            if explicit and explicit != "auto" and explicit != quant:
                raise AutomationError(f"설정 quantization={explicit}, config.json quantization={quant} 불일치")
            auxiliary = sorted(path.glob("*.json")) + sorted(path.glob("*.model")) + sorted(path.glob("*.jinja"))
            weight = {"model_path": str(path), "revision": self.fingerprint(files + auxiliary), "quantization": quant, "weight_format": "safetensors"}
        self.weight_cache[key] = weight
        return weight

    def inspect_gguf_tokenizer(self, entry):
        value = entry.get("tokenizer_path")
        if not isinstance(value, str) or not Path(value).is_absolute():
            raise AutomationError("Python GGUF에는 로컬 절대 tokenizer_path가 필요합니다")
        path = Path(value)
        files = [path / "config.json", path / "tokenizer_config.json", path / "tokenizer.json"]
        if any(not file.is_file() for file in files):
            raise AutomationError(f"GGUF tokenizer_path에 config.json·tokenizer_config.json·tokenizer.json이 필요합니다: {path}")
        config = read_json(files[0])
        family = entry["model"].split(":", 1)[0]
        allowed = {family, "gemma3_text"} if family == "gemma3" else {family}
        if config.get("model_type") not in allowed:
            raise AutomationError("GGUF 모델과 tokenizer_path의 model_type이 다릅니다")
        read_json(files[1])
        read_json(files[2])
        auxiliary = sorted(path.glob("*.json")) + sorted(path.glob("*.model")) + sorted(path.glob("*.jinja")) + sorted(path.glob("*.txt"))
        return {"tokenizer_path": str(path), "tokenizer_revision": self.fingerprint(auxiliary)}

    def prepare(self):
        # 준비 단계는 검사와 기록만 수행한다. 패키지·모델을 새로 만들지 않는다.
        template = read_json(self.args.config)
        if not template or not isinstance(template.get("combinations"), list):
            raise AutomationError(f"combinations 배열이 있는 설정 파일이 필요합니다: {self.args.config}")
        entries = []
        seen = set()
        for item in template["combinations"]:
            if not isinstance(item, dict):
                raise AutomationError("각 조합은 JSON 객체여야 합니다")
            key = (item.get("engine"), item.get("model"))
            if key in seen or key[0] not in ENGINES[1:] or key[1] not in MODELS:
                raise AutomationError(f"알 수 없거나 중복된 조합: {key}")
            if not isinstance(item.get("enabled"), bool):
                raise AutomationError("enabled는 true 또는 false여야 합니다")
            seen.add(key)
            if key[0] in self.args.engines and key[1] in self.args.models:
                entries.append(dict(item))
        for engine in self.args.engines:
            if engine != "ollama":
                for model in self.args.models:
                    if (engine, model) not in seen:
                        entries.append({"engine": engine, "model": model, "enabled": False, "reason": "설정 파일에 조합 없음"})
        self.fingerprints = read_json(self.runtime / "model_fingerprints.json", {})
        needs_ollama = "ollama" in self.args.engines or any(item.get("model_path", "").startswith("ollama://") for item in entries if item["enabled"])
        if needs_ollama:
            self.stage("기존 Ollama 모델·GGUF 검사", self.inspect_ollama)
        for entry in entries:
            if not entry["enabled"]:
                continue
            try:
                entry.update(self.inspect_weight(entry))
                entry["version"] = self.runtime_version(entry)
                entry["env"] = {**entry.get("env", {}), "HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1"}
                # CLI 인자 호환성을 검사하되 서버를 기동하지 않는다.
                expression = "const fs=require('fs');const e=JSON.parse(fs.readFileSync(0,'utf8'));const c=require(process.argv[1]);c.validate(e);const s=require(process.argv[2]);new s.OpenAiServer({entry:e,logDir:'.'}).checkRuntime(c.launchSpec(e,{parallel:2,numCtx:4096})).catch(x=>{console.error(x.message);process.exitCode=1});"
                self.run([self.node, "-e", expression, self.scripts / "lib/engine_config.js", self.scripts / "lib/openai_server.js"], input_text=json.dumps(entry), quiet=True, timeout=90)
                self.preparation["engines"][entry["engine"]] = {"ready": True, "version": entry["version"], "command": entry["command"]}
            except (AutomationError, OSError, ValueError, KeyError, TypeError) as error:
                entry.update(enabled=False, reason=self.redact(str(error))[-1500:], inspection_failed=True)
                self.log(f"검사 실패 {entry['engine']}/{entry['model']}: {entry['reason']}")
            self.gpu_idle()
        self.preparation["native_entries"] = entries
        write_json(self.runtime / "model_fingerprints.json", self.fingerprints)
        write_json(self.runtime / "preflight.json", self.preparation)

    def matrix(self):
        entries = self.preparation.get("native_entries", [])
        target = self.runtime / "engines.generated.json"
        write_json(target, {"combinations": entries})
        return target, entries

    def mark_preparation(self, entries):
        for row in self.report["combinations"]:
            if row["engine"] == "ollama":
                runtime = self.preparation["engines"].get("ollama", {})
                weight = self.preparation["ollama_models"].get(row["model"], {})
                ready = runtime.get("ready") and weight.get("ready")
                reason = runtime.get("reason") or weight.get("reason")
                row["status"] = "prepared" if ready else "unavailable"
            else:
                entry = next(item for item in entries if item["engine"] == row["engine"] and item["model"] == row["model"])
                row["status"] = "prepared" if entry["enabled"] else "unavailable" if entry.get("inspection_failed") else "unconfigured"
                reason = entry.get("reason")
            if reason:
                row["reason"] = reason
            self.log(f"{row['engine']}/{row['model']}: {row['status']}" + (f" ({reason})" if reason else ""))
        self.save()

    def benchmark(self, config, entries):
        cfg = json.loads(self.run([self.node, "-e", "process.stdout.write(JSON.stringify(require(process.argv[1]).loadConfig(process.argv[2])))",
                                  self.scripts / "config/load_config.js", self.args.profile], quiet=True)[1])
        base_args = ["--run-date", self.args.run_date, "--profile", self.args.profile]
        # 같은 날짜/try의 Ollama 결과에는 엔진 버전과 가중치가 섞이지 않아야 한다.
        identity_file = self.results / "summary" / f"preparation_{self.args.run_date}_{self.args.profile}.json"
        previous = read_json(identity_file, {})
        for model in self.args.models:
            if "ollama" not in self.args.engines:
                break
            before = previous.get("ollama_models", {}).get(model, {})
            current = self.preparation["ollama_models"].get(model, {})
            old_version = previous.get("engines", {}).get("ollama", {}).get("version")
            version = self.preparation["engines"].get("ollama", {}).get("version")
            if before.get("ready") and current.get("ready") and (before.get("digest") != current.get("digest") or old_version != version):
                raise AutomationError("Ollama 버전 또는 가중치가 기존 결과와 다릅니다. --try try2 등으로 분리하세요")
        write_json(identity_file, self.preparation)
        self.report["preparation_snapshot"] = str(identity_file)
        # Ollama는 조합별 자식 실행으로 한 모델의 실패가 다른 모델 측정을 지우지 않게 한다.
        for row in self.report["combinations"]:
            if row["engine"] != "ollama" or row["status"] != "prepared":
                continue
            try:
                self.gpu_idle()
                self.service_touched = True
                self.run(["sudo", "-n", "systemctl", "start", "ollama"], timeout=90)
                self.wait_ollama()
                actual = {item["name"]: item for item in self.api("/api/tags").get("models", [])}
                if actual.get(row["model"], {}).get("digest") != self.preparation["ollama_models"][row["model"]]["digest"]:
                    raise AutomationError("Ollama 실제 가중치 digest가 준비 기록과 다릅니다")
                if self.api("/api/version")["version"] != self.preparation["engines"]["ollama"]["version"]:
                    raise AutomationError("Ollama 실제 엔진 버전이 준비 기록과 다릅니다")
                code, _ = self.run([self.node, self.scripts / "run_load_test.js", *base_args,
                                    "--models", row["model"], "--server-control", "systemd", "--no-restore"],
                                   check=False, timeout=None)
                if code != 0:
                    row.update(status="failed", reason=f"Ollama 측정 프로세스 exit {code}")
                else:
                    # 실제 run_id를 JS 함수에서 얻어 이름 규칙을 중복 구현하지 않는다.
                    expression = "const r=require(process.argv[1]);const c=require(process.argv[2]).loadConfig(process.argv[3]);process.stdout.write(r.makeRunId(c.models.find(m=>m.tag===process.argv[4]),process.argv[5],process.argv[3]));"
                    run_id = self.run([self.node, "-e", expression, self.scripts / "run_load_test.js",
                                       self.scripts / "config/load_config.js", self.args.profile, row["model"], self.args.run_date], quiet=True)[1]
                    steps = self.results / "raw" / run_id / "steps.jsonl"
                    records = [json.loads(line) for line in steps.read_text(encoding="utf-8").splitlines() if line.strip()] if steps.is_file() else []
                    row.update(run_id=run_id, status=completed_state(records, cfg))
            except Interrupted:
                row.update(status="interrupted", reason="사용자 중단 요청")
                raise
            except CleanupError:
                raise
            except (AutomationError, OSError) as error:
                row.update(status="failed", reason=self.redact(str(error))[-1500:])
            finally:
                try:
                    self.stop_ollama()
                    self.gpu_idle()
                except (AutomationError, OSError) as error:
                    row.update(status="cleanup_failed", reason=str(error))
                    raise CleanupError(str(error)) from error
                finally:
                    self.save()
        native = [engine for engine in self.args.engines if engine != "ollama"]
        if native:
            self.stop_ollama()
            self.gpu_idle()
            matrix_started_ns = time.time_ns()
            code, _ = self.run([self.node, self.scripts / "run_engines.js", "--config", config, *base_args,
                                "--engines", ",".join(native), "--models", ",".join(self.args.models)], check=False, timeout=None)
            self.report["native_exit_code"] = code
            report_file = self.results / "summary" / (f"engine_matrix_{self.args.run_date}" +
                                                       ("_quick" if self.args.profile == "quick" else "") + ".json")
            fresh = report_file.is_file() and report_file.stat().st_mtime_ns >= matrix_started_ns
            matrix = read_json(report_file, {}).get("combinations", []) if fresh else []
            for row in self.report["combinations"]:
                if row["engine"] == "ollama" or row["status"] != "prepared":
                    continue
                result = next((item for item in matrix if item["engine"] == row["engine"] and item["model"] == row["model"]), None)
                expected = next(entry for entry in entries if entry["engine"] == row["engine"] and entry["model"] == row["model"])
                digest = hashlib.sha256(json.dumps(expected, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()
                if result and result.get("config_sha256") == digest:
                    row.update(result)
                else:
                    row.update(status="failed", reason=f"네이티브 측정 결과 없음 (exit {code})")
            self.save()
            self.gpu_idle()

    def summarize(self):
        if not (self.results / "raw").is_dir() or not list((self.results / "raw").glob("*/run_meta.json")):
            self.log("측정 원본이 없어 성능 요약은 생략합니다. 자동 실행 결과 JSON은 저장했습니다.")
            return
        code, _ = self.run([self.node, self.scripts / "summarize.js", "--run-date", self.args.run_date,
                            "--profile", self.args.profile], check=False, timeout=300)
        if code != 0:
            raise AutomationError("결과 요약 실패")

    def restore_service(self):
        if not self.service_touched or not self.original_service:
            return
        self.stop_ollama()
        self.gpu_idle()
        original = self.original_service
        if original["override"] is None:
            self.run(["sudo", "-n", "rm", "-f", "--", OVERRIDE])
        else:
            self.run(["sudo", "-n", "mkdir", "-p", str(Path(OVERRIDE).parent)])
            self.run(["sudo", "-n", "tee", OVERRIDE], input_text=original["override"], quiet=True)
        self.run(["sudo", "-n", "systemctl", "daemon-reload"])
        if self.service_exists():
            current_enabled = self.run(["systemctl", "is-enabled", "--quiet", "ollama"], check=False, quiet=True)[0] == 0
            wanted = original["exists"] and original["enabled"]
            if current_enabled != wanted:
                self.run(["sudo", "-n", "systemctl", "enable" if wanted else "disable", "ollama"])
        if original["active"] and not self.args.no_restore:
            self.run(["sudo", "-n", "systemctl", "start", "ollama"], timeout=90)
            self.wait_ollama()
        original["restored"] = True
        write_json(self.runtime / "ollama_original_state.json", original)
        self.report["ollama_restored"] = {"active": original["active"] and not self.args.no_restore,
                                          "override_restored": True}

    def print_plan(self):
        self.log("Ubuntu 24.04 LTS / T4 1장 / 이미 설치된 엔진·로컬 모델만 사용")
        self.log(f"날짜={self.args.run_date}, try={self.args.try_tag}, profile={self.args.profile}")
        self.log(f"설정={self.args.config}")
        self.log("순서: " + " → ".join(self.args.engines))
        for engine in self.args.engines:
            for model in self.args.models:
                self.log(f"  {engine}/{model}: 검사 → 로딩 → 모델 웜업 → 사용자 웜업·A/B/C 측정 → 종료 → GPU·포트 확인")
        self.log("설치·빌드·모델 다운로드·드라이버 변경 명령은 없습니다.")
        self.log("--check-only: 엔진·모델 검사 후 원래 Ollama 상태를 복원하고 측정하지 않습니다.")
        self.log("--dry-run: 호스트 조회·서비스 변경·결과 쓰기 없이 계획만 출력합니다.")

    def execute(self):
        if self.args.dry_run:
            self.print_plan()
            return 0
        self.validate_host()
        self.acquire()
        self.runtime.mkdir(parents=True, exist_ok=True)
        logs = self.results / "raw/logs"
        logs.mkdir(parents=True, exist_ok=True)
        self.log_file = (logs / f"automation_{self.args.run_date}_{self.args.profile}_{os.getpid()}.log").open("a", encoding="utf-8")
        handlers = {}
        def interrupt(_number, _frame):
            if not self.interrupted:
                self.interrupted = True
                raise Interrupted("사용자 중단 요청")
        for number in (signal.SIGINT, signal.SIGTERM):
            handlers[number] = signal.signal(number, interrupt)
        code = 0
        try:
            self.report["status"] = "running"
            self.save()
            self.capture_service()
            self.stop_ollama()
            self.gpu_idle(0)
            self.stage("설치된 엔진·로컬 모델 검사", self.prepare)
            config, entries = self.matrix()
            self.mark_preparation(entries)
            if self.args.check_only:
                self.report["status"] = "prepared" if all(row["status"] == "prepared" for row in self.report["combinations"]) else "partial_check"
            else:
                self.stage("Ollama → llama.cpp → vLLM → SGLang 순차 측정", lambda: self.benchmark(config, entries))
                self.report["status"] = "done" if all(row["status"] == "done" for row in self.report["combinations"]) and not self.report.get("native_exit_code", 0) else "partial"
            if self.report["status"] not in ("done", "prepared"):
                code = 1
        except Interrupted as error:
            code = 130
            self.report.update(status="interrupted", reason=str(error))
        except CleanupError as error:
            code = 1
            self.report.update(status="cleanup_failed", reason=str(error))
            self.log(f"GPU 정리 실패로 전환 중단: {error}")
        except (AutomationError, OSError, ValueError, KeyError) as error:
            code = 1
            self.report.update(status="failed", reason=self.redact(str(error))[-3000:])
            self.log(f"자동 실행 중단: {error}")
        finally:
            for number in handlers:
                signal.signal(number, signal.SIG_IGN)
            self.interrupted = False  # 중단 이후에도 정리·요약 명령은 실행해야 한다.
            for row in self.report["combinations"]:
                if row["status"] == "pending" or (row["status"] == "prepared" and not self.args.check_only):
                    row.update(status="not_run", reason="이전 단계 중단으로 미실행")
            try:
                if not self.args.check_only:
                    self.stage("결과 요약", self.summarize)
            except (AutomationError, OSError) as error:
                code = code or 1
                self.report["summary_error"] = str(error)
            try:
                self.stage("GPU 해제 확인·Ollama 상태 복원", self.restore_service)
            except (AutomationError, OSError) as error:
                code = code or 1
                self.report.update(status="cleanup_failed", cleanup_error=str(error))
                self.log(f"정리 실패: {error}. GPU 해제 확인 전 Ollama를 다시 시작하지 않습니다.")
            self.report.update(ended_at=iso_now(), exit_code=code)
            self.save()
            self.log(f"자동 실행 결과: {self.report_path} (exit {code})")
            for number, handler in handlers.items():
                signal.signal(number, handler)
            self.log_file.close()
            self.log_file = None
            self.release()
        return code

def main(argv=None):
    try:
        return Automation(parse_args(argv)).execute()
    except (AutomationError, OSError, ValueError) as error:
        print(f"실패: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
