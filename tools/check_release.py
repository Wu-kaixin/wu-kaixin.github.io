"""Release policy and lightweight pre-commit, pre-push, and pre-deploy guards.

Python standard library only. Never modifies or auto-expands public_manifest.json.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_REL = 'content/public_manifest.json'
SITE_CONFIG_REL = 'content/site.json'
DEFAULT_BUILD_REL = 'dist'
BASELINE_COMMIT = '788efc21bec976bf09fa7045bf89a45e24098b14'
ZERO_SHA = '0' * 40

WEB_UI_ASSETS = (
    'app.js',
    'concept-crowd-en-sensing.svg',
    'concept-crowd-en.svg',
    'concept-crowd-zh-sensing.svg',
    'concept-crowd-zh.svg',
    'concept-transport-en-sensing.svg',
    'concept-transport-en.svg',
    'concept-transport-zh-sensing.svg',
    'concept-transport-zh.svg',
    'favicon.svg',
    'portfolio.css',
    'social-card.png',
    'social-card.svg',
    'style.css',
)

GENERATED_WEB_FILES = (
    '.generated-pages.json',
    '.nojekyll',
    'en/index.html',
    'index.html',
    'robots.txt',
    'sitemap.xml',
)

EXACT_REPO_FILES = frozenset({
    '.gitattributes',
    '.gitignore',
    '.github/workflows/pages.yml',
    '.githooks/pre-commit',
    '.githooks/pre-push',
    'LICENSE',
    'README.md',
    MANIFEST_REL,
    SITE_CONFIG_REL,
    'site/.nojekyll',
    *(f'site/assets/{name}' for name in WEB_UI_ASSETS),
})

FORBIDDEN_SITE_CONFIG_KEYS = frozenset({
    'paper',
    'updates',
    'manuscripts',
    'raw_data',
    'runs',
    'results',
})

FORBIDDEN_RAW_SUFFIXES = (
    '.sqlite',
    '.sqlite3',
    '.db',
    '.wal',
    '.shm',
)

GLOB_CHARS = frozenset('*?[]{}')
RESERVED_MOUNT_PREFIXES = frozenset({'en', 'assets'})
HEX64_RE = re.compile(r'^[0-9a-f]{64}$')
SLUG_RE = re.compile(r'^[a-z0-9][a-z0-9_-]*$')
SAFE_CODE_FILE_RE = re.compile(r'^(?:docs/[A-Za-z0-9._-]+\.md|tools/[A-Za-z0-9_-]+\.(?:py|cjs)|tests/[A-Za-z0-9_-]+\.py)$')


class ReleaseCheckError(Exception):
    """Raised when one or more release-guard checks fail."""

    def __init__(self, errors: list[str]):
        self.errors = list(errors)
        super().__init__('\n'.join(self.errors))


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> tuple[int, str]:
    digest = hashlib.sha256()
    total = 0
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            total += len(chunk)
            digest.update(chunk)
    return total, digest.hexdigest()


def validate_clean_relpath(value: object, label: str) -> str:
    if not isinstance(value, str) or not value:
        raise ValueError(f'{label}: must be a non-empty relative path string')
    if '\\' in value or value.startswith('/') or value.endswith('/'):
        raise ValueError(f'{label} ({value!r}): must use normalized POSIX relative path without leading/trailing slash')
    if any(ch in GLOB_CHARS for ch in value):
        raise ValueError(f'{label} ({value!r}): wildcard/glob patterns are forbidden in public manifest')
    pure = PurePosixPath(value)
    if pure.is_absolute() or any(part in ('', '.', '..') for part in pure.parts) or pure.as_posix() != value:
        raise ValueError(f'{label} ({value!r}): invalid or escaping relative path')
    if pure.parts[0] in ('runs', 'results', 'raw', 'experiments'):
        raise ValueError(f'{label} ({value!r}): direct experiment directories (runs/, results/, raw/, experiments/) are forbidden')
    return value


def is_allowed_repo_code_or_asset(path: str) -> bool:
    if path in EXACT_REPO_FILES:
        return True
    if SAFE_CODE_FILE_RE.fullmatch(path):
        return True
    return False


def validate_site_config_bytes(raw: bytes, context: str = SITE_CONFIG_REL) -> list[str]:
    errors: list[str] = []
    try:
        data = json.loads(raw.decode('utf-8'))
    except Exception as exc:
        return [f'{context}: invalid JSON ({exc})']
    if not isinstance(data, dict):
        return [f'{context}: root must be a JSON object']
    forbidden = sorted(FORBIDDEN_SITE_CONFIG_KEYS & data.keys())
    if forbidden:
        errors.append(f'{context}: forbidden unpublished keys present: {", ".join(forbidden)}')
    return errors


def validate_manifest_data(data: object, context: str = MANIFEST_REL) -> tuple[dict, list[str]]:
    errors: list[str] = []
    if not isinstance(data, dict):
        return {}, [f'{context}: manifest root must be a JSON object']
    if data.get('schema') != 1:
        errors.append(f'{context}: unsupported schema {data.get("schema")!r} (expected 1)')
    policy = data.get('policy')
    if not isinstance(policy, dict):
        errors.append(f'{context}: missing policy object')
    else:
        if policy.get('allow_globs') is not False or policy.get('allow_directory_wildcards') is not False:
            errors.append(f'{context}: policy must keep allow_globs=false and allow_directory_wildcards=false')
        allowed_refs = policy.get('allowed_public_refs')
        if allowed_refs != ['refs/heads/main']:
            errors.append(f'{context}: allowed_public_refs must be ["refs/heads/main"], got {allowed_refs!r}')

    demos = data.get('demos')
    if not isinstance(demos, list):
        errors.append(f'{context}: demos must be a list')
        return data, errors

    seen_ids: set[str] = set()
    seen_mounts: set[str] = set()
    seen_sources: set[str] = set()
    seen_targets: set[str] = set()

    for idx, demo in enumerate(demos):
        prefix_ctx = f'{context} demos[{idx}]'
        if not isinstance(demo, dict):
            errors.append(f'{prefix_ctx}: demo entry must be an object')
            continue
        demo_id = demo.get('id')
        if not isinstance(demo_id, str) or not SLUG_RE.fullmatch(demo_id):
            errors.append(f'{prefix_ctx}: invalid demo id {demo_id!r}')
            continue
        if demo_id in seen_ids:
            errors.append(f'{prefix_ctx}: duplicate demo id {demo_id!r}')
        seen_ids.add(demo_id)

        try:
            mount = validate_clean_relpath(demo.get('mount_prefix'), f'{prefix_ctx}.mount_prefix')
        except ValueError as exc:
            errors.append(str(exc))
            continue
        top_seg = mount.split('/', 1)[0]
        if top_seg in RESERVED_MOUNT_PREFIXES:
            errors.append(f'{prefix_ctx}: mount_prefix {mount!r} collides with reserved site path {top_seg!r}')
        if any(mount == prev or mount.startswith(prev + '/') or prev.startswith(mount + '/') for prev in seen_mounts):
            errors.append(f'{prefix_ctx}: overlapping mount_prefix {mount!r}')
        seen_mounts.add(mount)

        source_version = demo.get('source_version')
        if not isinstance(source_version, dict) or not source_version.get('origin_export'):
            errors.append(f'{prefix_ctx} ({demo_id}): source_version.origin_export is required')

        files = demo.get('files')
        if not isinstance(files, list) or not files:
            errors.append(f'{prefix_ctx} ({demo_id}): files must be a non-empty list of explicit file entries')
            continue

        demo_targets: set[str] = set()
        expected_source_prefix = f'site/{mount}/'
        expected_target_prefix = f'{mount}/'

        for f_idx, item in enumerate(files):
            item_ctx = f'{prefix_ctx} ({demo_id}) files[{f_idx}]'
            if not isinstance(item, dict):
                errors.append(f'{item_ctx}: entry must be an object')
                continue
            try:
                src = validate_clean_relpath(item.get('source'), f'{item_ctx}.source')
                dst = validate_clean_relpath(item.get('target'), f'{item_ctx}.target')
            except ValueError as exc:
                errors.append(str(exc))
                continue
            if not src.startswith(expected_source_prefix):
                errors.append(f'{item_ctx}: source {src!r} must live under {expected_source_prefix!r}')
            if not dst.startswith(expected_target_prefix):
                errors.append(f'{item_ctx}: target {dst!r} must live under {expected_target_prefix!r}')
            if src[len(expected_source_prefix):] != dst[len(expected_target_prefix):]:
                errors.append(f'{item_ctx}: relative path mismatch between source {src!r} and target {dst!r}')
            lower = dst.lower()
            if lower.endswith(FORBIDDEN_RAW_SUFFIXES):
                errors.append(f'{item_ctx}: native database file {dst!r} is forbidden in public manifest')
            size = item.get('bytes')
            digest = item.get('sha256')
            if not isinstance(size, int) or isinstance(size, bool) or size < 0:
                errors.append(f'{item_ctx} ({src}): bytes must be a non-negative integer')
            if not isinstance(digest, str) or not HEX64_RE.fullmatch(digest):
                errors.append(f'{item_ctx} ({src}): sha256 must be 64 lowercase hex chars')
            if src in seen_sources:
                errors.append(f'{item_ctx}: duplicate source {src!r}')
            if dst in seen_targets:
                errors.append(f'{item_ctx}: duplicate target {dst!r}')
            seen_sources.add(src)
            seen_targets.add(dst)
            demo_targets.add(dst)

        for field in ('entry_pages', 'preserved_downloads'):
            refs = demo.get(field, [])
            if not isinstance(refs, list):
                errors.append(f'{prefix_ctx} ({demo_id}): {field} must be a list')
                continue
            for ref in refs:
                if ref not in demo_targets:
                    errors.append(f'{prefix_ctx} ({demo_id}): {field} item {ref!r} is missing from demo files')

    return data, errors


def load_manifest(root: Path = ROOT) -> dict:
    manifest_path = root / MANIFEST_REL
    if not manifest_path.is_file():
        raise ReleaseCheckError([f'Missing public manifest: {MANIFEST_REL}'])
    try:
        raw_data = json.loads(manifest_path.read_text(encoding='utf-8'))
    except Exception as exc:
        raise ReleaseCheckError([f'{MANIFEST_REL}: invalid JSON ({exc})']) from exc
    data, errors = validate_manifest_data(raw_data, MANIFEST_REL)
    if errors:
        raise ReleaseCheckError(errors)
    return data


def check_manifest_sources(root: Path = ROOT, manifest: dict | None = None) -> list[str]:
    errors: list[str] = []
    if manifest is None:
        try:
            manifest = load_manifest(root)
        except ReleaseCheckError as exc:
            return exc.errors

    site_cfg = root / SITE_CONFIG_REL
    if not site_cfg.is_file():
        errors.append(f'Missing site config: {SITE_CONFIG_REL}')
    else:
        errors.extend(validate_site_config_bytes(site_cfg.read_bytes(), SITE_CONFIG_REL))

    for demo in manifest['demos']:
        for entry in demo['files']:
            rel = entry['source']
            full = root / rel
            if full.is_symlink():
                errors.append(f'Source file is a symlink (forbidden): {rel}')
                continue
            if not full.is_file():
                errors.append(f'Missing approved source file declared in {MANIFEST_REL}: {rel}')
                continue
            actual_bytes, actual_sha = sha256_file(full)
            if actual_bytes != entry['bytes'] or actual_sha != entry['sha256']:
                errors.append(
                    f'Approved source content modified without manifest review: {rel} '
                    f'(expected sha256={entry["sha256"][:12]}... bytes={entry["bytes"]}, '
                    f'actual sha256={actual_sha[:12]}... bytes={actual_bytes})'
                )
    return errors


def expected_artifact_map(manifest: dict) -> tuple[frozenset[str], dict[str, dict]]:
    web_files = set(GENERATED_WEB_FILES) | {f'assets/{name}' for name in WEB_UI_ASSETS}
    research_targets: dict[str, dict] = {}
    for demo in manifest['demos']:
        for entry in demo['files']:
            research_targets[entry['target']] = entry
    return frozenset(web_files), research_targets


def check_artifact(build_dir: Path, root: Path = ROOT, manifest: dict | None = None) -> list[str]:
    errors: list[str] = []
    if manifest is None:
        try:
            manifest = load_manifest(root)
        except ReleaseCheckError as exc:
            return exc.errors

    build_dir = build_dir.resolve()
    if not build_dir.is_dir():
        return [f'Website build directory does not exist: {build_dir} (run tools/build.py first)']

    web_expected, research_expected = expected_artifact_map(manifest)
    all_expected = web_expected | set(research_expected.keys())

    actual_files: set[str] = set()
    for item in sorted(build_dir.rglob('*')):
        rel = item.relative_to(build_dir).as_posix()
        if item.is_symlink():
            errors.append(f'Forbidden symlink in build artifact: {rel}')
            continue
        if item.is_file():
            actual_files.add(rel)

    unapproved = sorted(actual_files - all_expected)
    for rel in unapproved:
        errors.append(f'Unapproved file in website build artifact ({build_dir.name}/): {rel}')

    missing = sorted(all_expected - actual_files)
    for rel in missing:
        errors.append(f'Missing expected file in website build artifact ({build_dir.name}/): {rel}')

    for rel in sorted(research_expected.keys() & actual_files):
        entry = research_expected[rel]
        actual_bytes, actual_sha = sha256_file(build_dir / rel)
        if actual_bytes != entry['bytes'] or actual_sha != entry['sha256']:
            errors.append(
                f'Artifact file content mismatch against {MANIFEST_REL}: {rel} '
                f'(expected sha256={entry["sha256"][:12]}... bytes={entry["bytes"]}, '
                f'actual sha256={actual_sha[:12]}... bytes={actual_bytes})'
            )

    return errors


class _GitBlobReader:
    """Single-process `git cat-file --batch` reader with in-memory SHA-256 cache."""

    def __init__(self, root: Path):
        self.root = root
        self.cache: dict[str, bytes] = {}
        self.digest_cache: dict[str, tuple[int, str]] = {}
        self.proc = subprocess.Popen(
            ['git', 'cat-file', '--batch'],
            cwd=root,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
        )

    def close(self) -> None:
        if self.proc.stdin and not self.proc.stdin.closed:
            self.proc.stdin.close()
        if self.proc.stdout and not self.proc.stdout.closed:
            self.proc.stdout.close()
        self.proc.wait(timeout=15)

    def __enter__(self) -> '_GitBlobReader':
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()

    def read_raw(self, sha: str) -> bytes:
        if sha in self.cache:
            return self.cache[sha]
        assert self.proc.stdin is not None and self.proc.stdout is not None
        self.proc.stdin.write((sha + '\n').encode('ascii'))
        self.proc.stdin.flush()
        header = self.proc.stdout.readline().decode('ascii', errors='replace').strip()
        parts = header.split()
        if len(parts) < 3 or parts[1] == 'missing':
            raise RuntimeError(f'Git object missing: {sha} ({header})')
        size = int(parts[2])
        payload = self.proc.stdout.read(size)
        self.proc.stdout.read(1)  # trailing LF
        if len(payload) != size:
            raise RuntimeError(f'Short read from git cat-file for {sha}')
        if size <= 2 * 1024 * 1024:
            self.cache[sha] = payload
        return payload

    def size_and_sha256(self, sha: str) -> tuple[int, str]:
        if sha in self.digest_cache:
            return self.digest_cache[sha]
        payload = self.read_raw(sha)
        result = (len(payload), sha256_bytes(payload))
        self.digest_cache[sha] = result
        return result


def _validate_tree_entries(
    entries: dict[str, tuple[str, str]],
    reader: _GitBlobReader,
    label: str,
) -> list[str]:
    errors: list[str] = []
    if MANIFEST_REL not in entries:
        return [f'{label}: missing required {MANIFEST_REL}']
    if SITE_CONFIG_REL not in entries:
        errors.append(f'{label}: missing required {SITE_CONFIG_REL}')
    else:
        cfg_raw = reader.read_raw(entries[SITE_CONFIG_REL][1])
        errors.extend(validate_site_config_bytes(cfg_raw, f'{label}:{SITE_CONFIG_REL}'))

    try:
        manifest_obj = json.loads(reader.read_raw(entries[MANIFEST_REL][1]).decode('utf-8'))
    except Exception as exc:
        return [*errors, f'{label}:{MANIFEST_REL}: invalid JSON ({exc})']

    manifest, m_errors = validate_manifest_data(manifest_obj, f'{label}:{MANIFEST_REL}')
    if m_errors:
        return [*errors, *m_errors]

    approved_sources: dict[str, dict] = {}
    for demo in manifest['demos']:
        for item in demo['files']:
            approved_sources[item['source']] = item

    for path in sorted(entries.keys()):
        mode, blob_sha = entries[path]
        if mode in ('120000', '160000'):
            errors.append(f'{label}: symlink or submodule entry is forbidden in public repository: {path}')
            continue
        if path in approved_sources:
            expected = approved_sources[path]
            size, digest = reader.size_and_sha256(blob_sha)
            if size != expected['bytes'] or digest != expected['sha256']:
                errors.append(
                    f'{label}: research asset hash mismatch against {MANIFEST_REL}: {path} '
                    f'(expected sha256={expected["sha256"][:12]}... bytes={expected["bytes"]}, '
                    f'actual sha256={digest[:12]}... bytes={size})'
                )
        elif not is_allowed_repo_code_or_asset(path):
            errors.append(
                f'{label}: unapproved file in public repository: {path} '
                f'(not an allowed website source file and not listed in {MANIFEST_REL})'
            )

    for src_path in sorted(approved_sources.keys() - entries.keys()):
        errors.append(f'{label}: file listed in {MANIFEST_REL} is missing from repository tree: {src_path}')

    return errors


def check_staged_index(root: Path = ROOT) -> list[str]:
    out = subprocess.check_output(['git', 'ls-files', '--stage', '-z'], cwd=root)
    entries: dict[str, tuple[str, str]] = {}
    for raw_item in out.split(b'\0'):
        if not raw_item:
            continue
        meta, raw_path = raw_item.split(b'\t', 1)
        mode, blob_sha, _stage = meta.decode('ascii').split()
        entries[raw_path.decode('utf-8')] = (mode, blob_sha)
    with _GitBlobReader(root) as reader:
        return _validate_tree_entries(entries, reader, 'staged-index')


def _commit_tree_entries(root: Path, commit: str) -> dict[str, tuple[str, str]]:
    out = subprocess.check_output(['git', 'ls-tree', '-r', '-z', commit], cwd=root)
    entries: dict[str, tuple[str, str]] = {}
    for raw_item in out.split(b'\0'):
        if not raw_item:
            continue
        meta, raw_path = raw_item.split(b'\t', 1)
        mode, _obj_type, blob_sha = meta.decode('ascii').split()
        entries[raw_path.decode('utf-8')] = (mode, blob_sha)
    return entries


def _git_object_exists(root: Path, rev: str) -> bool:
    res = subprocess.run(
        ['git', 'cat-file', '-e', f'{rev}^{{commit}}'],
        cwd=root,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return res.returncode == 0


def _pending_commits_for_range(root: Path, local_sha: str, remote_sha: str | None = None) -> list[str]:
    if remote_sha and remote_sha != ZERO_SHA and _git_object_exists(root, remote_sha):
        out = subprocess.check_output(['git', 'rev-list', '--reverse', f'{remote_sha}..{local_sha}'], cwd=root, text=True)
        commits = [line.strip() for line in out.splitlines() if line.strip()]
        return commits or [local_sha]

    if _git_object_exists(root, 'refs/remotes/origin/main'):
        out = subprocess.check_output(
            ['git', 'rev-list', '--reverse', local_sha, '--not', 'refs/remotes/origin/main'],
            cwd=root,
            text=True,
        )
        commits = [line.strip() for line in out.splitlines() if line.strip()]
        return commits or [local_sha]

    if _git_object_exists(root, BASELINE_COMMIT):
        is_anc = subprocess.run(
            ['git', 'merge-base', '--is-ancestor', BASELINE_COMMIT, local_sha],
            cwd=root,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        ).returncode == 0
        if is_anc:
            out = subprocess.check_output(
                ['git', 'rev-list', '--reverse', f'{BASELINE_COMMIT}..{local_sha}'],
                cwd=root,
                text=True,
            )
            commits = [line.strip() for line in out.splitlines() if line.strip()]
            return commits or [local_sha]

    return [local_sha]


def check_commits(commits: list[str], root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    with _GitBlobReader(root) as reader:
        for commit in commits:
            entries = _commit_tree_entries(root, commit)
            errors.extend(_validate_tree_entries(entries, reader, f'commit {commit[:10]}'))
    return errors


def check_push_lines(push_lines: list[str], root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    try:
        manifest = load_manifest(root)
        allowed_refs = set(manifest['policy']['allowed_public_refs'])
    except ReleaseCheckError as exc:
        allowed_refs = {'refs/heads/main'}
        errors.extend(exc.errors)

    commits_to_inspect: list[str] = []
    seen_commits: set[str] = set()

    current_branch = subprocess.run(
        ['git', 'symbolic-ref', '-q', 'HEAD'],
        cwd=root,
        capture_output=True,
        text=True,
    ).stdout.strip()
    if current_branch and current_branch not in allowed_refs and not push_lines:
        errors.append(
            f'Current branch {current_branch!r} is not an approved public branch '
            f'({sorted(allowed_refs)}); do not use non-main branches on the public repository.'
        )

    if not push_lines:
        if _git_object_exists(root, 'HEAD'):
            for sha in _pending_commits_for_range(root, 'HEAD', None):
                if sha not in seen_commits:
                    seen_commits.add(sha)
                    commits_to_inspect.append(sha)
    else:
        for raw_line in push_lines:
            line = raw_line.strip()
            if not line:
                continue
            parts = line.split()
            if len(parts) != 4:
                errors.append(f'Malformed pre-push ref line: {line!r}')
                continue
            local_ref, local_sha, remote_ref, remote_sha = parts
            if local_sha == ZERO_SHA:
                continue
            if remote_ref not in allowed_refs:
                errors.append(
                    f'Blocked push to unapproved public ref {remote_ref!r} (from {local_ref!r}): '
                    f'public repository only allows {sorted(allowed_refs)} and forbids storing private branches/tags.'
                )
            for sha in _pending_commits_for_range(root, local_sha, remote_sha):
                if sha not in seen_commits:
                    seen_commits.add(sha)
                    commits_to_inspect.append(sha)

    if commits_to_inspect:
        errors.extend(check_commits(commits_to_inspect, root=root))
    return errors


def ensure_git_hooks(root: Path = ROOT) -> bool:
    git_dir = root / '.git'
    hooks_dir = root / '.githooks'
    if not git_dir.exists() or not hooks_dir.is_dir():
        return False
    for hook_name in ('pre-commit', 'pre-push'):
        hook_file = hooks_dir / hook_name
        if hook_file.is_file():
            hook_file.chmod(hook_file.stat().st_mode | 0o111)
    current = subprocess.run(
        ['git', 'config', '--local', '--get', 'core.hooksPath'],
        cwd=root,
        capture_output=True,
        text=True,
    ).stdout.strip()
    if current != '.githooks':
        subprocess.run(['git', 'config', '--local', 'core.hooksPath', '.githooks'], cwd=root, check=True)
    return True


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT, help='Repository root directory.')
    parser.add_argument('--check-manifest', action='store_true', help='Verify public_manifest.json schema and source hashes.')
    parser.add_argument('--check-staged', action='store_true', help='Verify staged Git index before commit.')
    parser.add_argument('--check-commits', action='store_true', help='Verify pending commits ahead of origin/main.')
    parser.add_argument('--check-push', action='store_true', help='Verify git pre-push ref updates from stdin.')
    parser.add_argument('--check-artifact', type=Path, metavar='BUILD_DIR', help='Verify final website build directory before deploy.')
    parser.add_argument('--install-hooks', action='store_true', help='Configure local git core.hooksPath=.githooks.')
    parser.add_argument('hook_args', nargs='*', help='Optional remote_name and remote_url passed by git pre-push.')
    args = parser.parse_args(argv)

    root = args.root.resolve()
    if args.install_hooks:
        ensure_git_hooks(root)

    ran_any = False
    errors: list[str] = []

    if args.check_manifest:
        ran_any = True
        errors.extend(check_manifest_sources(root))

    if args.check_staged:
        ran_any = True
        errors.extend(check_staged_index(root))

    if args.check_commits:
        ran_any = True
        head_sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
        pending = _pending_commits_for_range(root, head_sha, None)
        errors.extend(check_commits(pending, root=root))

    if args.check_push:
        ran_any = True
        stdin_lines = [] if sys.stdin.isatty() else sys.stdin.read().splitlines()
        errors.extend(check_push_lines(stdin_lines, root=root))

    if args.check_artifact is not None:
        ran_any = True
        artifact_dir = args.check_artifact if args.check_artifact.is_absolute() else (root / args.check_artifact)
        errors.extend(check_artifact(artifact_dir, root=root))

    if not ran_any and not args.install_hooks:
        # Default comprehensive local check: manifest + staged index + build artifact.
        errors.extend(check_manifest_sources(root))
        if (root / '.git').exists():
            errors.extend(check_staged_index(root))
        errors.extend(check_artifact(root / DEFAULT_BUILD_REL, root=root))

    if errors:
        print('RELEASE CHECK BLOCKED:', file=sys.stderr)
        for item in errors:
            print(f'  - {item}', file=sys.stderr)
        return 1

    print('PASS: release guard checks succeeded.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
