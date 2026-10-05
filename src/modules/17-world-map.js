/* Cartografia do Vale: mapa local, mapa completo e marcação de destinos.
   Fonte offline. Posições sempre pertencem a scenes.main, inclusive em interiores.
   A fonte principal controla G e inclui isOpen() na pausa real do jogo. */
(function(){
 'use strict';
 let adapter={},ready=false,opened=false,previousFocus=null,timer=0,selected=null;
 let mini,miniCanvas,miniRegion,miniTarget,overlay,fullCanvas,currentLabel,selectionLabel,clearButton,list;
 let base=null,baseMap=null,baseObjects=null,baseSeason='',places=[],lastInfo=null,lastMiniView=null;
 const WORLD_NAMES={farm:'Fazenda',mountain:'Montanha',desert:'Oásis'};
 const ROOM_NAMES={house:'Casa',barn:'Celeiro',greenhouse:'Estufa'};
 const COLORS={ink:'#213f36',paper:'#f4ecd7',gold:'#ffdc67',teal:'#60d0bd',pin:'#bb537b',water:'#3c8790'};
 const element=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
 const button=(label,fn,cls='fm-button')=>{const n=element('button',cls,label);n.type='button';n.addEventListener('click',fn);return n;};
 const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
 const regionAt=y=>y<42*16?'mountain':y>=90*16?'desert':'farm';
 function read(){
  if(typeof scenes==='undefined'||!scenes.main||typeof player==='undefined')return null;
  const main=scenes.main,scene=typeof currentScene==='string'?currentScene:'main',inside=scene!=='main';
  const entranceType={house:'door_house',barn:'door_barn',greenhouse:'gh_path'}[scene];
  const entrance=inside?main.objects.find(o=>o.type===entranceType):null;
  const position=inside?(main._lastPlayer||entrance||{x:16*16+8,y:57*16+8,dir:0}):player;
  const actors=window.FarmStoryIntegration?.read?.().npcs||main.objects.filter(o=>o.type==='story_npc');
  return {main,scene,inside,x:Number(position.x)||0,y:Number(position.y)||0,dir:Number(position.dir)||0,
   width:main.MW*TS,height:main.MH*TS,tileSize:TS,npcs:actors,season:typeof currentSeason==='string'?currentSeason:'hot',
   region:regionAt(Number(position.y)||0),active:typeof gameStarted!=='undefined'&&gameStarted&&!player.dead};
 }
 function canOpen(){
  if(adapter.canOpen)return !!adapter.canOpen();
  return !!read()?.active&&!(typeof cutsceneActive!=='undefined'&&cutsceneActive)&&!(typeof tutorialActive!=='undefined'&&tutorialActive)&&!(typeof histologyMissionOpen!=='undefined'&&histologyMissionOpen)&&!window.FarmStoryUI?.isOpen?.();
 }
 function localName(info){return info.inside?'Dentro de '+(ROOM_NAMES[info.scene]||'um abrigo')+' · entrada no mapa':WORLD_NAMES[info.region]||'Vale';}
 function terrainColor(tile,cold){
  switch(tile){
   case T.WATER:case T.RIVER:case T.OASIS:return COLORS.water;
   case T.PATH:case T.WOOD:return '#c7ac75';
   case T.FIELD:return '#8f704c';
   case T.SNOW:return '#d0e1db';case T.ICE:return '#8bbfc9';case T.SNOWROCK:return '#83999a';
   case T.SAND:return '#d8b677';case T.DUNE:return '#c79c61';case T.CRACKED:return '#b99367';
   case T.STONE:case T.COBBLE:return '#899685';case T.FENCE:return '#8b7551';
   default:return cold?'#a8b9a4':'#7f9c69';
  }
 }
 function buildPlaces(info){
  const objects=info.main.objects,find=type=>objects.find(o=>o.type===type);
  const definitions=[
   ['house','Casa','door_house','Abrigo e descanso'],['barn','Celeiro','door_barn','Animais e ferramentas'],
   ['greenhouse','Estufa','gh_path','Cultivo protegido'],['seed-house','Casa das Sementes','story_seed_door','Encontros da comunidade'],
   ['well','Poço','well','Água para a fazenda'],['sell','Caixa de venda','sellbox','Venda da produção'],
   ['cabin','Cabana da montanha','mtn_cabin','Abrigo na montanha'],['fire','Fogueira da montanha','mtn_fire','Ponto de apoio'],
   ['ice','Coleta de gelo','mtn_ice_cache','Recurso da montanha'],['oasis','Água do oásis','des_oasis_fillpoint','Ponto de coleta'],
   ['lookout','Mirante','fx_lookout','Caminho sul da fazenda'],['weather','Estação meteorológica','fx_weather','Pomar, além do rio']
  ];
  places=[];
  for(const [id,name,type,description]of definitions){const o=find(type);if(!o)continue;places.push({id:'place:'+id,name,kind:'place',x:o.x,y:o.y,description,region:regionAt(o.y),number:places.length+1});}
  const fruit=objects.find(o=>o.type==='fx_fruittree'&&o.x>45*TS);
  if(fruit)places.push({id:'place:orchard',name:'Pomar',kind:'place',x:fruit.x,y:fruit.y,description:'Árvores e frutas além da ponte',region:regionAt(fruit.y),number:places.length+1});
  const farm=window.FarmLife?.snapshot?.();
  for(const station of farm?.stations||[]){
   places.push({id:'farm:'+station.id,name:station.name,kind:'place',x:station.x,y:station.y,description:station.kind==='clue'?'Pista encontrada · releia o registro':'Vida na fazenda · '+station.name,region:regionAt(station.y),number:places.length+1});
  }
  for(const clue of farm?.clues||[]){if(clue.found)places.push({id:'clue:'+clue.id,name:clue.title,kind:'place',x:clue.x,y:clue.y,description:'Pista encontrada · releia o registro',region:regionAt(clue.y),number:places.length+1});}
 }
 function ensureBase(info){
  if(base&&baseMap===info.main.map&&baseObjects===info.main.objects&&baseSeason===info.season)return;
  baseMap=info.main.map;baseObjects=info.main.objects;baseSeason=info.season;
  base=document.createElement('canvas');base.width=info.main.MW*8;base.height=info.main.MH*8;const g=base.getContext('2d');
  for(let y=0;y<info.main.MH;y++)for(let x=0;x<info.main.MW;x++){
   g.fillStyle=terrainColor(info.main.map[y]?.[x],info.season==='cold');g.fillRect(x*8,y*8,8,8);
   if(((x*17+y*13)%11)===0){g.fillStyle='rgba(27,62,47,.07)';g.fillRect(x*8+2,y*8+2,3,2);}
  }
  const scale=base.width/info.width;
  for(const o of info.main.objects){
   if(['house','barn','story_seed_house'].includes(o.type)){
    g.fillStyle='#7a6047';g.fillRect(o.x*scale,o.y*scale,o.w*scale,o.h*scale);g.fillStyle='#b07d55';g.fillRect(o.x*scale+1,o.y*scale+1,o.w*scale-2,o.h*scale/2);
   }else if(o.type==='mtn_cabin'){g.fillStyle='#745b49';g.fillRect((o.x-28)*scale,(o.y-28)*scale,56*scale,34*scale);}
   else if(['tree','mtn_pine','fx_fruittree','des_palm'].includes(o.type)){g.fillStyle=o.type==='mtn_pine'?'#5f8c80':'#557d53';g.fillRect(o.x*scale-2,o.y*scale-3,4,4);}
   else if(o.type==='world_ridge'){g.fillStyle=o.biome==='desert'?'#9e7655':'#667e80';g.fillRect(o.x*scale,(o.y-o.rise+8)*scale,o.w*scale,(o.rise+o.h-8)*scale);}
  }
  buildPlaces(info);if(opened)renderList(info);
 }
 function markers(info){
  const cast=window.FarmStoryWorld?.characters||[];
  return places.concat(info.npcs.map(n=>({id:'npc:'+n.npcId,name:cast.find(c=>c.id===n.npcId)?.name||n.npcId,kind:'npc',x:n.x,y:n.y,description:n.routineDescription||'Morador do vale',region:regionAt(n.y)})));
 }
 function target(info){return selected?(selected.kind==='point'?selected:markers(info).find(m=>m.id===selected.id)||null):null;}
 function distanceText(info,point){
  const dx=point.x-info.x,dy=point.y-info.y,steps=Math.round(Math.hypot(dx,dy)/info.tileSize);
  if(steps<=1)return 'perto de você';
  const vertical=dy<0?'norte':'sul',horizontal=dx<0?'oeste':'leste';
  const direction=Math.abs(dx)<Math.abs(dy)*.4?vertical:Math.abs(dy)<Math.abs(dx)*.4?horizontal:(dy<0?(dx<0?'noroeste':'nordeste'):(dx<0?'sudoeste':'sudeste'));
  return steps+' passos ao '+direction;
 }
 function pointOnMap(point,view,width,height){return{x:(point.x-view.x)/view.w*width,y:(point.y-view.y)/view.h*height};}
 function triangle(g,x,y,dir,size){
  g.save();g.translate(x,y);g.rotate([Math.PI,-Math.PI/2,Math.PI/2,0][dir]||0);
  g.fillStyle=COLORS.gold;g.strokeStyle='#243e34';g.lineWidth=size*.32;g.beginPath();g.moveTo(0,-size);g.lineTo(size*.78,size*.7);g.lineTo(0,size*.35);g.lineTo(-size*.78,size*.7);g.closePath();g.fill();g.stroke();g.restore();
 }
 function draw(canvas,info,view,full=false){
  ensureBase(info);const g=canvas.getContext('2d'),w=canvas.width,h=canvas.height,scale=2;
  g.clearRect(0,0,w,h);g.imageSmoothingEnabled=false;
  const factor=base.width/info.width;g.drawImage(base,view.x*factor,view.y*factor,view.w*factor,view.h*factor,0,0,w,h);
  if(full){
   g.textAlign='center';g.font='bold 19px Georgia';g.fillStyle='rgba(29,61,53,.75)';
   for(const [name,y]of [['MONTANHA',5*TS],['FAZENDA',44*TS],['OÁSIS',96*TS]])g.fillText(name,w/2,y/info.height*h);
  }
  const chosen=target(info),pos=pointOnMap(info,view,w,h);
  if(chosen){const p=pointOnMap(chosen,view,w,h);g.strokeStyle='#f9dc85';g.lineWidth=full?3:2;g.setLineDash([8,7]);g.beginPath();g.moveTo(pos.x,pos.y);g.lineTo(p.x,p.y);g.stroke();g.setLineDash([]);}
  for(const m of markers(info)){
   const p=pointOnMap(m,view,w,h);if(p.x<-10||p.y<-10||p.x>w+10||p.y>h+10)continue;
   if(m.kind==='npc'){g.fillStyle=COLORS.teal;g.strokeStyle='#173f35';g.lineWidth=2;g.beginPath();g.arc(p.x,p.y,full?7:5,0,Math.PI*2);g.fill();g.stroke();}
   else if(full){g.fillStyle='#fcf0cf';g.strokeStyle='#674e38';g.lineWidth=2;g.beginPath();g.arc(p.x,p.y,12,0,Math.PI*2);g.fill();g.stroke();g.textAlign='center';g.textBaseline='middle';g.font='bold 16px Georgia';g.fillStyle='#304a3b';g.fillText(String(m.number),p.x,p.y+1);g.textBaseline='alphabetic';}
   else{g.fillStyle='#fff0bc';g.strokeStyle='#685337';g.lineWidth=2;g.fillRect(p.x-4,p.y-4,8,8);g.strokeRect(p.x-4,p.y-4,8,8);}
  }
  if(chosen){const p=pointOnMap(chosen,view,w,h);g.strokeStyle=COLORS.pin;g.lineWidth=4;g.beginPath();g.arc(p.x,p.y,full?17:12,0,Math.PI*2);g.stroke();g.fillStyle=COLORS.pin;g.fillRect(p.x-2,p.y-24,4,13);g.beginPath();g.moveTo(p.x+2,p.y-24);g.lineTo(p.x+15,p.y-20);g.lineTo(p.x+2,p.y-15);g.fill();}
  triangle(g,clamp(pos.x,11,w-11),clamp(pos.y,11,h-11),info.dir,full?13:12);
  g.fillStyle='#1e3a32';g.fillRect(w-36,7,29,42);g.fillStyle='#f2e2b5';g.textAlign='center';g.font='bold 19px Georgia';g.fillText('N',w-22,42);g.beginPath();g.moveTo(w-22,12);g.lineTo(w-28,25);g.lineTo(w-16,25);g.fill();
  if(full){g.strokeStyle='#677958';g.lineWidth=4;g.strokeRect(2,2,w-4,h-4);}
 }
 function miniView(info){const w=Math.min(info.width,384),h=w*miniCanvas.height/miniCanvas.width;return{x:clamp(info.x-w/2,0,info.width-w),y:clamp(info.y-h/2,0,info.height-h),w,h};}
 function selectionStatus(info){const t=target(info);return t?t.name+' · '+distanceText(info,t)+' · linha reta':'Escolha um local, morador ou ponto no mapa para marcar um destino.';}
 function refresh(info=read()){
  if(!ready||!info)return;lastInfo=info;ensureBase(info);
  mini.hidden=opened||!info.active||!canOpen();
  if(!mini.hidden){lastMiniView=miniView(info);draw(miniCanvas,info,lastMiniView);miniRegion.textContent=info.inside?'Interior · '+(ROOM_NAMES[info.scene]||'abrigo'):WORLD_NAMES[info.region];const t=target(info);miniTarget.textContent=t?t.name+' · '+distanceText(info,t):'Você: seta amarela';mini.title='Abrir mapa completo (G). '+localName(info)+(t?'. Destino: '+t.name:'');}
  if(opened){currentLabel.textContent=localName(info)+(info.inside?'. Sua posição no vale é a entrada do edifício.':'. Você é a seta amarela; os moradores são círculos verdes.');selectionLabel.textContent=selectionStatus(info);clearButton.hidden=!selected;layoutMap();draw(fullCanvas,info,{x:0,y:0,w:info.width,h:info.height},true);
   for(const b of list.querySelectorAll('[data-map-id]')){b.setAttribute('aria-pressed',String(b.dataset.mapId===selected?.id));const m=markers(info).find(m=>m.id===b.dataset.mapId);if(m)b.querySelector('small').textContent=distanceText(info,m);}
  }
 }
 function selectDestination(value){const info=read();if(!info)return false;
  if(typeof value==='string'){const m=markers(info).find(x=>x.id===value);if(!m)return false;selected={id:m.id,kind:m.kind};}
  else if(value&&Number.isFinite(value.x)&&Number.isFinite(value.y)){selected={id:'point',kind:'point',name:'Ponto marcado',x:clamp(value.x,0,info.width),y:clamp(value.y,0,info.height)};}
  else return false;refresh(info);return true;
 }
 function renderList(info){
  list.replaceChildren();const all=markers(info);
  for(const kind of ['place','npc']){
   list.append(element('h3','',kind==='place'?'Lugares do vale':'Moradores agora'));
   const grid=element('div','fm-destinations');
   for(const m of all.filter(x=>x.kind===kind)){
    const b=button('',()=>selectDestination(m.id),'fm-destination');b.dataset.mapId=m.id;b.setAttribute('aria-pressed',String(selected?.id===m.id));
    const badge=element('span','fm-marker '+(kind==='npc'?'fm-npc':''),kind==='place'?m.number:'●'),label=element('span');label.append(element('strong','',m.name),element('small','',distanceText(info,m)));b.append(badge,label);b.title=m.description+' · '+WORLD_NAMES[m.region];grid.append(b);
   }list.append(grid);
  }
 }
 function layoutMap(){
  if(!fullCanvas)return;const width=window.innerWidth,mobile=width<=680;
  const available=overlay?.querySelector('.fm-body')?.clientHeight||window.innerHeight-245;
  const legendHeight=overlay?.querySelector('.fm-map-key')?.getBoundingClientRect().height||18;
  const height=mobile?Math.min(390,Math.max(220,window.innerHeight-280)):Math.min(600,Math.max(150,available-legendHeight-18));
  fullCanvas.style.width=Math.min(mobile?width-72:300,height*60/124)+'px';fullCanvas.style.height='auto';
 }
 function resize(){if(opened)refresh();else layoutMap();}
 function focusables(){return Array.from(overlay.querySelectorAll('button,[tabindex="0"]')).filter(n=>!n.disabled&&!n.hidden&&n.getClientRects().length);}
 function keyboard(e){
  if(!opened)return;
  if(e.key==='Escape'||e.key.toLowerCase()==='g'){e.preventDefault();e.stopImmediatePropagation();close();return;}
  if(e.key==='Tab'){const items=focusables(),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}e.stopImmediatePropagation();return;}
  if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopImmediatePropagation();const a=document.activeElement;if(a?.tagName==='BUTTON'&&overlay.contains(a))a.click();return;}
  e.stopImmediatePropagation();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','q','f','c','r','e','h','j','i'].includes(e.key.toLowerCase()))e.preventDefault();
 }
 function install(){
  const style=element('style');style.textContent=`
  #worldMapMini{position:fixed;right:14px;bottom:84px;width:178px;padding:9px;z-index:38;border:1px solid #acaa74;border-radius:9px;color:#eee5c8;background:#1c3830ed;box-shadow:0 5px 20px #071e2380;cursor:pointer;text-align:left;font-family:Georgia,serif;box-sizing:border-box;}
  #worldMapMini[hidden],#worldMapOverlay[hidden],#worldMapClear[hidden]{display:none!important}#worldMapMini:focus-visible{outline:3px solid #ffe27b;outline-offset:3px}#worldMapMini:hover{border-color:#ffdf7c;background:#264a3bea}
  #worldMapMini .fm-mini-heading{display:flex;align-items:center;justify-content:space-between;font:bold 12px Georgia,serif;margin-bottom:7px;color:#ffe3a1}#worldMapMini kbd{font:11px monospace;border:1px solid #b4b789;border-radius:3px;padding:1px 5px;color:#ede4c7}#worldMapMini canvas{display:block;width:100%;height:auto;image-rendering:pixelated;border:1px solid #75977a;box-sizing:border-box;border-radius:3px}#worldMapMini .fm-mini-region{font:bold 10px Georgia,serif;margin-top:6px;display:block}#worldMapMini .fm-mini-target{display:block;font:9px/1.3 Georgia,serif;color:#d4ddbe;margin-top:3px;max-height:2.6em;overflow:hidden;overflow-wrap:anywhere}
  #worldMapOverlay{position:fixed;inset:0;z-index:1720;background:#071e21bf;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box}#worldMapOverlay *{box-sizing:border-box}.fm-card{width:min(930px,100%);max-height:calc(100dvh - 36px);border:3px solid #685333;box-shadow:0 0 0 2px #c4a96f,0 20px 70px #031815b3;border-radius:6px;background:#f4ecd7;padding:22px;color:#213f36;display:flex;flex-direction:column;overflow:hidden;font-family:Georgia,serif}.fm-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}.fm-header h2{font:700 29px/1.15 Georgia,serif;margin:4px 0}.fm-eyebrow{font:10px/1.3 monospace;letter-spacing:1.5px;text-transform:uppercase;color:#827547}.fm-current{margin:4px 0 0;font:13px/1.5 Georgia,serif;color:#53644e}.fm-button{border:1px solid #a69a70;background:#e7dfc5;color:#264437;padding:9px 13px;min-height:40px;font:13px Georgia,serif;border-radius:4px;cursor:pointer}.fm-button:hover{background:#d4dabe}.fm-button:focus-visible,.fm-destination:focus-visible{outline:3px solid #426b4a;outline-offset:2px}.fm-close{flex:0 0 auto}
  .fm-body{display:grid;grid-template-columns:minmax(220px,300px) minmax(0,1fr);gap:22px;min-height:0;overflow:auto;padding:3px}.fm-map-column{display:flex;flex-direction:column;align-items:center;gap:10px}.fm-full-canvas{display:block;max-width:100%;image-rendering:pixelated;cursor:crosshair;border-radius:3px;touch-action:manipulation}.fm-map-key{display:flex;justify-content:center;flex-wrap:wrap;gap:7px 12px;font:11px/1.5 Georgia,serif;color:#4c644d}.fm-key-player{color:#8c6c1c;font-weight:bold}.fm-key-npc{color:#316e5a;font-weight:bold}.fm-key-pin{color:#a53b69;font-weight:bold}.fm-list h3{font:700 16px Georgia,serif;margin:8px 0 10px}.fm-list h3:not(:first-child){margin-top:20px}.fm-destinations{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.fm-destination{display:flex;align-items:center;gap:9px;text-align:left;min-width:0;min-height:48px;border:1px solid #c0bda1;background:#e8e3cf;color:#253f34;padding:8px;border-radius:4px;cursor:pointer}.fm-destination strong{display:block;font:700 13px/1.25 Georgia,serif;overflow-wrap:anywhere}.fm-destination small{display:block;color:#61735a;font:11px/1.35 Georgia,serif;margin-top:3px}.fm-destination:hover{background:#d8dfc2}.fm-destination[aria-pressed=true]{border:2px solid #a1456c;padding:7px;background:#f0deca}.fm-marker{display:flex;align-items:center;justify-content:center;flex:0 0 22px;width:22px;height:22px;border:1px solid #8f7c52;background:#f6e7b8;color:#3d5137;border-radius:50%;font:700 11px Georgia,serif}.fm-marker.fm-npc{background:#bbd9c2;color:#287c67;border-color:#709f82;font-size:15px}
  .fm-footer{border-top:1px solid #c6c7aa;margin-top:15px;padding-top:12px;display:flex;align-items:center;justify-content:space-between;gap:10px}.fm-selection{font:13px/1.4 Georgia,serif;margin:0;min-height:18px}.fm-map-note{font:10px/1.5 Georgia,serif;margin:0;color:#6c775c}.fm-footer-controls{flex:0 0 auto}.fm-card .fm-button[disabled]{opacity:.5;cursor:default}
  body.access-contrast .fm-card{background:#fff;color:#162d21;border-color:#142f23}body.access-contrast .fm-destination{background:#fff;color:#152e22;border-color:#476046}body.access-contrast .fm-current,body.access-contrast .fm-selection{color:#162d21}
  @media(min-width:681px){.fm-map-column{position:sticky;top:0;align-self:start}}
  @media(max-width:680px){#worldMapOverlay{padding:10px}.fm-card{padding:15px;max-height:calc(100dvh - 20px)}.fm-header h2{font-size:23px}.fm-current{font-size:12px}.fm-eyebrow{font-size:9px;letter-spacing:.7px}.fm-close{padding:8px;font-size:11px;min-height:36px}.fm-body{grid-template-columns:1fr;gap:14px}.fm-destinations{grid-template-columns:repeat(2,minmax(0,1fr))}.fm-footer{margin-top:10px;padding-top:9px}.fm-selection{font-size:12px}.fm-footer-controls .fm-button{padding:8px;font-size:11px}.fm-map-note{font-size:10px}}
  @media(max-width:540px){#worldMapMini{right:10px;bottom:88px;width:126px;padding:7px}#worldMapMini .fm-mini-heading{font-size:11px;margin-bottom:5px}#worldMapMini .fm-mini-region{font-size:9px}#worldMapMini .fm-mini-target{font-size:8px}#worldMapMini kbd{font-size:10px;padding:0 4px}}
  @media(max-height:560px){#worldMapMini{width:126px;padding:8px}#worldMapMini canvas,#worldMapMini .fm-mini-region,#worldMapMini .fm-mini-target{display:none}#worldMapMini .fm-mini-heading{margin:0}.fm-header h2{font-size:22px}.fm-card{padding:14px}.fm-current{font-size:11px}.fm-footer{margin-top:8px;padding-top:8px}}
  `;document.head.append(style);
  mini=button('',open);mini.id='worldMapMini';mini.hidden=true;mini.setAttribute('aria-label','Abrir mapa completo do Vale, tecla G');mini.setAttribute('aria-haspopup','dialog');
  const title=element('span','fm-mini-heading');title.append(element('span','','Mapa do Vale'),element('kbd','','G'));
  miniCanvas=element('canvas');miniCanvas.width=320;miniCanvas.height=208;miniCanvas.setAttribute('aria-hidden','true');miniRegion=element('span','fm-mini-region');miniTarget=element('span','fm-mini-target');mini.append(title,miniCanvas,miniRegion,miniTarget);
  overlay=element('div');overlay.id='worldMapOverlay';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','worldMapTitle');
  const card=element('section','fm-card'),header=element('header','fm-header'),labels=element('div');labels.append(element('span','fm-eyebrow','Encontre seu caminho'));
  const titleFull=element('h2','','Mapa do Vale');titleFull.id='worldMapTitle';currentLabel=element('p','fm-current');labels.append(titleFull,currentLabel);header.append(labels,button('Fechar · Esc',close,'fm-button fm-close'));card.append(header);
  const body=element('div','fm-body'),mapColumn=element('div','fm-map-column');fullCanvas=element('canvas','fm-full-canvas');fullCanvas.id='worldMapCanvas';fullCanvas.width=600;fullCanvas.height=1240;fullCanvas.setAttribute('aria-label','Mapa completo: montanha ao norte, fazenda no centro e oásis ao sul. Escolha um local na lista para marcar o destino.');
  const key=element('div','fm-map-key');key.append(element('span','fm-key-player','▲ Você'),element('span','fm-key-npc','● Moradores'),element('span','fm-key-pin','⚑ Destino'));mapColumn.append(fullCanvas,key);list=element('section','fm-list');body.append(mapColumn,list);card.append(body);
  const footer=element('footer','fm-footer'),description=element('div');selectionLabel=element('p','fm-selection');selectionLabel.setAttribute('aria-live','polite');description.append(selectionLabel,element('p','fm-map-note','Marcar um lugar ajuda a se orientar. O percurso é feito caminhando.'));
  const controls=element('div','fm-footer-controls');clearButton=button('Limpar marca',()=>{selected=null;refresh();});clearButton.id='worldMapClear';clearButton.hidden=true;controls.append(clearButton);footer.append(description,controls);card.append(footer);overlay.append(card);document.body.append(mini,overlay);
  overlay.addEventListener('click',e=>{if(e.target===overlay)close();});fullCanvas.addEventListener('click',e=>{
   const info=read();if(!info)return;const b=fullCanvas.getBoundingClientRect(),point={x:clamp((e.clientX-b.left)/b.width,0,1)*info.width,y:clamp((e.clientY-b.top)/b.height,0,1)*info.height};
   const nearest=markers(info).map(m=>({m,d:Math.hypot((m.x-point.x)/info.width*b.width,(m.y-point.y)/info.height*b.height)})).sort((a,b)=>a.d-b.d)[0];
   selectDestination(nearest?.d<16?nearest.m.id:point);
  });window.addEventListener('keydown',keyboard,true);window.addEventListener('resize',resize);resize();
 }
 function open(){
  if(!ready||opened||!canOpen())return false;const info=read();if(!info)return false;
  previousFocus=document.activeElement;adapter.beforeOpen?.();opened=true;overlay.hidden=false;mini.hidden=true;ensureBase(info);buildPlaces(info);renderList(info);resize();refresh(info);overlay.querySelector('button')?.focus({preventScroll:true});return true;
 }
 function close(){if(!opened)return false;opened=false;overlay.hidden=true;refresh();const f=previousFocus;previousFocus=null;if(f?.isConnected&&!f.hidden&&f.getClientRects().length)f.focus({preventScroll:true});else adapter.focusGame?.();return true;}
 function reset(){close();selected=null;base=null;baseMap=null;baseObjects=null;refresh();}
 function snapshot(){const info=read();if(!info)return null;return{open:opened,position:{x:info.x,y:info.y,dir:info.dir},inside:info.inside,scene:info.scene,region:info.region,world:{width:info.width,height:info.height,tilesX:info.main.MW,tilesY:info.main.MH},markers:markers(info),destination:target(info),miniView:lastMiniView,playerColor:COLORS.gold,npcColor:COLORS.teal,caption:localName(info)};}
 window.FarmWorldMap={
  init(api={}){adapter=api||{};if(!ready){ready=true;install();}refresh();return snapshot();},
  update(dt){if(!ready)return;timer+=Number.isFinite(dt)?Math.max(0,dt):0;if(timer<.1)return;timer%=.1;refresh();},
  isOpen:()=>opened,open,close,toggle(){return opened?close():open();},reset,
  setDestination:selectDestination,clearDestination(){selected=null;refresh();},snapshot,draw(){refresh();},
  invalidate(){base=null;refresh();}
 };
})();
