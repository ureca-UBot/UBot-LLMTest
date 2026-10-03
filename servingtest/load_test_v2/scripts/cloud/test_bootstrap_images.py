"""Synthetic tests only: no Docker daemon, registry, models, or remote host."""
import contextlib
import copy
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

import bootstrap_images as bootstrap
import prepare_models as prep


def inspection(image_id):
    return {'Os': 'linux', 'Architecture': 'amd64', 'Created': '2026-10-02T00:00:00Z',
            'RootFS': {'Type': 'layers', 'Layers': ['sha256:' + 'b' * 64]},
            'Config': {'Entrypoint': ['node'], 'Cmd': ['test'], 'Env': ['IMAGE=' + image_id], 'WorkingDir': '/workspace'}}


class MockDocker:
    def __init__(self, images, wrong_loaded=None, wrong_pulled=None, existing=None):
        self.images = {item['id']: item for item in images}
        self.aliases = copy.deepcopy(existing or {})
        self.commands = []
        self.wrong_loaded = wrong_loaded
        self.wrong_pulled = wrong_pulled

    def __call__(self, command):
        self.commands.append(command[:])
        self.assert_prefix(command)
        action = command[3:]
        if action[:2] == ['image', 'load']:
            image_id = Path(action[-1]).stem
            value = inspection(image_id)
            if image_id == self.wrong_loaded:
                value['Config']['Cmd'] = ['tampered']
            self.aliases[self.images[image_id]['reference']] = value
        elif action[:2] == ['image', 'inspect']:
            reference = action[-1]
            if reference not in self.aliases:
                return subprocess.CompletedProcess(command, 1, '', 'Error: No such image: ' + reference)
            return subprocess.CompletedProcess(command, 0, json.dumps([self.aliases[reference]]), '')
        elif action[:2] == ['image', 'pull']:
            if action[2:4] != ['--platform', 'linux/amd64']:
                raise AssertionError('Pull must explicitly target linux/amd64')
            reference = action[-1]
            image_id = next(item['id'] for item in self.images.values() if item['source_digest'] == reference)
            value = inspection(image_id)
            if image_id == self.wrong_pulled:
                value['Config']['Cmd'] = ['tampered']
            self.aliases[reference] = value
        elif action[:2] == ['image', 'tag']:
            self.aliases[action[-1]] = copy.deepcopy(self.aliases[action[-2]])
        else:
            raise AssertionError('Unexpected daemon action: ' + repr(action))
        return subprocess.CompletedProcess(command, 0, '', '')

    def assert_prefix(self, command):
        if command[:3] != ['docker', '--host', 'unix:///var/run/docker.sock']:
            raise AssertionError('Only the local Linux Docker socket is allowed')

    def actions(self, operation):
        return [command for command in self.commands if command[3:5] == ['image', operation]]


class BootstrapTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='serving-bootstrap-mock-')
        self.root = Path(self.temp.name) / 'source'
        self.bundle = Path(self.temp.name) / 'bundle'
        self.root.mkdir()
        self.bundle.mkdir()
        self.config = self.root / 'load_test_v2/config'
        self.config.mkdir(parents=True)
        self.images = []
        rows = []
        for image_id in ['ollama', 'llamacpp', 'vllm', 'sglang', 'runner']:
            item = {'id': image_id, 'reference': 'llm-frozen/' + image_id + ':fixture',
                    'source_digest': 'public/' + image_id + '@sha256:' + 'c' * 64 if image_id in bootstrap.PUBLIC_IDS else None,
                    'platform': 'linux/amd64', 'config_fingerprint': bootstrap.image_fingerprint(inspection(image_id))}
            self.images.append(item)
            file = self.bundle / (image_id + '.tar')
            file.write_bytes(('Synthetic archive ' + image_id).encode())
            rows.append({**item, 'file': file.name, 'bytes': file.stat().st_size, 'sha256': prep.digest(file)})
        self.image_lock = {'schema_version': 1, 'platform': 'linux/amd64', 'images': self.images}
        self.profile = {'candidates': [{'id': candidate, 'engine': bootstrap.ENGINE_NAMES[image_id],
                      'runtime': {'image': next(item['reference'] for item in self.images if item['id'] == image_id)}}
                     for candidate, image_id in bootstrap.CANDIDATES.items()]}
        model_file = Path(__file__).resolve().parents[2] / 'config/models.lock.json'
        self.models = json.loads(model_file.read_text(encoding='utf-8-sig'))
        self.transfer = {'schema_version': 1, 'status': 'completed', 'platform': 'linux/amd64', 'images': rows}
        self.write_transfer()
        self.resign_sources()

    def tearDown(self):
        target = Path(self.temp.name).resolve()
        self.assertIn(Path(tempfile.gettempdir()).resolve(), target.parents)
        self.temp.cleanup()

    def write_transfer(self):
        (self.bundle / 'images.transfer.json').write_text(json.dumps(self.transfer), encoding='utf-8')

    def resign_sources(self):
        for name, value in [('images.lock.json', self.image_lock), ('http.t4.json', self.profile), ('models.lock.json', self.models)]:
            (self.config / name).write_text(json.dumps(value), encoding='utf-8')
        source = self.root / 'load_test_v2/scripts/synthetic.py'
        source.parent.mkdir(parents=True, exist_ok=True)
        if not source.exists():
            source.write_text('# synthetic source\n', encoding='utf-8')
        files = ['load_test_v2/config/' + name for name in ['images.lock.json', 'http.t4.json', 'models.lock.json']]
        files.append('load_test_v2/scripts/synthetic.py')
        frozen = {'schema_version': 1, 'platform': 'linux/amd64', 'images': self.images,
                  'profile_file': 'load_test_v2/config/http.t4.json', 'profile_sha256': prep.digest(self.config / 'http.t4.json'),
                  'models_file': 'load_test_v2/config/models.lock.json', 'models_sha256': prep.digest(self.config / 'models.lock.json'),
                  'files': [{'path': name, 'sha256': prep.digest(self.root / name)} for name in files]}
        (self.config / 'cloud.lock.json').write_text(json.dumps(frozen), encoding='utf-8')

    def invoke(self, flags, docker=None):
        docker = docker or MockDocker(self.images)
        with contextlib.redirect_stdout(io.StringIO()):
            result = bootstrap.main(['--bundle', str(self.bundle)] + flags, root=self.root,
                                    command_runner=docker, runtime_platform='linux')
        return result, docker

    def remove_unselected(self, keep):
        for row in self.transfer['images']:
            if row['id'] not in keep:
                (self.bundle / row['file']).unlink()

    def test_default_keeps_full_archive_mode(self):
        result, docker = self.invoke([])
        self.assertEqual(result['image_count'], 5)
        self.assertEqual(len(docker.actions('load')), 5)
        self.assertEqual(docker.actions('pull'), [])
        self.assertFalse(result['inference_run'])

    def test_full_explicit_pull_keeps_custom_archives_and_pulls_three_public_engines(self):
        self.remove_unselected({'sglang', 'runner'})
        result, docker = self.invoke(['--pull'])
        self.assertEqual(result['image_count'], 5)
        self.assertEqual({Path(command[-1]).stem for command in docker.actions('load')}, {'runner', 'sglang'})
        self.assertEqual(len(docker.actions('pull')), 3)
        self.assertEqual(len(docker.actions('tag')), 3)

    def test_selected_archives_allow_unrelated_tar_absence(self):
        self.remove_unselected({'vllm', 'runner'})
        result, docker = self.invoke(['--candidate', 'vllm_s8'])
        self.assertEqual(result['image_count'], 2)
        self.assertEqual({Path(command[-1]).stem for command in docker.actions('load')}, {'vllm', 'runner'})
        self.assertEqual(result['full_identity_count'], 5)

    def test_all_six_candidates_select_correct_engine_and_runner(self):
        for candidate, image_id in bootstrap.CANDIDATES.items():
            result, docker = self.invoke(['--candidate', candidate])
            self.assertEqual(set(result['selected_image_ids']), {image_id, 'runner'})
            self.assertEqual(len(docker.actions('load')), 2)

    def test_selected_public_pull_is_digest_pinned_and_tag_follows_fingerprint(self):
        self.remove_unselected({'runner'})
        result, docker = self.invoke(['--candidate', 'ollama_p4', '--pull'])
        self.assertEqual(len(docker.actions('load')), 1)
        self.assertEqual(len(docker.actions('pull')), 1)
        pull = docker.actions('pull')[0]
        expected = next(item for item in self.images if item['id'] == 'ollama')
        self.assertEqual(pull[-1], expected['source_digest'])
        self.assertEqual(pull[-3:-1], ['--platform', 'linux/amd64'])
        self.assertEqual(len(docker.actions('tag')), 1)
        self.assertEqual(result['archive_count'], 1)

    def test_existing_correct_public_alias_reused_without_registry_pull(self):
        item = next(item for item in self.images if item['id'] == 'vllm')
        docker = MockDocker(self.images, existing={item['reference']: inspection('vllm')})
        self.remove_unselected({'runner'})
        result, docker = self.invoke(['--candidate', 'vllm_s32', '--pull'], docker)
        self.assertEqual(docker.actions('pull'), [])
        self.assertIn({'id': 'vllm', 'preparation': 'existing_frozen_alias_verified'}, result['preparation'])

    def test_custom_sglang_requires_only_custom_and_runner_archives_even_with_pull(self):
        self.remove_unselected({'sglang', 'runner'})
        result, docker = self.invoke(['--candidate', 'sglang_r32', '--pull'])
        self.assertEqual(len(docker.actions('load')), 2)
        self.assertEqual(docker.actions('pull'), [])
        self.assertEqual(result['archive_count'], 2)

    def test_verify_only_never_calls_daemon_or_network_and_reports_public_pending(self):
        self.remove_unselected({'runner'})
        docker = MockDocker(self.images)
        result, docker = self.invoke(['--candidate', 'llamacpp_p4', '--pull', '--verify-only'], docker)
        self.assertEqual(docker.commands, [])
        self.assertFalse(result['daemon_accessed'])
        self.assertFalse(result['network_accessed'])
        self.assertFalse(result['images_loaded'])
        self.assertEqual(result['public_fingerprint_pending'], ['llamacpp'])

    def test_verify_only_default_still_requires_all_five_archives(self):
        (self.bundle / 'ollama.tar').unlink()
        docker = MockDocker(self.images)
        with self.assertRaisesRegex(ValueError, 'archive differs'):
            self.invoke(['--verify-only'], docker)
        self.assertEqual(docker.commands, [])

    def test_every_selected_archive_is_hashed_before_first_mutation(self):
        (self.bundle / 'sglang.tar').write_bytes(b'tampered')
        docker = MockDocker(self.images)
        with self.assertRaisesRegex(ValueError, 'archive differs'):
            self.invoke(['--candidate', 'sglang_r8'], docker)
        self.assertEqual(docker.commands, [])

    def test_missing_selected_runner_blocks_pull_before_daemon_mutation(self):
        (self.bundle / 'runner.tar').unlink()
        docker = MockDocker(self.images)
        with self.assertRaisesRegex(ValueError, 'archive differs'):
            self.invoke(['--candidate', 'vllm_s8', '--pull'], docker)
        self.assertEqual(docker.commands, [])

    def test_unselected_identity_tampering_is_still_rejected(self):
        self.transfer['images'][3]['config_fingerprint'] = '0' * 64
        self.write_transfer()
        docker = MockDocker(self.images)
        with self.assertRaisesRegex(ValueError, 'source image lock'):
            self.invoke(['--candidate', 'ollama_p4', '--verify-only'], docker)
        self.assertEqual(docker.commands, [])

    def test_unselected_invalid_archive_path_is_still_rejected(self):
        self.transfer['images'][3]['file'] = '../escape.tar'
        self.write_transfer()
        with self.assertRaisesRegex(ValueError, 'archive path'):
            self.invoke(['--candidate', 'ollama_p4', '--verify-only'])

    def test_source_model_profile_and_image_locks_all_remain_guarded(self):
        for file in ['images.lock.json', 'models.lock.json', 'http.t4.json']:
            self.resign_sources()
            (self.config / file).write_text('{}')
            docker = MockDocker(self.images)
            with self.assertRaisesRegex(ValueError, 'Frozen source changed'):
                self.invoke(['--candidate', 'ollama_p4', '--verify-only'], docker)
            self.assertEqual(docker.commands, [])
        self.resign_sources()
        (self.root / 'load_test_v2/scripts/synthetic.py').write_text('changed')
        with self.assertRaisesRegex(ValueError, 'Frozen source changed'):
            self.invoke(['--candidate', 'ollama_p4', '--verify-only'])

    def test_public_source_digest_must_be_full_repository_digest(self):
        self.images[0]['source_digest'] = 'ollama/ollama:latest'
        self.resign_sources()
        docker = MockDocker(self.images)
        with self.assertRaisesRegex(ValueError, 'repository@sha256:64'):
            self.invoke(['--candidate', 'ollama_p4', '--pull'], docker)
        self.assertEqual(docker.commands, [])

    def test_wrong_runner_fingerprint_blocks_public_pull(self):
        docker = MockDocker(self.images, wrong_loaded='runner')
        with self.assertRaisesRegex(ValueError, 'content differs: runner'):
            self.invoke(['--candidate', 'vllm_s8', '--pull'], docker)
        self.assertEqual(docker.actions('pull'), [])
        self.assertEqual(docker.actions('tag'), [])

    def test_wrong_pulled_fingerprint_never_creates_frozen_alias(self):
        docker = MockDocker(self.images, wrong_pulled='vllm')
        with self.assertRaisesRegex(ValueError, 'content differs: vllm'):
            self.invoke(['--candidate', 'vllm_s8', '--pull'], docker)
        self.assertEqual(len(docker.actions('pull')), 1)
        self.assertEqual(docker.actions('tag'), [])

    def test_wrong_existing_alias_is_not_overwritten_or_pulled_again(self):
        item = next(item for item in self.images if item['id'] == 'ollama')
        wrong = inspection('ollama')
        wrong['Config']['Cmd'] = ['wrong']
        docker = MockDocker(self.images, existing={item['reference']: wrong})
        with self.assertRaisesRegex(ValueError, 'content differs: ollama'):
            self.invoke(['--candidate', 'ollama_p4', '--pull'], docker)
        self.assertEqual(docker.actions('pull'), [])
        self.assertEqual(docker.actions('tag'), [])

    def test_unknown_candidate_rejected_without_commands(self):
        docker = MockDocker(self.images)
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit):
                self.invoke(['--candidate', 'unknown'], docker)
        self.assertEqual(docker.commands, [])


if __name__ == '__main__':
    unittest.main(verbosity=2)
