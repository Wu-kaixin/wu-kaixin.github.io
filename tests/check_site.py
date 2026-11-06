"""Check public profile links and ensure unpublished materials are absent."""
import json
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site'
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__();self.links=[];self.ids=[];self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  for key in ['href','src']:
   if a.get(key):self.links.append(a[key])
pages={p.resolve():Page(p.read_text(encoding='utf-8')) for p in SITE.rglob('*.html')}
assert set(p.relative_to(SITE.resolve()).as_posix() for p in pages)=={'index.html','en/index.html','evacuation/index.html','evacuation/report.html'}
for path,page in pages.items():
 assert len(page.ids)==len(set(page.ids))
 for link in page.links:
  if link.startswith(('http://','https://')):continue
  parsed=urlsplit(link);rel=unquote(parsed.path);anchor=parsed.fragment;target=(path.parent/rel).resolve() if rel else path
  assert target.is_relative_to(SITE.resolve()),(path,link)
  if target.is_dir():target/='index.html'
  assert target.exists(),(path,link)
  if anchor:assert anchor in pages[target].ids
 if path in [(SITE/'index.html').resolve(), (SITE/'en/index.html').resolve()]:
  for required in ['scholar.google.com/citations?','orcid.org/0009-0009-8963-4432','evacuation/?lang=']:
   assert any(required in link for link in page.links)
for forbidden in ['downloads','data','evidence','research','resources','research-approach']:
 assert not (SITE/forbidden).exists()
assert not list(SITE.rglob('*.pdf')) and not list(SITE.rglob('*.csv'))
assert not {'paper','updates'} & json.loads((ROOT/'content/site.json').read_text()).keys()
demo=SITE/'evacuation'
manifest=json.loads((demo/'manifest.json').read_text(encoding='utf-8'))
assert len(manifest['runs'])==16
assert manifest['default_run'] in {run['id'] for run in manifest['runs']}
total_frames=0
for run in manifest['runs']:
 paths=[run['meta'], *run['chunks']]
 for rel in paths:
  target=(demo/rel).resolve()
  assert target.is_relative_to(demo.resolve()) and target.is_file(),rel
  json.loads(target.read_text(encoding='utf-8'))
 total_frames+=run['frame_count']
assert total_frames==15287
assert not list(demo.rglob('*.sqlite')) and not list(demo.rglob('*.db'))
print('PASS: 2 profile pages + 2 authorized replay pages; local links, 16 replay cases / 15,287 declared frames, no manuscripts or native databases.')
