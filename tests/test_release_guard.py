"""Automated regression tests for public manifest, isolated build, and git push guards."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))

from build import build_site  # noqa: E402
from check_release import (  # noqa: E402
    MANIFEST_REL,
    ReleaseCheckError,
    SITE_CONFIG_REL,
    WEB_UI_ASSETS,
    check_artifact,
    check_manifest_sources,
    ensure_git_hooks,
    validate_manifest_data,
)
from check_site import verify_built_site  # noqa: E402
from stage_demo import stage_demo  # noqa: E402


def _make_minimal_sandbox(base: Path) -> Path:
    """Create a self-contained synthetic website repo sandbox with zero real research data."""
    repo = base / 'repo'
    repo.mkdir(parents=True)
    for rel in ('.gitattributes', '.gitignore', 'LICENSE', 'README.md', SITE_CONFIG_REL):
        dst = repo / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / rel, dst)

    for hook in ('pre-commit', 'pre-push'):
        dst = repo / '.githooks' / hook
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / '.githooks' / hook, dst)
        dst.chmod(0o755)

    for tool in ('check_release.py', 'build.py', 'stage_demo.py'):
        dst = repo / 'tools' / tool
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / 'tools' / tool, dst)

    (repo / 'site' / '.nojekyll').parent.mkdir(parents=True, exist_ok=True)
    (repo / 'site' / '.nojekyll').write_bytes(b'')
    for asset in WEB_UI_ASSETS:
        dst = repo / 'site' / 'assets' / asset
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / 'site' / 'assets' / asset, dst)

    # Create one tiny synthetic approved demo under site/evacuation/
    demo_files = {
        'index.html': b'<!doctype html><html><body><a href="report.html">Report</a></body></html>\n',
        'report.html': b'<!doctype html><html><body><a href="export_manifest.json">Provenance</a><a href="README.md">Guide</a></body></html>\n',
        'README.md': b'# Synthetic Demo Guide\n',
        'export_manifest.json': b'{"schema":1,"source_name":"synthetic_baseline"}\n',
        'manifest.json': b'{"schema":1,"default_run":"syn_case","runs":[]}\n',
        'data/syn_case/meta.json': b'{"synthetic":true,"note":"non-research test fixture"}\n',
    }
    file_entries = []
    for rel, raw in sorted(demo_files.items()):
        p = repo / 'site' / 'evacuation' / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(raw)
        file_entries.append({
            'source': f'site/evacuation/{rel}',
            'target': f'evacuation/{rel}',
            'bytes': len(raw),
            'sha256': hashlib.sha256(raw).hexdigest(),
        })

    manifest = {
        'schema': 1,
        'policy': {
            'description': 'Synthetic test manifest',
            'allow_globs': False,
            'allow_directory_wildcards': False,
            'browser_trajectories_are_public': True,
            'allowed_public_refs': ['refs/heads/main'],
        },
        'repository_audit': {'audited_on': '2026-11-18'},
        'demos': [
            {
                'id': 'atrium100',
                'title': {'zh': '测试演示', 'en': 'Synthetic demo'},
                'project_id': 'crowds',
                'mount_prefix': 'evacuation',
                'homepage_entry': {
                    'href': 'evacuation/?lang={lang}',
                    'label': {'zh': '打开建筑疏散演示', 'en': 'Open building evacuation demo'},
                    'caption': {'zh': '测试说明', 'en': 'Synthetic caption'},
                },
                'source_version': {'origin_export': 'synthetic_v1'},
                'entry_pages': ['evacuation/index.html', 'evacuation/report.html'],
                'preserved_downloads': [
                    'evacuation/export_manifest.json',
                    'evacuation/README.md',
                    'evacuation/data/syn_case/meta.json',
                ],
                'files': file_entries,
            }
        ],
    }
    manifest_path = repo / MANIFEST_REL
    manifest_path.write_bytes((json.dumps(manifest, indent=2) + '\n').encode('utf-8'))
    return repo


class ReleaseGuardTests(unittest.TestCase):
    def test_wildcard_rules_rejected_in_manifest(self) -> None:
        bad = {
            'schema': 1,
            'policy': {
                'allow_globs': False,
                'allow_directory_wildcards': False,
                'allowed_public_refs': ['refs/heads/main'],
            },
            'demos': [
                {
                    'id': 'bad-demo',
                    'mount_prefix': 'evacuation',
                    'source_version': {'origin_export': 'v1'},
                    'files': [
                        {
                            'source': 'site/evacuation/data/**',
                            'target': 'evacuation/data/**',
                            'bytes': 10,
                            'sha256': '0' * 64,
                        }
                    ],
                }
            ],
        }
        _, errors = validate_manifest_data(bad)
        self.assertTrue(any('wildcard/glob' in e for e in errors), errors)

        bad_runs = json.loads(json.dumps(bad))
        bad_runs['demos'][0]['files'][0]['source'] = 'runs/exp1/replay.json'
        bad_runs['demos'][0]['files'][0]['target'] = 'evacuation/replay.json'
        _, errors2 = validate_manifest_data(bad_runs)
        self.assertTrue(any('direct experiment directories' in e for e in errors2), errors2)

    def test_untracked_experiment_files_never_enter_isolated_build(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = _make_minimal_sandbox(Path(tmp))
            # Drop synthetic unapproved files in runs/, results/, and even inside site/evacuation/
            (repo / 'runs' / 'exp_new').mkdir(parents=True)
            (repo / 'runs' / 'exp_new' / 'trajectory.csv').write_text('t,x,y\n0,1,2\n', encoding='utf-8')
            (repo / 'results' / 'batch_01').mkdir(parents=True)
            (repo / 'results' / 'batch_01' / 'metrics.json').write_text('{"synthetic":1}\n', encoding='utf-8')
            unapproved_in_site = repo / 'site' / 'evacuation' / 'data' / 'unapproved_case' / 'frames_0000.json'
            unapproved_in_site.parent.mkdir(parents=True)
            unapproved_in_site.write_text('[{"synthetic_unapproved":true}]\n', encoding='utf-8')

            dist = build_site(root=repo, output_dir=repo / 'dist')
            self.assertFalse((dist / 'runs').exists())
            self.assertFalse((dist / 'results').exists())
            self.assertFalse((dist / 'evacuation' / 'data' / 'unapproved_case').exists())
            self.assertEqual(check_artifact(dist, root=repo), [])

    def test_contaminating_artifact_or_replacing_manifest_content_blocks_release(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = _make_minimal_sandbox(Path(tmp))
            dist = build_site(root=repo, output_dir=repo / 'dist')

            # 1) Inject synthetic test file into built artifact
            leaked = dist / 'evacuation' / 'data' / 'synthetic_leak' / 'frames_0000.json'
            leaked.parent.mkdir(parents=True)
            leaked.write_text('[{"synthetic_test_only":true}]\n', encoding='utf-8')
            art_errors = check_artifact(dist, root=repo)
            self.assertTrue(
                any('evacuation/data/synthetic_leak/frames_0000.json' in e for e in art_errors),
                art_errors,
            )

            # Clean injected file, then 2) overwrite an approved source file without manifest review
            shutil.rmtree(leaked.parent)
            self.assertEqual(check_artifact(dist, root=repo), [])

            meta_src = repo / 'site' / 'evacuation' / 'data' / 'syn_case' / 'meta.json'
            meta_src.write_bytes(b'{"synthetic":true,"note":"overwritten_by_new_experiment"}\n')
            src_errors = check_manifest_sources(repo)
            self.assertTrue(
                any('site/evacuation/data/syn_case/meta.json' in e for e in src_errors),
                src_errors,
            )
            with self.assertRaises(ReleaseCheckError):
                build_site(root=repo, output_dir=repo / 'dist')

    def test_git_precommit_and_prepush_block_intermediate_commits_and_side_branches(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            bare = base / 'origin.git'
            subprocess.run(['git', 'init', '--bare', str(bare)], check=True, capture_output=True)

            repo = _make_minimal_sandbox(base)
            subprocess.run(['git', 'init', '-b', 'main'], cwd=repo, check=True, capture_output=True)
            subprocess.run(['git', 'config', 'user.name', 'Test User'], cwd=repo, check=True)
            subprocess.run(['git', 'config', 'user.email', 'test@example.com'], cwd=repo, check=True)
            subprocess.run(['git', 'config', 'commit.gpgsign', 'false'], cwd=repo, check=True)
            subprocess.run(['git', 'remote', 'add', 'origin', str(bare)], cwd=repo, check=True)
            ensure_git_hooks(repo)

            env = {**dict(subprocess.os.environ), 'PYTHON': sys.executable}
            subprocess.run(['git', 'add', '.'], cwd=repo, check=True, env=env)
            subprocess.run(['git', 'commit', '-m', 'Initial clean baseline'], cwd=repo, check=True, env=env, capture_output=True)
            subprocess.run(['git', 'push', '-u', 'origin', 'main'], cwd=repo, check=True, env=env, capture_output=True)

            # A) Force-staging an unapproved experiment file is blocked at pre-commit
            leak_file = repo / 'runs' / 'synthetic_exp' / 'raw_trace.json'
            leak_file.parent.mkdir(parents=True)
            leak_file.write_text('{"synthetic_only": true}\n', encoding='utf-8')
            subprocess.run(['git', 'add', '-f', 'runs/synthetic_exp/raw_trace.json'], cwd=repo, check=True, env=env)
            commit_try = subprocess.run(
                ['git', 'commit', '-m', 'Attempt accidental commit'],
                cwd=repo,
                env=env,
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(commit_try.returncode, 0)
            self.assertIn('runs/synthetic_exp/raw_trace.json', commit_try.stderr)

            # B) Bypass pre-commit in Commit 1, then remove file in Commit 2 so HEAD looks clean;
            #    pre-push MUST still inspect Commit 1 in origin/main..HEAD and block the push!
            subprocess.run(['git', 'commit', '--no-verify', '-m', 'Bypass commit with leak'], cwd=repo, check=True, env=env, capture_output=True)
            subprocess.run(['git', 'rm', '-f', 'runs/synthetic_exp/raw_trace.json'], cwd=repo, check=True, env=env, capture_output=True)
            subprocess.run(['git', 'commit', '--no-verify', '-m', 'Delete leak in later commit'], cwd=repo, check=True, env=env, capture_output=True)

            push_try = subprocess.run(
                ['git', 'push', 'origin', 'main'],
                cwd=repo,
                env=env,
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(push_try.returncode, 0)
            self.assertIn('runs/synthetic_exp/raw_trace.json', push_try.stderr)

            # Reset back to origin/main and test C) pushing to a non-main branch is blocked
            subprocess.run(['git', 'reset', '--hard', 'origin/main'], cwd=repo, check=True, env=env, capture_output=True)
            branch_push = subprocess.run(
                ['git', 'push', 'origin', 'HEAD:refs/heads/private-experiments'],
                cwd=repo,
                env=env,
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(branch_push.returncode, 0)
            self.assertIn('refs/heads/private-experiments', branch_push.stderr)

    def test_stage_demo_publishes_single_selected_case_without_batch_leakage(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            repo = _make_minimal_sandbox(base)
            batch_export = base / 'synthetic_batch_export'
            (batch_export / 'assets').mkdir(parents=True)
            (batch_export / 'index.html').write_text('<!doctype html><html><body>Demo</body></html>\n', encoding='utf-8')
            (batch_export / 'report.html').write_text('<!doctype html><html><body><a href="export_manifest.json">P</a></body></html>\n', encoding='utf-8')
            (batch_export / 'assets' / 'viewer.js').write_text('"use strict";\n', encoding='utf-8')

            for rid, model in [('internal_keep', 'cfs'), ('internal_secret', 'sfm')]:
                d = batch_export / 'data' / rid
                d.mkdir(parents=True)
                (d / 'meta.json').write_text(json.dumps({'id': rid, 'synthetic': True}), encoding='utf-8')
                (d / 'frames_0000.json').write_text('[{"t":0,"p":[]}]', encoding='utf-8')

            (batch_export / 'manifest.json').write_text(json.dumps({
                'schema': 1,
                'default_run': 'internal_secret',
                'chunk_frames': 64,
                'runs': [
                    {
                        'id': 'internal_keep',
                        'variant': 'internal',
                        'model': 'cfs',
                        'available': True,
                        'frame_count': 1,
                        'meta': 'data/internal_keep/meta.json',
                        'chunks': ['data/internal_keep/frames_0000.json'],
                        'metrics': {'status': 'COMPLETE'},
                    },
                    {
                        'id': 'internal_secret',
                        'variant': 'internal',
                        'model': 'sfm',
                        'available': True,
                        'frame_count': 1,
                        'meta': 'data/internal_secret/meta.json',
                        'chunks': ['data/internal_secret/frames_0000.json'],
                        'metrics': {'status': 'COMPLETE'},
                    },
                ],
            }), encoding='utf-8')
            (batch_export / 'export_manifest.json').write_text(json.dumps({
                'schema': 1,
                'source_name': 'synthetic_batch_v1',
                'source_hashes': {
                    'summary.json': 'a' * 64,
                    'internal/cfs/replay.json': 'b' * 64,
                    'internal/sfm/replay.json': 'c' * 64,
                },
            }), encoding='utf-8')

            # Multi-run export without --runs must refuse by default
            with self.assertRaises(ValueError):
                stage_demo(
                    root=repo,
                    demo_id='single-case-demo',
                    mount_prefix='demos/single-case',
                    export_dir=batch_export,
                    origin_version='synthetic_batch_v1',
                    title_zh='单案例测试',
                    title_en='Single-case test',
                    update_manifest=True,
                )

            # Selecting only internal_keep stages ONLY internal_keep and strips internal_secret
            result = stage_demo(
                root=repo,
                demo_id='single-case-demo',
                mount_prefix='demos/single-case',
                export_dir=batch_export,
                origin_version='synthetic_batch_v1 / internal_keep',
                title_zh='单案例测试',
                title_en='Single-case test',
                selected_runs=['internal_keep'],
                update_manifest=True,
            )
            self.assertEqual(result['mode'], 'staged')
            staged_root = repo / 'site' / 'demos' / 'single-case'
            self.assertTrue((staged_root / 'data' / 'internal_keep' / 'meta.json').is_file())
            self.assertFalse((staged_root / 'data' / 'internal_secret').exists())
            staged_exp = json.loads((staged_root / 'export_manifest.json').read_text(encoding='utf-8'))
            self.assertNotIn('internal/sfm/replay.json', staged_exp['source_hashes'])

            dist = build_site(root=repo, output_dir=repo / 'dist')
            self.assertTrue((dist / 'demos' / 'single-case' / 'data' / 'internal_keep' / 'meta.json').is_file())
            self.assertFalse((dist / 'demos' / 'single-case' / 'data' / 'internal_secret').exists())
            self.assertEqual(check_artifact(dist, root=repo), [])

    def test_real_repository_built_artifact_passes_site_check(self) -> None:
        dist = ROOT / 'dist'
        if not dist.is_dir():
            build_site(root=ROOT, output_dir=dist)
        verify_built_site(dist, root=ROOT)


if __name__ == '__main__':
    unittest.main()
