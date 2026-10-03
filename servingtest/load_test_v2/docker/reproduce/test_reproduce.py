#!/usr/bin/env python3
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parent

def load(name):
    spec = importlib.util.spec_from_file_location(name, HERE / (name + '.py'))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m

repro = load('reproduce')
sg = load('setup_sglang')


class ReproductionTests(unittest.TestCase):
    def test_plan_has_no_runtime_calls(self):
        with patch.object(repro, 'run', side_effect=AssertionError('Docker called during plan')):
            plan = repro.Environment().plan(list(repro.ENGINES))
        self.assertFalse(plan['build_required'])
        self.assertFalse(plan['tar_required'])
        self.assertEqual({x['id'] for x in plan['models']}, {'qwen3_4b_gguf_q4km', 'qwen3_4b_awq'})
        self.assertTrue(all('@sha256:' in x for x in plan['images'].values()))

    def test_corrupt_download_cannot_pass(self):
        import hashlib
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / 'weight'
            expected = {'path': 'weight', 'bytes': 4, 'sha256': hashlib.sha256(b'good').hexdigest()}
            repro.copy_download(io.BytesIO(b'good'), p, expected)
            with self.assertRaises(ValueError):
                repro.copy_download(io.BytesIO(b'evil'), p, expected)
            with self.assertRaises(ValueError):
                repro.copy_download(io.BytesIO(b'short'), p, expected)

    def test_changed_image_is_rejected(self):
        expected = [{'reference': 'repo@sha256:old', 'image_id': 'sha256:original'}]
        repro.assert_ready_images(expected, observe=lambda ref: {'image_id': 'sha256:original'})
        with self.assertRaises(ValueError):
            repro.assert_ready_images(expected, observe=lambda ref: {'image_id': 'sha256:different'})

    def test_core_difference_rejects_but_other_versions_are_recordable(self):
        pins = {'sglang_core': {'vllm': '0.8.4'}, 'sglang_cuda_build': '12.4'}
        actual = {'packages': [{'name': 'vllm', 'version': '0.8.4'}, {'name': 'other', 'version': 'new'}],
                  'torch': {'cuda_build': '12.4'}}
        sg.check_core(pins, actual)
        actual['packages'][0]['version'] = '0.9.0'
        with self.assertRaises(RuntimeError):
            sg.check_core(pins, actual)

    def test_gpu_must_be_same_uuid_and_idle(self):
        good = {'uuid': 'GPU-original', 'memory_mib': 0, 'compute_pids': []}
        repro.assert_idle(good, 'GPU-original')
        for change in [{'memory_mib': 1}, {'compute_pids': ['42']}, {'uuid': 'GPU-restarted'}]:
            with self.assertRaises(ValueError):
                repro.assert_idle({**good, **change}, 'GPU-original')

    def stop_fixture(self, root):
        env = repro.Environment.__new__(repro.Environment)
        env.state = Path(root) / '.repro-state'
        directory = env.state / 'sessions' / 'case'
        repro.write(env.state / 'active.json', {'project': 'ubot-repro-123456789abc',
                    'session_directory': str(directory), 'gpu_baseline': {'uuid': 'GPU-original'}})
        commands = []
        def fake_run(command, **kwargs):
            commands.append(command)
            if command[1] == 'ps':
                stdout = 'owned\n'
            elif command[1] == 'inspect':
                stdout = json.dumps([{'Config': {'Labels': {'com.docker.compose.project': 'ubot-repro-123456789abc',
                                                           'io.ubot.llm.reproduction': 'true'}}}])
            else:
                stdout = ''
            return subprocess.CompletedProcess(command, 0, stdout, '')
        return env, commands, fake_run

    def test_stop_requires_three_idle_samples(self):
        with tempfile.TemporaryDirectory() as d:
            env, commands, fake_run = self.stop_fixture(d)
            snapshots = iter([{'uuid': 'GPU-original', 'memory_mib': x, 'compute_pids': []} for x in [10, 0, 0, 0]])
            with patch.object(repro, 'run', side_effect=fake_run), patch.object(repro.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, '', '')), patch.object(repro, 'gpu_snapshot', side_effect=lambda: next(snapshots)), patch.object(repro.time, 'sleep'):
                env.stop()
            self.assertFalse((env.state / 'active.json').exists())
            record = repro.read(env.state / 'sessions/case/session.json')
            self.assertEqual(len(record['release_samples']), 3)
            self.assertEqual([c[1] for c in commands if c[1] in ('stop', 'rm')], ['stop', 'rm'])

    def test_restart_keeps_active_gate(self):
        with tempfile.TemporaryDirectory() as d:
            env, _, fake_run = self.stop_fixture(d)
            with patch.object(repro, 'run', side_effect=fake_run), patch.object(repro.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, '', '')), patch.object(repro, 'gpu_snapshot', return_value={'uuid': 'GPU-new', 'memory_mib': 0, 'compute_pids': []}):
                with self.assertRaises(ValueError):
                    env.stop()
            self.assertTrue((env.state / 'active.json').exists())

    def test_start_all_is_rejected_before_operations(self):
        with patch.object(repro, 'Environment', side_effect=AssertionError('Environment touched')):
            with self.assertRaises(SystemExit):
                repro.main(['start', '--engine', 'all'])


if __name__ == '__main__':
    unittest.main()
