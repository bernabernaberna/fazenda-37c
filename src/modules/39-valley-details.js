/* Consequências visíveis, apoiadas em móveis que já existem.
   Não cria objetos, colisões, interações, moedas nem campos de save. */
(()=>{
 'use strict';
 const P={ink:'#354d3e',dark:'#66513b',wood:'#aa8659',paper:'#e5d4a9',light:'#f0e4bc',green:'#7b9664',blue:'#6a9993',clay:'#bc8063'};
 let revision=-1,saga=null,details=new Map(),seedBank=null,mentor=false,refreshes=0,workObjects=null,workshop=null;
 const sprites=new Map(),MAX_SPRITES=16;
 const R=(g,c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
 function refresh(){
  const api=window.FarmValleySaga,now=api?.revision?.()??0;
  if(saga===api&&revision===now)return;
  saga=api;revision=now;refreshes++;
  details=new Map((api?.decorationState?.()||[]).map(d=>[d.surface,d]));
  const world=api?.worldState?.();
  seedBank=world?.archiveOpen?(world.sharedSeedBank?'shared':'catalogued'):null;
  mentor=world?.roles?.tomas?.completed===true&&world.roles.tomas.variant===1;
 }
 function paint(g,surface,variant){
  const x=16,y=26;
  if(surface==='seedbox'){
   if(variant==='shared'){
    R(g,P.dark,x-10,y-14,20,6);R(g,P.wood,x-9,y-13,18,4);
    R(g,P.dark,x-9,y-8,18,3);
    for(let i=0;i<3;i++){R(g,[P.paper,P.green,P.clay][i],x-7+i*5,y-10,4,5);R(g,P.light,x-6+i*5,y-10,2,1);}
   }else{R(g,P.paper,x-8,y-10,6,4);R(g,P.light,x+1,y-10,6,4);R(g,P.ink,x-7,y-8,3,1);R(g,P.ink,x+2,y-8,3,1);R(g,P.clay,x-1,y-9,2,4);}
  }else if(surface==='notebook'){
   R(g,P.dark,x-7,y-13,15,7);R(g,P.paper,x-6,y-13,13,6);R(g,P.light,x,y-13,1,6);
   if(variant==='questions'){R(g,P.blue,x-5,y-12,4,1);R(g,P.ink,x-4,y-10,2,1);R(g,P.ink,x-4,y-8,1,1);R(g,P.clay,x+3,y-14,3,2);}
   else for(let i=0;i<3;i++){R(g,[P.green,P.blue,P.clay][i],x-5,y-12+i*2,4,1);R(g,[P.clay,P.green,P.blue][i],x+2,y-12+i*2,4,1);}
  }else if(surface==='workbench'){
   if(variant==='signed'){R(g,P.dark,x-8,y-12,16,5);R(g,P.paper,x-7,y-11,14,3);R(g,P.ink,x-6,y-10,4,1);R(g,P.clay,x+1,y-10,5,1);}
   else{R(g,P.dark,x-8,y-18,7,3);R(g,P.wood,x-8,y-19,6,2);R(g,P.paper,x-2,y-18,4,2);R(g,P.wood,x+2,y-20,6,4);R(g,P.light,x+2,y-20,5,1);}
  }else if(surface==='routeboard'){
   R(g,P.dark,x-5,y-12,11,10);R(g,P.paper,x-4,y-11,9,8);
   if(variant==='notices'){R(g,P.blue,x-3,y-10,7,1);R(g,P.ink,x-3,y-7,5,1);R(g,P.clay,x+3,y-6,1,2);}
   else{R(g,P.green,x-3,y-9,3,1);R(g,P.green,x-1,y-8,3,1);R(g,P.green,x+1,y-7,3,1);R(g,P.clay,x+3,y-6,1,1);}
  }else if(surface==='reserve'){
   R(g,P.paper,x-9,y-10,18,4);
   if(variant==='community'){for(let i=0;i<3;i++)R(g,[P.green,P.blue,P.clay][i],x-7+i*5,y-9,3,2);}
   else{R(g,P.green,x-6,y-9,5,2);R(g,P.clay,x+1,y-9,5,2);R(g,P.dark,x-1,y-7,2,3);}
  }else if(surface==='mapboard'){
   R(g,P.paper,x-8,y-5,16,5);R(g,P.light,x-3,y-5,1,5);
   R(g,P.green,x-6,y-4,5,1);R(g,P.green,x-2,y-3,6,1);
   if(variant==='presentation'){R(g,P.clay,x+4,y-2,3,1);R(g,P.ink,x+5,y-3,1,1);}
   else{for(let i=0;i<3;i++)R(g,[P.clay,P.blue,P.green][i],x-6+i*5,y-1,3,1);}
  }else if(surface==='archive'){
   R(g,P.dark,x-9,y-10,18,4);R(g,P.paper,x-8,y-10,16,2);
   if(variant==='shared'){for(let i=0;i<3;i++){R(g,[P.green,P.blue,P.clay][i],x-7+i*5,y-8,3,3);R(g,P.light,x-6+i*5,y-9,2,1);}}
   else{R(g,P.paper,x-6,y-9,12,6);R(g,P.ink,x-4,y-8,7,1);R(g,P.ink,x-4,y-6,5,1);R(g,P.clay,x+4,y-9,2,5);}
  }
 }
 function stamp(g,o,surface,variant){
  const key=surface+':'+variant;let c=sprites.get(key);
  if(!c){c=document.createElement('canvas');c.width=32;c.height=32;paint(c.getContext('2d'),surface,variant);
   if(sprites.size>=MAX_SPRITES)sprites.delete(sprites.keys().next().value);sprites.set(key,c);}
  g.drawImage(c,Math.round(o.x)-16,Math.round(o.y)-26);
 }
 function draw(g,o){
  refresh();
  const surface=o.type==='farm_life_project'&&o.projectId==='oficina'?'workbench':
   o.type==='farm_life_clue'?({'carta-perdida':'seedbox','horta-caderno':'notebook','cabana-fita':'routeboard','oasis-caixa':'reserve','mapa-nico':'mapboard','arquivo-casa':'archive'})[o.clueId]:null;
  if(!surface)return;
  if(surface==='workbench'&&!(window.FarmLife?.navigationVersion?.()&1))return;
  const variant=surface==='archive'?seedBank:details.get(surface)?.variant;
  if(variant)stamp(g,o,surface,variant);
 }
 function mentorDestination(id,hour){
  refresh();
  if(!mentor||hour<11||hour>=15||!['tomas','nico'].includes(id)||!(window.FarmLife?.navigationVersion?.()&1))return null;
  const objects=window.FarmBiomes?.scenes?.main?.objects;
  if(objects!==workObjects){workObjects=objects;workshop=objects?.find(o=>o.type==='farm_life_project'&&o.projectId==='oficina');}
  const work=workshop;
  if(!work)return null;
  return{key:'mentoria:'+id,x:work.x-24,y:work.y+(id==='tomas'?0:32),activity:id==='tomas'?'work':'observe',
   label:id==='tomas'?'Ensinando Nico na oficina':'Praticando com Tomás',
   line:id==='tomas'?'Hoje o martelo fica com Nico. Eu seguro a madeira e espero ele explicar o encaixe.':
    'Tomás me deixou errar numa sobra de madeira. Já entendi por que ele guarda até os pedaços pequenos.'};
 }
 (window.__farmBiomes=window.__farmBiomes||[]).push(API=>{
  for(const type of ['farm_life_project','farm_life_clue']){
   const original=OBJECT_DRAWERS[type];if(!original)continue;
   API.registerObjectDrawer(type,(o,g)=>{original(o,g);draw(g,o);});
  }
 });
 window.FarmValleyDetails=Object.freeze({draw,mentorDestination,
  info(){refresh();return{revision,refreshes,details:[...details.values()].map(d=>({...d})),seedBank,mentor,sprites:sprites.size,maxSprites:MAX_SPRITES};}});
})();
