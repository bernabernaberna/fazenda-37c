/* Animais do Vale: anatomia própria, quatro vistas e locomoção pelo chão.
   Não muda recompensas, alimentação, lã, IDs, inventário ou saves. A saciedade
   conserva exatamente as taxas do updateAnimals anterior (.003/.005 por s).
   Curral é obtido do objeto de mundo: nenhum deslocamento FARM_Y0 é reaplicado. */
(function(){
 'use strict';
 const TAU=Math.PI*2,W=64,H=64,AX=32,AY=48,MAX_SPRITES=768;
 const P={ink:'#233c35',edge:'#496057',cream:'#eee8ca',light:'#fff4d8',shade:'#c5c9ad',dark:'#335044',
  patch:'#385348',patchHi:'#577264',rose:'#c99180',roseHi:'#e5b6a0',roseSh:'#aa796d',horn:'#d7be8c',hoof:'#34483c',
  wool:'#f0e5c1',woolHi:'#fff3d2',woolSh:'#c3bea1',woolDeep:'#9fa98b',skin:'#cba78f',skinHi:'#e0bfa2',
  hen:'#d7af76',henHi:'#f1d3a0',henSh:'#a58056',wing:'#b79060',comb:'#b7654b',combHi:'#de8860',beak:'#daa950',leg:'#b2854b'};
 const KIND={cow:{speed:6,radius:12,cycle:16,wait:[2.6,6],name:'vaca'},sheep:{speed:8,radius:10,cycle:12,wait:[2,4.6],name:'ovelha'},chicken:{speed:12,radius:6,cycle:5.4,wait:[1,2.8],name:'galinha'}};
 const cache=new Map();let brains=new WeakMap();
 const kindOf=a=>a.kind==='cow'?'cow':a.kind==='sheep'?'sheep':'chicken';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const R=(g,c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
 function poly(g,c,points){g.fillStyle=c;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(Math.round(x),Math.round(y)):g.moveTo(Math.round(x),Math.round(y)));g.closePath();g.fill();}
 function stroke(g,c,points,width=1){g.strokeStyle=c;g.lineWidth=width;g.lineJoin='miter';g.lineCap='square';g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(Math.round(x)+.5,Math.round(y)+.5):g.moveTo(Math.round(x)+.5,Math.round(y)+.5));g.stroke();}
 function seed(value){let n=value>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
 function penFor(a,objects){
  const pens=objects.filter(o=>o.type==='pen');
  return pens.find(p=>a.x>=p.x&&a.x<=p.x+p.w&&a.y>=p.y&&a.y<=p.y+p.h)||pens.reduce((best,p)=>!best||Math.hypot(a.x-p.x-p.w/2,a.y-p.y-p.h/2)<Math.hypot(a.x-best.x-best.w/2,a.y-best.y-best.h/2)?p:best,null);
 }
 function brain(a,objects,index){
  let b=brains.get(a);if(b)return b;
  const kind=kindOf(a),k=KIND[kind],pen=penFor(a,objects),random=seed((a.x*997+a.y*199+index*104729+3700)|0);
  const bounds=pen?{left:pen.x+k.radius+2,right:pen.x+pen.w-k.radius-2,top:pen.y+10,bottom:pen.y+pen.h-12}:
   {left:a.x-24,right:a.x+24,top:a.y-24,bottom:a.y+24};
  // Campos antigos eram locais. Reconstituir pela cerca mundial também cobre
  // saves existentes, sem somar672 mais de uma vez após correção do template.
  if(pen){a.penX=pen.x+8;a.penY=pen.y+8;a.penW=pen.w-16;a.penH=pen.h-16;}
  a.tx=a.x;a.ty=a.y;a.animalPhase=Number(a.animalPhase)||0;a.animalBlend=0;a.moving=false;a.dir=Number.isInteger(a.dir)?a.dir:2;
  b={random,bounds,kind,k,mode:kind==='chicken'?'peck':'graze',timer:1+random()*2,vx:0,vy:0,clock:random()*10,
   previousWell:a.well??.85,blocked:0,lastX:a.x,lastY:a.y,feed:0};brains.set(a,b);return b;
 }
 function chooseActivity(a,b){
  b.mode=b.random()<(b.kind==='chicken'?.8:.68)?(b.kind==='chicken'?'peck':'graze'):'look';
  b.timer=b.k.wait[0]+b.random()*(b.k.wait[1]-b.k.wait[0]);a.pauseT=b.timer;
 }
 function chooseTarget(a,b,animals){
  const bounds=b.bounds;let chosen=null;
  for(let n=0;n<14;n++){
   const x=bounds.left+b.random()*(bounds.right-bounds.left),y=bounds.top+b.random()*(bounds.bottom-bounds.top);
   if(Math.hypot(x-a.x,y-a.y)<10)continue;
   if(animals.some(o=>o!==a&&Math.hypot(o.x-x,o.y-y)<b.k.radius+KIND[kindOf(o)].radius+3))continue;
   chosen={x,y};break;
  }
  if(!chosen){chooseActivity(a,b);return;}
  a.tx=chosen.x;a.ty=chosen.y;b.mode='walk';b.blocked=0;a.pauseT=0;
 }
 function update(dt,objects,context={}){
  if(!Array.isArray(objects)||!Number.isFinite(dt)||dt<=0)return;
  const animals=objects.filter(a=>a.type==='animal'),step=Math.min(dt,.1),night=Number(context.timeOfDay)>=20||Number(context.timeOfDay)<5;
  for(let i=0;i<animals.length;i++){
   const a=animals[i],b=brain(a,objects,i),k=b.k,oldX=a.x,oldY=a.y;
   if(a.well===undefined)a.well=.85;
   const fed=a.well>b.previousWell+.035;a.well=Math.max(0,a.well-dt*(context.cold?.005:.003));b.previousWell=a.well;
   b.clock+=step;b.feed=Math.max(0,b.feed-step);a.animalClock=b.clock;
   if(Math.hypot(a.x-b.lastX,a.y-b.lastY)>8){b.vx=b.vy=0;a.tx=a.x;a.ty=a.y;chooseActivity(a,b);}
   if(fed){b.feed=1.8;b.mode=b.kind==='chicken'?'peck':'graze';b.timer=2.4;b.vx=b.vy=0;}
   if(night&&b.mode!=='rest'){b.mode='rest';b.vx=b.vy=0;}
   else if(!night&&b.mode==='rest'){chooseActivity(a,b);}
   if(context.reducedMotion||b.mode==='rest'){
    a.moving=false;a.animalBlend=0;a.animalActivity=b.mode==='rest'?'rest':'look';a.pauseT=Math.max(0,b.timer);b.vx=b.vy=0;
   }else if(b.mode!=='walk'){
    a.moving=false;b.vx*=Math.exp(-step/.10);b.vy*=Math.exp(-step/.10);b.timer-=step;a.pauseT=Math.max(0,b.timer);
    if(b.timer<=0)chooseTarget(a,b,animals);
   }else{
    const inside=a.x>=b.bounds.left&&a.x<=b.bounds.right&&a.y>=b.bounds.top&&a.y<=b.bounds.bottom;
    if(!inside){ // Dois pixels internos vencem a tolerância de chegada de1,6.
     a.tx=clamp(a.x,b.bounds.left+2,b.bounds.right-2);a.ty=clamp(a.y,b.bounds.top+2,b.bounds.bottom-2);
    }
    const dx=a.tx-a.x,dy=a.ty-a.y,distance=Math.hypot(dx,dy);
    if(distance<1.6){b.vx=b.vy=0;chooseActivity(a,b);a.moving=false;}
    else{
     const speed=k.speed*Math.min(1,distance/9);let vx=dx/distance*speed,vy=dy/distance*speed;
     for(const other of animals){if(other===a)continue;const ox=a.x-other.x,oy=a.y-other.y,gap=Math.hypot(ox,oy),wanted=k.radius+KIND[kindOf(other)].radius+6;
      if(gap<wanted&&gap>.01){const avoid=(wanted-gap)/wanted*k.speed*2.3;vx+=ox/gap*avoid;vy+=oy/gap*avoid;}}
     const norm=Math.hypot(vx,vy);if(norm>k.speed){vx*=k.speed/norm;vy*=k.speed/norm;}
     const ease=1-Math.exp(-step/.17);b.vx+=(vx-b.vx)*ease;b.vy+=(vy-b.vy)*ease;
     let nx=a.x+b.vx*step,ny=a.y+b.vy*step;
     if(inside){nx=clamp(nx,b.bounds.left,b.bounds.right);ny=clamp(ny,b.bounds.top,b.bounds.bottom);}
     const obstructed=animals.some(other=>other!==a&&Math.hypot(nx-other.x,ny-other.y)<(k.radius+KIND[kindOf(other)].radius)*.88&&Math.hypot(nx-other.x,ny-other.y)<Math.hypot(a.x-other.x,a.y-other.y));
     if(!obstructed){a.x=nx;a.y=ny;}
     const traveled=Math.hypot(a.x-oldX,a.y-oldY);a.moving=traveled>.0001;
     if(a.moving){
      a.animalPhase+=traveled*TAU/k.cycle;a.animT=a.animalPhase;
      const ax=Math.abs(a.x-oldX),ay=Math.abs(a.y-oldY);
      if(ax>ay*1.2)a.dir=a.x<oldX?1:2;else if(ay>ax*1.2)a.dir=a.y<oldY?3:0;
      a.facing=a.dir===1?-1:1;b.blocked=0;
     }else{b.blocked+=step;if(b.blocked>.7)chooseTarget(a,b,animals);}
    }
   }
   a.animalBlend+=(Number(a.moving)-Number(a.animalBlend||0))*(1-Math.exp(-step/(a.moving?.10:.16)));
   if(a.animalBlend<.015)a.animalBlend=0;
   a.animalActivity=context.reducedMotion&&b.mode!=='rest'?'look':b.mode;a.animalFed=b.feed>0;b.lastX=a.x;b.lastY=a.y;
  }
 }
 function foot(phase,offset,amplitude,lift){
  const t=((phase/TAU+offset)%1+1)%1;
  if(t<.64)return{x:amplitude*(1-t/.32),up:0};
  const swing=(t-.64)/.36;return{x:-amplitude+2*amplitude*swing,up:Math.sin(swing*Math.PI)*lift};
 }
 function leg(g,x,top,phase,offset,far,species,side,blend,rest){
  const cow=species==='cow',f=foot(phase,offset,cow?5:species==='sheep'?3.5:2.7,species==='chicken'?3:2.5),ground=far?-3:0;
  const stride=f.x*blend,up=f.up*blend,width=species==='chicken'?1:cow?3:2;
  const endX=x+(side?stride:Math.sin((phase+offset*TAU))*blend),endY=ground-up+(side?0:stride*.55);
  if(rest){const settled=cow?4:3;R(g,far?P.shade:P.cream,x-2,-2-settled,5,2);R(g,species==='chicken'?P.leg:P.hoof,x+1,-1-settled,3,1);return;}
  const skin=species==='chicken'?P.leg:far?P.shade:P.cream;
  stroke(g,P.edge,[[x,top],[x+(side?stride*.35:0),top+(endY-top)*.55],[endX,endY]],width+1);
  stroke(g,skin,[[x,top],[x+(side?stride*.35:0),top+(endY-top)*.55],[endX,endY-1]],width);
  R(g,species==='chicken'?P.beak:P.hoof,endX-1,endY,species==='chicken'?4:width+2,1+(species!=='chicken'));
 }
 function cowHead(g,x,y,dir,closed){
  if(dir===2){
   poly(g,P.ink,[[x-3,y-9],[x+5,y-9],[x+9,y-3],[x+10,y+6],[x+6,y+9],[x-2,y+8],[x-5,y+1]]);
   poly(g,P.cream,[[x-2,y-8],[x+4,y-8],[x+7,y-2],[x+8,y+5],[x+5,y+7],[x-2,y+6],[x-4,y]]);
   R(g,P.shade,x-3,y-5,4,8);R(g,P.light,x+1,y-7,4,5);R(g,P.patch,x+3,y-3,5,5);
   R(g,P.roseSh,x+1,y+4,9,4);R(g,P.rose,x+1,y+3,8,3);R(g,P.roseHi,x+2,y+3,5,1);R(g,P.ink,x+7,y+4,1,1);
   R(g,P.ink,x+5,y-2,2,closed?1:2);if(!closed)R(g,P.light,x+5,y-2,1,1);
   poly(g,P.edge,[[x-3,y-6],[x-9,y-8],[x-8,y-4],[x-3,y-2]]);R(g,P.rose,x-7,y-6,4,1);
   stroke(g,P.horn,[[x-1,y-8],[x-3,y-12],[x-5,y-13]],2);R(g,P.light,x-5,y-13,1,1);
  }else{
   R(g,P.edge,x-8,y-9,16,13);R(g,P.cream,x-7,y-10,14,13);R(g,P.light,x-4,y-10,5,7);
   R(g,P.patch,x-7,y-7,5,7);R(g,P.patch,x+4,y-8,3,7);
   poly(g,P.edge,[[x-7,y-7],[x-13,y-9],[x-12,y-5],[x-7,y-3]]);poly(g,P.edge,[[x+7,y-7],[x+13,y-9],[x+12,y-5],[x+7,y-3]]);
   R(g,P.rose,x-11,y-7,3,1);R(g,P.rose,x+8,y-7,3,1);
   stroke(g,P.horn,[[x-5,y-9],[x-8,y-13],[x-9,y-13]],2);stroke(g,P.horn,[[x+5,y-9],[x+8,y-13],[x+9,y-13]],2);
   if(dir===0){R(g,P.roseSh,x-7,y,14,5);R(g,P.rose,x-6,y-1,12,4);R(g,P.roseHi,x-4,y,7,1);R(g,P.ink,x-4,y+2,1,1);R(g,P.ink,x+4,y+2,1,1);
    R(g,P.ink,x-5,y-4,2,closed?1:2);R(g,P.ink,x+4,y-4,2,closed?1:2);if(!closed){R(g,P.light,x-5,y-4,1,1);R(g,P.light,x+4,y-4,1,1);}}
   else{R(g,P.patch,x-4,y-4,8,5);R(g,P.shade,x-5,y,10,2);}
  }
 }
 function paintCow(g,s){
  const side=s.dir===2,drop=s.graze,rest=s.rest,lift=rest?4:0,phase=s.phase,b=s.blend;
  g.save();g.translate(0,lift);
  if(side){
   stroke(g,P.edge,[[-18,-23],[-21,-18],[-20+s.tail,-8]],2);R(g,P.patch,-21+s.tail,-7,3,4);
   leg(g,-10,-13,phase,.5,true,'cow',true,b,rest);leg(g,9,-12,phase,0,true,'cow',true,b,rest);
   poly(g,P.ink,[[-16,-26],[5,-26],[12,-22],[14,-14],[9,-7],[-12,-7],[-18,-12],[-19,-20]]);
   poly(g,P.cream,[[-15,-25],[4,-25],[11,-21],[12,-14],[8,-8],[-11,-8],[-17,-12],[-18,-19]]);
   R(g,P.shade,-14,-12,24,4);R(g,P.light,-12,-25,16,3);R(g,P.light,-16,-22,10,2);
   poly(g,P.patch,[[-13,-23],[-6,-24],[-3,-20],[-5,-16],[-12,-16],[-15,-18]]);R(g,P.patchHi,-12,-22,6,2);
   poly(g,P.patch,[[3,-22],[9,-20],[10,-14],[5,-13],[1,-17]]);R(g,P.patchHi,4,-20,3,1);
   R(g,P.roseSh,-2,-8,10,3);R(g,P.rose,-1,-8,8,2);R(g,P.roseSh,1,-6,1,3);R(g,P.roseSh,5,-6,1,2);
   leg(g,-12,-11,phase,.75,false,'cow',true,b,rest);leg(g,8,-10,phase,.25,false,'cow',true,b,rest);
   poly(g,P.shade,[[7,-21],[14,-23+drop],[18,-15+drop],[10,-10]]);cowHead(g,15,-21+drop,2,s.closed);
  }else{
   leg(g,-7,-15,phase,.5,true,'cow',false,b,rest);leg(g,7,-15,phase,0,true,'cow',false,b,rest);
   if(s.dir===3)cowHead(g,0,-24,3,s.closed);
   poly(g,P.ink,[[-9,-27],[9,-27],[13,-23],[13,-11],[9,-6],[-9,-6],[-13,-11],[-13,-23]]);
   poly(g,P.cream,[[-8,-26],[8,-26],[12,-22],[12,-11],[8,-7],[-8,-7],[-12,-11],[-12,-22]]);
   R(g,P.light,-7,-25,7,13);R(g,P.shade,8,-22,3,12);R(g,P.shade,-8,-10,17,3);
   poly(g,P.patch,[[-10,-22],[-4,-25],[-1,-20],[-3,-14],[-10,-15]]);R(g,P.patch,5,-17,6,8);R(g,P.patchHi,-8,-22,4,2);
   leg(g,-8,-9,phase,.75,false,'cow',false,b,rest);leg(g,8,-9,phase,.25,false,'cow',false,b,rest);
   if(s.dir===0)cowHead(g,0,-13+drop*.4,0,s.closed);
   else{stroke(g,P.edge,[[0,-19],[1+s.tail,-10],[s.tail,-3]],2);R(g,P.patch,s.tail-1,-4,3,4);}
  }g.restore();
 }
 function wool(g,x,y,w,h,shorn){
  poly(g,P.edge,[[x+4,y],[x+w-5,y],[x+w,y+5],[x+w,y+h-4],[x+w-5,y+h],[x+4,y+h],[x,y+h-5],[x,y+5]]);
  poly(g,shorn?P.skin:P.wool,[[x+4,y+1],[x+w-5,y+1],[x+w-1,y+5],[x+w-1,y+h-4],[x+w-5,y+h-1],[x+4,y+h-1],[x+1,y+h-5],[x+1,y+5]]);
  R(g,shorn?P.roseSh:P.woolSh,x+4,y+h-5,w-8,4);R(g,shorn?P.skinHi:P.woolHi,x+5,y+2,w-12,3);
  if(!shorn){
   for(let i=0;i<5;i++){const xx=x+3+i*(w-7)/5;R(g,P.edge,xx,y-1+(i%2),5,5);R(g,P.wool,xx,y+(i%2),4,4);R(g,P.woolHi,xx+1,y+(i%2),2,1);}
   for(let i=0;i<4;i++){const xx=x+3+i*(w-8)/4;R(g,P.woolSh,xx,y+7+(i%2)*3,5,4);R(g,P.woolHi,xx,y+6+(i%2)*3,4,2);}
  }else{R(g,P.skinHi,x+5,y+7,3,1);R(g,P.roseSh,x+w-7,y+8,1,3);}
 }
 function sheepHead(g,x,y,dir,closed){
  const side=dir===2;
  R(g,P.ink,x-(side?2:5),y-6,side?9:10,11);R(g,P.dark,x-(side?1:4),y-5,side?7:8,9);
  R(g,P.patchHi,x-(side?1:3),y-5,side?5:6,3);R(g,P.ink,x+(side?3:-3),y+3,side?5:6,2);
  if(side){poly(g,P.edge,[[x-1,y-4],[x-7,y-6],[x-6,y-2],[x-1,y]]);R(g,P.skin,x-5,y-4,3,1);R(g,P.cream,x+4,y-3,2,closed?1:2);if(!closed)R(g,P.ink,x+5,y-2,1,1);}
  else{R(g,P.edge,x-10,y-5,6,3);R(g,P.edge,x+4,y-5,6,3);R(g,P.skin,x-9,y-4,4,1);R(g,P.skin,x+5,y-4,4,1);
   if(dir===0){R(g,P.cream,x-3,y-2,1,closed?1:2);R(g,P.cream,x+3,y-2,1,closed?1:2);R(g,P.ink,x,y+3,1,1);}}
 }
 function paintSheep(g,s){
  const side=s.dir===2;g.save();g.translate(0,s.rest?3:0);
  if(side){
   leg(g,-8,-11,s.phase,.5,true,'sheep',true,s.blend,s.rest);leg(g,7,-11,s.phase,0,true,'sheep',true,s.blend,s.rest);
   R(g,P.woolSh,-18,-11,4,3);wool(g,-16,-22,29,15,s.shorn);
   leg(g,-9,-9,s.phase,.75,false,'sheep',true,s.blend,s.rest);leg(g,8,-9,s.phase,.25,false,'sheep',true,s.blend,s.rest);
   sheepHead(g,14,-16+s.graze*.8,2,s.closed);
  }else{
   leg(g,-5,-13,s.phase,.5,true,'sheep',false,s.blend,s.rest);leg(g,5,-13,s.phase,0,true,'sheep',false,s.blend,s.rest);
   if(s.dir===3)sheepHead(g,0,-23,3,s.closed);
   wool(g,-10,-24,20,18,s.shorn);leg(g,-7,-8,s.phase,.75,false,'sheep',false,s.blend,s.rest);leg(g,7,-8,s.phase,.25,false,'sheep',false,s.blend,s.rest);
   if(s.dir===0)sheepHead(g,0,-12+s.graze*.5,0,s.closed);else{R(g,P.woolSh,-2,-11,4,5);R(g,P.woolHi,-2,-11,3,3);}
  }g.restore();
 }
 function henHead(g,x,y,dir,closed){
  const side=dir===2;R(g,P.edge,x-3,y-4,7,8);R(g,P.cream,x-2,y-4,5,7);R(g,P.light,x-2,y-3,2,4);
  R(g,P.comb,x-2,y-7,5,3);R(g,P.combHi,x-1,y-8,2,2);R(g,P.comb,x,y+3,2,3);
  if(side){poly(g,P.beak,[[x+3,y],[x+7,y+1],[x+3,y+3]]);R(g,P.ink,x+1,y-1,1,closed?1:2);if(!closed)R(g,P.light,x+1,y-1,1,1);}
  else if(dir===0){R(g,P.ink,x-2,y-1,1,closed?1:2);R(g,P.ink,x+2,y-1,1,closed?1:2);poly(g,P.beak,[[x-2,y+1],[x+2,y+1],[x,y+4]]);}
 }
 function paintHen(g,s){
  const side=s.dir===2,bob=s.blend*Math.abs(Math.sin(s.phase))*1;g.save();g.translate(0,s.rest?3:0);
  if(side){
   leg(g,-3,-7,s.phase,.5,true,'chicken',true,s.blend,s.rest);
   poly(g,P.edge,[[-8,-10],[-14,-20],[-12,-24],[-7,-17],[-10,-24],[-7,-25],[-3,-16]]);
   stroke(g,P.henHi,[[-11,-21],[-6,-15]],2);stroke(g,P.dark,[[-8,-23],[-4,-16]],2);
   poly(g,P.edge,[[-9,-17],[-4,-20-bob],[4,-20-bob],[9,-14],[7,-7],[2,-4],[-6,-5],[-10,-10]]);
   poly(g,P.hen,[[-8,-16],[-3,-19-bob],[3,-19-bob],[8,-13],[6,-7],[1,-5],[-5,-6],[-9,-10]]);
   poly(g,P.cream,[[-1,-19-bob],[4,-18-bob],[7,-13],[5,-9],[2,-9]]);R(g,P.henHi,-6,-16,7,3);
   poly(g,P.henSh,[[-6,-13],[1,-15],[5,-11],[2,-7],[-4,-8]]);stroke(g,P.wing,[[-5,-12],[0,-10],[3,-10]],1);R(g,P.henHi,-4,-13,4,2);
   leg(g,3,-6,s.phase,0,false,'chicken',true,s.blend,s.rest);
   const drop=s.graze*2;poly(g,P.cream,[[3,-15],[7,-23+drop],[11,-22+drop],[8,-12]]);henHead(g,9,-23+drop,2,s.closed);
  }else{
   leg(g,-3,-7,s.phase,.5,false,'chicken',false,s.blend,s.rest);leg(g,3,-7,s.phase,0,false,'chicken',false,s.blend,s.rest);
   if(s.dir===3)henHead(g,0,-23,3,s.closed);
   poly(g,P.edge,[[-5,-20],[-9,-14],[-8,-7],[-4,-4],[4,-4],[8,-7],[9,-14],[5,-20]]);
   poly(g,P.hen,[[-4,-19],[-8,-14],[-7,-7],[-3,-5],[3,-5],[7,-7],[8,-14],[4,-19]]);
   R(g,P.cream,-4,-18,8,10);R(g,P.henHi,-3,-17,3,10);R(g,P.henSh,-8,-13,3,6);R(g,P.henSh,6,-13,2,6);
   if(s.dir===0)henHead(g,0,-22+s.graze*1.8,0,s.closed);
   else{poly(g,P.dark,[[-5,-9],[-4,-16],[-1,-11],[0,-19],[3,-11],[6,-16],[5,-6]]);R(g,P.henHi,-1,-13,2,7);R(g,P.wing,3,-12,2,4);}
  }g.restore();
 }
 function visualState(a,reduced=false){
  const kind=kindOf(a),phase=Number(a.animalPhase??a.animT)||0,rest=a.animalActivity==='rest'||a.sleeping||a.asleep||a.dormindo;
  const time=Number(a.animalClock)||0,activity=a.animalActivity||'look',moving=!reduced&&!rest&&(a.moving||a.animalBlend>.01);
  const blend=moving?Math.round(clamp(Number(a.animalBlend??1),0,1)*4)/4:0;
  const frame=moving?Math.floor(((phase%TAU+TAU)%TAU)/TAU*16)%16:0;
  const grazes=!reduced&&!moving&&!rest&&(activity==='graze'||activity==='peck');
  const graze=grazes?[0,2,5,8,10,8,4,1][Math.floor(time*(kind==='chicken'?4.4:2.2))%8]:0;
  const dir=Number.isInteger(a.dir)?clamp(a.dir,0,3):(a.facing<0?1:2);
  return{kind,dir,phase:frame*TAU/16,frame,blend,graze,rest:!!rest,shorn:!!a.shorn,
   closed:!!rest||(!reduced&&Math.floor(time*5)%31===30),tail:reduced?0:Math.round(Math.sin(time*.85)),fed:!!a.animalFed};
 }
 function sprite(s){
  const key=[s.kind,s.dir,s.frame,s.blend,s.graze,s.rest,s.shorn,s.closed,s.tail].join(':');if(cache.has(key))return cache.get(key);
  let c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.translate(AX,AY);
  if(s.dir===1)g.scale(-1,1);const canonical={...s,dir:s.dir===1?2:s.dir};
  if(s.kind==='cow')paintCow(g,canonical);else if(s.kind==='sheep')paintSheep(g,canonical);else paintHen(g,canonical);
  // Galinhas ocupam cinco oitavos da escala de desenho. A redução em pixels
  // inteiros mantém crista/bico legíveis e a mesma âncora dos pés no chão.
  if(s.kind==='chicken'){const small=document.createElement('canvas');small.width=W;small.height=H;const sg=small.getContext('2d');sg.imageSmoothingEnabled=false;sg.drawImage(c,AX*.375,AY*.375,W*.625,H*.625);c=small;}
  if(cache.size>=MAX_SPRITES)cache.delete(cache.keys().next().value);cache.set(key,c);return c;
 }
 function draw(g,a,opts={}){
  if(!g||!a)return;const reduced=opts.reducedMotion??(typeof motionOk==='function'&&!motionOk()),s=visualState(a,reduced);
  const x=Math.round(Number.isFinite(opts.x)?opts.x:a.x),y=Math.round(Number.isFinite(opts.y)?opts.y:a.y),feet=s.kind==='chicken'?4:6;
  g.save();g.imageSmoothingEnabled=false;
  g.fillStyle='rgba(28,53,43,.24)';g.beginPath();g.ellipse(x,y+feet,s.kind==='cow'?15:s.kind==='sheep'?12:7,s.kind==='chicken'?2:3,0,0,TAU);g.fill();
  g.drawImage(sprite(s),x-AX,y+feet-AY);
  if(a.well!==undefined&&a.well<.3){R(g,P.edge,x-3,y-(s.kind==='chicken'?31:35),7,8);R(g,P.horn,x-2,y-(s.kind==='chicken'?30:34),5,6);R(g,P.ink,x,y-(s.kind==='chicken'?29:33),1,3);R(g,P.ink,x,y-(s.kind==='chicken'?25:29),1,1);}
  if(s.fed&&!reduced){const yy=y-(s.kind==='chicken'?30:35);R(g,P.comb,x-2,yy,2,2);R(g,P.comb,x+1,yy,2,2);R(g,P.comb,x-1,yy+2,3,2);R(g,P.comb,x,yy+4,1,1);}
  g.restore();
 }
 window.FarmAnimalLife={update,draw,reset(){brains=new WeakMap();},visualState,
  info(){return{version:3,cache:cache.size,maxSprites:MAX_SPRITES,bytes:cache.size*W*H*4,species:Object.keys(KIND),cycle:Object.fromEntries(Object.entries(KIND).map(([key,k])=>[key,k.cycle]))};}
 };
 (window.__farmBiomes=window.__farmBiomes||[]).push(api=>{api.registerObjectDrawer('animal',(animal,g)=>draw(g,animal));});
})();
