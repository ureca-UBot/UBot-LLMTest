#!/usr/bin/env python3
"""Materialize pinned HF files into portable, ordinary directories.

Default mode copies an existing local cache without network access. --download
explicitly enables snapshot_download(local_dir=...) with a full revision and
an exact file allow-list. This script never registers or executes a model.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import uuid
from datetime import datetime, timezone


DEFAULT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_LOCK = Path(__file__).resolve().parents[2] / "config" / "models.lock.json"


def digest(path):
    hasher = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            hasher.update(block)
    return hasher.hexdigest()


def relative_path(value):
    if not isinstance(value, str) or not value or "\\" in value or value.startswith("/") or re.match(r"^[A-Za-z]:", value):
        raise ValueError("Only portable relative paths are allowed")
    parts = value.split("/")
    if any(part in ("", ".", "..") for part in parts):
        raise ValueError("Unsafe manifest path")
    return PurePosixPath(value)


def inside(base, path):
    base = Path(base).resolve()
    resolved = Path(path).resolve()
    if resolved == base or base not in resolved.parents:
        raise ValueError("Resolved path escaped its intended directory")
    return resolved


def validate_lock(lock):
    if lock.get("schema_version") != 1 or lock.get("model_family") != "Qwen3-4B":
        raise ValueError("Unsupported model lock schema/family")
    upstream = lock.get("upstream", {})
    if upstream.get("conversion_commit_verified") is not False or lock.get("lineage_status") != "pending_exact_upstream_conversion_commit":
        raise ValueError("Exact conversion lineage must remain explicitly unverified")
    entries = [upstream, lock.get("template", {}).get("source", {})] + lock.get("models", [])
    for entry in entries:
        if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", entry.get("repository", "")) or not re.fullmatch(r"[a-f0-9]{40}", entry.get("revision", "")):
            raise ValueError("Full repository revisions are required")
    template = lock.get("template", {})
    relative_path(template.get("workspace_relative_path"))
    if not re.fullmatch(r"[a-f0-9]{64}", template.get("sha256", "")) or not isinstance(template.get("bytes"), int) or template["bytes"] < 1:
        raise ValueError("Template fingerprint required")
    if not lock.get("models"):
        raise ValueError("Model entries required")
    ids, directories = set(), set()
    for model in lock["models"]:
        if not re.fullmatch(r"[a-z0-9_]+", model.get("id", "")) or model["id"] in ids:
            raise ValueError("Unique model IDs required")
        ids.add(model["id"])
        directory = model.get("portable_subdir", "")
        if not re.fullmatch(r"[A-Za-z0-9_.-]+", directory) or directory in (".", "..") or directory in directories:
            raise ValueError("Unique portable subdirectories required")
        directories.add(directory)
        files = model.get("files", [])
        if not files or not any(file.get("role") == "weight" for file in files):
            raise ValueError("Locked model files and weight required")
        paths = set()
        for file in files:
            relative_path(file.get("path"))
            if file["path"] in paths or not re.fullmatch(r"[a-f0-9]{64}", file.get("sha256", "")) or not isinstance(file.get("bytes"), int) or file["bytes"] < 1:
                raise ValueError("Unique file fingerprints required")
            paths.add(file["path"])
    return lock


def verify_template(root, lock):
    template = lock["template"]
    file = inside(root, Path(root).joinpath(*relative_path(template["workspace_relative_path"]).parts))
    if not file.is_file() or file.stat().st_size != template["bytes"] or digest(file) != template["sha256"]:
        raise ValueError("Pinned chat template byte/hash mismatch")
    return file


def verify_files(directory, model, lock):
    allowed_files = {file["path"] for file in model["files"]} | {".prepared.json"}
    allowed_dirs = {".cache", ".cache/huggingface"}
    for file in model["files"]:
        for parent in relative_path(file["path"]).parents:
            if str(parent) != ".":
                allowed_dirs.add(str(parent))
    for entry in Path(directory).rglob("*"):
        relative = entry.relative_to(directory).as_posix()
        if entry.is_symlink():
            raise ValueError(f"Portable model contains a symlink: {relative}")
        if relative.startswith(".cache/huggingface/"):
            continue
        if entry.is_dir() and relative not in allowed_dirs or entry.is_file() and relative not in allowed_files:
            raise ValueError(f"Unregistered model file/directory: {relative}")
    verified = []
    for file in model["files"]:
        target = inside(directory, Path(directory).joinpath(*relative_path(file["path"]).parts))
        if not target.is_file() or target.stat().st_size != file["bytes"]:
            raise ValueError(f"Missing/size-mismatched file: {model['id']}/{file['path']}")
        actual = digest(target)
        if actual != file["sha256"]:
            raise ValueError(f"SHA-256 mismatch: {model['id']}/{file['path']}")
        verified.append({**file, "actual_sha256": actual})
    if model.get("metadata"):
        config = json.loads((Path(directory) / "config.json").read_text(encoding="utf-8"))
        for key, expected in model["metadata"].items():
            actual = config.get(key)
            # Official AWQ artifacts may spell an omitted module exclusion as
            # null. Only that undeclared null is equivalent; every other key
            # and value remains exact, after all file fingerprints passed.
            if (key == "quantization_config" and isinstance(actual, dict)
                    and isinstance(expected, dict) and "modules_to_not_convert" not in expected
                    and "modules_to_not_convert" in actual and actual["modules_to_not_convert"] is None):
                actual = {name: value for name, value in actual.items() if name != "modules_to_not_convert"}
            if actual != expected:
                raise ValueError(f"Pinned metadata mismatch: {model['id']}/{key}")
    source = lock["template"]["source"]
    if source["repository"] == model["repository"] and source["revision"] == model["revision"]:
        config = json.loads(Path(directory).joinpath(*relative_path(source["path"]).parts).read_text(encoding="utf-8"))
        value = config.get(source["field"])
        if not isinstance(value, str) or hashlib.sha256(value.encode("utf-8")).hexdigest() != lock["template"]["sha256"]:
            raise ValueError("Official tokenizer template field disagrees with the frozen template")
    return verified


def cache_copy(cache_dir, staging, model):
    snapshot = Path(cache_dir) / ("models--" + model["repository"].replace("/", "--")) / "snapshots" / model["revision"]
    for file in model["files"]:
        source = snapshot.joinpath(*relative_path(file["path"]).parts)
        # Resolve standard HF snapshot links through the supplied cache, rather
        # than recording any platform-specific Xet blob path in the lock.
        actual = inside(cache_dir, source)
        if not actual.is_file() or actual.stat().st_size != file["bytes"] or digest(actual) != file["sha256"]:
            raise ValueError(f"Offline cache file missing/mismatched: {source}")
        target = inside(staging, Path(staging).joinpath(*relative_path(file["path"]).parts))
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(actual, target)


def materialize(root, lock, model, cache_dir, download=False, validate_only=False, lock_sha256=None):
    root = Path(root).resolve()
    portable_root = inside(root, root / "model_assets" / "portable")
    destination = inside(portable_root, portable_root / model["portable_subdir"])
    if validate_only:
        files = verify_files(destination, model, lock)
        receipt_path = destination / ".prepared.json"
        if not receipt_path.is_file():
            raise ValueError("Missing preparation receipt; only new preparation may publish readiness")
        receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
        if receipt.get("repository") != model["repository"] or receipt.get("revision") != model["revision"] or receipt.get("model_lock_sha256") != lock_sha256:
            raise ValueError("Preparation receipt does not match the frozen lock")
        return {"id": model["id"], "status": "validated", "path": str(destination), "files": files}
    if destination.exists() or destination.is_symlink():
        raise ValueError(f"Prepared directory already exists; use --validate-only: {destination}")
    portable_root.mkdir(parents=True, exist_ok=True)
    staging = inside(portable_root, portable_root / ("." + model["portable_subdir"] + ".prepare-" + str(uuid.uuid4())))
    staging.mkdir(exist_ok=False)
    try:
        if download:
            try:
                from huggingface_hub import snapshot_download
            except ImportError as error:
                raise ValueError("--download requires huggingface_hub in the preparation Python environment") from error
            snapshot_download(repo_id=model["repository"], revision=model["revision"],
                              allow_patterns=[file["path"] for file in model["files"]],
                              local_dir=str(staging), cache_dir=str(cache_dir) if cache_dir else None,
                              token=False)
            # Ensure portability even with old HF versions that produce links.
            for file in model["files"]:
                target = staging.joinpath(*relative_path(file["path"]).parts)
                if target.is_symlink():
                    source = target.resolve(strict=True)
                    temporary = target.with_name(target.name + ".materialize-" + str(uuid.uuid4()))
                    shutil.copyfile(source, temporary)
                    target.unlink()
                    temporary.replace(target)
        else:
            cache_copy(cache_dir, staging, model)
        files = verify_files(staging, model, lock)
        receipt = {"schema_version": 1, "id": model["id"], "repository": model["repository"],
                   "revision": model["revision"], "model_lock_sha256": lock_sha256,
                   "prepared_at": datetime.now(timezone.utc).isoformat(),
                   "mode": "pinned_snapshot_download" if download else "offline_cache_materialization",
                   "lineage_status": lock["lineage_status"], "files": files}
        (staging / ".prepared.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
        # Publishing a new folder is the last action after every file passes.
        if destination.exists() or destination.is_symlink():
            raise ValueError("Destination appeared during preparation; refusing to replace it")
        os.rename(staging, destination)
        return {"id": model["id"], "status": "prepared", "path": str(destination), "files": files}
    except Exception as error:
        # Keep this uniquely owned, unpublished staging folder for diagnostics.
        (staging / ".failed.json").write_text(json.dumps({"error": str(error), "ready": False}) + "\n", encoding="utf-8")
        raise


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lock", type=Path, default=DEFAULT_LOCK)
    parser.add_argument("--root", type=Path, default=DEFAULT_ROOT)
    parser.add_argument("--model", action="append", help="locked model ID; default all")
    parser.add_argument("--cache-dir", type=Path, help="existing HF hub cache; default root/model_assets/huggingface/hub")
    network = parser.add_mutually_exclusive_group()
    network.add_argument("--download", action="store_true", help="explicitly enable pinned public HF downloads")
    network.add_argument("--offline", action="store_true", help="copy an existing cache without network access (default)")
    parser.add_argument("--validate-only", action="store_true", help="read and hash existing prepared directories")
    args = parser.parse_args(argv)
    lock = validate_lock(json.loads(args.lock.read_text(encoding="utf-8-sig")))
    verify_template(args.root, lock)
    requested = args.model or ["all"]
    if "all" in requested and requested != ["all"]:
        raise ValueError("Use either all or explicit unique model IDs")
    known = {model["id"]: model for model in lock["models"]}
    if requested != ["all"] and (len(set(requested)) != len(requested) or any(model not in known for model in requested)):
        raise ValueError("Unknown/duplicate locked model ID")
    selected = lock["models"] if requested == ["all"] else [known[model] for model in requested]
    cache = args.cache_dir or args.root.resolve() / "model_assets" / "huggingface" / "hub"
    prepared = [materialize(args.root, lock, model, cache, download=args.download,
                            validate_only=args.validate_only, lock_sha256=digest(args.lock)) for model in selected]
    print(json.dumps({"status": "validated" if args.validate_only else "prepared", "model_lock_sha256": digest(args.lock),
                      "lineage_status": lock["lineage_status"], "models": prepared}, indent=2))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as error:
        print(f"Model preparation failed: {error}", file=sys.stderr)
        sys.exit(1)
