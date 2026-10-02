#!/usr/bin/env python3
"""Export/import only the pinned model files as a verified portable archive.

No model weights are loaded for inference. No network, Hugging Face package,
credentials, original cache layout, or platform-specific Xet path is needed.
"""

import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import re
import sys
import tarfile
import uuid
from datetime import datetime, timezone

import prepare_models as prep


PREFIX = "model_assets/portable/"


def json_bytes(value):
    return (json.dumps(value, indent=2, sort_keys=True) + "\n").encode("utf-8")


def members_for(lock):
    members = {}
    for model in lock["models"]:
        base = PREFIX + model["portable_subdir"] + "/"
        for file in model["files"]:
            members[base + file["path"]] = {**file, "member_path": base + file["path"], "model_id": model["id"]}
        members[base + ".prepared.json"] = {"member_path": base + ".prepared.json", "model_id": model["id"], "role": "receipt"}
    return members


def receipt_for(model, lock, lock_hash):
    return {"schema_version": 1, "id": model["id"], "repository": model["repository"], "revision": model["revision"],
            "model_lock_sha256": lock_hash, "prepared_at": datetime.now(timezone.utc).isoformat(),
            "mode": "pinned_model_archive", "lineage_status": lock["lineage_status"],
            "files": [{**file, "actual_sha256": file["sha256"]} for file in model["files"]]}


def verify_receipt(body, model, lock, lock_hash):
    receipt = json.loads(body.decode("utf-8"))
    expected = {"schema_version": 1, "id": model["id"], "repository": model["repository"], "revision": model["revision"],
                "model_lock_sha256": lock_hash, "lineage_status": lock["lineage_status"]}
    for key, value in expected.items():
        if receipt.get(key) != value:
            raise ValueError(f"Archive preparation receipt mismatch: {model['id']}/{key}")
    if receipt.get("files") != [{**file, "actual_sha256": file["sha256"]} for file in model["files"]]:
        raise ValueError("Archive preparation receipt fingerprints mismatch")


def add_regular(archive, name, size, stream):
    info = tarfile.TarInfo(name)
    info.size = size
    info.mode = 0o644
    info.uid = info.gid = 0
    info.uname = info.gname = ""
    info.mtime = 0
    archive.addfile(info, stream)


def export_models(bundle, root, cache_dir, lock, lock_hash):
    prep.verify_template(root, lock)
    bundle = Path(bundle).resolve()
    bundle.mkdir(parents=True, exist_ok=True)
    archive_path, transfer_path = bundle / "models.tar", bundle / "models.transfer.json"
    if archive_path.exists() or transfer_path.exists():
        raise ValueError("Model archive/transfer already exists; refusing to overwrite")
    sources = {}
    expected = members_for(lock)
    for model in lock["models"]:
        snapshot = Path(cache_dir) / ("models--" + model["repository"].replace("/", "--")) / "snapshots" / model["revision"]
        for file in model["files"]:
            source = prep.inside(cache_dir, snapshot.joinpath(*prep.relative_path(file["path"]).parts))
            if not source.is_file() or source.stat().st_size != file["bytes"] or prep.digest(source) != file["sha256"]:
                raise ValueError(f"Source cache file missing/mismatched: {model['id']}/{file['path']}")
            sources[PREFIX + model["portable_subdir"] + "/" + file["path"]] = source
    temporary = bundle / ("models.tar.partial-" + str(uuid.uuid4()))
    rows = []
    with temporary.open("xb") as output:
        with tarfile.open(fileobj=output, mode="w|", format=tarfile.USTAR_FORMAT) as archive:
            for model in lock["models"]:
                base = PREFIX + model["portable_subdir"] + "/"
                for file in model["files"]:
                    name = base + file["path"]
                    with sources[name].open("rb") as stream:
                        add_regular(archive, name, file["bytes"], stream)
                    rows.append(expected[name])
                name = base + ".prepared.json"
                body = json_bytes(receipt_for(model, lock, lock_hash))
                add_regular(archive, name, len(body), io.BytesIO(body))
                rows.append({**expected[name], "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest()})
    transfer = {"schema_version": 1, "artifact_kind": "pinned_model_archive", "model_lock_sha256": lock_hash,
                "lineage_status": lock["lineage_status"], "archive": {"file": "models.tar", "bytes": temporary.stat().st_size, "sha256": prep.digest(temporary)},
                "models": [{key: model[key] for key in ("id", "repository", "revision", "portable_subdir")} for model in lock["models"]], "files": rows}
    # Verify the byte stream and exact member set before publishing either file.
    verify_archive(temporary, transfer, lock, lock_hash)
    if archive_path.exists() or transfer_path.exists():
        raise ValueError("Destination appeared during export; refusing to replace it")
    os.rename(temporary, archive_path)
    with transfer_path.open("xb") as stream:
        stream.write(json_bytes(transfer))
    return {"status": "exported", "archive": str(archive_path), "transfer": str(transfer_path), "bytes": transfer["archive"]["bytes"], "sha256": transfer["archive"]["sha256"], "member_count": len(rows)}


def transfer_entries(transfer, lock, lock_hash):
    if transfer.get("schema_version") != 1 or transfer.get("artifact_kind") != "pinned_model_archive" or transfer.get("model_lock_sha256") != lock_hash or transfer.get("lineage_status") != lock["lineage_status"]:
        raise ValueError("Transfer manifest does not match the current model lock")
    archive = transfer.get("archive", {})
    if archive.get("file") != "models.tar" or not isinstance(archive.get("bytes"), int) or archive["bytes"] < 1 or not re.fullmatch(r"[a-f0-9]{64}", archive.get("sha256", "")):
        raise ValueError("Archive fingerprint required")
    models = [{key: model[key] for key in ("id", "repository", "revision", "portable_subdir")} for model in lock["models"]]
    if transfer.get("models") != models:
        raise ValueError("Transfer model identities differ from the lock")
    expected = members_for(lock)
    rows = transfer.get("files")
    if not isinstance(rows, list) or len(rows) != len(expected):
        raise ValueError("Exact transfer member allow-list required")
    entries = {}
    for row in rows:
        name = row.get("member_path")
        prep.relative_path(name)
        if name not in expected or name in entries:
            raise ValueError("Unknown/duplicate transfer member")
        for key, value in expected[name].items():
            if row.get(key) != value:
                raise ValueError("Transfer file identity/fingerprint differs from the lock")
        if not isinstance(row.get("bytes"), int) or row["bytes"] < 1 or not re.fullmatch(r"[a-f0-9]{64}", row.get("sha256", "")):
            raise ValueError("Transfer member fingerprint required")
        entries[name] = row
    if set(entries) != set(expected):
        raise ValueError("Missing transfer members")
    return entries


def checked_member(member, entries, seen):
    prep.relative_path(member.name)
    if member.name not in entries or member.name in seen or not member.isreg() or member.pax_headers:
        raise ValueError("Archive contains an unknown, duplicate, or non-regular member")
    expected = entries[member.name]
    if member.size != expected["bytes"]:
        raise ValueError("Archive member size differs from the lock")
    seen.add(member.name)
    return expected


def verify_archive(archive_path, transfer, lock, lock_hash):
    entries = transfer_entries(transfer, lock, lock_hash)
    archive_path = Path(archive_path)
    if not archive_path.is_file() or archive_path.stat().st_size != transfer["archive"]["bytes"] or prep.digest(archive_path) != transfer["archive"]["sha256"]:
        raise ValueError("Archive byte/hash mismatch")
    models = {model["id"]: model for model in lock["models"]}
    seen = set()
    with tarfile.open(archive_path, mode="r|") as archive:
        for member in archive:
            expected = checked_member(member, entries, seen)
            hasher = hashlib.sha256()
            receipt = bytearray() if expected["role"] == "receipt" else None
            if receipt is not None and member.size > 1024 * 1024:
                raise ValueError("Unexpectedly large model receipt")
            stream = archive.extractfile(member)
            for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
                hasher.update(block)
                if receipt is not None:
                    receipt.extend(block)
            if hasher.hexdigest() != expected["sha256"]:
                raise ValueError("Archive member SHA-256 mismatch")
            if receipt is not None:
                verify_receipt(bytes(receipt), models[expected["model_id"]], lock, lock_hash)
    if seen != set(entries):
        raise ValueError("Archive omitted locked members")
    return {"status": "verified", "bytes": archive_path.stat().st_size, "sha256": transfer["archive"]["sha256"], "member_count": len(seen), "lineage_status": lock["lineage_status"]}


def import_models(bundle, root, lock, lock_hash):
    root = Path(root).resolve()
    prep.verify_template(root, lock)
    bundle = Path(bundle).resolve()
    archive_path = bundle / "models.tar"
    transfer = json.loads((bundle / "models.transfer.json").read_text(encoding="utf-8"))
    verified = verify_archive(archive_path, transfer, lock, lock_hash)
    entries = transfer_entries(transfer, lock, lock_hash)
    portable = prep.inside(root, root / "model_assets" / "portable")
    for model in lock["models"]:
        destination = prep.inside(portable, portable / model["portable_subdir"])
        if destination.exists() or destination.is_symlink():
            raise ValueError("Import destination already exists; refusing to overwrite")
    assets = prep.inside(root, root / "model_assets")
    assets.mkdir(parents=True, exist_ok=True)
    staging = prep.inside(assets, assets / (".model-import-" + str(uuid.uuid4())))
    staging.mkdir(exist_ok=False)
    seen = set()
    try:
        with tarfile.open(archive_path, mode="r|") as archive:
            for member in archive:
                expected = checked_member(member, entries, seen)
                relative = member.name[len(PREFIX):]
                target = prep.inside(staging, staging.joinpath(*prep.relative_path(relative).parts))
                target.parent.mkdir(parents=True, exist_ok=True)
                hasher = hashlib.sha256()
                with target.open("xb") as output:
                    stream = archive.extractfile(member)
                    for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
                        hasher.update(block)
                        output.write(block)
                if hasher.hexdigest() != expected["sha256"]:
                    raise ValueError("Archive changed during import; member hash mismatch")
                target.chmod(0o644)
        if seen != set(entries):
            raise ValueError("Archive changed during import; missing members")
        for model in lock["models"]:
            directory = staging / model["portable_subdir"]
            prep.verify_files(directory, model, lock)
            verify_receipt((directory / ".prepared.json").read_bytes(), model, lock, lock_hash)
        portable.mkdir(parents=True, exist_ok=True)
        published = []
        for model in lock["models"]:
            destination = prep.inside(portable, portable / model["portable_subdir"])
            if destination.exists() or destination.is_symlink():
                raise ValueError("Destination appeared during import; refusing to replace it")
            os.rename(staging / model["portable_subdir"], destination)
            published.append(str(destination))
        staging.rmdir()
        return {**verified, "status": "imported", "models": published}
    except Exception as error:
        (staging / ".failed.json").write_bytes(json_bytes({"error": str(error), "ready": False}))
        raise


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--export", dest="export_mode", action="store_true")
    mode.add_argument("--verify", dest="verify_mode", action="store_true")
    mode.add_argument("--import", dest="import_mode", action="store_true")
    parser.add_argument("--bundle", type=Path, required=True)
    parser.add_argument("--root", type=Path, default=prep.DEFAULT_ROOT)
    parser.add_argument("--lock", type=Path, default=prep.DEFAULT_LOCK)
    parser.add_argument("--cache-dir", type=Path)
    args = parser.parse_args(argv)
    lock = prep.validate_lock(json.loads(args.lock.read_text(encoding="utf-8-sig")))
    lock_hash = prep.digest(args.lock)
    if args.export_mode:
        cache = args.cache_dir or args.root.resolve() / "model_assets" / "huggingface" / "hub"
        result = export_models(args.bundle, args.root, cache, lock, lock_hash)
    elif args.import_mode:
        result = import_models(args.bundle, args.root, lock, lock_hash)
    else:
        transfer = json.loads((args.bundle / "models.transfer.json").read_text(encoding="utf-8"))
        result = verify_archive(args.bundle / "models.tar", transfer, lock, lock_hash)
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as error:
        print(f"Model archive operation failed: {error}", file=sys.stderr)
        sys.exit(1)
