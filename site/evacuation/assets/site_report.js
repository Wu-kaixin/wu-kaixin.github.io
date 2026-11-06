(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const copy={en:{title:'Model comparison',intro:'Two 100 × 100 m floors · two egress strategies · preserved native results',
    back:'Open interactive replay',provenance:'Export provenance',readme:'Deployment guide',
    columns:['Strategy / model','Outcome','People safe','Guides safe','Native left','Run end (s)','Contact audit','Guided strict gate','Replay data'],
    internal:'Internal stairs',external:'Exterior stairs',yes:'Pass',no:'Fail',na:'Not assessed',
    autonomous:'Autonomous OSM',data:'Metrics & metadata',unavailable:'Replay unavailable',
    complete:'Complete',incomplete:'Incomplete',error:'Program error',total:'Recorded cases',done:'Complete cases',contacts:'Contact passes',strict:'Guided strict passes',
    scopeTitle:'What this comparison establishes',scope:'OSM is an autonomous batch comparator with no online guides and no queried native residual count. Its contact pass is separate from the guided JuPedSim strict gate. Missing values are not counted as zero or pass.',
    guardScope:'These are explicitly controlled development configurations. GCFM uses recorded native-speed braking and actual ellipse audits; OSM uses declared hard-body footstep and admission constraints. All original success thresholds and failures remain recorded. This is a recorded demonstration, not a remote solver or a general model ranking.',load:'Loading comparison…',retry:'Reload',failure:'Could not load the comparison. Check that the complete site folder was uploaded.'},
  zh:{title:'行人模型对比',intro:'两层 100 × 100 米建筑 · 两种疏散方案 · 保留原生仿真结果',
    back:'打开交互回放',provenance:'导出来源与哈希',readme:'网站部署说明',
    columns:['方案 / 模型','运行结果','安全到达人员','安全到达引导代理','原生残留实体','结束时间（秒）','接触检查','引导式严格验收','回放数据'],
    internal:'内置楼梯',external:'外置楼梯',yes:'通过',no:'未通过',na:'未评估',
    autonomous:'OSM 自主对比',data:'指标与元数据',unavailable:'无可用回放',
    complete:'全部完成',incomplete:'未完成',error:'程序错误',total:'已记录案例',done:'完成案例',contacts:'接触检查通过',strict:'引导式严格通过',
    scopeTitle:'对比结果的适用范围',scope:'OSM 为自主批量仿真，不含在线引导代理，也未查询原生残留数量。其接触检查通过与 JuPedSim 的引导式严格验收分别列出。缺失值不会被当作零或通过。',
    guardScope:'这些是明确标注控制干预的开发配置。GCFM 使用已记录的原生速度制动及真实椭圆审计；OSM 使用已声明的脚步与入场身体约束。原成功阈值和失败记录均保留。本网站展示已记录的仿真，不提供远程求解，也不作普遍模型优劣排名。',load:'正在加载对比数据…',retry:'重新加载',failure:'无法加载对比数据，请检查是否上传了完整网站目录。'}};
  let manifest=null, failed=false;
  const node=(tag,value)=>{const e=document.createElement(tag);e.textContent=value;return e;};
  function draw(){const lang=window.AtriumI18n.language,c=copy[lang];
    for(const [id,key] of Object.entries({reportTitle:'title',reportIntro:'intro',back:'back',provenance:'provenance',readme:'readme',scopeTitle:'scopeTitle',scope:'scope',guardScope:'guardScope'}))$(id).textContent=c[key];
    $('back').href=`index.html?lang=${lang}`;document.title=`Atrium 100 · ${c.title}`;
    $('reportError').replaceChildren();if(!manifest){$('reportError').textContent=failed?c.failure:c.load;if(failed){const retry=node('button',c.retry);retry.onclick=load;$('reportError').append(retry);}return;}
    $('columns').replaceChildren();const tr=document.createElement('tr');c.columns.forEach(label=>tr.append(node('th',label)));$('columns').append(tr);
    const all=manifest.runs;$('reportSummary').replaceChildren();
    for(const [label,n] of [[c.total,all.length],[c.done,all.filter(r=>r.metrics.status==='COMPLETE').length],[c.contacts,all.filter(r=>r.metrics.contact_pass===true).length],[c.strict,all.filter(r=>r.model!=='osm'&&r.metrics.strict_pass===true).length]]){const card=document.createElement('div');card.append(node('small',label),node('strong',n));$('reportSummary').append(card);}
    $('rows').replaceChildren();for(const r of all){const m=r.metrics,row=document.createElement('tr'),first=document.createElement('td');
      const link=node(r.available?'a':'span',`${c[r.variant]||r.variant} / ${window.AtriumI18n.model(r.model)}`);if(r.available)link.href=`index.html?run=${encodeURIComponent(r.id)}&lang=${lang}`;first.append(link);row.append(first);
      const pass=x=>x===true?c.yes:x===false?c.no:c.na, val=x=>x==null?'—':String(x);
      const outcome={COMPLETE:c.complete,INCOMPLETE:c.incomplete,EXPERIMENT_ERROR:c.error}[m.status]||m.status||c.na;
      [outcome,`${val(m.arrived_count)}/${val(m.people)}`,`${val(m.guides_safe)}/${val(m.guides)}`,val(m.native_remaining),m.elapsed_time_s==null?'—':m.elapsed_time_s.toFixed(2),pass(m.contact_pass),r.model==='osm'?c.autonomous:pass(m.strict_pass)].forEach((v,i)=>{const td=node('td',v);if(i===5||i===6)td.className=v===c.yes?'pass':v===c.no?'fail':'';row.append(td);});
      const data=document.createElement('td');if(r.meta){const a=node('a',c.data);a.href=r.meta;data.append(a);}else data.textContent=c.unavailable;row.append(data);$('rows').append(row);
    }
  }
  async function load(){failed=false;draw();try{const response=await fetch('manifest.json');if(!response.ok)throw Error();manifest=await response.json();}catch{failed=true;}draw();}
  window.AtriumI18n.onChange(draw);load();
})();
