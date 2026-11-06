/* Presentation translations only. Model IDs, trajectories and metrics remain unchanged. */
(function(global){
  'use strict';
  const zh={
    'PEDESTRIAN DYNAMICS LAB':'行人动力学实验室','/ Two-storey evacuation':'/ 双层建筑疏散',
    'Model & map notes':'模型与地图说明','EGRESS STRATEGY':'疏散方案','PEDESTRIAN MODEL':'行人模型',
    'FOLLOW GROUP':'跟随群体','FLOOR VIEW':'楼层视图','Reset view':'重置视图',
    'Internal stairs → ground exits':'内置楼梯 → 一层出口','Exterior stairs → outdoor safety':'外置楼梯 → 室外安全区',
    'Both floors':'双层视图','Ground floor':'一层','Upper floor':'二层',
    'Map view':'地图视图','Zoom out':'缩小','Zoom in':'放大','Expand map':'展开大地图',
    'Exit expanded map':'退出大地图','Map controls':'地图控制','Equal scale on both axes':'横纵坐标等比例显示','Draw cost':'绘图耗时',
    'OBSERVED SAFE':'已观测到达安全区','ACTIVE PEOPLE':'场内人员','NEW ARRIVALS':'新增入场人员',
    'PHYSICAL GUIDES':'场内引导代理','SIMULATION TIME':'仿真时间','0 pending outside':'0 人等待入场',
    '2 entrances / 4 final exits':'2 个入口 / 4 个最终出口','2 emergency storey exits':'2 个楼层应急出口',
    'LAYERS':'图层','Trails':'运动轨迹','Enclosure':'包围范围','Following':'跟随关系','Guide roles':'引导角色',
    'Step 1 sites':'步骤 1 部署点','Room labels':'房间标注','Stair transit':'楼梯通行',
    'Pause':'暂停','Play':'播放','Back to start':'回到起点','Follow live':'跟随实时进度',
    'Guide behavior':'引导策略','Evidence & guide behavior':'结果依据与引导策略','Expand for model scope and results':'展开查看模型范围与结果',
    'Native motion, observed arrivals':'原生运动与实际到达','Comparison & audit':'模型对比与审计',
    'Original rooms & notebook lab':'原始房间场景与交互笔记本实验','Close':'关闭',
    'Wheel to zoom · drag to pan · all dimensions in metres · seeded furniture and population':'滚轮缩放 · 拖动平移 · 单位：米 · 家具与人员按随机种子生成',
    'MODEL & GEOMETRY CONTRACT':'模型与几何约定','Two routes to the same accounting rule':'两种路径，统一到达判定',
    'Native backend':'原生仿真后端','Models':'模型','Control scope':'控制范围',
    'Online motion, physical guides, live admission stop':'在线原生运动、实体引导代理、实时停止入场',
    'Autonomous batch/replay, native stairs and scheduled sources; no online guides':'自主批量仿真与回放，原生楼梯与计划入场；不含在线引导代理',
    'Vadere 4.0 + declared corrections':'Vadere 4.0 + 已声明修正',
    'Ground floor architectural evacuation map':'一层建筑疏散地图','Upper floor architectural evacuation map':'二层建筑疏散地图',
    'Continuous native stair progress':'原生楼梯连续运动进度','Simulation timeline':'仿真时间轴','Replay speed':'回放速度',
    'Free camera':'自由视角','Visitors':'新增访客','Guide marker':'引导标记','Native live':'原生实时仿真','Recorded replay':'保存结果回放',
    'Collision Free Speed · v1':'无碰撞速度模型 · v1','Collision Free Speed · v2':'无碰撞速度模型 · v2',
    'Collision Free Speed · v3 + guard':'无碰撞速度模型 · v3 + 保护控制',
    'Anticipation Velocity Model':'预期速度模型 AVM','GCFM · native ellipses + braking':'广义离心力模型 GCFM · 原生椭圆 + 制动',
    'Generalized Centrifugal Force Model':'广义离心力模型 GCFM',
    'Optimal Steps Model':'最优步模型 OSM','Social Force Model':'社会力模型 SFM','OSM · hard-body constraints':'最优步模型 OSM · 身体不可重叠约束',
    'WarpDriver':'WarpDriver 模型',
    'Reception lounge':'接待休息室','Learning studio':'学习工作室','Seminar room':'研讨室','Library lounge':'图书阅览室',
    'Workshop':'工坊','Meeting suite':'会议套间','Project studio':'项目工作室','Exhibition room':'展览室',
    'Teaching laboratory':'教学实验室','Design studio':'设计工作室','Collaboration room':'协作室','Training room':'培训室',
    'Auditorium':'礼堂','Quiet study':'安静自习室','Conference room':'会议室','Multipurpose hall':'多功能厅',
    'ENTRY':'入口','EMERGENCY STAIR':'应急疏散楼梯','CIRCULATION':'通行楼梯','SAFE · GRADE':'地面室外安全区','SAFE':'安全区',
    'WEST CONCOURSE':'西侧大厅','EAST CONCOURSE':'东侧大厅',
    'Guide':'引导代理','Lead':'领航','Ahead':'前导','Tail':'后卫','Relay':'接应',
    'autonomous':'自主疏散','deploy':'部署','enclose':'包围','compress':'压缩队形','passage':'沿路疏导','release':'退出引导','visit / egress':'访问 / 疏散',
    'Awaiting native frames':'等待原生仿真数据','Finished':'已结束','COMPLETE':'全部完成','INCOMPLETE':'尚未完成','EXPERIMENT_ERROR':'程序错误',
    'Finite admission window':'有限入场时段','Draining after source closure':'入口已关闭，继续疏散',
    'Stop inflow early':'提前停止入场','Inflow stopped':'入场已停止','Waiting for native tick…':'等待原生仿真确认…',
    'Stop requested · awaiting native tick':'已请求停止 · 等待原生仿真确认','Connection interrupted · simulation may still be running':'连接中断 · 仿真可能仍在运行',
    'Loading replay data…':'正在加载回放数据…','Loading replay…':'正在加载回放…','Retry':'重试',
    'Replay data could not be loaded.':'无法加载回放数据。','Live endpoint unavailable':'实时接口不可用',
    'Vadere · autonomous batch / corrected interpolation':'Vadere · 自主批量仿真 / 修正插值',
    'JuPedSim CFS v3 · explicit speed / yield guard':'JuPedSim CFS v3 · 已声明限速与让路控制',
    'JuPedSim · declared displacement budget':'JuPedSim · 已声明位移预算',
    'JuPedSim · native pedestrian model':'JuPedSim · 原生行人模型',
    'No online guide controller. Scheduled sources and native stair stepping; replay of saved native output.':'不含在线引导控制器。计划入场与原生楼梯步进；此处回放保存的原生结果。',
    'Only targets and desired speeds are commanded. Native positions determine stair transfer, physical interactions and safe arrivals.':'下发目标与期望速度指令。楼层转移、物理交互和安全区到达均依据原生位置判定。',
    'Targets, desired speeds and supplemental native-speed braking are commanded. Native positions determine stair transfer, physical interactions and safe arrivals.':'下发目标、期望速度与附加原生速度制动。楼层转移、物理交互和安全区到达均依据原生位置判定。',
    'Native speed-dependent ellipses checked at every tick, including continuous envelopes and command-time changes. Supplemental native-speed braking is recorded. ':'每个原生步都检查随速度变化的真实椭圆，包括连续包络与指令时刻变化；附加原生速度制动完整记录。',
    'Historical reference disks only; native ellipse clearance was not assessed. ':'历史结果仅检查参考圆盘，未评估原生椭圆间隙。',
    'CFS v3 observed-heading speed guard':'CFS v3 观测朝向限速控制',
    'GCFM native ellipse braking controller':'GCFM 原生椭圆制动控制',
    'AVM / WarpDriver displacement budget':'AVM / WarpDriver 位移预算控制',
    'Committed-footstep capsule feasibility':'已提交脚步的胶囊形扫掠区域可行性约束',
    'DRAINED':'已全部疏散','BATCH_FINISHED':'批量仿真已结束',
    'guidePolicy':'开阔区域包围 · 靠近墙壁压缩队形 · 停滞时沿路疏导 · 恢复通行后重组',
    'note1':'每层为 100 × 100 米。原生运动在一个连续展开的二维区域内进行；二层图表将其原生坐标镜像显示。楼梯在原生区域中的路径长 12 米，标注层高 4 米；这不是三维生物力学模型。',
    'note2':'内置方案：二层人员通过共用楼梯下行，与一层人流汇合，经一层最终出口离开。外置方案：二层应急路线经专用室外楼梯到达地面安全区；共用楼梯仍可供新增访客上楼。',
    'note3':'经过二层出口不算到达安全区。必须观测到原生身体中心处于室外区域内，且越过最终出口至少 0.6 米。室外区域是演示目的地，不代表经过火灾安全距离评估。',
    'note4':'实时入场：随机新增人员在设定的有限时段后自动停止（默认 30 秒）。提前停止按钮在原生仿真确认后关闭请求。已请求人员继续纳入记账，完成二层访问后疏散。暂停回放不会暂停入场。保存的对比同样在 30 秒关闭请求，随后最多允许 600 秒完成清空。',
    'note5':'CFS v3 包含已声明的观测朝向限速与让路控制。AVM 使用已声明的 0.3 米墙壁缓冲。协议 v3 在 AVM 与 WarpDriver 每个原生步前应用基于观测的位移预算，仅限制期望速度，不改变位置或身体半径。Vadere 使用隔离编译的修正：在包含查询点的网格单元内插值，并对脚步与入场施加身体不可重叠约束，原 JAR 与失败结果均保留。GCFM 使用随速度变化的原生椭圆，以及明确声明的原生速度制动；真实椭圆状态、指令时刻变化与连续包络按不变的零间隙标准审计，同时保留原参考圆盘检查。模型默认参数和楼梯处理尚未进行行为标定；这是配置对比，不是模型优劣排名。',
    'note6':'冻结的步骤 1 从观测人员位置估计边界并搜索部署位置。动态跟随和路径恢复是独立的演示扩展。菱形仅标识引导代理；内部较小的填充身体使用声明的物理半径或记录的 GCFM 椭圆轴长。原生朝向为零时，使用覆盖所有可能椭圆方向的外接圆保守显示。'
  };
  const fragments=[
    [' Status: ',' 状态：'],['Contact audit: ','接触审计：'],
    ['nonnegative recorded gaps','记录的间隙均非负'],['FAIL — contact or unresolved clearance retained','未通过 — 保留接触或未决间隙'],
    ['Strict pass: true','严格验收：通过'],['Strict pass: false','严格验收：未通过'],
    ['Heading observer mismatches: ','朝向观测不一致数：'],['Native remaining: ','原生残留实体数：'],
    ['Stop request failed: ','停止请求失败：'],['Replay load failed: ','回放加载失败：'],
    ['Replay data failed to load: ','回放数据加载失败：'],['Loading replay data','正在加载回放数据'],
    ['Loading replay','正在加载回放'],['Guide marker','引导标记'],['Visitors','新增访客']
  ];
  const listeners=[];
  let requested=null,saved=null;
  try { requested=new URLSearchParams(global.location?.search||'').get('lang'); } catch (_) {}
  try { saved=global.localStorage?.getItem('atrium-language'); } catch (_) {}
  let language=([ 'en','zh' ].includes(requested)?requested:saved)==='zh'?'zh':'en';
  function text(value){
    const input=String(value??'');
    if(language==='en')return input;
    if(Object.prototype.hasOwnProperty.call(zh,input))return zh[input];
    let match;
    if((match=input.match(/^(\d+) pending · (\d+) requested$/)))return `${match[1]} 人待入场 · 共请求 ${match[2]} 人`;
    if((match=input.match(/^(\d+) observed safe$/)))return `已观测到达安全区：${match[1]}`;
    if((match=input.match(/^G (\d+) · U (\d+) · stairs (\d+)$/)))return `一层 ${match[1]} · 二层 ${match[2]} · 楼梯 ${match[3]}`;
    if((match=input.match(/^Source closed at ([\d.]+) s · pending visitors retained$/)))return `入口在 ${match[1]} 秒关闭 · 待入场访客继续保留`;
    if((match=input.match(/^Automatic source closure at ([\d.]+) s · playback pause does not pause simulation$/)))return `入口在 ${match[1]} 秒自动关闭 · 暂停回放不暂停仿真`;
    if((match=input.match(/^Replay · source stop (.*)$/)))return `回放 · 停止入场：${match[1].replace('s (scheduled)','秒（计划）').replace(' s',' 秒')}`;
    if((match=input.match(/^(\d+) bodies in native stair passages · 12 m per flight \/ landing route$/)))return `楼梯内人员与引导代理：${match[1]} · 每段楼梯 / 平台路径长 12 米`;
    if((match=input.match(/^(.*?) · ([a-z /]+) · (\d+) people$/)))return `${match[1]} · ${text(match[2])} · ${match[3]} 人`;
    if((match=input.match(/^(.*?) · (\d+) safe$/)))return `${match[1]} · ${match[2]} 人安全到达`;
    if((match=input.match(/^100 × 100 m · (\d+) rooms( · \+4 m)?$/)))return `100 × 100 米 · ${match[1]} 个房间${match[2]?' · 层高 +4 米':''}`;
    let out=input;
    // Long sentences must be replaced before short fragments. Unknown custom room
    // names and raw backend error details deliberately keep their original text.
    for(const [from,to] of Object.entries(zh))if(from.length>12&&out.includes(from))out=out.split(from).join(to);
    for(const [from,to] of fragments)out=out.split(from).join(to);
    return out.replace(/\bCOMPLETE\b/g,'全部完成').replace(/\bINCOMPLETE\b/g,'尚未完成').replace(/\bEXPERIMENT_ERROR\b/g,'程序错误').replace(/\.\s+(?=[\u3400-\u9fff])/g,'。').replace(/\.$/,'。');
  }
  // Stable IDs must never be translated by the generic text function. In this
  // building B is both a group ID and a rear-guide role; N is an exit ID as well
  // as the compass direction. Call the explicit context only for role/compass UI.
  function role(value){return language==='zh'?({F:'前',L:'左',B:'后',R:'右'}[value]||text(value)):String(value);}
  function direction(value){return language==='zh'?({N:'北',E:'东',S:'南',W:'西'}[value]||text(value)):String(value);}
  function model(value){const names={cfs_v1:'Collision Free Speed · v1',cfs:'Collision Free Speed · v2',cfs_v3:'Collision Free Speed · v3 + guard',avm:'Anticipation Velocity Model',gcfm:'GCFM · native ellipses + braking',sfm:'Social Force Model',warp:'WarpDriver',osm:'OSM · hard-body constraints'};return text(names[value]||value);}
  function apply(){
    const doc=global.document;
    if(!doc)return;
    if(doc.documentElement)doc.documentElement.lang=language==='zh'?'zh-CN':'en';
    if(doc.querySelectorAll){
      for(const node of doc.querySelectorAll('[data-i18n]')){
        if(node.__atriumEnglish===undefined)node.__atriumEnglish=node.textContent;
        node.textContent=language==='en'?node.__atriumEnglish:text(node.getAttribute('data-i18n'));
      }
      for(const [attribute,target] of [['data-i18n-title','title'],['data-i18n-aria','aria-label']])
        for(const node of doc.querySelectorAll(`[${attribute}]`))node.setAttribute(target,text(node.getAttribute(attribute)));
    }
    const button=doc.getElementById('language');
    if(button){button.textContent=language==='en'?'中文':'English';button.setAttribute?.('aria-label',language==='en'?'Switch to Chinese':'切换到英文');button.setAttribute?.('title',language==='en'?'Switch to Chinese':'切换到英文');}
    if(['Atrium 100 · Pedestrian Dynamics Lab','Atrium 100 · 行人动力学实验室'].includes(doc.title))doc.title=language==='en'?'Atrium 100 · Pedestrian Dynamics Lab':'Atrium 100 · 行人动力学实验室';
  }
  function setLanguage(next){
    if(next!=='en'&&next!=='zh')return;
    language=next;
    try{global.localStorage?.setItem('atrium-language',language);}catch(_){}
    // Synchronize an explicit language query so reloading cannot undo a toggle,
    // including browsers that block localStorage. Preserve run and anchor values.
    try{if(global.history?.replaceState&&global.location?.pathname){const query=new URLSearchParams(global.location.search||'');query.set('lang',language);global.history.replaceState(null,'',global.location.pathname+'?'+query.toString()+(global.location.hash||''));}}catch(_){}
    apply();
    for(const listener of listeners)listener(language);
  }
  global.AtriumI18n={text,role,direction,model,apply,setLanguage,onChange(callback){listeners.push(callback);return ()=>{const i=listeners.indexOf(callback);if(i>=0)listeners.splice(i,1);};},get language(){return language;}};
  const button=global.document?.getElementById('language');
  if(button)button.onclick=()=>setLanguage(language==='en'?'zh':'en');
  apply();
})(window);
