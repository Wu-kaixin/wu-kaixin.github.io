"""Build Kaixin Wu's concise bilingual public profile. Python standard library only."""
import html, json, os, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'site'
CONFIG=json.loads((ROOT/'content/site.json').read_text(encoding='utf-8'))
SITE_URL=os.environ.get('SITE_URL',CONFIG['site_url']).rstrip('/')+'/'
assert re.fullmatch(r'https?://[A-Za-z0-9.-]+(?::[0-9]+)?(?:/[A-Za-z0-9._~-]+)*/',SITE_URL), 'Invalid site_url'
E=html.escape

def t(zh,en): return zh if LANG=='zh' else en
def c(value): return value[LANG]
def profile_links(cls='pf-text-link'):
    return ''.join(f'<a class="{cls}" href="{E(p["url"],quote=True)}" target="_blank" rel="noopener noreferrer">{E(p["label"])} <span aria-hidden="true">↗</span></a>' for p in CONFIG['profiles'])
def background():
    education=''.join(f'''<li><span class="pf-cv-date">{E(c(item['period']))}</span><h4>{E(c(item['institution']))}</h4><p>{E(c(item['qualification']))}</p></li>''' for item in CONFIG['education'])
    experience=''.join(f'''<li><span class="pf-cv-date">{E(c(item['period']))}</span><h4>{E(c(item['institution']))}</h4><p class="pf-cv-role">{E(c(item['role']))}</p><p>{E(c(item['summary']))}</p></li>''' for item in CONFIG['experience'])
    skills=''.join(f'''<section><h3>{E(c(group['label']))}</h3><ul>{''.join('<li>'+E(item)+'</li>' for item in c(group['items']))}</ul></section>''' for group in CONFIG['skills'])
    return f'''<div class="pf-background"><section aria-labelledby="education-title"><h3 id="education-title">{t('教育背景','Education')}</h3><ol class="pf-cv-list">{education}</ol></section><section aria-labelledby="experience-title"><h3 id="experience-title">{t('此前研究经历','Previous research experience')}</h3><ol class="pf-cv-list">{experience}</ol></section></div><div class="pf-skills-grid">{skills}</div>'''
def render():
    headline=c(CONFIG['headline'])
    nav=''.join(f'<a href="#{anchor}">{text}</a>' for anchor,text in [('research',t('研究方向','Research')),('publications',t('已发表论文','Publications')),('about',t('关于我','About')),('profiles',t('学术档案','Profiles'))])
    publications=''.join(f'''<article class="pf-publication"><span class="pf-publication-year">{E(p['year'])}</span><div><h3><a href="https://doi.org/{E(p['doi'],quote=True)}" target="_blank" rel="noopener noreferrer">{E(p['title'])}<span aria-hidden="true"> ↗</span></a></h3><p>{E(p['authors'])}</p><p class="pf-publication-venue">{E(p['venue'])}</p></div></article>''' for p in CONFIG['publications'])
    projects=''
    for i,p in enumerate(CONFIG['projects']):
        kind='transport' if p['id']=='transport' else 'crowd'
        projects+=f'''<article class="pf-project {'reverse' if i else ''}"><div class="pf-project-art {kind}"><div class="pf-art-top"><span>{E(p['acronym'])}</span><span>0{i+1} / {t('研究概念','RESEARCH CONCEPT')}</span></div><img src="{PREFIX}assets/concept-{kind}-{LANG}.svg" alt="{t('研究主题概念示意，非实验结果','Concept illustration of the research topic, not experimental results')}" width="620" height="440" loading="lazy"><div class="pf-art-bottom">{t('研究概念示意','Research concept illustration')}<span>↗</span></div></div><div class="pf-project-copy"><span class="pf-status"><i></i>{E(c(p['status']))}</span><h3>{E(c(p['title']))}</h3><p class="pf-project-subtitle">{E(p['english_title'])}</p><p>{E(c(p['summary']))}</p></div></article>'''
    rel='' if LANG=='zh' else 'en/'
    other='en/' if LANG=='zh' else '../'
    body=f'''<a class="skip" href="#main">{t('跳至内容','Skip to content')}</a><header class="site-header"><div class="header-inner"><a class="brand" href="./"><img src="{PREFIX}assets/favicon.svg" width="33" height="33" alt=""><span>KAIXIN WU<small>RESEARCH & EXPLORATION</small></span></a><nav class="main-nav" id="navigation" aria-label="{t('主导航','Main navigation')}">{nav}</nav><div class="header-actions"><a class="lang-switch" href="{other}" aria-label="{t('Switch to English','切换到中文')}">{t('EN','中文')}</a><button class="menu-button" aria-expanded="false" aria-controls="navigation" aria-label="{t('打开导航','Open navigation')}">☰</button></div></div></header>
<main id="main"><section class="pf-hero wrap"><div class="pf-hero-copy"><div class="pf-eyebrow"><i></i>{E(c(CONFIG['affiliation']))}</div><p class="pf-name">{E(CONFIG['name'])}<span>{E(c(CONFIG['role']))}</span></p><h1>{E(headline[0])}<br><em>{E(headline[1])}</em></h1><p class="pf-intro">{E(c(CONFIG['introduction']))}</p><div class="hero-buttons"><a class="button primary" href="#research">{t('了解我的研究','Explore my research')} <span>↘</span></a><a class="pf-text-link" href="#profiles">{t('学术档案','Academic profiles')} <span>→</span></a></div><p class="pf-location">HIROSHIMA, JAPAN <span></span> PERCEPTION → COOPERATION</p></div>
<div class="pf-visual" data-concept-root data-prefix="{PREFIX}" data-language="{LANG}"><div class="pf-visual-top"><span>RESEARCH, ILLUSTRATED</span><span data-concept-index>FIG. 01</span></div><img data-concept-image src="{PREFIX}assets/concept-transport-{LANG}.svg" width="620" height="440" alt="{t('机器人协作概念图','Concept illustration of robot cooperation')}"><div class="pf-visual-controls"><div role="group" aria-label="{t('研究示意主题','Research illustration topic')}"><button data-mode="transport" aria-pressed="true" disabled>{t('协同搬运','Transport')}</button><button data-mode="crowd" aria-pressed="false" disabled>{t('人群引导','Guidance')}</button></div><button class="pf-sensing" data-sensing aria-pressed="false" disabled>◎ {t('局部观测','Local sensing')}</button></div><p data-concept-caption>{t('从局部感知，探索群体协作。','Exploring collective action through local perception.')}</p><div class="pf-figure-note">{t('概念示意 · 非实验数据或控制器仿真','Concept illustration · not experimental data or a controller simulation')}</div></div></section>
<div class="pf-topic-strip"><div class="wrap"><span><b>01</b>{t('多智能体系统','Multi-agent systems')}<small>MULTI-AGENT SYSTEMS</small></span><span><b>02</b>{t('机器人协作','Robot cooperation')}<small>ROBOT COOPERATION</small></span><span><b>03</b>{t('人群引导','Crowd guidance')}<small>CROWD GUIDANCE</small></span></div></div>
<section id="research" class="section wrap"><div class="pf-section-heading"><div><span class="eyebrow">01 / CURRENT RESEARCH</span><h2>{t('我正在研究什么。','What I am working on.')}</h2></div></div>{projects}</section>
<section id="publications" class="section wrap pf-publications"><div class="pf-section-heading"><div><span class="eyebrow">02 / PUBLICATIONS</span><h2>{t('已发表论文','Publications')}</h2></div><a class="pf-text-link" href="https://orcid.org/0009-0009-8963-4432" target="_blank" rel="noopener noreferrer">ORCID <span>↗</span></a></div>{publications}</section>
<section id="about" class="section wrap pf-about"><div><span class="eyebrow">03 / ABOUT ME</span><div class="pf-monogram" aria-hidden="true">kw<span>PERCEIVE · COOPERATE · EXPLORE</span></div><p>HIROSHIMA, JAPAN</p></div><div><h2>{t('理解群体，构建协作。','Understanding collectives.<br>Building cooperation.')}</h2>{''.join('<p>'+E(x)+'</p>' for x in c(CONFIG['about']))}<div class="about-links"><a class="pf-text-link" href="https://csslab.jp/members/" target="_blank" rel="noopener noreferrer">{t('复杂系统科学研究室','Complex Systems Science Lab')} <span>↗</span></a></div></div>{background()}</section>
<section id="profiles" class="pf-contact wrap"><div><span class="eyebrow">04 / ACADEMIC PROFILES</span><h2>{t('学术档案与联系','Academic profiles & connection')}</h2><p>{t('我的学术档案与公开项目，可从以下入口了解。','Find my academic profiles and public projects below.')}</p></div><div class="profile-links">{profile_links('button secondary')}</div></section></main>
<footer><div class="footer-inner"><a class="footer-brand" href="#main">Kaixin Wu<span>RESEARCH & EXPLORATION</span></a><p>{t('从局部感知，走向群体协作。','Local perception. Collective action.')}</p><small>© 2026 Kaixin Wu</small></div></footer>'''
    return f'''<!doctype html><html lang="{'zh-CN' if LANG=='zh' else 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kaixin Wu · {t('个人研究主页','Research & Exploration')}</title><meta name="description" content="{E(c(CONFIG['introduction']),quote=True)}"><meta name="theme-color" content="#f7f7f2"><meta property="og:title" content="Kaixin Wu · Research & Exploration"><meta property="og:type" content="website"><meta property="og:image" content="{SITE_URL}assets/social-card.png"><meta property="og:description" content="{E(c(CONFIG['introduction']),quote=True)}"><link rel="canonical" href="{SITE_URL}{rel}"><link rel="alternate" hreflang="zh-CN" href="{SITE_URL}"><link rel="alternate" hreflang="en" href="{SITE_URL}en/"><link rel="icon" href="{PREFIX}assets/favicon.svg"><link rel="stylesheet" href="{PREFIX}assets/style.css"><link rel="stylesheet" href="{PREFIX}assets/portfolio.css"><script defer src="{PREFIX}assets/app.js"></script></head><body data-language="{LANG}">{body}</body></html>'''

def main():
    global LANG,PREFIX
    for LANG in ('zh','en'):
        PREFIX='./' if LANG=='zh' else '../'
        target=SITE/('' if LANG=='zh' else 'en')/'index.html';target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text(render(),encoding='utf-8')
    (SITE/'.generated-pages.json').write_text('["index.html", "en/index.html"]\n')
    (SITE/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+SITE_URL+'</loc></url><url><loc>'+SITE_URL+'en/</loc></url></urlset>')
    (SITE/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: '+SITE_URL+'sitemap.xml\n')
    print('Built 2 concise bilingual profile pages. No manuscripts, datasets or research-detail pages.')
if __name__=='__main__': main()
