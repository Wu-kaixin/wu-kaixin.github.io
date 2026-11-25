import {colors,word,exitName} from './words.js';
import {clamp,positionOnPlan} from './replay.js';

const center=b=>[(b[0]+b[2])/2,(b[1]+b[3])/2];
function path(ctx,points,close=false){
  ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));if(close)ctx.closePath();
}
function hull(points){
  const sorted=points.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  function half(arr){const p=[];for(const v of arr){while(p.length>=2){const [a,b]=p.slice(-2);
    if((b[0]-a[0])*(v[1]-a[1])>(b[1]-a[1])*(v[0]-a[0]))break;p.pop();}p.push(v);}return p;}
  return [...half(sorted).slice(0,-1),...half(sorted.reverse()).slice(0,-1)];
}
function label(c,s,x,y,size,color,bold=false,align='center'){
  c.font=(bold?'600 ':'400 ')+size+'px "Segoe UI","Microsoft YaHei",sans-serif';
  c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y);
}
function stroke(c,points,color,width=1){path(c,points);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function fillRing(c,points,fill,line,width=1){path(c,points,true);if(fill){c.fillStyle=fill;c.fill();}if(line){c.strokeStyle=line;c.lineWidth=width;c.stroke();}}
function normal(e,plan){
  if(e.normal)return e.normal;
  const cardinals={W:[-1,0],E:[1,0],N:[0,1],S:[0,-1]};if(cardinals[e.id])return cardinals[e.id];
  const [x,y]=center(e.bounds),[cx,cy]=center(plan.bounds);
  return Math.abs(x-cx)>Math.abs(y-cy)?[Math.sign(x-cx),0]:[0,Math.sign(y-cy)];
}
export class MapView{
  constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d');this.base=document.createElement('canvas');this.key='';this.transforms=[];}
  size(){const r=this.canvas.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1);
    return {w:Math.max(1,Math.round(r.width)),h:Math.max(1,Math.round(r.height)),d};}
  transform(box,plan,view,f,track){
    const {x,y,w,h}=box,b=plan.bounds,[cx,cy]=center(b),padX=clamp(w*.08,21,50),padY=clamp(h*.064,19,31);
    const s=Math.min((w-2*padX)/(b[2]-b[0]),(h-2*padY)/(b[3]-b[1]))*view.z;
    const fx=track?.f===f?track.x:cx,fy=track?.f===f?track.y:cy;
    const ox=x+w/2-fx*s+view.dx,oy=y+h/2+fy*s+view.dy;
    return {box,f,s,ox,oy,xy:(a,b)=>[ox+a*s,oy-b*s]};
  }
  draw(replay,sample,view,opt){
    const {w,h,d}=this.size(),plan=replay.plan;
    if(this.canvas.width!==Math.round(w*d)||this.canvas.height!==Math.round(h*d)){
      this.canvas.width=Math.round(w*d);this.canvas.height=Math.round(h*d);this.key='';
    }
    const groups=sample.pts.filter(p=>p.actor.group===opt.camera&&p.actor.kind==='person'&&!p.safe);
    let track=null;
    if(groups.length){
      const most=groups.filter(p=>p.f===1).length>groups.length/2?1:0,part=groups.filter(p=>p.f===most);
      track={x:part.reduce((s,p)=>s+p.x,0)/part.length,y:part.reduce((s,p)=>s+p.y,0)/part.length,f:most};
    }
    let floors=plan.floors.length===1?[0]:opt.floor==='both'?[0,1]:[track?.f??Number(opt.floor)];
    const vertical=floors.length>1&&w<h*1.14;
    const boxes=floors.map((f,i)=>({x:vertical?0:i*w/floors.length,y:vertical?i*h/floors.length:0,w:vertical?w:w/floors.length,h:vertical?h/floors.length:h}));
    this.transforms=floors.map((f,i)=>this.transform(boxes[i],plan,view,f,track));
    const key=[replay.data.id,w,h,d,opt.lang,opt.labels,opt.floor,view.z,view.dx,view.dy,track?.x,track?.y,track?.f].join('|');
    if(key!==this.key){
      if(this.base.width!==this.canvas.width||this.base.height!==this.canvas.height){
        this.base.width=this.canvas.width;this.base.height=this.canvas.height;}
      const b=this.base.getContext('2d');b.setTransform(d,0,0,d,0,0);b.clearRect(0,0,w,h);
      this.transforms.forEach(tr=>this.floorBase(b,tr,plan,opt,floors.length>1));this.key=key;
    }
    const c=this.c;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,this.canvas.width,this.canvas.height);c.drawImage(this.base,0,0);
    c.setTransform(d,0,0,d,0,0);
    this.transforms.forEach(tr=>this.people(c,tr,replay,sample,opt));
    this.scale=this.transforms[0].s;
  }
  floorBase(c,tr,plan,opt,both){
    const {box:b,xy,s,f}=tr,p=plan.floors[f],lg=opt.lang,roomTones=['#f4e9d8','#e5edf0','#edf0dd','#e9e5ee'];
    c.save();c.beginPath();c.rect(b.x,b.y,b.w,b.h);c.clip();
    const rect=(r,fill,line=null,width=1)=>{
      const [x,y]=xy(r[0],r[3]),w=(r[2]-r[0])*s,h=(r[3]-r[1])*s;
      if(fill){c.fillStyle=fill;c.fillRect(x,y,w,h);}
      if(line){c.strokeStyle=line;c.lineWidth=width;c.strokeRect(x,y,w,h);}
      return [x,y,w,h];
    };
    for(const ring of p.outlines){
      const pts=ring.map(q=>xy(...q));
      c.save();c.shadowColor='#23423a38';c.shadowOffsetY=3;c.shadowBlur=6;fillRing(c,pts,'#f9f9ef');c.restore();
      fillRing(c,pts,'#f8f8f0','#435d56',2);
    }
    c.save();c.beginPath();
    for(const ring of p.outlines){ring.forEach((q,i)=>i?c.lineTo(...xy(...q)):c.moveTo(...xy(...q)));c.closePath();}c.clip();
    for(const q of p.corridors||[])rect(q,'#dce9e1');
    if(!p.corridors?.length&&p.rooms.length===4){rect([0,35,100,45],'#dce9e1');rect([45,0,55,80],'#dce9e1');}
    p.rooms.forEach((z,i)=>rect(z.bounds,roomTones[i%4]));
    const [x0,y0,x1,y1]=plan.bounds,step=s>14?1:5;
    c.strokeStyle='#58756613';c.lineWidth=.65;c.beginPath();
    for(let x=Math.ceil(x0/step)*step;x<=x1;x+=step){c.moveTo(...xy(x,y0));c.lineTo(...xy(x,y1));}
    for(let y=Math.ceil(y0/step)*step;y<=y1;y+=step){c.moveTo(...xy(x0,y));c.lineTo(...xy(x1,y));}c.stroke();
    for(const q of p.holes||[]){
      const pts=q.map(v=>xy(...v));const round=q.length>10;
      fillRing(c,pts,round?'#a3b69b':'#b7b3a0','#6f8372',Math.max(.8,s*.11));
      if(round){const cx=pts.reduce((v,a)=>v+a[0],0)/pts.length,cy=pts.reduce((v,a)=>v+a[1],0)/pts.length;
        c.beginPath();c.arc(cx,cy,Math.max(1,Math.hypot(cx-pts[1][0],cy-pts[1][1])*.48),0,Math.PI*2);c.strokeStyle='#dde3c8';c.stroke();}
    }
    for(const item of p.solids||[]){
      const wall=item.kind==='wall',r=item.bounds,[x,y,w,h]=rect(r,wall?'#52625f':item.kind==='storage'?'#a5b3a5':'#c7b49a',wall?'#566760':'#867c68',wall?.5:.8);
      if(!wall&&w>5&&h>3){
        c.fillStyle='#f4ead4';c.fillRect(x+1,y+1,Math.max(1,w-2),Math.min(2,h*.3));
        if(w>7)stroke(c,[[x+w*.68,y+1],[x+w*.68,y+h-1]],'#958b79',.7);
      }
    }
    for(const d of p.doors||[]){
      const [a,z]=d.map(v=>xy(...v)),len=Math.hypot(z[0]-a[0],z[1]-a[1]),angle=Math.atan2(z[1]-a[1],z[0]-a[0]);
      if(len<3)continue;
      const below=p.rooms.some(r=>Math.abs(r.bounds[3]-d[0][1])<.05&&d[0][0]>=r.bounds[0]&&d[0][0]<=r.bounds[2]);
      c.save();c.translate(...a);c.rotate(angle);c.scale(1,below?-1:1);c.strokeStyle='#91a599';c.lineWidth=.8;
      c.beginPath();c.arc(0,0,len*.48,-Math.PI/2,0);c.stroke();stroke(c,[[0,0],[0,-len*.48]],'#7e9489');c.restore();
    }
    for(const st of p.stairs||[]){
      const [x,y,w,h]=rect(st.bounds,'#dccfba','#a19074');
      const vertical=st.exterior,span=vertical?h:w;
      for(let i=1;i<9;i++){const t=span*i/9;
        stroke(c,vertical?[[x,y+t],[x+w,y+t]]:[[x+t,y],[x+t,y+h]],'#a39375',.8);}
      if(opt.labels&&s>3.5)label(c,st.id,x+w/2,y+h/2,9,'#654e30',true);
    }
    c.restore();
    for(const e of p.exits){
      const ink=e.emergency?'#94581b':'#17765e',[x,y,w,h]=rect(e.bounds,e.emergency?'#efe0bb':'#c4e3cf',ink,1);
      const [nx,ny]=normal(e,plan),cx=x+w/2,cy=y+h/2;const len=clamp(Math.min(w,h)*.34,2,13);
      c.save();c.translate(cx,cy);c.rotate(Math.atan2(-ny,nx));
      stroke(c,[[-len,0],[len,0],[len*.25,-len*.52]],ink,1.8);stroke(c,[[len,0],[len*.25,len*.52]],ink,1.8);c.restore();
      if(opt.labels){
        const tx=cx+nx*(w/2+4),ty=cy-ny*(h/2+8);
        let title=exitName(e.id,lg);if(b.w<340)title=e.id;
        const width=c.measureText(title).width;
        const align=nx>0?'left':nx<0?'right':'center';
        const lx=nx>0?Math.min(tx,b.x+b.w-width-3):nx<0?Math.max(tx,b.x+width+3):tx;
        label(c,title,lx,ty,clamp(s*1.75,9,12),ink,true,align);
      }
    }
    for(const [i,r] of p.entrances.entries()){
      const [x,y,w,h]=rect(r,'#d4e3e9','#7195a0');
      if(Math.min(w,h)>=8)label(c,'I'+(i+1),x+w/2,y+h/2,clamp(s*1.5,8,11),'#436678',true);
    }
    for(const ring of p.outlines)fillRing(c,ring.map(q=>xy(...q)),null,'#3e5a50',Math.max(1.55,Math.min(3.6,s*.38)));
    if(opt.labels){
      p.rooms.forEach(z=>{const r=z.bounds,[cx]=center(r),[a,yy]=xy(cx,r[3]-(r[3]-r[1])*.18);
        const title=word(z.label,lg);if((r[2]-r[0])*s>Math.max(30,title.length*(lg==='en'?5:9)))label(c,title,a,yy,clamp(s*1.95,10,15),'#526558',true);});
      if(p.size&&s>3.5){
        const [x,y]=xy(p.size[0]/2,p.size[1]===66?34.5:p.size[1]===44?23:50);
        label(c,word('crossing',lg),x,y,clamp(s*1.5,9,12),'#668179');
      }
    }
    if(both){
      stroke(c,[[b.x,b.y],[b.x+b.w,b.y]],'#c1cfc6');stroke(c,[[b.x,b.y],[b.x,b.y+b.h]],'#c1cfc6');
      label(c,word('floor'+f,lg),b.x+b.w/2,b.y+13,11,'#436257',true);
    }
    c.restore();
  }
  people(c,tr,replay,sample,opt){
    const {box:b,f,xy,s}=tr,visible=sample.pts.filter(p=>p.f===f);c.save();c.beginPath();c.rect(b.x,b.y,b.w,b.h);c.clip();
    if(opt.sensing&&/^(search|leader)-/.test(replay.data.id)){
      c.setLineDash([3,4]);c.strokeStyle='#9f864c99';c.fillStyle='#d7be7914';
      for(const p of visible.filter(q=>q.actor.kind==='guide')){c.beginPath();c.arc(...xy(p.x,p.y),7*s,0,2*Math.PI);c.fill();c.stroke();}
      c.setLineDash([]);
    }
    if(opt.trails)for(const p of visible){
      const trl=replay.trail(p.id,sample);let chain=[];
      for(const q of trl){if(q.f===f)chain.push(xy(q.x,q.y));else{if(chain.length>1)stroke(c,chain,'#59877c73',1);chain=[];}}
      if(chain.length>1)stroke(c,chain,'#59877c73',1);
    }
    if(opt.hull)for(const group of replay.groups){
      const pts=visible.filter(p=>p.actor.kind==='guide'&&p.actor.group===group&&!p.safe).map(p=>xy(p.x,p.y));
      if(pts.length>=3){c.setLineDash([3,3]);fillRing(c,hull(pts),(colors[group]||'#518079')+'13',(colors[group]||'#518079')+'a0');c.setLineDash([]);}
    }
    if(opt.links)for(const [a,i] of sample.frame.links||[]){
      const from=sample.byId.get(a),to=sample.byId.get(i);if(from?.f===f&&to?.f===f)stroke(c,[xy(from.x,from.y),xy(to.x,to.y)],'#458b927d',.85);
    }
    if(opt.targets||opt.roles)for(const [id,x,y,role] of sample.frame.targets||[]){
      const target=positionOnPlan(x,y,replay.plan),g=sample.byId.get(id);
      if(opt.targets&&target.f===f){const [px,py]=xy(target.x,target.y);stroke(c,[[px-3,py],[px+3,py]],'#8c5d3d');stroke(c,[[px,py-3],[px,py+3]],'#8c5d3d');}
      if(opt.roles&&g?.f===f){const [px,py]=xy(g.x,g.y);label(c,word(role,opt.lang),px+6,py-7,10,'#294847',true);}
    }
    if(opt.waypoints)for(const [i,q] of (replay.plan.floors[f].waypoints||[]).entries()){
      const [x,y]=xy(...q);c.beginPath();c.arc(x,y,4,0,2*Math.PI);c.strokeStyle='#8a6845';c.stroke();label(c,String(i+1),x+8,y,9,'#775737');
    }
    for(const p of visible){
      const [x,y]=xy(p.x,p.y),col=colors[p.actor.group]||'#647f86',guide=p.actor.kind==='guide';
      const r=clamp(Math.max(p.a,p.b)*s,2.45,10);
      c.fillStyle=p.safe?'#92b1a4':col;c.strokeStyle=guide?'#243e3b':'#fffef5';c.lineWidth=guide?1.2:.7;
      c.beginPath();
      if(opt.bodies){c.ellipse(x,y,Math.max(.1,p.a*s),Math.max(.1,p.b*s),-p.angle,0,2*Math.PI);c.fill();}
      else if(guide){const d=r+1.3;path(c,[[x,y-d],[x+d,y],[x,y+d],[x-d,y]],true);c.fillStyle='#fffcef';c.fill();c.stroke();c.fillStyle=col;c.fillRect(x-1.3,y-1.3,2.6,2.6);}
      else{c.arc(x,y,r,0,Math.PI*2);c.fill();c.stroke();}
    }
    c.restore();
  }
}
