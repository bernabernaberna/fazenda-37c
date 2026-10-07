/* Acabamento V6.4: evidências da build real, contratos de desenho e regressões.
   Requer tools/capsrv.py 8766. O backup comparativo é opcional; use
   FARM37_SKIP_BEFORE=1 para executar numa cópia pública sem analise/.
   Capturas precisam ser abertas: nenhum teste de pixels aprova a qualidade da arte. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {isDeepStrictEqual}=require('node:util');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'analise','graficos-v64');fs.mkdirSync(dir,{recursive:true});
const base=process.env.FARM37_URL||'http://127.0.0.1:8766',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const locations=[['centro',400,936],['casa',608,1268],['rio',712,988],['oasis',624,1736],['lago',344,464],['montanha',400,592]];
const report={geradoEm:new Date().toISOString(),metodo:'Edge isolado; RAF suspenso e relógio visual controlado; terreno sintético temporário; E/WASD reais; recursos e posições iniciais preparados.',checagens:[],erros:[],externos:[],capturas:[],limites:['As imagens precisam de inspeção humana; o teste não atribui aprovação estética por hash.','As medidas referem-se a Edge local, não a todos os dispositivos.','Os testes sintéticos restauram o terreno original antes da simulação.','Em 390×844, o object-fit cover e os painéis da interface existente reduzem muito a área visível. Esta rodada conserva a UI e não aprova a experiência móvel completa.']};
let browser,page,prior=null,priorSave=null;
function check(nome,passou,evidencia){report.checagens.push({nome,passou:!!passou,evidencia});assert.ok(passou,nome);}
async function prepare(){await page.evaluate(()=>{
 startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryIntegration.reset();FarmStoryCinematics.reset();FarmValleySaga.reset();FarmLife.reset();
 FarmStoryUI.close();FarmValleyPanels.close(false);FarmStoryCinematics.close();histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;
 A11Y.noDeath=true;A11Y.relaxed=true;A11Y.reduceMotion=false;currentWeather=null;weatherCooldown=1e9;timeOfDay=12;currentSeason='hot';isPaused=false;soundEnabled=false;
 player.coins=1000;Object.assign(player.inv,{wood:100,wool:40,veg:40,water:40,hay:40});
 for(const d of FarmLife.snapshot().projects){player.x=d.x;player.y=d.y;const r=FarmLife.build(d.id);if(!r.ok)throw Error(r.message);}
 const story=FarmStoryWorld.serialize();story.main.forEach(r=>{r.status='completed';r.paid=true;});FarmStoryWorld.restore(story);
 window.__gfxPosition=(x,y)=>{player.x=x;player.y=y;player.temp=37;player.en=80;player.hyd=80;player.resting=false;player.dead=false;player.running=false;player.moving=false;player.actionTimer=0;for(const k of Object.keys(keys))delete keys[k];document.getElementById('game').focus();};
 window.__gfxState=()=>({scene:currentScene,x:player.x,y:player.y,inv:{...player.inv},coins:player.coins,farm:FarmLife.serialize(),story:FarmStoryWorld.serialize(),saga:FarmValleySaga.serialize()});
 });}
async function snapshot(){return page.evaluate(()=>{
 const m=scenes.main;saveGame(true);const save=JSON.parse(localStorage.getItem(SAVE_KEY));
 return{map:m.map,objects:m.objects.map(o=>Object.fromEntries(['type','kind','x','y','w','h','shadeR','projectId','clueId','stationId','npcId','_dest'].filter(k=>o[k]!==undefined).map(k=>[k,o[k]]))),ids:save.objects.map(o=>o.stateId).sort(),saveVersion:save.version,weights:Array.from({length:124},(_,y)=>regionWeights(y)),save};
 });}
async function capture(stage,loc,hour,viewport={width:1280,height:800}){
 await page.setViewportSize(viewport);const [place,x,y]=loc,name=`graficos-v64-${stage}-${place}-${hour}h-${viewport.width}x${viewport.height}`;
 const r=await page.evaluate(async({name,x,y,hour})=>{
  if(currentScene!=='main')setSceneTo('main');FarmValleyPanels.close(false);FarmStoryUI.close();FarmStoryCinematics.close();isPaused=false;
  let point=null;for(let dy=-128;dy<=128;dy+=4)for(let dx=-128;dx<=128;dx+=4){const d=dx*dx+dy*dy;if((!point||d<point.d)&&!FarmWorldDepth.isBlocked(x+dx,y+dy)&&![T.WATER,T.RIVER,T.OASIS,T.ICE].includes(map[Math.floor((y+dy)/TS)]?.[Math.floor((x+dx)/TS)]))point={x:x+dx,y:y+dy,d};}
  if(!point)throw Error('Sem apoio para captura '+name);__gfxPosition(point.x,point.y);timeOfDay=hour;ZOOM=2;snapCamera();render();
  const canvas=document.getElementById('game'),url=canvas.toDataURL('image/png'),response=await fetch('/shot?name='+name,{method:'POST',body:url});if(!response.ok)throw Error('POST /shot: '+response.status);
  const rect=canvas.getBoundingClientRect();return{base64:url.split(',')[1],camera:{x:_camFloatX,y:_camFloatY,w:_visW,h:_visH,zoom:ZOOM},player:point,canvas:{width:canvas.width,height:canvas.height,cssWidth:rect.width,cssHeight:rect.height,left:rect.left,top:rect.top,objectFit:getComputedStyle(canvas).objectFit,smoothing:ctx.imageSmoothingEnabled}};
 },{name,x,y,hour});
 const bytes=Buffer.from(r.base64,'base64'),file=path.join(dir,name+'.png');fs.writeFileSync(file,bytes);const {base64,...geometry}=r;
 const entry={stage,place,hour,viewport,file,canvasFile:path.join(root,'site','shots',name+'.png'),SHA256:sha(bytes),...geometry};
 if(stage==='depois'&&place==='centro'&&hour===12){entry.viewportFile=path.join(dir,name+'-viewport.png');await page.screenshot({path:entry.viewportFile});}
 report.capturas.push(entry);return entry;
}
async function move(key,n){await page.keyboard.down(key);try{await page.evaluate(n=>{for(let i=0;i<n;i++)update(1/60);},n);}finally{await page.keyboard.up(key);}}
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});report.navegador=browser.version();page=await browser.newPage({viewport:{width:1280,height:800}});
 page.on('pageerror',e=>report.erros.push(e.message));await page.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.setItem('farm37_seen_intro','1');let seed=731947;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};window.__gfxTime=10000;performance.now=()=>window.__gfxTime;});
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin===new URL(base).origin)return r.continue();report.externos.push(u.href);return r.abort();});
 const beforeFile=path.join(dir,'jogo-antes.html'),hasBefore=fs.existsSync(beforeFile)&&process.env.FARM37_SKIP_BEFORE!=='1';
 report.comparacaoAnterior=hasBefore?'Backup local capturado nas mesmas condições.':'Backup não fornecido ou comparação desativada por FARM37_SKIP_BEFORE=1.';
 if(hasBefore){
  const response=await page.goto(base+'/analise/graficos-v64/jogo-antes.html?v='+Date.now());assert.ok(response.ok(),'Backup servido');report.anteriorSHA256=sha(await response.body());await prepare();prior=await snapshot();
  for(const loc of locations)for(const hour of [7,12,17])await capture('antes',loc,hour);
  priorSave=prior.save;
 }
 const response=await page.goto(base+'/jogo.html?v=graficos-v64-'+Date.now());assert.ok(response.ok(),'Jogo servido');const html=(await response.body()).toString('utf8');report.jogoSHA256=sha(html);await prepare();const current=await snapshot();
 if(prior){
  const stripScripts=s=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<!-- BUILD:[\s\S]*?-->/g,'').replace(/\r\n/g,'\n');
  const beforeHTML=fs.readFileSync(beforeFile,'utf8');check('HTML e CSS da interface permanecem iguais',stripScripts(beforeHTML)===stripScripts(html));
  const moduleText=(s,name)=>{s=s.replace(/\r\n/g,'\n');const start=s.indexOf('\n   src/modules/'+name+'\n');if(start<0)return null;const from=s.indexOf('*/',start)+2,next=s.indexOf('\n   src/modules/',from),end=next<0?s.indexOf('</script>',from):s.lastIndexOf('/*',next);return s.slice(from,end).trim();};
  const interfaces=['15-story-ui.js','17-world-map.js','37-valley-panels.js','38-skin-learning.js'];check('Diálogos, mapa, caderno e Visão da Pele mantêm os mesmos módulos',interfaces.every(name=>moduleText(beforeHTML,name)!==null&&moduleText(beforeHTML,name)===moduleText(html,name)),interfaces);
  check('Mapa físico e transição térmica permanecem iguais',isDeepStrictEqual(current.map,prior.map)&&isDeepStrictEqual(current.weights,prior.weights),{tiles:current.map.length*current.map[0].length});
  check('Tipos, posições, portas e pontos de interação permanecem iguais',isDeepStrictEqual(current.objects,prior.objects),{objetos:current.objects.length});
  check('Versão do save e identidades dos objetos permanecem iguais',current.saveVersion===prior.saveVersion&&isDeepStrictEqual(current.ids,prior.ids),{version:current.saveVersion,objetosComID:current.ids.length});
 }else report.limites.push(report.comparacaoAnterior);
 const renderContract=await page.evaluate(()=>({render:render.toString(),cinematic:drawCinematicWorld.toString(),api:typeof FarmWorldDepth.drawGroundShadows}));
 check('API de sombras compartilhada disponível',renderContract.api==='function');
 check('Render não chama nuvens brancas sobre o chão',!/drawClouds\s*\(/.test(renderContract.render));
 const windDrawing=await page.evaluate(()=>{const prior=ctx,canvas=document.createElement('canvas'),g=canvas.getContext('2d'),rects=[],fill=g.fillRect.bind(g);g.fillRect=(...a)=>{rects.push({a,color:g.fillStyle});fill(...a);};ctx=g;try{A11Y.reduceMotion=false;drawGrassSway(0,0,960,1984);const normal=[...rects];rects.length=0;A11Y.reduceMotion=true;drawGrassSway(0,0,960,1984);return{normal,reduced:[...rects]};}finally{ctx=prior;A11Y.reduceMotion=false;}});
 check('Camada legada contém apenas quatro riscos discretos de vento, suspensos no modo reduzido',windDrawing.normal.length>0&&windDrawing.normal.length<=8&&windDrawing.normal.every(r=>[3,7].includes(r.a[2])&&r.a[3]===1&&!['#54a142','#9bd86c'].includes(r.color))&&windDrawing.reduced.length===0,windDrawing);
 const shadow=await page.evaluate(()=>{
  const tree=scenes.main.objects.find(o=>o.type==='tree'),rows=[];
  for(const reduced of [false,true])for(const hour of [7,12,17]){
   A11Y.reduceMotion=reduced;timeOfDay=hour;const sun=sunShadowVec(),wanted=treeShadowEllipse(tree,sun),ellipses=[];
   const canvas=document.createElement('canvas'),g=canvas.getContext('2d'),original=g.ellipse.bind(g);g.ellipse=(...a)=>{ellipses.push(a);original(...a);};
   FarmWorldDepth.drawGroundShadows(g,[tree],sun);player.x=wanted.cx;player.y=wanted.cy;
   rows.push({hour,reduced,sun,wanted,ellipses,shadeAtCenter:inShade()});
  }
  A11Y.reduceMotion=false;return rows;
 });
 check('Sombra desenhada usa a elipse térmica exata em três horários e redução de movimento',shadow.every(r=>r.ellipses.length===1&&r.ellipses[0].slice(0,4).every((v,i)=>v===[r.wanted.cx,r.wanted.cy,r.wanted.rx,r.wanted.ry][i])&&r.shadeAtCenter),shadow);
 check('Sol projeta para lados opostos de manhã e à tarde; modo reduzido fica estável',shadow[0].sun.dx>0&&shadow[2].sun.dx<0&&isDeepStrictEqual(shadow[3].wanted,shadow[4].wanted)&&isDeepStrictEqual(shadow[4].wanted,shadow[5].wanted));
 const supports=await page.evaluate(()=>{
  // Apoios observados nos sprites: arbusto +3, estaca do espantalho +16,
  // móveis +8..12. O teste não consulta a tabela de sombras implementada.
  const fixtures=[['bush',3],['scarecrow',16],['sunflower',8],['well',1],['woodpile',8],['sellbox',10],['loom',12],['bench',8],['player',10],['animal',6,'cow'],['animal',4,'chicken']];
  const prior=ctx,canvas=document.createElement('canvas'),g=canvas.getContext('2d'),ellipses=[],original=g.ellipse.bind(g),rows=[];g.ellipse=(...a)=>{ellipses.push(a);original(...a);};ctx=g;
  try{for(const hour of [7,17])for(const [type,offset,kind]of fixtures){timeOfDay=hour;ellipses.length=0;drawSunShadows([{type,kind,x:100,y:100}]);rows.push({type,kind,hour,footY:100+offset,ellipses:[...ellipses]});}return rows;}finally{ctx=prior;}
 });
 check('Projeções pequenas partem dos apoios dos sprites em manhã e tarde',supports.every(r=>r.ellipses.length===2&&r.ellipses.every(e=>e[1]===r.footY&&(r.hour===7?e[0]>100:e[0]<100))),supports);
 const order=await page.evaluate(()=>{
  __gfxPosition(400,936);timeOfDay=12;snapCamera();const originalDepth=window.FarmWorldDepth,drawers={...OBJECT_DRAWERS},events=[];
  window.FarmWorldDepth={...originalDepth,drawGroundShadows(...args){events.push('sombras');return originalDepth.drawGroundShadows(...args);}};
  for(const [type,draw]of Object.entries(drawers))OBJECT_DRAWERS[type]=(...args)=>{events.push('objeto:'+type);return draw(...args);};
  try{render();const normal=[...events];events.length=0;const c=document.createElement('canvas');c.width=960;c.height=480;drawCinematicWorld(c.getContext('2d'),{width:960,height:480,focusX:400,focusY:936,zoom:2});return{normal,cinematic:[...events]};}
  finally{window.FarmWorldDepth=originalDepth;Object.assign(OBJECT_DRAWERS,drawers);}
 });
 for(const [name,events]of Object.entries(order))check(name+' aplica uma passagem de sombras antes dos sprites',events.filter(x=>x==='sombras').length===1&&events.indexOf('sombras')<events.findIndex(x=>x.startsWith('objeto:')),{first:events.slice(0,10),shadowPasses:events.filter(x=>x==='sombras').length});
 const terrain=await page.evaluate(()=>{
  const tx=20,ty=60,cells=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)cells.push({x:tx+dx,y:ty+dy,t:map[ty+dy][tx+dx]});
  const c=document.createElement('canvas');c.width=16;c.height=16;const g=c.getContext('2d');
  const draw=(center,surround,corner,offset)=>{for(const p of cells)map[p.y][p.x]=surround;map[ty][tx]=center;if(corner!==null)map[ty+offset[1]][tx+offset[0]]=corner;g.clearRect(0,0,16,16);g.save();g.translate(-tx*TS,-ty*TS);drawTile(tx,ty,center,g);g.restore();return Array.from(g.getImageData(0,0,16,16).data);};
  const rows=[];try{for(const [type,shore]of [[T.RIVER,T.GRASS],[T.OASIS,T.SAND],[T.ICE,T.SNOW]])for(const [dx,dy]of [[-1,-1],[1,-1],[1,1],[-1,1]]){
    const plain=draw(type,type,null,[dx,dy]),diagonal=draw(type,type,shore,[dx,dy]),changed=[];
    for(let i=0;i<256;i++)if(plain.slice(i*4,i*4+4).some((v,k)=>v!==diagonal[i*4+k]))changed.push({x:i%16,y:Math.floor(i/16)});
    rows.push({type,shore,dx,dy,changed,deterministic:isDeep(diagonal,draw(type,type,shore,[dx,dy]))});
   }
   const snowGrass=[];for(const [center,other]of [[T.GRASS,T.SNOW],[T.SNOW,T.GRASS]])for(const offset of [[0,-1],[1,0],[0,1],[-1,0]]){
    const plain=draw(center,center,null,offset),mixed=draw(center,center,other,offset);snowGrass.push({center,offset,different:!isDeep(plain,mixed),deterministic:isDeep(mixed,draw(center,center,other,offset))});
   }
   return{rows,snowGrass};
  }finally{for(const p of cells)map[p.y][p.x]=p.t;}
  function isDeep(a,b){return a.length===b.length&&a.every((v,i)=>v===b[i]);}
 });
 check('As quatro diagonais de rio, oásis e gelo recebem cantos determinísticos',terrain.rows.every(r=>r.changed.length>0&&r.deterministic),terrain.rows);
 check('Neve encontra gramado com acabamento determinístico',terrain.snowGrass.some(r=>r.different)&&terrain.snowGrass.every(r=>r.deterministic),terrain.snowGrass);
 const vegetation=await page.evaluate(()=>{
  const g=document.createElement('canvas').getContext('2d'),opts={camX:120,camY:800,visW:640,visH:400,timeOfDay:12,winter:false,reducedMotion:false};
  function paint(extra={}){FarmWorldArt.drawAtmosphere(g,{...opts,...extra});return FarmWorldArt.state().atmosphere;}
  __gfxTime=10000;const a=paint(),b=paint({camX:121,camY:801});__gfxTime=14100;const animated=paint();
  const still1=paint({reducedMotion:true});__gfxTime=21100;const still2=paint({reducedMotion:true});
  const bounds=[];for(const [visW,visH]of [[640,400],[512,320],[195,422],[960,540],[1920,960]])bounds.push({visW,visH,state:paint({visW,visH})});
  const noWind=paint({windStrength:0}),indoor=paint({indoor:true});__gfxTime=10000;return{a,b,animated,still1,still2,bounds,noWind,indoor};
 });
 const anchors=s=>(s?.anchors||[]).map(({x,y})=>`${x},${y}`),sharedA=anchors(vegetation.a).filter(k=>{const [x,y]=k.split(',').map(Number);return x>=121&&y>=801&&x<760&&y<1200;}),sharedB=anchors(vegetation.b).filter(k=>{const [x,y]=k.split(',').map(Number);return x>=121&&y>=801&&x<760&&y<1200;});
 check('Uma camada de vegetação respeita 40 grupos e conta âncoras desenhadas',vegetation.bounds.every(r=>r.state&&r.state.count<=40&&r.state.count===r.state.anchors.length)&&vegetation.a.count>0,vegetation.bounds);
 check('Mover a câmera um pixel mantém âncoras na região compartilhada',sharedA.length>0&&isDeepStrictEqual(sharedA.sort(),sharedB.sort()),{a:sharedA,b:sharedB});
 check('Vento anima vegetação; redução de movimento congela os deslocamentos',anchors(vegetation.a).join('|')===anchors(vegetation.animated).join('|')&&vegetation.a.anchors.some((a,i)=>a.sway!==vegetation.animated.anchors[i].sway)&&vegetation.still1.anchors.every(a=>a.sway===0)&&isDeepStrictEqual(vegetation.still1.anchors,vegetation.still2.anchors),{animated:vegetation.animated,still:vegetation.still1});
 check('Interiores não recebem vegetação de campo',vegetation.indoor.count===0,vegetation.indoor);
 check('Vento nulo mantém os tufos imóveis',vegetation.noWind.anchors.every(a=>a.sway===0),vegetation.noWind);
 for(const loc of locations)for(const hour of [7,12,17])await capture('depois',loc,hour);
 for(const viewport of [{width:1024,height:640},{width:390,height:844}])for(const loc of locations)await capture('depois',loc,12,viewport);
 check('Capturas mantêm zoom inteiro, desenho sem suavização e proporção via object-fit',report.capturas.every(c=>c.camera.zoom===2&&!c.canvas.smoothing&&(['cover','contain','scale-down'].includes(c.canvas.objectFit)||Math.abs(c.canvas.width/c.canvas.height-c.canvas.cssWidth/c.canvas.cssHeight)<.01)),report.capturas.map(c=>({file:path.basename(c.file),canvas:c.canvas})));
 if(prior)check('Comparações usam as mesmas câmeras, apoio e horário',report.capturas.filter(c=>c.stage==='antes').every(a=>{const b=report.capturas.find(b=>b.stage==='depois'&&b.place===a.place&&b.hour===a.hour&&b.viewport.width===a.viewport.width);return b&&isDeepStrictEqual(a.camera,b.camera)&&isDeepStrictEqual(a.player,b.player);}));
 await page.setViewportSize({width:1280,height:800});
 for(const [type,scene]of [['door_house','house'],['door_barn','barn']]){
  await page.evaluate(type=>{const d=objects.find(o=>o.type===type);__gfxPosition(d.x,d.y+10);},type);await page.keyboard.press('e');check('E abre a porta '+scene,await page.evaluate(s=>currentScene===s,scene));
  const before=await page.evaluate(()=>player.y);await move('w',10);check('Entrada de '+scene+' permite caminhar',await page.evaluate(y=>player.y<y,before));
  await page.evaluate(()=>{const d=objects.find(o=>o.type==='i_door');__gfxPosition(d.x,d.y);});await page.keyboard.press('e');check('E retorna de '+scene+' ao mundo',await page.evaluate(()=>currentScene==='main'));
 }
 const bridge=await page.evaluate(()=>{const o=objects.find(o=>o.type==='bridge');const y=o.y;__gfxPosition(o.x-12,y);return{x:o.x,y,w:o.w};});await move('d',120);const crossed=await page.evaluate(()=>({x:player.x,y:player.y,scene:currentScene}));check('Ponte mantém travessia real por teclado',crossed.scene==='main'&&crossed.x>bridge.x+bridge.w&&Math.abs(crossed.y-bridge.y)<1,{bridge,crossed});
 const fish=await page.evaluate(()=>{const o=objects.find(o=>o.type==='fishing_spot');o.fishCooldown=-1e6;__gfxPosition(o.x-10,o.y);window.__gfxRandom=Math.random;Math.random=()=>.1;return{en:player.en,hyd:player.hyd};});
 try{await page.keyboard.press('e');const after=await page.evaluate(()=>({en:player.en,hyd:player.hyd,cooldown:objects.find(o=>o.type==='fishing_spot').fishCooldown}));check('E pesca na margem com efeito real e espera registrada',after.en>fish.en&&after.hyd>fish.hyd&&after.cooldown===10000,{before:fish,after});}finally{await page.evaluate(()=>{Math.random=window.__gfxRandom;delete window.__gfxRandom;});}
 const wood=await page.evaluate(()=>{const o=objects.find(o=>o.type==='woodpile');__gfxPosition(o.x,o.y);return player.inv.wood;});await page.keyboard.press('e');check('E coleta lenha e mantém a atividade existente',await page.evaluate(before=>player.inv.wood===before+1,wood));
 if(priorSave){await page.evaluate(save=>localStorage.setItem(SAVE_KEY,JSON.stringify(save)),priorSave);await page.reload();await page.locator('#continueBtn').click();const restored=await page.evaluate(()=>({version:JSON.parse(localStorage.getItem(SAVE_KEY)).version,inv:{...player.inv},coins:player.coins,farm:FarmLife.serialize()}));check('Save da versão anterior abre sem migração ou perda de progresso',restored.version===priorSave.version&&isDeepStrictEqual(restored.inv,priorSave.player.inv)&&restored.coins===priorSave.player.coins&&isDeepStrictEqual(restored.farm,priorSave.farmLife),restored);}
 else{const saved=await page.evaluate(()=>{saveGame(true);return{inv:{...player.inv},coins:player.coins,farm:FarmLife.serialize()};});await page.reload();await page.locator('#continueBtn').click();check('Reload preserva inventário, moedas e projetos',isDeepStrictEqual(saved,await page.evaluate(()=>({inv:{...player.inv},coins:player.coins,farm:FarmLife.serialize()}))));}
 const cache=await page.evaluate(()=>{
  FarmStoryUI.close();FarmStoryCinematics.close();FarmValleyPanels.close(false);if(currentScene!=='main')setSceneTo('main');isPaused=false;A11Y.reduceMotion=false;
  const places=[[400,936],[608,1268],[712,988],[624,1736],[344,464],[400,592]],info=()=>{const a=FarmWorldArt.state();return{tileSprites:a.tileSprites,objectSprites:a.objectSprites,bytes:a.cacheBytes,depth:FarmWorldDepth.cacheInfo(),tileWidth:_tileCache?.width,tileHeight:_tileCache?.height};};
  const tour=()=>{for(const [x,y]of places)for(const t of [7,12,17]){player.x=x;player.y=y;timeOfDay=t;snapCamera();render();}};
  tour();tour();const before=info(),worldCache=_tileCache;for(let i=0;i<6;i++)tour();return{before,after:info(),sameTileCanvas:worldCache===_tileCache};
 });check('Revisitar locais e horários reutiliza os caches aquecidos',cache.sameTileCanvas&&isDeepStrictEqual(cache.before,cache.after),cache);
 check('Sem erros de execução ou dependências externas',report.erros.length===0&&report.externos.length===0,{erros:report.erros,externos:report.externos});report.passou=true;
})().catch(e=>{report.passou=false;report.falha=e.stack;process.exitCode=1;}).finally(async()=>{await browser?.close();const name=process.env.FARM37_SKIP_BEFORE==='1'?'graficos-v64-sem-backup.json':'graficos-v64.json';fs.writeFileSync(path.join(dir,name),JSON.stringify(report,null,2));console.log(JSON.stringify({passou:report.passou,checagens:report.checagens.length,jogoSHA256:report.jogoSHA256,capturas:report.capturas.length,erros:report.erros,falha:report.falha,relatorio:path.join(dir,name)},null,2));});
