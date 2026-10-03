#!/usr/bin/env python3
"""Package only the source allow-list after its lock has been finalized."""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import zipfile

import prepare_models as prep


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bundle', type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[3]
    lock_path = root / 'load_test_v2/config/cloud.lock.json'
    lock = json.loads(lock_path.read_text(encoding='utf-8'))
    output = args.bundle.resolve() / 'source.zip'
    if output.exists() or output.with_suffix('.zip.partial').exists():
        raise ValueError('Refuse to replace an existing source package')
    rows = lock['files'] + [{'path': 'load_test_v2/config/cloud.lock.json', 'sha256': prep.digest(lock_path)}]
    if len({row['path'] for row in rows}) != len(rows):
        raise ValueError('Source allow-list contains duplicates')
    with zipfile.ZipFile(output.with_suffix('.zip.partial'), 'x', zipfile.ZIP_DEFLATED) as archive:
        for row in rows:
            file = prep.inside(root, root.joinpath(*prep.relative_path(row['path']).parts))
            content = file.read_bytes()
            if hashlib.sha256(content).hexdigest() != row['sha256']:
                raise ValueError('Frozen source changed: ' + row['path'])
            info = zipfile.ZipInfo(row['path'], (2026, 10, 2, 0, 0, 0))
            info.external_attr = 0o644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, content)
    output.with_suffix('.zip.partial').rename(output)
    receipt = {'schema_version': 1, 'file': 'source.zip', 'bytes': output.stat().st_size,
               'sha256': prep.digest(output), 'source_lock_sha256': prep.digest(lock_path),
               'file_count': len(rows), 'includes_model_weights': False,
               'includes_credentials': False, 'includes_results': False}
    (args.bundle / 'source.transfer.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(receipt))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
