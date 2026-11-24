const text = {
  osmTopicScope:['本专题使用运行中的指令，当前 OSM 批处理适配器支持固定路线与途经点。','This topic uses runtime commands. The current OSM batch adapter supports fixed routes and waypoints.'],
  building:['建筑疏散','Buildings'],behavior:['行人行为','Pedestrian behavior'],compare:['模型对照','Model comparison'],
  atlas:['疏散图集','EVACUATION ATLAS'],help:['使用与资料','Guide & sources'],scene:['选择场景','Scenario'],model:['模型','Model'],
  floor:['楼层','Floor'],floor0:['首层','Ground floor'],floor1:['上层','Upper floor'],both:['两层并排','Both floors'],
  layout:['更换布局','Change layout'],layoutNo:['布局','Layout'],layers:['图层','Layers'],expand:['全屏地图','Expand map'],close:['关闭','Close'],
  zoomIn:['放大','Zoom in'],zoomOut:['缩小','Zoom out'],fit:['恢复全图','Fit map'],play:['播放','Play'],pause:['暂停','Pause'],restart:['回到起点','Restart'],
  timeline:['仿真时间轴','Simulation timeline'],speed:['播放速度','Playback speed'],map:['可缩放的疏散地图','Zoomable evacuation map'],
  camera:['镜头','Camera'],all:['全图','Whole map'],group:['组','Group'],overview:['总览','Overview'],
  progress:['疏散进度','Evacuation progress'],byExit:['各出口到达人数','Arrivals by exit'],legend:['图例','Map key'],
  arrived:['人已到达','people arrived'],left:['人已离场','people departed'],inside:['疏散途中','En route'],active:['画面内人员','People in view'],
  guides:['引导代理','Guides'],admitted:['已入场人数','People admitted'],stairPeople:['楼梯上人员','People on stairs'],
  people:['行人','Pedestrian'],guide:['引导代理','Guide'],entry:['入口','Entrance'],exit:['普通出口','Exit'],emergency:['应急出口','Emergency exit'],
  labels:['房间与出口标注','Map labels'],trails:['移动轨迹','Recent trails'],hull:['引导代理包围范围','Guide enclosure'],
  sensing:['局部感知范围 · 7 米','Local sensing range · 7 m'],departuresByExit:['按出口统计离场','Departures by exit'],
  leaveFullscreen:['退出全屏','Exit full screen'],
  links:['实际跟随关系','Following links'],targets:['引导部署目标','Guide targets'],roles:['引导位置角色','Guide roles'],waypoints:['行程途经点','Journey waypoints'],
  bodies:['实际身体轮廓','Body footprints'],revision:['回放版本','Recording'],current:['当前版本','Current recording'],earlier:['保留的早期版本','Earlier recording'],
  guideScope:['人员随实际引导位置移动','Pedestrians follow the guides’ actual positions'],osmScope:['自主步行，无在线引导','Autonomous walking without online guides'],
  archive:['早期记录','Earlier recording'],contact:['检测到接触','Contact detected'],incomplete:['疏散未完成','Evacuation incomplete'],error:['生成错误','Recording error'],
  demo:['独立生成的演示回放','Independently generated demonstration replay'],loading:['读取回放中…','Loading recording…'],failure:['回放读取失败，请重选场景或刷新网页。','Could not load the recording. Select the scene again or refresh.'],
  gestures:['地图操作','Map controls'],gesturesBody:['滚轮缩放，拖动平移，点击缩放百分比恢复全图。空格播放或暂停，方向键前后移动 5 秒。点选群组镜头可跟随行人。','Scroll to zoom and drag to pan. Select the zoom percentage to fit the map. Space toggles playback and the arrow keys move five seconds. Select a group camera to follow its pedestrians.'],
  helpBody:['建筑、行人行为与模型对照共用同一播放器。回放来自独立演示运行。模型对照采用相同建筑布局和仿真秒数，较短的记录在终点停留。双层建筑中的 OSM 自主行走，其他模型可接受在线引导。圆点和菱形为便于辨认的地图符号，可切换实际身体轮廓。','Buildings, behavior examples and model comparisons share one player. Each recording comes from a separate demonstration run. The comparison uses the same layout and simulation clock and holds the shorter recording at its end. OSM walks autonomously in the two-storey building; the other models can use online guidance. Dots and diamonds are map symbols. Turn on body footprints for physical sizes.'],
  sources:['JuPedSim 官方示例','JuPedSim notebooks'],original:['已发布的 Atrium 100','Published Atrium 100'],singleFloor:['单层平面','Single-floor plan'],
  compareDeck:['两种模型使用同一布局、同一仿真时刻。可切换模型，或沿时间轴查看人群如何分流。','Both models share a layout and simulation clock. Select a pair or scrub the timeline to see how the flows diverge.'],
  exitsUnknown:['此回放没有可归属的出口记录。','This recording has no attributable exit events.'],distance:['比例尺','Map scale'],m:['米','m'],
  sameClock:['同步播放','Synchronized playback'],modelA:['模型 A','Model A'],modelB:['模型 B','Model B'],floorStair:['疏散楼梯','Egress stair'],
  east:['东','East'],west:['西','West'],south:['南','South'],north:['北','North'],outside:['室外','Outdoors'],
  earlyEnd:['已到回放终点','End of recording'],room:['房间','Room'],crossing:['中央交叉口','Central crossing'],concourse:['中央走廊','Central concourse'],
  complete:['全部到达','All arrived'],strictOther:['仅核实自主疏散与身体接触','Autonomous evacuation and body contacts checked'],
  analysis:['步速与密度 · PedPy','Speed & density · PedPy'],meanSpeed:['平均步速','Mean speed'],density:['走廊密度','Corridor density'],
  floorCross:['各层十字走廊，按层计数','Cross corridors, counted per floor'],pavilionCross:['整条东西走廊','Full east–west corridor'],campusStrip:['东西走廊中央测量带','Central strip of the east–west corridor'],
  deploy:['就位','Deploying'],enclose:['四向引导','Surrounding'],compress:['压缩队形','Compressing'],release:['自主离场','Leaving independently'],passage:['沿路疏导','Corridor guidance'],
  autonomous:['自主步行','Walking independently'],'visit / egress':['上楼后疏散','Upper-floor visit and evacuation'],corridor:['沿路疏导','Corridor guidance'],surround:['包围引导','Surrounding'],search:['搜索','Searching'],interrupted:['协调中断','Coordination paused'],walk:['通行','Walking'],
  phaseWalk:['通行','Walking'],phaseSearch:['搜索','Search'],phaseInterrupted:['协调中断','Coordination paused'],phaseSurround:['包围引导','Surrounding the group'],phaseCorridor:['沿路疏导','Corridor guidance'],
  views:['浏览模式','Views'],calm:['回放','Replay'],draw:['地图','Plan'],destination:['出口','Exit'],shade:['其他','Other'],
  notebook1:['模型比较','Model comparison'],notebook2:['转角','Corners'],notebook3:['连续瓶颈','Double bottleneck'],notebook4:['行程与途经点','Journeys'],
  notebook5:['双向流与分道','Bidirectional lanes'],notebook6:['动机与步速','Motivation'],notebook7:['等待与队列','Queues and waiting'],notebook8:['疏散路线选择','Route choice'],notebook9:['引导跟随','Leader–follower motion'],notebook10:['单列行走','Single-file movement'],
  'Forum':['论坛厅','Forum'],'Gallery':['展厅','Gallery'],'Reading room':['阅览室','Reading room'],'Lounge':['休息厅','Lounge'],
  'Workshop':['工作坊','Workshop'],'Studio':['设计室','Studio'],'Seminar room':['研讨室','Seminar room'],'Library':['图书室','Library'],
  'Coworking':['共享工作室','Coworking'],'Auditorium':['报告厅','Auditorium'],'Teaching lab':['教学实验室','Teaching lab'],'Exhibition':['展览厅','Exhibition'],
  'Training room':['培训室','Training room'],'Multipurpose hall':['多功能厅','Multipurpose hall'],garden:['庭园','Garden'],lounge:['休息区','Lounge'],gallery:['展览区','Gallery'],forum:['交流区','Forum'],
  F:['前','F'],B:['后','B'],L:['左','L'],R:['右','R'],main:['主出口','Main exit'],emergencyId:['应急出口','Emergency exit'],visitors:['新入场','Arrivals'],
};
export const notebooks=['model-comparison','corner','double-bottleneck','journey','lane-formation','motivation','queues_waiting','routing','direct_steering','single-file'];
export const colors={A:'#126c73',B:'#af5b34',C:'#585998',D:'#58834b',V:'#9e506a'};
export const modelNames={cfs:'CFS v2',cfs_v1:'CFS v1',cfs_v3:'CFS v3',avm:'AVM',gcfm:'GCFM',sfm:'Social Force',warp:'WarpDriver',osm:'OSM'};
export function word(key,lang){return text[key]?.[lang==='zh'?0:1]??key;}
export function modelName(key,lang){return key==='sfm'&&lang==='zh'?'社会力模型':modelNames[key]??key;}
export function exitName(id,lang){
  const names={E:'east',W:'west',N:'north',S:'south',main:'main',emergency:'emergencyId',UN:'north',US:'south'};
  if(!names[id])return id;
  if(id==='main'||id==='emergency')return word(names[id],lang);
  const side=word(names[id],lang);
  if(id.startsWith('U'))return lang==='zh'?side+'侧外梯':side+' stair';
  return lang==='zh'?side+'出口':side+' exit';
}
