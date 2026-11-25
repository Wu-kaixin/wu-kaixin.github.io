const text = {
  osmTopicScope:['本专题使用运行中的指令，当前 OSM 批处理适配器支持固定路线与途经点。','This topic uses runtime commands. The current OSM batch adapter supports fixed routes and waypoints.',"このテーマでは実行中に指示を出します。現在の OSM バッチアダプターは、固定経路と経由点に対応しています。"],
  building:['建筑疏散','Buildings',"建物の避難"],behavior:['行人行为','Pedestrian behavior',"歩行者の行動"],compare:['模型对照','Model comparison',"モデル比較"],
  atlas:['疏散图集','EVACUATION ATLAS',"避難アトラス"],help:['使用与资料','Guide & sources',"使い方と参考資料"],scene:['选择场景','Scenario',"シナリオを選択"],model:['模型','Model',"モデル"],
  floor:['楼层','Floor',"階"],floor0:['首层','Ground floor',"1階"],floor1:['上层','Upper floor',"上階"],both:['两层并排','Both floors',"両階を並べて表示"],
  layout:['更换布局','Change layout',"配置を変更"],layoutNo:['布局','Layout',"配置"],layers:['图层','Layers',"表示レイヤー"],expand:['全屏地图','Expand map',"地図を全画面表示"],close:['关闭','Close',"閉じる"],
  zoomIn:['放大','Zoom in',"拡大"],zoomOut:['缩小','Zoom out',"縮小"],fit:['恢复全图','Fit map',"地図全体を表示"],play:['播放','Play',"再生"],pause:['暂停','Pause',"一時停止"],restart:['回到起点','Restart',"最初に戻る"],
  timeline:['仿真时间轴','Simulation timeline',"シミュレーションの時間軸"],speed:['播放速度','Playback speed',"再生速度"],map:['可缩放的疏散地图','Zoomable evacuation map',"拡大・縮小できる避難地図"],
  camera:['镜头','Camera',"カメラ"],all:['全图','Whole map',"地図全体"],group:['组','Group',"グループ"],overview:['总览','Overview',"概要"],
  progress:['疏散进度','Evacuation progress',"避難の進み具合"],byExit:['各出口到达人数','Arrivals by exit',"出口別の到達人数"],legend:['图例','Map key',"凡例"],
  arrived:['人已到达','people arrived',"人が到達"],left:['人已离场','people departed',"人が退場"],inside:['疏散途中','En route',"避難中"],active:['画面内人员','People in view',"画面内の人数"],
  guides:['引导代理','Guides',"誘導員"],admitted:['已入场人数','People admitted',"入場者数"],stairPeople:['楼梯上人员','People on stairs',"階段上の人数"],
  people:['行人','Pedestrian',"歩行者"],guide:['引导代理','Guide',"誘導員"],entry:['入口','Entrance',"入口"],exit:['普通出口','Exit',"一般出口"],emergency:['应急出口','Emergency exit',"非常口"],
  labels:['房间与出口标注','Map labels',"部屋と出口の名称"],trails:['移动轨迹','Recent trails',"移動の軌跡"],hull:['引导代理包围范围','Guide enclosure',"誘導員が囲む範囲"],
  sensing:['局部感知范围 · 7 米','Local sensing range · 7 m',"周囲の感知範囲（7 m）"],departuresByExit:['按出口统计离场','Departures by exit',"出口別の退場人数"],
  leaveFullscreen:['退出全屏','Exit full screen',"全画面表示を終了"],
  links:['实际跟随关系','Following links',"実際の追従関係"],targets:['引导部署目标','Guide targets',"誘導員の配置目標"],roles:['引导位置角色','Guide roles',"誘導員の位置と役割"],waypoints:['行程途经点','Journey waypoints',"経由点"],
  bodies:['实际身体轮廓','Body footprints',"実寸の身体輪郭"],revision:['回放版本','Recording',"再生記録"],current:['当前版本','Current recording',"現在の記録"],earlier:['保留的早期版本','Earlier recording',"以前の記録"],
  guideScope:['人员随实际引导位置移动','Pedestrians follow the guides’ actual positions',"歩行者は誘導員の実際の位置を追って移動します"],osmScope:['自主步行，无在线引导','Autonomous walking without online guides',"リアルタイムの誘導を受けずに自律歩行します"],
  archive:['早期记录','Earlier recording',"以前の記録"],contact:['检测到接触','Contact detected',"身体接触を検出"],incomplete:['疏散未完成','Evacuation incomplete',"避難未完了"],error:['生成错误','Recording error',"記録エラー"],
  demo:['独立生成的演示回放','Independently generated demonstration replay',"個別に実行したデモの再生記録"],loading:['读取回放中…','Loading recording…',"記録を読み込み中…"],failure:['回放读取失败，请重选场景或刷新网页。','Could not load the recording. Select the scene again or refresh.',"記録を読み込めませんでした。シナリオを選び直すか、ページを再読み込みしてください。"],
  gestures:['地图操作','Map controls',"地図の操作"],gesturesBody:['滚轮缩放，拖动平移，点击缩放百分比恢复全图。空格播放或暂停，方向键前后移动 5 秒。点选群组镜头可跟随行人。','Scroll to zoom and drag to pan. Select the zoom percentage to fit the map. Space toggles playback and the arrow keys move five seconds. Select a group camera to follow its pedestrians.',"スクロールで拡大・縮小、ドラッグで移動します。倍率を選ぶと地図全体に戻ります。スペースキーで再生・一時停止、左右の矢印キーで5秒ずつ移動します。カメラでグループを選ぶと、その歩行者を追跡できます。"],
  helpBody:['建筑、行人行为与模型对照共用同一播放器。回放来自独立演示运行。模型对照采用相同建筑布局和仿真秒数，较短的记录在终点停留。双层建筑中的 OSM 自主行走，其他模型可接受在线引导。圆点和菱形为便于辨认的地图符号，可切换实际身体轮廓。','Buildings, behavior examples and model comparisons share one player. Each recording comes from a separate demonstration run. The comparison uses the same layout and simulation clock and holds the shorter recording at its end. OSM walks autonomously in the two-storey building; the other models can use online guidance. Dots and diamonds are map symbols. Turn on body footprints for physical sizes.',"建物の避難、歩行者の行動、モデル比較では同じプレーヤーを使います。各記録は個別に実行したデモです。モデル比較では同じ配置とシミュレーション時刻を使い、先に終わった記録は最終状態を表示します。2階建ての建物では OSM は自律歩行し、ほかのモデルはリアルタイムの誘導を受けられます。丸とひし形は地図上の記号です。「実寸の身体輪郭」で実際の大きさを確認できます。"],
  sources:['JuPedSim 官方示例','JuPedSim notebooks',"JuPedSim 公式サンプル"],original:['已发布的 Atrium 100','Published Atrium 100',"公開版 Atrium 100"],singleFloor:['单层平面','Single-floor plan',"単層平面図"],
  compareDeck:['两种模型使用同一布局、同一仿真时刻。可切换模型，或沿时间轴查看人群如何分流。','Both models share a layout and simulation clock. Select a pair or scrub the timeline to see how the flows diverge.',"同じ配置、同じシミュレーション時刻で2つのモデルを比較します。モデルの組み合わせを選ぶか、時間軸を動かして人の流れの違いを確認できます。"],
  exitsUnknown:['此回放没有可归属的出口记录。','This recording has no attributable exit events.',"この記録には出口を特定できるイベントがありません。"],distance:['比例尺','Map scale',"縮尺"],m:['米','m',"m"],
  sameClock:['同步播放','Synchronized playback',"同期再生"],modelA:['模型 A','Model A',"モデル A"],modelB:['模型 B','Model B',"モデル B"],floorStair:['疏散楼梯','Egress stair',"避難階段"],
  east:['东','East',"東"],west:['西','West',"西"],south:['南','South',"南"],north:['北','North',"北"],outside:['室外','Outdoors',"屋外"],
  earlyEnd:['已到回放终点','End of recording',"記録の終点"],room:['房间','Room',"部屋"],crossing:['中央交叉口','Central crossing',"中央交差部"],concourse:['中央走廊','Central concourse',"中央通路"],
  complete:['全部到达','All arrived',"全員到達"],strictOther:['仅核实自主疏散与身体接触','Autonomous evacuation and body contacts checked',"自律避難と身体接触のみ確認"],
  analysis:['步速与密度 · PedPy','Speed & density · PedPy',"歩行速度と密度 · PedPy"],meanSpeed:['平均步速','Mean speed',"平均歩行速度"],density:['走廊密度','Corridor density',"通路の密度"],
  floorCross:['各层十字走廊，按层计数','Cross corridors, counted per floor',"各階の十字通路（階ごとに集計）"],pavilionCross:['整条东西走廊','Full east–west corridor',"東西通路全体"],campusStrip:['东西走廊中央测量带','Central strip of the east–west corridor',"東西通路中央の測定区間"],
  deploy:['就位','Deploying',"配置に移動"],enclose:['四向引导','Surrounding',"四方向から誘導"],compress:['压缩队形','Compressing',"隊形を縮小"],release:['自主离场','Leaving independently',"自律退場"],passage:['沿路疏导','Corridor guidance',"通路での誘導"],
  autonomous:['自主步行','Walking independently',"自律歩行"],'visit / egress':['上楼后疏散','Upper-floor visit and evacuation',"上階を経由して避難"],corridor:['沿路疏导','Corridor guidance',"通路での誘導"],surround:['包围引导','Surrounding',"取り囲んで誘導"],search:['搜索','Searching',"探索中"],interrupted:['协调中断','Coordination paused',"連携を一時停止"],walk:['通行','Walking',"歩行中"],
  phaseWalk:['通行','Walking',"歩行中"],phaseSearch:['搜索','Search',"探索"],phaseInterrupted:['协调中断','Coordination paused',"連携を一時停止"],phaseSurround:['包围引导','Surrounding the group',"グループを囲んで誘導"],phaseCorridor:['沿路疏导','Corridor guidance',"通路での誘導"],
  views:['浏览模式','Views',"表示モード"],calm:['回放','Replay',"再生"],draw:['地图','Plan',"平面図"],destination:['出口','Exit',"出口"],shade:['其他','Other',"その他"],
  notebook1:['模型比较','Model comparison',"モデル比較"],notebook2:['转角','Corners',"曲がり角"],notebook3:['连续瓶颈','Double bottleneck',"連続する狭窄部"],notebook4:['行程与途经点','Journeys',"経路と経由点"],
  notebook5:['双向流与分道','Bidirectional lanes',"双方向流とレーン形成"],notebook6:['动机与步速','Motivation',"動機と歩行速度"],notebook7:['等待与队列','Queues and waiting',"待機と行列"],notebook8:['疏散路线选择','Route choice',"避難経路の選択"],notebook9:['引导跟随','Leader–follower motion',"誘導員への追従"],notebook10:['单列行走','Single-file movement',"一列歩行"],
  'Forum':['论坛厅','Forum',"交流ホール"],'Gallery':['展厅','Gallery',"展示室"],'Reading room':['阅览室','Reading room',"閲覧室"],'Lounge':['休息厅','Lounge',"ラウンジ"],
  'Workshop':['工作坊','Workshop',"作業室"],'Studio':['设计室','Studio',"設計室"],'Seminar room':['研讨室','Seminar room',"セミナー室"],'Library':['图书室','Library',"図書室"],
  'Coworking':['共享工作室','Coworking',"共同作業室"],'Auditorium':['报告厅','Auditorium',"講堂"],'Teaching lab':['教学实验室','Teaching lab',"教育実験室"],'Exhibition':['展览厅','Exhibition',"展示ホール"],
  'Training room':['培训室','Training room',"研修室"],'Multipurpose hall':['多功能厅','Multipurpose hall',"多目的ホール"],garden:['庭园','Garden',"庭園"],lounge:['休息区','Lounge',"休憩エリア"],gallery:['展览区','Gallery',"展示エリア"],forum:['交流区','Forum',"交流エリア"],
  F:['前','F',"前"],B:['后','B',"後"],L:['左','L',"左"],R:['右','R',"右"],main:['主出口','Main exit',"正面出口"],emergencyId:['应急出口','Emergency exit',"非常口"],visitors:['新入场','Arrivals',"新規入場者"],
};
export const notebooks=['model-comparison','corner','double-bottleneck','journey','lane-formation','motivation','queues_waiting','routing','direct_steering','single-file'];
export const colors={A:'#126c73',B:'#af5b34',C:'#585998',D:'#58834b',V:'#9e506a'};
export const modelNames={cfs:'CFS v2',cfs_v1:'CFS v1',cfs_v3:'CFS v3',avm:'AVM',gcfm:'GCFM',sfm:'Social Force',warp:'WarpDriver',osm:'OSM'};
export function word(key,lang){return text[key]?.[lang==='zh'?0:lang==='ja'?2:1]??key;}
export function modelName(key,lang){if(key==='sfm'&&lang==='ja')return '社会力モデル';return key==='sfm'&&lang==='zh'?'社会力模型':modelNames[key]??key;}
export function exitName(id,lang){
  const names={E:'east',W:'west',N:'north',S:'south',main:'main',emergency:'emergencyId',UN:'north',US:'south'};
  if(!names[id])return id;
  if(id==='main'||id==='emergency')return word(names[id],lang);
  const side=word(names[id],lang);
  if(lang==='ja')return side+(id.startsWith('U')?'側の屋外階段':'出口');
  if(id.startsWith('U'))return lang==='zh'?side+'侧外梯':side+' stair';
  return lang==='zh'?side+'出口':side+' exit';
}
