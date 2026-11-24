"""Build Kaixin Wu's bilingual public site into an isolated build directory.

Normal webpage assets are generated/copied explicitly; research demonstration
assets are imported strictly from content/public_manifest.json with SHA-256
verification. Python standard library only.
"""
from __future__ import annotations

import argparse
import html
import json
import os
from pathlib import Path
import re
import shutil

from check_release import (
    DEFAULT_BUILD_REL,
    ROOT,
    SITE_CONFIG_REL,
    WEB_UI_ASSETS,
    ReleaseCheckError,
    check_artifact,
    check_manifest_sources,
    ensure_git_hooks,
    load_manifest,
    validate_site_config_bytes,
)

E = html.escape
SITE_URL_RE = re.compile(r'https?://[A-Za-z0-9.-]+(?::[0-9]+)?(?:/[A-Za-z0-9._~-]+)*/')


def _write_lf(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(text.replace('\r\n', '\n').encode('utf-8'))


def _render_page(config: dict, manifest: dict, site_url: str, lang: str, prefix: str) -> str:
    def t(zh: str, en: str) -> str:
        return zh if lang == 'zh' else en

    def c(value: dict) -> object:
        return value[lang]

    def profile_links(cls: str = 'pf-text-link') -> str:
        return ''.join(
            f'<a class="{cls}" href="{E(p["url"], quote=True)}" target="_blank" rel="noopener noreferrer">'
            f'{E(p["label"])} <span aria-hidden="true">↗</span></a>'
            for p in config['profiles']
        )

    def background() -> str:
        education = ''.join(
            f'<li><span class="pf-cv-date">{E(c(item["period"]))}</span>'
            f'<h4>{E(c(item["institution"]))}</h4><p>{E(c(item["qualification"]))}</p></li>'
            for item in config['education']
        )
        experience = ''.join(
            f'<li><span class="pf-cv-date">{E(c(item["period"]))}</span>'
            f'<h4>{E(c(item["institution"]))}</h4><p class="pf-cv-role">{E(c(item["role"]))}</p>'
            f'<p>{E(c(item["summary"]))}</p></li>'
            for item in config['experience']
        )
        skills = ''.join(
            f'<section><h3>{E(c(group["label"]))}</h3>'
            f'<ul>{"".join("<li>" + E(item) + "</li>" for item in c(group["items"]))}</ul></section>'
            for group in config['skills']
        )
        return (
            f'<div class="pf-background">'
            f'<section aria-labelledby="education-title"><h3 id="education-title">{t("教育背景", "Education")}</h3>'
            f'<ol class="pf-cv-list">{education}</ol></section>'
            f'<section aria-labelledby="experience-title"><h3 id="experience-title">{t("此前研究经历", "Previous research experience")}</h3>'
            f'<ol class="pf-cv-list">{experience}</ol></section></div>'
            f'<div class="pf-skills-grid">{skills}</div>'
        )

    demos_by_project: dict[str, list[dict]] = {}
    for demo in manifest['demos']:
        proj = demo.get('project_id')
        if proj and isinstance(demo.get('homepage_entry'), dict):
            demos_by_project.setdefault(proj, []).append(demo['homepage_entry'])

    headline = c(config['headline'])
    nav = ''.join(
        f'<a href="#{anchor}">{text}</a>'
        for anchor, text in [
            ('research', t('研究方向', 'Research')),
            ('publications', t('已发表论文', 'Publications')),
            ('about', t('关于我', 'About')),
            ('profiles', t('学术档案', 'Profiles')),
        ]
    )
    publications = ''.join(
        f'<article class="pf-publication"><span class="pf-publication-year">{E(p["year"])}</span>'
        f'<div><h3><a href="https://doi.org/{E(p["doi"], quote=True)}" target="_blank" rel="noopener noreferrer">'
        f'{E(p["title"])}<span aria-hidden="true"> ↗</span></a></h3>'
        f'<p>{E(p["authors"])}</p><p class="pf-publication-venue">{E(p["venue"])}</p></div></article>'
        for p in config['publications']
    )

    projects = ''
    for i, p in enumerate(config['projects']):
        kind = 'transport' if p['id'] == 'transport' else 'crowd'
        demo_html = ''
        for entry in demos_by_project.get(p['id'], []):
            href = entry['href'].replace('{lang}', lang)
            button_style = 'primary' if entry.get('primary') else 'secondary'
            demo_html += (
                f'<p><a class="button {button_style}" href="{prefix}{E(href, quote=True)}">'
                f'{E(entry["label"][lang])} →</a></p>'
                f'<p>{E(entry["caption"][lang])}</p>'
            )
        projects += (
            f'<article class="pf-project {"reverse" if i else ""}">'
            f'<div class="pf-project-art {kind}">'
            f'<div class="pf-art-top"><span>{E(p["acronym"])}</span><span>0{i + 1} / {t("研究概念", "RESEARCH CONCEPT")}</span></div>'
            f'<img src="{prefix}assets/concept-{kind}-{lang}.svg" '
            f'alt="{t("研究主题概念示意，非实验结果", "Concept illustration of the research topic, not experimental results")}" '
            f'width="620" height="440" loading="lazy">'
            f'<div class="pf-art-bottom">{t("研究概念示意", "Research concept illustration")}<span>↗</span></div></div>'
            f'<div class="pf-project-copy"><span class="pf-status"><i></i>{E(c(p["status"]))}</span>'
            f'<h3>{E(c(p["title"]))}</h3><p class="pf-project-subtitle">{E(p["english_title"])}</p>'
            f'<p>{E(c(p["summary"]))}</p>{demo_html}</div></article>'
        )

    rel = '' if lang == 'zh' else 'en/'
    other = 'en/' if lang == 'zh' else '../'
    body = f'''<a class="skip" href="#main">{t('跳至内容','Skip to content')}</a><header class="site-header"><div class="header-inner"><a class="brand" href="./"><img src="{prefix}assets/favicon.svg" width="33" height="33" alt=""><span>KAIXIN WU<small>RESEARCH & EXPLORATION</small></span></a><nav class="main-nav" id="navigation" aria-label="{t('主导航','Main navigation')}">{nav}</nav><div class="header-actions"><a class="lang-switch" href="{other}" aria-label="{t('Switch to English','切换到中文')}">{t('EN','中文')}</a><button class="menu-button" aria-expanded="false" aria-controls="navigation" aria-label="{t('打开导航','Open navigation')}">☰</button></div></div></header>
<main id="main"><section class="pf-hero wrap"><div class="pf-hero-copy"><div class="pf-eyebrow"><i></i>{E(c(config['affiliation']))}</div><p class="pf-name">{E(config['name'])}<span>{E(c(config['role']))}</span></p><h1>{E(headline[0])}<br><em>{E(headline[1])}</em></h1><p class="pf-intro">{E(c(config['introduction']))}</p><div class="hero-buttons"><a class="button primary" href="#research">{t('了解我的研究','Explore my research')} <span>↘</span></a><a class="pf-text-link" href="#profiles">{t('学术档案','Academic profiles')} <span>→</span></a></div><p class="pf-location">HIROSHIMA, JAPAN <span></span> PERCEPTION → COOPERATION</p></div>
<div class="pf-visual" data-concept-root data-prefix="{prefix}" data-language="{lang}"><div class="pf-visual-top"><span>RESEARCH, ILLUSTRATED</span><span data-concept-index>FIG. 01</span></div><img data-concept-image src="{prefix}assets/concept-transport-{lang}.svg" width="620" height="440" alt="{t('机器人协作概念图','Concept illustration of robot cooperation')}"><div class="pf-visual-controls"><div role="group" aria-label="{t('研究示意主题','Research illustration topic')}"><button data-mode="transport" aria-pressed="true" disabled>{t('协同搬运','Transport')}</button><button data-mode="crowd" aria-pressed="false" disabled>{t('人群引导','Guidance')}</button></div><button class="pf-sensing" data-sensing aria-pressed="false" disabled>◎ {t('局部观测','Local sensing')}</button></div><p data-concept-caption>{t('从局部感知，探索群体协作。','Exploring collective action through local perception.')}</p><div class="pf-figure-note">{t('概念示意 · 非实验数据或控制器仿真','Concept illustration · not experimental data or a controller simulation')}</div></div></section>
<div class="pf-topic-strip"><div class="wrap"><span><b>01</b>{t('多智能体系统','Multi-agent systems')}<small>MULTI-AGENT SYSTEMS</small></span><span><b>02</b>{t('机器人协作','Robot cooperation')}<small>ROBOT COOPERATION</small></span><span><b>03</b>{t('人群引导','Crowd guidance')}<small>CROWD GUIDANCE</small></span></div></div>
<section id="research" class="section wrap"><div class="pf-section-heading"><div><span class="eyebrow">01 / CURRENT RESEARCH</span><h2>{t('我正在研究什么。','What I am working on.')}</h2></div></div>{projects}</section>
<section id="publications" class="section wrap pf-publications"><div class="pf-section-heading"><div><span class="eyebrow">02 / PUBLICATIONS</span><h2>{t('已发表论文','Publications')}</h2></div><a class="pf-text-link" href="https://orcid.org/0009-0009-8963-4432" target="_blank" rel="noopener noreferrer">ORCID <span>↗</span></a></div>{publications}</section>
<section id="about" class="section wrap pf-about"><div><span class="eyebrow">03 / ABOUT ME</span><div class="pf-monogram" aria-hidden="true">kw<span>PERCEIVE · COOPERATE · EXPLORE</span></div><p>HIROSHIMA, JAPAN</p></div><div><h2>{t('理解群体，构建协作。','Understanding collectives.<br>Building cooperation.')}</h2>{''.join('<p>'+E(x)+'</p>' for x in c(config['about']))}<div class="about-links"><a class="pf-text-link" href="https://csslab.jp/members/" target="_blank" rel="noopener noreferrer">{t('复杂系统科学研究室','Complex Systems Science Lab')} <span>↗</span></a></div></div>{background()}</section>
<section id="profiles" class="pf-contact wrap"><div><span class="eyebrow">04 / ACADEMIC PROFILES</span><h2>{t('学术档案与联系','Academic profiles & connection')}</h2><p>{t('我的学术档案与公开项目，可从以下入口了解。','Find my academic profiles and public projects below.')}</p></div><div class="profile-links">{profile_links('button secondary')}</div></section></main>
<footer><div class="footer-inner"><a class="footer-brand" href="#main">Kaixin Wu<span>RESEARCH & EXPLORATION</span></a><p>{t('从局部感知，走向群体协作。','Local perception. Collective action.')}</p><small>© 2026 Kaixin Wu</small></div></footer>'''
    return (
        f'''<!doctype html><html lang="{'zh-CN' if lang == 'zh' else 'en'}"><head><meta charset="utf-8">'''
        f'''<meta name="viewport" content="width=device-width,initial-scale=1">'''
        f'''<title>Kaixin Wu · {t('个人研究主页', 'Research & Exploration')}</title>'''
        f'''<meta name="description" content="{E(c(config['introduction']), quote=True)}">'''
        f'''<meta name="theme-color" content="#f7f7f2">'''
        f'''<meta property="og:title" content="Kaixin Wu · Research & Exploration">'''
        f'''<meta property="og:type" content="website">'''
        f'''<meta property="og:image" content="{site_url}assets/social-card.png">'''
        f'''<meta property="og:description" content="{E(c(config['introduction']), quote=True)}">'''
        f'''<link rel="canonical" href="{site_url}{rel}">'''
        f'''<link rel="alternate" hreflang="zh-CN" href="{site_url}">'''
        f'''<link rel="alternate" hreflang="en" href="{site_url}en/">'''
        f'''<link rel="icon" href="{prefix}assets/favicon.svg">'''
        f'''<link rel="stylesheet" href="{prefix}assets/style.css">'''
        f'''<link rel="stylesheet" href="{prefix}assets/portfolio.css">'''
        f'''<script defer src="{prefix}assets/app.js"></script></head>'''
        f'''<body data-language="{lang}">{body}</body></html>'''
    )


def build_site(root: Path = ROOT, output_dir: Path | None = None) -> Path:
    root = root.resolve()
    ensure_git_hooks(root)

    out = (output_dir if output_dir is not None else (root / DEFAULT_BUILD_REL)).resolve()
    protected = {
        root,
        root / 'site',
        root / 'content',
        root / 'tools',
        root / 'tests',
        root / 'docs',
        root / '.git',
    }
    if out in protected or any(p in out.parents for p in (root / 'site', root / 'content', root / '.git')):
        raise ValueError(f'Build output must use an isolated build directory, not {out}')

    site_cfg_bytes = (root / SITE_CONFIG_REL).read_bytes()
    cfg_errors = validate_site_config_bytes(site_cfg_bytes, SITE_CONFIG_REL)
    if cfg_errors:
        raise ReleaseCheckError(cfg_errors)
    config = json.loads(site_cfg_bytes.decode('utf-8'))

    site_url = os.environ.get('SITE_URL', config['site_url']).rstrip('/') + '/'
    if not SITE_URL_RE.fullmatch(site_url):
        raise ValueError(f'Invalid site_url: {site_url!r}')

    manifest = load_manifest(root)
    source_errors = check_manifest_sources(root, manifest)
    if source_errors:
        raise ReleaseCheckError(source_errors)

    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True, exist_ok=True)

    for lang in ('zh', 'en'):
        prefix = './' if lang == 'zh' else '../'
        target = out / ('' if lang == 'zh' else 'en') / 'index.html'
        _write_lf(target, _render_page(config, manifest, site_url, lang, prefix))

    _write_lf(out / '.generated-pages.json', '["index.html", "en/index.html"]\n')
    _write_lf(
        out / 'sitemap.xml',
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        f'<url><loc>{site_url}</loc></url><url><loc>{site_url}en/</loc></url></urlset>',
    )
    _write_lf(out / 'robots.txt', f'User-agent: *\nAllow: /\nSitemap: {site_url}sitemap.xml\n')

    nojekyll_src = root / 'site' / '.nojekyll'
    if nojekyll_src.is_file():
        shutil.copyfile(nojekyll_src, out / '.nojekyll')
    else:
        (out / '.nojekyll').write_bytes(b'')

    assets_out = out / 'assets'
    assets_out.mkdir(parents=True, exist_ok=True)
    for asset_name in WEB_UI_ASSETS:
        src_asset = root / 'site' / 'assets' / asset_name
        if not src_asset.is_file() or src_asset.is_symlink():
            raise FileNotFoundError(f'Missing or invalid webpage UI asset: site/assets/{asset_name}')
        shutil.copyfile(src_asset, assets_out / asset_name)

    imported_files = 0
    for demo in manifest['demos']:
        for item in demo['files']:
            src_file = root / item['source']
            dst_file = out / item['target']
            dst_file.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(src_file, dst_file)
            imported_files += 1

    artifact_errors = check_artifact(out, root=root, manifest=manifest)
    if artifact_errors:
        raise ReleaseCheckError(artifact_errors)

    print(
        f'Built 2 bilingual profile pages into {out.relative_to(root).as_posix() if out.is_relative_to(root) else out}/; '
        f'imported {imported_files} manifest-verified research asset(s) across {len(manifest["demos"])} approved demo(s).'
    )
    return out


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT, help='Repository root directory.')
    parser.add_argument('--output', type=Path, default=None, help='Isolated build output directory (default: dist/).')
    args = parser.parse_args(argv)
    root = args.root.resolve()
    out = (args.output if args.output is None or args.output.is_absolute() else (root / args.output))
    try:
        build_site(root=root, output_dir=out)
        return 0
    except ReleaseCheckError as exc:
        import sys
        print('BUILD BLOCKED BY RELEASE GUARD:', file=sys.stderr)
        for line in exc.errors:
            print(f'  - {line}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
