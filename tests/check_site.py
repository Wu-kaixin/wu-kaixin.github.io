"""Check public profile links and ensure unpublished materials are absent."""
import json
from pathlib import Path
from html.parser import HTMLParser
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
assert len(pages)==2
for path,page in pages.items():
 assert len(page.ids)==len(set(page.ids))
 for link in page.links:
  if link.startswith(('http://','https://')):continue
  rel,_,anchor=link.partition('#');target=(path.parent/rel).resolve() if rel else path
  if target.is_dir():target/='index.html'
  assert target.exists(),(path,link)
  if anchor:assert anchor in pages[target].ids
 for required in ['scholar.google.com/citations?','orcid.org/0009-0009-8963-4432']:
  assert any(required in link for link in page.links)
for forbidden in ['downloads','data','evidence','research','resources','research-approach']:
 assert not (SITE/forbidden).exists()
assert not list(SITE.rglob('*.pdf')) and not list(SITE.rglob('*.csv'))
assert not {'paper','updates'} & json.loads((ROOT/'content/site.json').read_text()).keys()
print('PASS: 2 bilingual pages, working local links, both academic profiles, no manuscript/data/detail assets.')
