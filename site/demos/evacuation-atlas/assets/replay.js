export const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export function atOrBefore(rows,t,getTime){
  let lo=0,hi=rows.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(getTime(rows[mid])<=t)lo=mid+1;else hi=mid;}
  return lo-1;
}
const frameTime=f=>f.t, stepTime=r=>r[0];
const inRect=(x,y,b)=>x>=b[0]&&x<=b[2]&&y>=b[1]&&y<=b[3];
export function legacyPlan(data){
  return {bounds:data.bounds,floors:[{outlines:[data.outline],holes:data.holes,rooms:data.zones,
    solids:[],doors:[],stairs:[],entrances:data.entrances,exits:data.exits,corridors:[],waypoints:data.waypoints}]};
}
export function positionOnPlan(x,y,plan){
  if(plan.floors.length===1)return {x,y,f:0,stair:false,mirror:false};
  const connection=(x>100&&x<112)&&((y>=23&&y<=29)||(y>=71&&y<=77));
  const mirror=x>=112||(connection&&x>=106);
  const lx=mirror?212-x:x;
  const outer=mirror&&plan.floors[1].stairs.some(s=>s.exterior&&inRect(lx,y,s.bounds));
  const discharge=mirror&&(y>100||y<0)&&!outer;
  return {x:lx,y,f:mirror&&!discharge?1:0,stair:connection||outer,mirror};
}
function outsideDistance(x,y,b){
  return Math.hypot(Math.max(b[0]-x,0,x-b[2]),Math.max(b[1]-y,0,y-b[3]));
}
export class Replay{
  constructor(data,plan){
    this.data=data;this.plan=plan||legacyPlan(data);this.frames=data.frames;this.end=this.frames.at(-1).t;
    this.actors=new Map(data.actors.map(a=>[a.id,a]));this.first=new Map();this.last=new Map();this.indexCache=new Map();
    this.exits=this.plan.floors[0].exits;this.events=[];this.observed=Array.isArray(data.arrivals);
    this.groups=[...new Set(data.actors.map(a=>a.group))].sort();
    this.hasLinks=false;this.hasTargets=false;this.hasRoles=false;
    this.frames.forEach((f,k)=>{
      if(f.links?.length)this.hasLinks=true;
      if(f.targets?.length){this.hasTargets=true;this.hasRoles=true;}
      for(const p of f.p){if(!this.first.has(p[0]))this.first.set(p[0],f.t);this.last.set(p[0],[k,p]);}
    });
    if(this.observed)this.events=data.arrivals;
    else for(const [id,[k,p]] of this.last){
      if(k+1>=this.frames.length)continue;
      const matches=this.exits.filter(e=>outsideDistance(p[1],p[2],e.bounds)<=.5);
      this.events.push([this.frames[k+1].t,id,matches.length===1?matches[0].id:null]);
    }
    this.events.sort((a,b)=>a[0]-b[0]);
  }
  index(frame){
    let found=this.indexCache.get(frame);
    if(!found){found=new Map(frame.p.map(p=>[p[0],p]));this.indexCache.set(frame,found);
      if(this.indexCache.size>18)this.indexCache.delete(this.indexCache.keys().next().value);}
    return found;
  }
  sample(time){
    const t=clamp(time,0,this.end),k=Math.max(0,atOrBefore(this.frames,t,frameTime));
    const f=this.frames[k],g=this.frames[k+1],next=g?this.index(g):null,u=g&&g.t>f.t?(t-f.t)/(g.t-f.t):0;
    const pts=[],byId=new Map(),totals={arrived:0,admitted:0,inside:0,guides:0,stairs:0,exits:{}};
    const arrived=new Set();
    for(const [stamp,id,exit] of this.events){
      if(stamp>t+1e-8)break;arrived.add(id);
      if(this.actors.get(id)?.kind==='person'){totals.arrived++;if(exit)totals.exits[exit]=(totals.exits[exit]||0)+1;}
    }
    for(const [id,born] of this.first){
      if(born>t)continue;
      if(this.actors.get(id).kind==='person')totals.admitted++;
    }
    for(const p of f.p){
      const [id]=p,actor=this.actors.get(id),q=next?.get(id)||p;
      let x=p[1]+(q[1]-p[1])*u,y=p[2]+(q[2]-p[2])*u;
      const steps=this.data.steps?.[id];
      if(steps?.length){
        const foot=steps[Math.max(0,atOrBefore(steps,t,stepTime))],v=clamp((t-foot[0])/Math.max(.000001,foot[1]-foot[0]),0,1);
        x=foot[2]+(foot[4]-foot[2])*v;y=foot[3]+(foot[5]-foot[3])*v;
      }
      const a=p[3]??actor.radius,b=p[4]??actor.radius;
      const delta=((q[5]??0)-(p[5]??0)),angle=(p[5]??0)+Math.atan2(Math.sin(delta),Math.cos(delta))*u;
      const loc=positionOnPlan(x,y,this.plan);
      const point={...loc,id,actor,a:a+((q[3]??a)-a)*u,b:b+((q[4]??b)-b)*u,
        angle:loc.mirror?Math.PI-angle:angle,safe:arrived.has(id)};
      pts.push(point);byId.set(id,point);
      if(!point.safe){if(actor.kind==='guide')totals.guides++;else if(loc.stair)totals.stairs++;}
    }
    totals.inside=totals.admitted-totals.arrived;
    return {t,k,frame:f,pts,byId,totals};
  }
  trail(id,sample){
    const points=[];
    for(let j=0;j<=7;j++){
      const t=sample.t-(7-j)*.5;if(t<0)continue;
      const k=atOrBefore(this.frames,t,frameTime),p=this.index(this.frames[k]).get(id);
      if(p)points.push(positionOnPlan(p[1],p[2],this.plan));
    }
    return points;
  }
}
