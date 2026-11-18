"""Check built public website links, replay integrity, downloads, and manifest parity."""
from __future__ import annotations

import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))

from check_release import (  # noqa: E402
    DEFAULT_BUILD_REL,
    check_artifact,
    check_manifest_sources,
    ensure_git_hooks,
    load_manifest,
)


class Page(HTMLParser):
    def __init__(self, text: str):
        super().__init__()
        self.links: list[str] = []
        self.ids: list[str] = []
        self.feed(text)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = dict(attrs)
        if attr_map.get('id'):
            self.ids.append(attr_map['id'] or '')
        for key in ('href', 'src'):
            val = attr_map.get(key)
            if val:
                self.links.append(val)


def verify_built_site(site_dir: Path, root: Path = ROOT) -> None:
    root = root.resolve()
    ensure_git_hooks(root)
    site_dir = site_dir.resolve()

    manifest = load_manifest(root)
    errors = [*check_manifest_sources(root, manifest), *check_artifact(site_dir, root=root, manifest=manifest)]
    if errors:
        raise AssertionError('Release guard check failed:\n  - ' + '\n  - '.join(errors))

    pages = {p.resolve(): Page(p.read_text(encoding='utf-8')) for p in site_dir.rglob('*.html')}
    expected_html = {'index.html', 'en/index.html'}
    for demo in manifest['demos']:
        expected_html.update(demo.get('entry_pages', []))

    actual_html = {p.relative_to(site_dir).as_posix() for p in pages}
    assert actual_html == expected_html, f'Unexpected HTML page set: {actual_html ^ expected_html}'

    for path, page in pages.items():
        assert len(page.ids) == len(set(page.ids)), f'Duplicate element IDs in {path}'
        for link in page.links:
            if link.startswith(('http://', 'https://')):
                continue
            parsed = urlsplit(link)
            rel = unquote(parsed.path)
            anchor = parsed.fragment
            target = (path.parent / rel).resolve() if rel else path
            assert target.is_relative_to(site_dir), (path, link)
            if target.is_dir():
                target = target / 'index.html'
            assert target.exists(), (path, link)
            if anchor:
                assert anchor in pages[target].ids, (path, link, anchor)

        if path in {(site_dir / 'index.html').resolve(), (site_dir / 'en/index.html').resolve()}:
            for required in (
                'scholar.google.com/citations?',
                'orcid.org/0009-0009-8963-4432',
                'evacuation/?lang=',
            ):
                assert any(required in link for link in page.links), (path, required)

    for forbidden in ('downloads', 'data', 'evidence', 'research', 'resources', 'research-approach'):
        assert not (site_dir / forbidden).exists(), f'Forbidden root directory in built site: {forbidden}'

    # Verify preserved Atrium 100 baseline replay, comparison page, and download links.
    atrium_entries = [d for d in manifest['demos'] if d['id'] == 'atrium100']
    assert len(atrium_entries) == 1, 'Approved Atrium 100 baseline must remain registered'
    atrium_meta = atrium_entries[0]

    demo_dir = site_dir / atrium_meta['mount_prefix']
    replay_manifest = json.loads((demo_dir / 'manifest.json').read_text(encoding='utf-8'))
    assert len(replay_manifest['runs']) == 16
    assert replay_manifest['default_run'] in {run['id'] for run in replay_manifest['runs']}

    total_frames = 0
    for run in replay_manifest['runs']:
        paths = [run['meta'], *run['chunks']]
        run_frames = 0
        for rel in paths:
            target = (demo_dir / rel).resolve()
            assert target.is_relative_to(demo_dir.resolve()) and target.is_file(), rel
            parsed_json = json.loads(target.read_text(encoding='utf-8'))
            if rel != run['meta']:
                run_frames += len(parsed_json)
        assert run_frames == run['frame_count'], (run['id'], run_frames, run['frame_count'])
        total_frames += run['frame_count']
    assert total_frames == 15287

    # Verify preserved download links (export_manifest.json, README.md, and all 16 per-case meta.json files).
    report_links = set(pages[(demo_dir / 'report.html').resolve()].links)
    assert 'export_manifest.json' in report_links and 'README.md' in report_links
    report_script = (demo_dir / 'assets' / 'site_report.js').read_text(encoding='utf-8')
    assert 'a.href=r.meta' in report_script, 'Per-case metadata download link in report script must be preserved'
    for dl_rel in atrium_meta['preserved_downloads']:
        dl_target = (site_dir / dl_rel).resolve()
        assert dl_target.is_relative_to(site_dir) and dl_target.is_file(), f'Missing preserved download: {dl_rel}'

    assert not list(site_dir.rglob('*.sqlite')) and not list(site_dir.rglob('*.db'))
    print(
        f'PASS: {len(pages)} verified HTML pages in {site_dir.name}/; local links, '
        f'manifest SHA-256 parity ({sum(len(d["files"]) for d in manifest["demos"])} research files), '
        f'16 Atrium 100 cases / 15,287 frames, and preserved download links verified.'
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT, help='Repository root directory.')
    parser.add_argument('--site-dir', type=Path, default=None, help='Built website directory (default: dist/).')
    args = parser.parse_args(argv)
    root = args.root.resolve()
    site_dir = args.site_dir if args.site_dir is not None else (root / DEFAULT_BUILD_REL)
    if not site_dir.is_absolute():
        site_dir = root / site_dir
    try:
        verify_built_site(site_dir, root=root)
        return 0
    except AssertionError as exc:
        print(f'SITE CHECK FAILED: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
