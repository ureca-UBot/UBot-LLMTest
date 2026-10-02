#!/usr/bin/env python3
"""Read package/build metadata without GPU access or model initialization."""
import argparse
import importlib
import importlib.metadata as metadata
import json
from pathlib import Path
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError('Refuse to replace an existing environment inventory')
    inventory = {'python': sys.version, 'gpu_access_requested': False,
                 'model_initialized': False, 'packages': sorted(
                     ({'name': d.metadata['Name'], 'version': d.version}
                      for d in metadata.distributions() if d.metadata['Name']),
                     key=lambda d: d['name'].lower())}
    import torch
    inventory['torch'] = {'version': torch.__version__, 'cuda_build': torch.version.cuda,
                          'compiled_arch_flags': torch._C._cuda_getArchFlags()}
    capabilities = {}
    for module_name in ['sglang.srt.layers.quantization.awq',
                        'vllm.model_executor.layers.quantization.awq',
                        'vllm.model_executor.layers.quantization.awq_marlin',
                        'vllm.model_executor.layers.quantization.auto_awq']:
        try:
            module = importlib.import_module(module_name)
            capabilities[module_name] = {
                name: cls.get_min_capability() for name, cls in vars(module).items()
                if isinstance(cls, type) and cls.__module__ == module_name
                and callable(getattr(cls, 'get_min_capability', None))}
        except (ImportError, AttributeError, RuntimeError) as error:
            capabilities[module_name] = {'unavailable': str(error)}
    inventory['quantization_min_capability'] = capabilities
    inventory['pip_freeze'] = subprocess.check_output(
        [sys.executable, '-m', 'pip', 'freeze'], text=True).splitlines()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(inventory, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': 'captured', 'output': str(args.output),
                      'torch': inventory['torch'], 'capabilities': capabilities}))


if __name__ == '__main__':
    main()
