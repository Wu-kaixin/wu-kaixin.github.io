/* All outcome statistics come from the currently selected public demonstration. */
export function episodeMetrics(replay){
  const people=new Map(),guides=[];
  for(const [id,first] of replay.first){
    const a=replay.actors.get(id);
    if(a.kind==='person')people.set(id,first);else guides.push(id);
  }
  const seen=new Set(),times=[];
  let personSeconds=0;
  for(const [time,id] of replay.events){
    if(!people.has(id)||seen.has(id))continue;
    if(time<people.get(id)||time>replay.end+1e-6)throw Error('Departure outside recording');
    seen.add(id);times.push(time);personSeconds+=time-people.get(id);
  }
  times.sort((a,b)=>a-b);
  const n=people.size,count=times.length;
  const threshold=q=>n?times[Math.ceil(q*n)-1]??null:null;
  const t100=threshold(1);
  return {n,count,people,guides,times,end:replay.end,observed:replay.observed,
    completion:n?100*count/n:null,t50:threshold(.5),t90:threshold(.9),t100,
    mean:n&&count===n?personSeconds/n:null,flow:t100>0?n/t100:null,
    residual:n-count,contact:replay.data.notice,error:replay.data.outcome.includes('error')};
}

export function matchConditions(a,b,scene,models){
  if(a.error||b.error)return 'invalidRun';
  if(a.observed!==b.observed)return 'differentEvents';
  if(a.n!==b.n||a.guides.length!==b.guides.length)return a.guides.length!==b.guides.length?'differentGuidance':'differentCohort';
  for(const [id,start] of a.people){
    if(!b.people.has(id)||Math.abs(start-b.people.get(id))>1e-5)return 'differentCohort';
  }
  if(scene==='hall'&&models.includes('osm'))return 'differentSpeeds';
  return null;
}

export function relativeChange(a,b){
  return a!=null&&b!=null&&Number.isFinite(a)&&Number.isFinite(b)&&a>0?100*(b-a)/a:null;
}

const strings={
  title:['整段疏散对照','Full-episode comparison',"避難全体の比較"],jump:['查看对照指标 ↓','View outcome measures ↓',"比較指標を見る ↓"],
  curve:['累计离场比例','Cumulative departures',"累積退場率"],arrCurve:['累计到达比例','Cumulative arrivals',"累積到達率"],
  completion:['最终完成率','Final completion',"最終完了率"],t50:['50% 完成时间','Time to 50%',"50%完了までの時間"],t90:['90% 完成时间','Time to 90%',"90%完了までの時間"],
  t100:['全员完成时间','Time to 100%',"全員完了までの時間"],mean:['人均疏散用时','Mean individual time',"1人あたりの平均避難時間"],flow:['平均通行量','Mean discharge rate',"平均流出率"],
  residual:['终点在途人数','People unfinished',"終了時の未完了人数"],contact:['身体接触检查','Body-contact check',"身体接触の確認"],flag:['有提示','Flagged',"警告あり"],clear:['无提示','No flag',"警告なし"],
  base:['B 相对 A','B vs A',"A に対する B の差"],people:['人','people',"人"],unit:['人/秒','people/s',"人/秒"],pts:['百分点','pp',"ポイント"],
  changed:['T90 相对变化','Relative change in T90',"T90 の相対変化"],unavailable:['未达阈值或不可比','Unreached or unmatched',"未達または比較不可"],
  invalidRun:['记录有运行错误，停用相对差。','A recording ended in an error. Relative changes are unavailable.',"実行エラーで終了した記録があるため、相対差は表示しません。"],
  differentEvents:['两组的计时终点定义不同。','The recordings use different definitions of completion.',"2つの記録で完了時刻の定義が異なります。"],
  differentGuidance:['两组引导条件不同。仅列出各自观测值。','The guide conditions differ. Each column shows its own observed values.',"誘導条件が異なるため、各列にはそれぞれの観測値のみを示します。"],
  differentCohort:['实际入场人数、身份或入场时刻不同。仅列出各自观测值。','The admitted cohorts or admission times differ. Each column shows its own observed values.',"入場者の人数、構成、または入場時刻が異なるため、各列にはそれぞれの観測値のみを示します。"],
  differentSpeeds:['开放大厅原版 OSM 与 JuPedSim 采用不同的期望步速配置。仅列出各自观测值。','The original hall OSM and JuPedSim recordings use different desired-speed settings. Each column shows its own observed values.',"開放型ホールの元の記録では、OSM と JuPedSim の希望歩行速度の設定が異なります。各列にはそれぞれの観測値のみを示します。"],
  table:['整段指标','Episode measures',"記録全体の指標"],method:['指标怎么算','How the measures work',"指標の計算方法"],
  cutoff:['百分比的分母为整段实际入场的行人，引导代理单独计数。T50、T90 和全员时间从仿真开始计算，取首次达到相应人数的回放时刻。','Percentages use all pedestrians admitted during the episode. Guides are counted separately. T50, T90 and clearance are measured from the simulation start to the first recorded event reaching each threshold.',"割合の分母は、記録全体で実際に入場した歩行者数です。誘導員は別に数えます。T50、T90、全員完了時間は、シミュレーション開始から各人数に初めて達した記録時刻までの時間です。"],
  means:['人均用时从每人入场算到其完成。平均通行量为入场人数除以全员完成时间。两项均须全员完成。横线表示未达到、条件不同或分母为零。','Individual time starts at each person’s admission. Mean discharge is the admitted count divided by clearance time. Both require full completion. A dash marks an unreached threshold, unmatched conditions or a zero denominator.',"個人の避難時間はその人の入場から完了までです。平均流出率は入場者数を全員完了時間で割った値です。どちらも全員が完了した場合のみ算出します。横線は未達、条件の不一致、または分母がゼロであることを示します。"],
  interpretation:['时间相对差为 (B − A) / A × 100%。负值表示 B 用时更短。完成率之差用百分点。每列是一个演示运行，接触提示按该记录的身体检查显示。','Relative time change is (B − A) / A × 100%. Negative values mean B took less time. Completion-rate differences use percentage points. Each column is one demonstration run, with its own body-contact checks.',"時間の相対差は (B − A) / A × 100% です。負の値は B の所要時間が短いことを表します。完了率の差はパーセントポイントで示します。各列は1回のデモの結果で、身体接触の警告もその記録に基づきます。"],
  measured:['本场景按进入安全区的记录时刻计数。','This scene counts observed arrivals in a safe area.',"このシナリオでは、安全区域への到達が記録された時刻で集計します。"],sampled:['本场景按回放中行人离场的首帧计时，精度受采样间隔影响。','This scene uses the first replay frame after a pedestrian leaves. Timing has the resolution of the recording.',"このシナリオでは、歩行者の退場直後の最初のフレームを使います。時間の精度は記録のサンプリング間隔に依存します。"],
  time:['仿真时间（秒）','Simulation time (s)',"シミュレーション時間（秒）"],metric:['指标','Measure',"指標"],
};
const label=(key,lang)=>strings[key][lang==='zh'?0:lang==='ja'?2:1];
const $=id=>document.getElementById(id);
const node=(name,text)=>{const x=document.createElement(name);if(text!=null)x.textContent=text;return x;};
const signed=(v,d=1)=>v==null?'—':(v>0?'+':'')+v.toFixed(d);
function value(v,d,unit=''){return v==null?'—':v.toFixed(d)+(unit?' '+unit:'');}
let last=null;

function plot(){
  if(!last)return;
  const {a,b,lang,labels}=last,canvas=$('clearance-curve');
  const width=canvas.clientWidth,height=canvas.clientHeight;if(width<20||height<20)return;
  const ratio=Math.min(2,window.devicePixelRatio||1),ctx=canvas.getContext('2d');
  canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
  const l=38,r=12,top=10,bot=26,w=width-l-r,h=height-top-bot,max=Math.max(a.end,b.end,.001);
  const x=t=>l+Math.max(0,Math.min(1,t/max))*w,y=p=>top+(1-p)*h;
  ctx.font='11px system-ui, sans-serif';ctx.lineWidth=1;
  for(const p of [0,.5,1]){
    ctx.strokeStyle='#dce5df';ctx.beginPath();ctx.moveTo(l,y(p));ctx.lineTo(width-r,y(p));ctx.stroke();
    ctx.fillStyle='#556c66';ctx.textAlign='right';ctx.fillText((p*100)+'%',l-5,y(p)+3);
  }
  for(const t of [0,max/2,max]){
    ctx.textAlign=t===0?'left':t===max?'right':'center';ctx.fillStyle='#556c66';ctx.fillText(value(t,1,'s'),x(t),height-6);
  }
  for(const [i,m] of [a,b].entries()){
    if(!m.n)continue;
    ctx.strokeStyle=i?'#a55b2d':'#146958';ctx.lineWidth=2.1;ctx.setLineDash(i?[5,3]:[]);
    ctx.beginPath();ctx.moveTo(x(0),y(0));
    m.times.forEach((t,k)=>{ctx.lineTo(x(t),y(k/m.n));ctx.lineTo(x(t),y((k+1)/m.n));});
    ctx.lineTo(x(m.count===m.n?max:m.end),y(m.count/m.n));ctx.stroke();
  }
  ctx.setLineDash([]);canvas.setAttribute('aria-label',labels.join(' / ')+' · '+label(a.observed?'arrCurve':'curve',lang));
}

export function configureResults(tracks,entries,scene,lang,names){
  const visible=tracks.length===2;
  $('comparison-results').hidden=!visible;$('outcome-jump').hidden=!visible;$('compare-highlight').hidden=!visible;
  if(!visible){last=null;return;}
  const [a,b]=tracks.map(r=>r.episode??=episodeMetrics(r));
  const reason=matchConditions(a,b,scene,entries.map(e=>e.model)),t=key=>label(key,lang);
  const labels=names.map((n,i)=>(i?'B':'A')+' · '+n);
  last={a,b,lang,labels};
  $('outcome-jump').textContent=t('jump');$('outcome-heading').textContent=t('title');
  $('curve-title').textContent=t(a.observed?'arrCurve':'curve');$('curve-axis').textContent=t('time');$('curve-a').textContent=labels[0];$('curve-b').textContent=labels[1];
  $('measure-method').textContent=t('method');$('measure-description').textContent=[t(a.observed?'measured':'sampled'),t('cutoff'),t('means'),t('interpretation')].join(' ');
  $('match-note').hidden=!reason;$('match-note').textContent=reason?t(reason):'';
  const getDelta=key=>reason?null:relativeChange(a[key],b[key]);
  const headline=getDelta('t90');
  $('compare-highlight').textContent='T90 · '+(headline==null?t('unavailable'):t('base')+' '+signed(headline)+'%');
  $('compare-highlight').title=t('changed');
  const table=$('outcome-table');table.replaceChildren();const head=table.createTHead().insertRow();
  for(const title of [t('metric'),...labels,t('base')]){const cell=node('th',title);cell.scope='col';head.append(cell);}
  const body=table.createTBody();
  function row(key,left,right,delta='—'){
    const tr=body.insertRow(),name=node('th',t(key));name.scope='row';tr.append(name);
    for(const item of [left,right,delta])tr.insertCell().textContent=item;
  }
  const complete=m=>value(m.completion,1,'%')+' ('+m.count+'/'+m.n+')';
  row('completion',complete(a),complete(b),reason||a.completion==null||b.completion==null?'—':signed(b.completion-a.completion)+' '+t('pts'));
  for(const key of ['t50','t90','t100','mean','flow']){
    const digits=key==='flow'?2:1,unit=key==='flow'?t('unit'):'s',v=getDelta(key);
    row(key,value(a[key],digits,unit),value(b[key],digits,unit),v==null?'—':signed(v)+'%');
  }
  row('residual',String(a.residual),String(b.residual));row('contact',t(a.contact?'flag':'clear'),t(b.contact?'flag':'clear'));
  plot();
}
export function initializeResults(){
  new ResizeObserver(plot).observe($('clearance-curve'));
}
export function setResultTime(time){
  if(last)$('curve-position').style.left=(100*Math.min(1,time/Math.max(last.a.end,last.b.end,.001)))+'%';
}
