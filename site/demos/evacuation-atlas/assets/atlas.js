import {word,notebooks,modelName,colors,exitName} from './words.js';
import {Replay,clamp,atOrBefore} from './replay.js';
import {MapView} from './map.js';
import {configureResults,initializeResults,setResultTime} from './comparison.js';

const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
let lang=params.get('lang')==='en'?'en':params.get('lang')==='zh'?'zh':navigator.language.startsWith('zh')?'zh':'en';
const w=k=>word(k,lang),el=(tag,cls,content)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(content!==undefined)n.textContent=content;return n;};
function option(select,value,label){select.add(new Option(label,value));}
function fill(select,items,value){select.replaceChildren();for(const [id,text] of items)option(select,id,text);select.value=value;}
const modeScene={building:'pavilion',behavior:'obstacles',compare:'bottleneck'};
let catalog,mode='building',sceneId='pavilion',model='cfs',modelB='avm',layout=0,revision='',time=0,playing=false,stamp=0,loadIndex=0;
let tracks=[],entries=[],floor='0',camera='all',raf=0,lastUI=-Infinity,loadError=false,touring=false;
const view={z:1,dx:0,dy:0},cache=new Map(),layers={labels:true,trails:false,hull:false,links:false,targets:false,roles:false,sensing:false,waypoints:false,bodies:false};
const maps=[new MapView($('map-a')),new MapView($('map-b'))];
const currentScene=()=>catalog.scenes.find(s=>s.id===sceneId);
const eligible=()=>catalog.clips.filter(c=>c.scene===sceneId&&!c.attempt);
const modelOrder=['cfs_v1','cfs','cfs_v3','avm','gcfm','sfm','warp','osm'];
const modelsForScene=()=>modelOrder.filter(m=>eligible().some(c=>c.layout===layout&&c.model===m));
const duration=()=>Math.max(0,...tracks.map(r=>r.end));
const minutes=t=>String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0');
function comparable(id,variant=0){
  return new Set(catalog.clips.filter(c=>c.scene===id&&c.layout===variant&&!c.attempt).map(c=>c.model)).size>=2;
}
const scenes=()=>catalog.scenes.filter(s=>mode==='compare'?comparable(s.id):s.section===mode);
function restoreSelection(){
  const requested=params.get('view');
  if(!Object.hasOwn(modeScene,requested))return;
  mode=requested;
  sceneId=scenes().find(s=>s.id===params.get('scene'))?.id||modeScene[mode];
  modeScene[mode]=sceneId;
  const variant=Number(params.get('layout')||0);
  if(eligible().some(c=>c.layout===variant)&&(mode!=='compare'||comparable(sceneId,variant)))layout=variant;
  const supported=modelsForScene();
  if(supported.includes(params.get('a')))model=params.get('a');
  if(supported.includes(params.get('b')))modelB=params.get('b');
  if(mode!=='compare'&&catalog.clips.some(c=>c.id===params.get('recording')&&c.attempt&&c.scene===sceneId&&c.layout===layout&&c.model===model))revision=params.get('recording');
}
function updateSelectionLink(){
  const u=new URL(location.href);
  for(const key of ['view','scene','layout','a','b','recording'])u.searchParams.delete(key);
  if(mode!=='building'||sceneId!=='pavilion'||layout||model!=='cfs'||revision){
    u.searchParams.set('view',mode);u.searchParams.set('scene',sceneId);u.searchParams.set('a',model);
    if(mode==='compare')u.searchParams.set('b',modelB);
    if(layout)u.searchParams.set('layout',layout);
    if(revision)u.searchParams.set('recording',revision);
  }
  if(u.href!==location.href)history.replaceState(null,'',u);
}
let stats={draws:0,frameGaps:[],loadMs:0};
if(params.has('diagnostics'))Object.defineProperty(window,'atlasDiagnostics',{get:()=>({draws:stats.draws,
  frameGaps:[...stats.frameGaps],loadMs:stats.loadMs,scene:sceneId,models:entries.map(c=>c.model),t:time,zoom:view.z,dx:view.dx,dy:view.dy,playing,
  archived:!!revision,floor,lang,ready:tracks.length>0&&!loadError})});
function setWords(){
  document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.title=lang==='zh'?'Atrium 100 · 疏散图集':'Atrium 100 · Evacuation Atlas';
  document.querySelectorAll('[data-word]').forEach(n=>n.textContent=w(n.dataset.word));
  document.querySelectorAll('[data-tip]').forEach(n=>{n.title=w(n.dataset.tip);n.setAttribute('aria-label',n.title);});
  document.querySelectorAll('[data-mode]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.mode===mode)));
  for(const [id,key] of [['modes','views'],['map-a','map'],['map-b','modelB'],['timeline','timeline'],['speed','speed'],['camera','camera'],['scene','scene'],['model','modelA'],['model-b','modelB'],['floor','floor'],['revision','revision']])$(id).setAttribute('aria-label',w(key));
  $('home').setAttribute('aria-label','Atrium 100 · '+w('atlas'));$('lang').textContent=lang==='zh'?'English':'中文';
  $('model').setAttribute('aria-label',w(mode==='compare'?'modelA':'model'));
  fullscreenLabel();
  $('lang').setAttribute('aria-label',lang==='zh'?'Switch to English':'切换到中文');
  $('refs').replaceChildren();
  notebooks.forEach((slug,i)=>{const link=el('a','',w('notebook'+(i+1)));link.href='https://www.jupedsim.org/stable/notebooks/'+slug+'.html';link.target='_blank';link.rel='noopener noreferrer';$('refs').append(link);});
  const live=el('a','',w('original'));live.href='https://wu-kaixin.github.io/evacuation/?lang='+lang;live.target='_blank';live.rel='noopener noreferrer';$('refs').append(live);
}
function populate(){
  setWords();const sc=currentScene(),select=$('scene');select.replaceChildren();let category='';
  for(const s of scenes()){
    const cat=mode==='compare'?(s.section==='building'?w('building'):s.category?.[lang]||w('behavior')):s.category?.[lang]||'';
    const grouped=mode==='behavior'||mode==='compare';
    if(grouped&&cat!==category){category=cat;const group=el('optgroup');group.label=cat;select.append(group);}
    const parent=grouped?select.lastElementChild:select;parent.append(new Option(s.title[lang],s.id));
  }
  select.value=sceneId;$('kicker').textContent=w('atlas')+'  /  '+w(mode);
  $('scene-title').textContent=sc.title[lang];$('deck').textContent=mode==='compare'?w('compareDeck'):sc.description[lang];
  const models=modelsForScene();if(!models.includes(model))model=models.includes('cfs')?'cfs':models[0];
  if(!models.includes(modelB)||modelB===model)modelB=models.find(m=>m!==model);
  fill($('model'),models.map(m=>[m,modelName(m,lang)]),model);
  fill($('model-b'),models.filter(m=>m!==model).map(m=>[m,modelName(m,lang)]),modelB||'');
  $('model').disabled=models.length===1;$('model-label').textContent=mode==='compare'?'A':w('model');
  $('second-model-wrap').hidden=mode!=='compare';$('pane-b').hidden=mode!=='compare';$('tag-a').hidden=mode!=='compare';
  $('work').classList.toggle('wide-compare',mode==='compare');
  const variants=[...new Set(eligible().filter(c=>c.model===model).map(c=>c.layout))];
  $('layout').hidden=variants.length<2||(mode==='compare'&&variants.filter(v=>eligible().some(c=>c.layout===v&&c.model===modelB)).length<2);
  $('layout').textContent=w('layout')+' · '+(layout+1)+'/'+variants.length;
  const historical=catalog.clips.filter(c=>c.scene===sceneId&&c.model===model&&c.layout===layout&&c.attempt);
  $('revision-wrap').hidden=mode==='compare'||!historical.length;
  fill($('revision'),[['',w('current')],...historical.map(c=>[c.id,w('earlier')+' '+c.attempt])],revision);
  const multi=['internal','external'].includes(sceneId);$('floor-wrap').hidden=!multi;
  fill($('floor'),[['0',w('floor0')],['1',w('floor1')],['both',w('both')]],floor);
  $('floor-tag').hidden=mode==='compare'||(multi&&floor==='both');
  const two=catalog.plans[sceneId+'-'+layout]?.floors[0].size;
  $('floor-tag').textContent=multi?w('floor'+(floor==='both'?'0':floor)):(two?two.join(' × ')+' m  ·  ':'')+w('singleFloor');
  $('tag-a').textContent='A  ·  '+modelName(model,lang);$('tag-b').textContent='B  ·  '+modelName(modelB,lang);
  if(tracks.length)detailControls();playLabel();
}
function groupName(g){return g==='V'?w('visitors'):lang==='zh'?g+' 组':'Group '+g;}
function detailControls(){
  const track=tracks[0],groups=[...new Set(tracks.flatMap(t=>t.groups))];
  if(!groups.includes(camera))camera='all';
  fill($('camera'),[['all',w('all')],...groups.map(g=>[g,groupName(g)])],camera);
  const supported={labels:true,trails:true,bodies:true,hull:tracks.some(t=>t.data.guide_demo),
    links:tracks.some(t=>t.hasLinks),targets:tracks.some(t=>t.hasTargets),roles:tracks.some(t=>t.hasRoles),
    sensing:['search','leader'].includes(sceneId),
    waypoints:tracks.some(t=>t.plan.floors.some(f=>f.waypoints?.length))};
  $('toggles').replaceChildren();
  Object.keys(layers).forEach(key=>{if(!supported[key])return;const label=el('label'),input=document.createElement('input');input.type='checkbox';input.checked=layers[key];input.id='layer-'+key;
    input.onchange=()=>{layers[key]=input.checked;invalidate();};label.append(input,document.createTextNode(w(key)));$('toggles').append(label);});
  if(mode==='behavior'){
    const label=el('label'),input=document.createElement('input');input.type='checkbox';input.id='tour';input.checked=touring;
    input.onchange=()=>{touring=input.checked;};label.append(input,document.createTextNode(lang==='zh'?'连续播放专题':'Play topics in sequence'));$('toggles').append(label);
  }
  const legend=el('div','legend-grid');
  const keys=[['person','people'],...(tracks.some(t=>t.data.guide_demo)?[['guide','guide']]:[]),
    ...(track.plan.floors.some(f=>f.entrances.length)?[['entry','entry']]:[]),['regular','exit'],
    ...(track.exits.some(e=>e.emergency)?[['em','emergency']]:[])];
  keys.forEach(([style,key])=>{const item=el('span');item.append(el('i','mark '+style),document.createTextNode(w(key)));legend.append(item);});
  const gr=el('div','groups');groups.forEach(g=>{const item=el('span','group-key');const mark=el('i','mark person');mark.style.setProperty('--dot',colors[g]||'#647f86');item.append(mark,document.createTextNode(groupName(g)));gr.append(item);});
  $('legend').replaceChildren(legend,gr);
  const notes=entries.map(c=>{
    const name=(c.model==='osm'?'Vadere':'JuPedSim')+' · '+modelName(c.model,lang);
    if(c.model==='osm')return name+' · '+(lang==='zh'?'身体可行步约束，自主行走':'feasible-step constraints, autonomous motion');
    if(c.model==='gcfm'&&!c.attempt)return name+' · '+(lang==='zh'?'原生椭圆与速度制动':'native ellipses and speed braking');
    return name;
  });
  $('engine').textContent=notes.join('  /  ');
  const result=entries.flatMap(c=>[...(c.attempt?[w('archive')]:[]),...(c.notice?[w('contact')]:[]),...(c.outcome!=='complete'?[w(c.outcome.includes('error')?'error':'incomplete')]:[])]);
  $('recording').textContent=[w('demo'),...[...new Set(result)]].join(' · ');$('recording').className=result.length?'warning':'';
  $('flow-panel').querySelector('h2').textContent=w(track.observed?'byExit':'departuresByExit');
  $('metrics').hidden=!tracks.some(t=>t.data.movement);
  configureResults(tracks,entries,sceneId,lang,entries.map(c=>modelName(c.model,lang)));
  if(currentScene().section==='behavior'&&!eligible().some(c=>c.model==='osm')){
    $('recording').textContent+=' · '+w('osmTopicScope');
  }
}
function pairTable(headers,rows){
  const table=el('table','pair-table'),head=table.createTHead().insertRow(),body=table.createTBody();
  for(const h of headers){const cell=el('th','',h);cell.scope='col';head.append(cell);}
  for(const [name,a,b] of rows){const row=body.insertRow(),label=el('th','',name);label.scope='row';row.append(label);row.insertCell().textContent=a;row.insertCell().textContent=b;}
  return table;
}
function compareStats(samples){
  const a=samples[0].totals,b=samples[1].totals,top=el('div','comparison-counts');
  [a,b].forEach((v,i)=>{const col=el('div');col.append(el('span','read-label',(i?'B':'A')+' · '+modelName(entries[i].model,lang)),el('strong','',String(v.arrived)));top.append(col);});
  const headers=['','A','B'],rows=[['admitted','admitted'],['inside','inside']];
  if(tracks.some(t=>t.data.guide_demo))rows.push(['guides','guides']);
  if(tracks[0].plan.floors.length>1)rows.push(['stairPeople','stairs']);
  $('readings').replaceChildren(top,el('div','pair-caption',w(tracks[0].observed?'arrived':'left')),pairTable(headers,rows.map(([k,v])=>[w(k),a[v],b[v]])));
  if(tracks.some(t=>t.data.guide_demo)&&entries.some(c=>c.model==='osm'))$('readings').append(el('p','analysis-scope','OSM · '+w('osmScope')));
  const exits=tracks[0].exits.map(e=>[exitName(e.id,lang),a.exits[e.id]||0,b.exits[e.id]||0]);
  const unknown=[a,b].map(v=>v.arrived-Object.values(v.exits).reduce((x,y)=>x+y,0));
  if(unknown.some(Boolean))exits.push([lang==='zh'?'出口未定位':'Exit unassigned',...unknown]);
  $('exit-list').replaceChildren(pairTable(headers,exits));
}
function motionStats(samples){
  if(!$('metrics').open||$('metrics').hidden)return;
  const readings=[];
  for(const [i,r] of tracks.entries()){
    const m=r.data.movement;if(!m)continue;
    const row=m.values[atOrBefore(m.values,samples[i].t,p=>p[0])];if(!row)continue;
    if(tracks.length>1)readings.push(el('div','read-label',(i?'B':'A')+' · '+modelName(entries[i].model,lang)));
    const values=[[w('meanSpeed'),row[1],lang==='zh'?'米/秒':'m/s',2]];
    for(let f=0;f<row.length-2;f++){
      values.push([(row.length>3?w('floor'+f)+' · ':'')+w('density'),row[f+2],lang==='zh'?'人/㎡':'p/m²',3]);
    }
    for(const [key,n,unit,digits] of values){const line=el('div','read-line');line.append(el('span','',key),el('b','',n==null?'—':n.toFixed(digits)+' '+unit));readings.push(line);}
    readings.push(el('p','analysis-scope',w(m.region)+' · '+minutes(row[0])));
  }
  $('motion').replaceChildren(...readings);
}
function renderStats(samples){
  motionStats(samples);
  if(mode==='compare'){compareStats(samples);return;}
  const readings=[],rows=[];
  samples.forEach((sample,index)=>{
    const r=tracks[index],v=sample.totals,card=el('div','reading');
    const total=el('div','total');total.append(el('strong','',String(v.arrived)),el('span','',w(r.observed?'arrived':'left')));card.append(total);
    const meter=el('div','meter'),bar=el('i');bar.style.width=(v.admitted?100*v.arrived/v.admitted:0)+'%';meter.append(bar);card.append(meter);
    const fields=[['admitted',v.admitted],['inside',v.inside],...(r.data.guide_demo?[['guides',v.guides]]:[]),...(r.plan.floors.length>1?[['stairPeople',v.stairs]]:[])];
    for(const [key,n] of fields){const line=el('div','read-line');line.append(el('span','',w(key)),el('b','',String(n)));card.append(line);}
    readings.push(card);
    for(const e of r.exits){const line=el('div','exit-line'+(e.emergency?' em':'')),len=el('i'),fill=el('b'),n=v.exits[e.id]||0;
      fill.style.width=(v.admitted?100*n/v.admitted:0)+'%';len.append(fill);line.append(el('span','',exitName(e.id,lang)),len,el('b','',String(n)));rows.push(line);}
    const unknown=v.arrived-Object.values(v.exits).reduce((a,b)=>a+b,0);
    if(unknown){const line=el('div','read-line');line.append(el('span','',lang==='zh'?'出口未定位':'Exit unassigned'),el('b','',String(unknown)));rows.push(line);}
  });
  $('readings').replaceChildren(...readings);$('exit-list').replaceChildren(...rows);
}
function draw(force=false){
  if(!tracks.length)return;
  const options={...layers,camera,floor,lang},samples=tracks.map(r=>r.sample(time));
  tracks.forEach((r,i)=>maps[i].draw(r,samples[i],view,options));stats.draws++;
  if(force||Math.abs(time-lastUI)>.18||time===duration()){
    const factor=maps[0].scale,units=[.5,1,2,5,10,20,50].filter(n=>n*factor<=75).at(-1)||.5;
    const line=el('i','scale-line');line.style.width=(units*factor)+'px';$('scale').replaceChildren(line,document.createTextNode(units+' '+w('m')));
    $('time').textContent=minutes(time);$('end').textContent=minutes(duration());$('timeline').value=time;setResultTime(time);
    $('fit').textContent=Math.round(view.z*100)+'%';renderStats(samples);lastUI=time;
    const first=samples[0].frame,danger=entries.find(c=>c.notice||c.outcome!=='complete'),phase=first.modes?.[camera]||first.phase;
    const phaseText=danger?[...(danger.attempt?[w('archive')]:[]),w(danger.notice?'contact':danger.outcome.includes('error')?'error':'incomplete')].join(' · '):
      (mode!=='compare'&&phase&&phase!=='walk'?(camera!=='all'?groupName(camera)+' · ':'')+w(phase):'');
    $('phase').hidden=!phaseText;$('phase').textContent=phaseText;$('phase').classList.toggle('flag',!!danger);
    if(params.has('diagnostics')){
      const gaps=[...stats.frameGaps].sort((a,b)=>a-b),p95=gaps[Math.floor(gaps.length*.95)]||0;
      $('performance').hidden=false;$('performance').textContent='QA · frames '+gaps.length+' · p95 '+p95.toFixed(1)+' ms · load '+stats.loadMs.toFixed(0)+' ms · pan '+Math.round(view.dx)+','+Math.round(view.dy);
    }
    if(tracks[0].plan.floors.length>1&&floor!=='both'&&mode!=='compare')$('floor-tag').textContent=w('floor'+maps[0].transforms[0].f);
  }
}
function invalidate(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;draw(true);});}
function step(now){
  if(!playing)return;
  if(stamp){const gap=now-stamp;if(params.has('diagnostics')&&gap>0){stats.frameGaps.push(gap);if(stats.frameGaps.length>800)stats.frameGaps.shift();}
    time=Math.min(duration(),time+gap/1000*parseFloat($('speed').value));}
  stamp=now;draw();if(time>=duration()){playing=false;playLabel();
    if(mode==='behavior'&&touring){const list=scenes(),next=list.findIndex(s=>s.id===sceneId)+1;if(next<list.length)changeScene(list[next].id,true);}
  }else anim=requestAnimationFrame(step);
}
let anim=0;
function playLabel(){const key=playing?'pause':'play';$('play').textContent=playing?'Ⅱ':'▶';$('play').title=w(key);$('play').setAttribute('aria-label',w(key));$('play').setAttribute('aria-pressed',String(playing));}
function pause(){playing=false;cancelAnimationFrame(anim);stamp=0;playLabel();}
function toggle(){if(!tracks.length)return;if(playing){pause();return;}if(time>=duration())time=0;playing=true;stamp=0;playLabel();anim=requestAnimationFrame(step);}
function resetView(){Object.assign(view,{z:1,dx:0,dy:0});camera='all';$('camera').value='all';}
function position(t){time=clamp(t,0,duration());stamp=0;invalidate();}
async function getTrack(c){
  if(cache.has(c.id))return cache.get(c.id);
  const res=await fetch('./'+c.file);if(!res.ok)throw Error('Clip HTTP '+res.status);
  const data=await res.json(),r=new Replay(data,catalog.plans[c.scene+'-'+c.layout]);
  cache.set(c.id,r);while(cache.size>4)cache.delete(cache.keys().next().value);return r;
}
async function load(auto=false){
  configureResults([],[],sceneId,lang,[]);
  const serial=++loadIndex,start=performance.now();pause();time=0;lastUI=-Infinity;tracks=[];entries=[];resetView();loadError=false;populate();
  $('play').disabled=true;$('timeline').disabled=true;$('message').hidden=false;$('message').textContent=w('loading');$('readings').replaceChildren();$('exit-list').replaceChildren();
  const current=eligible().find(c=>c.model===model&&c.layout===layout);
  const list=[revision?catalog.clips.find(c=>c.id===revision):current];
  if(mode==='compare')list.push(eligible().find(c=>c.model===modelB&&c.layout===layout));
  try{const next=await Promise.all(list.map(getTrack));if(serial!==loadIndex)return;
    entries=list;tracks=next;$('timeline').max=duration()||1;$('play').disabled=false;$('timeline').disabled=false;$('message').hidden=true;
    detailControls();stats.frameGaps=[];draw(true);stats.loadMs=performance.now()-start;updateSelectionLink();invalidate();if(auto)toggle();
  }catch(error){if(serial!==loadIndex)return;console.error(error);loadError=true;$('message').textContent=w('failure');}
}
function changeScene(id,auto=false,variant=0){sceneId=id;modeScene[mode]=id;layout=variant;revision='';floor='0';closeLayers();load(auto);}
function switchMode(m){if(m===mode)return;const old=sceneId;mode=m;
  const keep=m==='compare'&&comparable(old,layout);
  const next=keep?old:modeScene[m];changeScene(next,false,keep?layout:0);}
function closeLayers(){$('layer-sheet').hidden=true;$('layers').setAttribute('aria-expanded','false');}
function fullscreenLabel(){
  const active=Boolean(document.fullscreenElement)||$('map-card').classList.contains('expanded');
  $('expand').title=w(active?'leaveFullscreen':'expand');$('expand').setAttribute('aria-label',$('expand').title);
}
function zoom(ratio,anchor=null){
  const z=clamp(view.z*ratio,.55,8),ratio2=z/view.z;
  if(anchor){view.dx=anchor[0]-(anchor[0]-view.dx)*ratio2;view.dy=anchor[1]-(anchor[1]-view.dy)*ratio2;}
  view.z=z;invalidate();
}
function inputMap(map){
  const canvas=map.canvas;let drag=null;
  canvas.addEventListener('wheel',e=>{e.preventDefault();const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
    const t=map.transforms.find(q=>x>=q.box.x&&x<q.box.x+q.box.w&&y>=q.box.y&&y<q.box.y+q.box.h);
    if(t)zoom(Math.exp(-clamp(e.deltaY,-250,250)*.002),[x-t.box.x-t.box.w/2,y-t.box.y-t.box.h/2]);},{passive:false});
  canvas.onpointerdown=e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};
  canvas.onpointermove=e=>{if(!drag||e.pointerId!==drag.id)return;view.dx+=e.clientX-drag.x;view.dy+=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;invalidate();};
  canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;};
  canvas.ondblclick=()=>{resetView();invalidate();};
  new ResizeObserver(()=>invalidate()).observe(canvas);
}
function bind(){
  initializeResults();
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>switchMode(b.dataset.mode));
  $('scene').onchange=e=>changeScene(e.target.value);$('model').onchange=e=>{model=e.target.value;revision='';load();};
  $('model-b').onchange=e=>{modelB=e.target.value;load();};$('revision').onchange=e=>{revision=e.target.value;load();};
  $('layout').onclick=()=>{const values=eligible().filter(c=>c.model===model&&(mode!=='compare'||eligible().some(b=>b.layout===c.layout&&b.model===modelB))).map(c=>c.layout);layout=values[(values.indexOf(layout)+1)%values.length];revision='';load();};
  $('floor').onchange=e=>{floor=e.target.value;resetView();populate();invalidate();};
  $('camera').onchange=e=>{camera=e.target.value;Object.assign(view,{dx:0,dy:0,z:camera==='all'?1:2.3});invalidate();};
  $('lang').onclick=()=>{lang=lang==='zh'?'en':'zh';const u=new URL(location.href);u.searchParams.set('lang',lang);history.replaceState(null,'',u);populate();if(loadError)$('message').textContent=w('failure');else if(!tracks.length)$('message').textContent=w('loading');invalidate();};
  $('layers').onclick=()=>{const open=$('layer-sheet').hidden;$('layer-sheet').hidden=!open;$('layers').setAttribute('aria-expanded',String(open));};
  document.addEventListener('click',e=>{if(!e.target.closest('#layers,#layer-sheet'))closeLayers();});
  $('help').onclick=()=>$('info').showModal();$('close').onclick=()=>$('info').close();
  $('zoom-in').onclick=()=>zoom(1.3);$('zoom-out').onclick=()=>zoom(1/1.3);$('fit').onclick=()=>{resetView();invalidate();};
  $('expand').onclick=async()=>{const box=$('map-card');if(document.fullscreenElement)await document.exitFullscreen();else if(box.classList.contains('expanded'))box.classList.remove('expanded');else {try{await box.requestFullscreen();}catch{box.classList.add('expanded');}}fullscreenLabel();};
  document.addEventListener('fullscreenchange',fullscreenLabel);
  $('metrics').ontoggle=()=>invalidate();
  $('play').onclick=toggle;$('restart').onclick=()=>position(0);$('timeline').oninput=e=>position(+e.target.value);
  maps.forEach(inputMap);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeLayers();$('map-card').classList.remove('expanded');fullscreenLabel();}if($('info').open||e.target.closest('button,select,input,a'))return;
    if(e.key===' '){e.preventDefault();toggle();}if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();position(time+(e.key==='ArrowLeft'?-5:5));}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
}
try{
  const res=await fetch('./catalog.json');if(!res.ok)throw Error('Catalog HTTP '+res.status);catalog=await res.json();restoreSelection();bind();await load();
}catch(error){console.error(error);setWords();$('message').hidden=false;$('message').textContent=w('failure');}
