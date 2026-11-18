"""Selectively stage an approved standalone demo and register exact SHA-256 hashes.

Never scans experiment directories automatically and never selects a "latest" run.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import shutil
import sys

from check_release import (
    BASELINE_COMMIT,
    MANIFEST_REL,
    ROOT,
    SLUG_RE,
    check_manifest_sources,
    sha256_bytes,
    sha256_file,
    validate_clean_relpath,
    validate_manifest_data,
)

BLOCKED_BATCH_ARTIFACTS = frozenset({
    'actors.json',
    'commands.jsonl',
    'congestion.json',
    'contact_guard.jsonl',
    'crossings.json',
    'execution.json',
    'inflow.json',
    'journeys.json',
    'model.json',
    'native.sqlite',
    'native_ellipse_state.csv',
    'planning.json',
    'preserved_runs.json',
    'progress.json',
    'provenance.json',
    'stair_commands.jsonl',
    'stair_transfers.json',
    'state.json',
    'summary.json',
    'trajectory.csv',
})

BLOCKED_STAGE_SUFFIXES = (
    '.sqlite',
    '.sqlite3',
    '.db',
    '.wal',
    '.shm',
    '.jsonl',
    '.log',
    '.pkl',
    '.npz',
    '.h5',
    '.pdf',
    '.tex',
    '.zip',
)

BLOCKED_STAGE_DIRS = frozenset({
    'source_snapshot',
    'audit_source_snapshot',
    'raw',
    'verification',
    'vadere_interpolation',
})


def _assert_safe_demo_file(rel_posix: str, allow_explicit: set[str] | None = None) -> None:
    validate_clean_relpath(rel_posix, 'demo file')
    if allow_explicit and rel_posix in allow_explicit:
        if rel_posix.lower().endswith(('.sqlite', '.sqlite3', '.db')):
            raise ValueError(f'Native database cannot be published even explicitly: {rel_posix}')
        return
    parts = rel_posix.split('/')
    if any(part in BLOCKED_STAGE_DIRS for part in parts[:-1]):
        raise ValueError(f'Blocked internal/raw experiment directory in {rel_posix!r}')
    name = parts[-1]
    lower = name.lower()
    if name in BLOCKED_BATCH_ARTIFACTS or lower.startswith('pedpy_') or lower.endswith(BLOCKED_STAGE_SUFFIXES):
        raise ValueError(
            f'Refusing raw/detailed experiment artifact {rel_posix!r}; '
            f'keep raw trajectories, logs, configs, and native databases in private research storage.'
        )


def _write_json_compact(path: Path, obj: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = json.dumps(obj, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode('utf-8')
    path.write_bytes(raw)


def _write_manifest_file(root: Path, manifest_obj: dict) -> None:
    validated, errors = validate_manifest_data(manifest_obj, MANIFEST_REL)
    if errors:
        raise ValueError('Invalid manifest generated:\n  - ' + '\n  - '.join(errors))
    target = root / MANIFEST_REL
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes((json.dumps(validated, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))


def init_baseline_manifest(root: Path = ROOT) -> Path:
    evac = root / 'site' / 'evacuation'
    if not evac.is_dir():
        raise FileNotFoundError(f'Baseline directory missing: {evac}')
    replay_manifest = json.loads((evac / 'manifest.json').read_text(encoding='utf-8'))
    export_manifest = json.loads((evac / 'export_manifest.json').read_text(encoding='utf-8'))
    runs = replay_manifest.get('runs', [])
    if len(runs) != 16:
        raise ValueError(f'Expected 16 baseline Atrium 100 runs, found {len(runs)}')
    declared_frames = sum(int(r['frame_count']) for r in runs)
    if declared_frames != 15287:
        raise ValueError(f'Expected 15,287 baseline frames, found {declared_frames}')

    files: list[dict] = []
    for item in sorted((p for p in evac.rglob('*') if p.is_file()), key=lambda p: p.relative_to(root).as_posix()):
        if item.is_symlink():
            raise ValueError(f'Symlink forbidden in baseline: {item}')
        rel_evac = item.relative_to(evac).as_posix()
        _assert_safe_demo_file(rel_evac)
        size, digest = sha256_file(item)
        files.append({
            'source': item.relative_to(root).as_posix(),
            'target': f'evacuation/{rel_evac}',
            'bytes': size,
            'sha256': digest,
        })

    if len(files) != 272:
        raise ValueError(f'Expected 272 baseline Atrium 100 files, found {len(files)}')

    meta_downloads = sorted(f'evacuation/{r["meta"]}' for r in runs if r.get('meta'))
    manifest_obj = {
        'schema': 1,
        'policy': {
            'description': (
                'Explicit file-level allowlist for research demonstrations published on wu-kaixin.github.io. '
                'Only individually listed files with matching byte size and SHA-256 may enter the public '
                'repository or built website artifact.'
            ),
            'allow_globs': False,
            'allow_directory_wildcards': False,
            'browser_trajectories_are_public': True,
            'allowed_public_refs': ['refs/heads/main'],
        },
        'repository_audit': {
            'audited_on': '2026-11-18',
            'public_site_repository': {
                'repository': 'Wu-kaixin/wu-kaixin.github.io',
                'visibility': 'public',
                'pages_build_type': 'workflow',
                'workflow': '.github/workflows/pages.yml',
                'isolated_build_dir': 'dist',
            },
            'research_storage_policy': (
                'Raw trajectories, native databases, full logs, detailed configs, and batch outputs remain '
                'in local research directories or verified private repositories by default; new public demos '
                'must be exported individually and explicitly registered in this manifest.'
            ),
            'historical_public_records': [
                {
                    'commit': BASELINE_COMMIT,
                    'date': '2026-11-06',
                    'ref_status': 'on refs/heads/main',
                    'summary': (
                        'Approved Atrium 100 bilingual static replay baseline (272 presentation files under '
                        f'site/evacuation/, exported from {export_manifest.get("source_name", "atrium100_20261106_delivery_v5")} / site_v2).'
                    ),
                },
                {
                    'commits': ['c0d694391e', 'a33d24630f', '8b539c15db', '75c8233574', '9a7233da3b'],
                    'date': '2026-11-06',
                    'ref_status': (
                        'rewritten out of refs/heads/main by 4027f49414; unreferenced by any branch or tag, '
                        'but commit objects remain cached by exact SHA on GitHub remote'
                    ),
                    'summary': (
                        'Earlier 2026-11-06 pushes prior to profile history cleanup. Recorded explicitly: '
                        '.gitignore and subsequent commits do not retract historical or cached remote Git objects.'
                    ),
                },
            ],
        },
        'demos': [
            {
                'id': 'atrium100',
                'title': {
                    'zh': 'Atrium 100 双层建筑疏散双语交互回放',
                    'en': 'Atrium 100 bilingual two-storey evacuation replay',
                },
                'project_id': 'crowds',
                'mount_prefix': 'evacuation',
                'homepage_entry': {
                    'href': 'evacuation/?lang={lang}',
                    'label': {
                        'zh': '打开建筑疏散演示',
                        'en': 'Open building evacuation demo',
                    },
                    'caption': {
                        'zh': '可交互的仿真回放 · 支持中英文',
                        'en': 'Interactive simulation replay · Chinese and English',
                    },
                },
                'source_version': {
                    'origin_export': f'{export_manifest.get("source_name", "atrium100_20261106_delivery_v5")} / site_v2',
                    'protocol': 'atrium100_two_storey_v4',
                    'seed': 1801,
                    'recorded_cases': 16,
                    'declared_frames': declared_frames,
                    'chunk_frames': int(replay_manifest.get('chunk_frames', 64)),
                    'baseline_commit': BASELINE_COMMIT,
                },
                'entry_pages': [
                    'evacuation/index.html',
                    'evacuation/report.html',
                ],
                'preserved_downloads': [
                    'evacuation/export_manifest.json',
                    'evacuation/README.md',
                    *meta_downloads,
                ],
                'files': files,
            }
        ],
    }
    _write_manifest_file(root, manifest_obj)
    src_errors = check_manifest_sources(root)
    if src_errors:
        raise RuntimeError('\n'.join(src_errors))
    return root / MANIFEST_REL


def _collect_replay_export_plan(
    export_dir: Path,
    selected_runs: list[str] | None,
    allow_all_runs: bool,
) -> tuple[dict[str, bytes], list[str], list[str], dict]:
    manifest_file = export_dir / 'manifest.json'
    replay_manifest = json.loads(manifest_file.read_text(encoding='utf-8'))
    all_runs = replay_manifest.get('runs', [])
    if not isinstance(all_runs, list) or not all_runs:
        raise ValueError(f'{manifest_file}: manifest contains no runs')

    if selected_runs:
        by_id = {r['id']: r for r in all_runs}
        missing = [rid for rid in selected_runs if rid not in by_id]
        if missing:
            raise ValueError(f'Requested run ID(s) not found in {manifest_file}: {", ".join(missing)}')
        chosen_ids = list(dict.fromkeys(selected_runs))
        chosen_runs = [by_id[rid] for rid in chosen_ids]
    else:
        if len(all_runs) > 1 and not allow_all_runs:
            raise ValueError(
                f'Export {export_dir} contains {len(all_runs)} runs; pass --runs <run_id ...> to stage '
                f'only the approved demo case(s), or pass --allow-all-exported-runs if every run is approved.'
            )
        chosen_runs = all_runs

    payloads: dict[str, bytes] = {}
    entry_pages: list[str] = []
    downloads: list[str] = []

    for shell_rel in ('index.html', 'report.html', 'README.md'):
        candidate = export_dir / shell_rel
        if candidate.is_file():
            _assert_safe_demo_file(shell_rel)
            payloads[shell_rel] = candidate.read_bytes()
            if shell_rel.endswith('.html'):
                entry_pages.append(shell_rel)
            if shell_rel == 'README.md':
                downloads.append(shell_rel)

    assets_dir = export_dir / 'assets'
    if assets_dir.is_dir():
        for asset in sorted(p for p in assets_dir.iterdir() if p.is_file()):
            rel = asset.relative_to(export_dir).as_posix()
            _assert_safe_demo_file(rel)
            payloads[rel] = asset.read_bytes()

    for run in chosen_runs:
        for rel in [run.get('meta'), *run.get('chunks', [])]:
            if not rel:
                continue
            _assert_safe_demo_file(rel)
            full = (export_dir / rel).resolve()
            if not full.is_relative_to(export_dir.resolve()) or not full.is_file():
                raise FileNotFoundError(f'Missing referenced replay file in export: {rel}')
            payloads[rel] = full.read_bytes()
        if run.get('meta'):
            downloads.append(run['meta'])

    filtered_manifest = dict(replay_manifest)
    filtered_manifest['runs'] = chosen_runs
    chosen_id_set = {r['id'] for r in chosen_runs}
    if filtered_manifest.get('default_run') not in chosen_id_set:
        filtered_manifest['default_run'] = chosen_runs[0]['id']
    payloads['manifest.json'] = json.dumps(
        filtered_manifest, ensure_ascii=False, separators=(',', ':'), allow_nan=False
    ).encode('utf-8')

    exp_meta_file = export_dir / 'export_manifest.json'
    origin_name = export_dir.name
    if exp_meta_file.is_file():
        exp_meta = json.loads(exp_meta_file.read_text(encoding='utf-8'))
        origin_name = exp_meta.get('source_name', origin_name)
        allowed_prefixes = tuple(f'{r["variant"]}/{r["model"]}/' for r in chosen_runs if 'variant' in r and 'model' in r)
        raw_hashes = exp_meta.get('source_hashes', {})
        filtered_hashes = {
            k: v for k, v in raw_hashes.items()
            if k.startswith(allowed_prefixes) or (len(chosen_runs) == len(all_runs) and k == 'summary.json')
        }
        filtered_exp_meta = {
            **exp_meta,
            'source_hashes': filtered_hashes,
            'selected_runs': [r['id'] for r in chosen_runs],
        }
        payloads['export_manifest.json'] = json.dumps(
            filtered_exp_meta, ensure_ascii=False, separators=(',', ':'), allow_nan=False
        ).encode('utf-8')
        downloads.insert(0, 'export_manifest.json')

    stats = {
        'origin_name': origin_name,
        'recorded_cases': len(chosen_runs),
        'declared_frames': sum(int(r.get('frame_count', 0)) for r in chosen_runs),
        'chunk_frames': int(filtered_manifest.get('chunk_frames', 64)),
    }
    return payloads, entry_pages, downloads, stats


def _collect_explicit_files_plan(
    export_dir: Path,
    explicit_files: list[str],
    allow_explicit: set[str],
) -> tuple[dict[str, bytes], list[str], list[str], dict]:
    if not explicit_files:
        raise ValueError('Specify --files <rel_path ...> when staging a non-manifest static demo.')
    payloads: dict[str, bytes] = {}
    entry_pages: list[str] = []
    for rel in explicit_files:
        _assert_safe_demo_file(rel, allow_explicit=allow_explicit)
        full = (export_dir / rel).resolve()
        if not full.is_relative_to(export_dir.resolve()) or not full.is_file() or full.is_symlink():
            raise FileNotFoundError(f'Invalid or missing explicit demo file: {rel}')
        payloads[rel] = full.read_bytes()
        if rel.endswith('.html'):
            entry_pages.append(rel)
    if not entry_pages:
        raise ValueError('Staged demo must include at least one HTML entry page (e.g. index.html).')
    return payloads, sorted(entry_pages), [], {'origin_name': export_dir.name, 'recorded_cases': 1}


def stage_demo(
    *,
    root: Path,
    demo_id: str,
    mount_prefix: str,
    export_dir: Path,
    origin_version: str,
    title_zh: str,
    title_en: str,
    selected_runs: list[str] | None = None,
    explicit_files: list[str] | None = None,
    allow_explicit: list[str] | None = None,
    allow_all_runs: bool = False,
    project_id: str | None = None,
    homepage_label_zh: str | None = None,
    homepage_label_en: str | None = None,
    homepage_caption_zh: str | None = None,
    homepage_caption_en: str | None = None,
    replace_existing: bool = False,
    update_manifest: bool = False,
) -> dict:
    if not SLUG_RE.fullmatch(demo_id):
        raise ValueError(f'Invalid --demo-id {demo_id!r}')
    mount = validate_clean_relpath(mount_prefix, '--mount')
    export_dir = export_dir.resolve()
    if not export_dir.is_dir():
        raise FileNotFoundError(f'Export source directory not found: {export_dir}')
    if export_dir == root.resolve() or root.resolve() in export_dir.parents:
        raise ValueError('Export source must come from an external directory, not inside the public repo')

    manifest_path = root / MANIFEST_REL
    manifest_obj = json.loads(manifest_path.read_text(encoding='utf-8'))

    dest_dir = root / 'site' / mount
    existing_ids = {d['id'] for d in manifest_obj['demos']}
    if (dest_dir.exists() or demo_id in existing_ids) and not replace_existing:
        raise FileExistsError(
            f'Demo {demo_id!r} or target directory site/{mount} already exists; '
            f'pass --replace-existing-demo only when intentionally updating an approved demo.'
        )

    allow_set = set(allow_explicit or [])
    if (export_dir / 'manifest.json').is_file() and not explicit_files:
        payloads, rel_entries, rel_downloads, stats = _collect_replay_export_plan(
            export_dir, selected_runs, allow_all_runs
        )
    else:
        payloads, rel_entries, rel_downloads, stats = _collect_explicit_files_plan(
            export_dir, explicit_files or [], allow_set
        )

    file_records: list[dict] = []
    for rel in sorted(payloads.keys()):
        raw = payloads[rel]
        file_records.append({
            'source': f'site/{mount}/{rel}',
            'target': f'{mount}/{rel}',
            'bytes': len(raw),
            'sha256': sha256_bytes(raw),
        })

    demo_entry: dict = {
        'id': demo_id,
        'title': {'zh': title_zh, 'en': title_en},
        'mount_prefix': mount,
        'source_version': {
            'origin_export': origin_version or stats['origin_name'],
            **{k: v for k, v in stats.items() if k != 'origin_name'},
        },
        'entry_pages': [f'{mount}/{p}' for p in rel_entries],
        'preserved_downloads': [f'{mount}/{p}' for p in rel_downloads],
        'files': file_records,
    }
    if project_id:
        demo_entry['project_id'] = project_id
    if homepage_label_zh and homepage_label_en:
        demo_entry['homepage_entry'] = {
            'href': f'{mount}/?lang={{lang}}',
            'label': {'zh': homepage_label_zh, 'en': homepage_label_en},
            'caption': {
                'zh': homepage_caption_zh or title_zh,
                'en': homepage_caption_en or title_en,
            },
        }

    if not update_manifest:
        return {
            'mode': 'dry-run',
            'demo_id': demo_id,
            'mount_prefix': mount,
            'file_count': len(file_records),
            'files_preview': [f['target'] for f in file_records[:15]],
        }

    if dest_dir.exists():
        shutil.rmtree(dest_dir)
    for rel, raw in payloads.items():
        out_file = dest_dir / rel
        out_file.parent.mkdir(parents=True, exist_ok=True)
        out_file.write_bytes(raw)

    new_demos = [d for d in manifest_obj['demos'] if d['id'] != demo_id]
    new_demos.append(demo_entry)
    manifest_obj['demos'] = new_demos
    _write_manifest_file(root, manifest_obj)

    src_errors = check_manifest_sources(root)
    if src_errors:
        raise RuntimeError('Post-stage verification failed:\n  - ' + '\n  - '.join(src_errors))

    return {
        'mode': 'staged',
        'demo_id': demo_id,
        'mount_prefix': mount,
        'file_count': len(file_records),
        'manifest': MANIFEST_REL,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT, help='Website repository root.')
    parser.add_argument('--init-baseline', action='store_true', help='Record verified Atrium 100 baseline into public_manifest.json.')
    parser.add_argument('--demo-id', help='Unique slug for the approved demo (e.g. corridor-demo-v1).')
    parser.add_argument('--mount', help='Target URL subpath under website (e.g. demos/corridor-v1).')
    parser.add_argument('--from-export', type=Path, help='Explicit external export directory (never scanned automatically).')
    parser.add_argument('--runs', nargs='+', help='Explicit run ID(s) to extract from a comparison export.')
    parser.add_argument('--allow-all-exported-runs', action='store_true', help='Allow importing all runs when every run in --from-export is approved.')
    parser.add_argument('--files', nargs='+', help='Explicit relative file list when staging a custom static demo.')
    parser.add_argument('--allow-file', nargs='+', default=[], help='Explicitly approved summary files (e.g. summary_metrics.csv).')
    parser.add_argument('--origin-version', default='', help='Provenance/version label recorded in public_manifest.json.')
    parser.add_argument('--title-zh', default='研究演示', help='Chinese demo title.')
    parser.add_argument('--title-en', default='Research demonstration', help='English demo title.')
    parser.add_argument('--project-id', choices=['transport', 'crowds'], help='Optional homepage research card to attach a link.')
    parser.add_argument('--homepage-label-zh', help='Optional Chinese button label on homepage.')
    parser.add_argument('--homepage-label-en', help='Optional English button label on homepage.')
    parser.add_argument('--homepage-caption-zh', help='Optional Chinese caption below homepage button.')
    parser.add_argument('--homepage-caption-en', help='Optional English caption below homepage button.')
    parser.add_argument('--replace-existing-demo', action='store_true', help='Allow replacing an already-registered demo.')
    parser.add_argument('--update-manifest', action='store_true', help='Write staged files and update content/public_manifest.json (omit for dry-run).')
    args = parser.parse_args(argv)

    root = args.root.resolve()
    try:
        if args.init_baseline:
            out = init_baseline_manifest(root)
            print(f'Initialized baseline manifest: {out.relative_to(root).as_posix()} (272 approved files).')
            return 0
        if not args.demo_id or not args.mount or not args.from_export:
            parser.error('Specify --demo-id, --mount, and --from-export (or --init-baseline).')
        summary = stage_demo(
            root=root,
            demo_id=args.demo_id,
            mount_prefix=args.mount,
            export_dir=args.from_export,
            origin_version=args.origin_version,
            title_zh=args.title_zh,
            title_en=args.title_en,
            selected_runs=args.runs,
            explicit_files=args.files,
            allow_explicit=args.allow_file,
            allow_all_runs=args.allow_all_exported_runs,
            project_id=args.project_id,
            homepage_label_zh=args.homepage_label_zh,
            homepage_label_en=args.homepage_label_en,
            homepage_caption_zh=args.homepage_caption_zh,
            homepage_caption_en=args.homepage_caption_en,
            replace_existing=args.replace_existing_demo,
            update_manifest=args.update_manifest,
        )
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return 0
    except Exception as exc:
        print(f'STAGE DEMO BLOCKED: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
