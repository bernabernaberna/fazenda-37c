/* Teclado real, update/render reais, relógio de simulação controlado.
   Sem alterar fonte/mundo. --baseline conserva falhas como diagnóstico.
   Cenas/controles são preparados; vídeo mostra sequência contínua a 30 Hz. */
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/atuacao-v614');fs.mkdirSync(out,{recursive:true});
const baseline=process.argv.includes('--baseline'),phaseOnly=process.argv.includes('--phase-only'),label=process.env.LOCOMOCAO_LABEL||(phaseOnly?'audio-fase':baseline?'antes':'depois');
const report={at:new Date().toISOString(),baseline,checks:[],errors:[],external:[],samples:{},artifacts:[],limits:['Posições preparadas; teclas reais; update em intervalos controlados.','Vídeo de render real a30Hz; não é ensaio humano nem captura de monitor físico.','Critérios de pixels complementam inspeção visual; não avaliam beleza por contagem de quadros.']};
const check=(name,pass,evidence)=>report.checks.push({name,pass:!!pass,evidence});let browser,page;
async function key(k,on=true){await page.keyboard[on?'down':'up'](k);}
async function step(n=1,dt=1/60){return page.evaluate(({n,dt})=>window.__movement.step(n,dt),{n,dt});}
async function reset(){await page.evaluate(()=>window.__movement.reset());}
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:1280,height:800}});
 if(phaseOnly){
  await page.setContent('<button id="audit">Validar contatos da passada</button>');const source=fs.readFileSync(path.join(root,'src/modules/71-original-audio.js'),'utf8');report.source71SHA256=createHash('sha256').update(source).digest('hex');await page.addScriptTag({content:source});
  await page.evaluate(()=>document.getElementById('audit').onclick=()=>{
   const bank=FarmOriginalAudio,cases=[],count=()=>bank.state().footsteps.count;
   const send=(x,phase,props={})=>bank.updateFootsteps({x,y:100,scene:'audit',moving:true,surface:'wood',phase,...props});
   let before=count();send(100,2.95,{moving:false});send(101,3.2);cases.push({name:'Retoma perto do contato preservando fração anterior',pass:count()===before+1,state:bank.state().footsteps});
   before=count();send(102,3.4,{running:true});send(103,3.6,{running:false});cases.push({name:'Alternar corrida não reintepreta distância como contato',pass:count()===before,state:bank.state().footsteps});
   before=count();send(114,6.3,{running:true});cases.push({name:'Próximo contato sai em2π',pass:count()===before+1,state:bank.state().footsteps});
   before=count();send(114,9.5);cases.push({name:'Sem deslocamento não toca mesmo que fase mude',pass:count()===before,state:bank.state().footsteps});
   before=count();send(600,12.7);send(601,12.8);cases.push({name:'Teleporte resincroniza sem rajada',pass:count()===before,state:bank.state().footsteps});
   bank.resetFootsteps();before=count();send(100,6.1,{moving:false});send(101,.1);cases.push({name:'Fase normalizada cruza2π sem perder contato',pass:count()===before+1,state:bank.state().footsteps});
   before=count();send(120,3.05,{blocked:true});send(121,3.3);cases.push({name:'Pausa ancora fase e som retoma no contato seguinte',pass:count()===before+1,state:bank.state().footsteps});
   before=count();send(122,22);cases.push({name:'Salto inválido de fase não multiplica vozes',pass:count()===before,state:bank.state().footsteps});
   bank.resetFootsteps();before=count();send(0,undefined);send(18,undefined);cases.push({name:'API legada semphase ainda reconhece18px',pass:count()===before+1,state:bank.state().footsteps});
   bank.stopAll();window.__phaseCases=cases;
  });await page.locator('#audit').click();await page.waitForFunction(()=>window.__phaseCases);report.checks=await page.evaluate(()=>window.__phaseCases);return;
 }
 page.on('pageerror',e=>report.errors.push(e.message));await page.addInitScript(()=>{requestAnimationFrame=()=>0;window.__visualNow=1000;Object.defineProperty(performance,'now',{configurable:true,value:()=>window.__visualNow});localStorage.clear();localStorage.setItem('farm37_seen_intro','1');});
 const base=process.env.FARM37_URL||'http://127.0.0.1:8766';await page.route('**/*',r=>{if(new URL(r.request().url()).origin===new URL(base).origin)return r.continue();report.external.push(r.request().url());return r.abort();});
 if(baseline)await page.route('**/jogo.html?*',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.resolve(root,'../backups/antes-personagens-v614-20261020/jogo.html'))}));
 const response=await page.goto(base+'/jogo.html?v=locomocao-v614-'+Date.now());report.sha256=createHash('sha256').update(await response.body()).digest('hex');
 await page.getByRole('button',{name:'COMEÇAR NOVO JOGO',exact:false}).click();await page.locator('.cs-option[data-gender="f"]').click();await page.locator('#csName').fill('Passadas');await page.locator('#csStartBtn').click();
 await page.evaluate(()=>{
  _pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();isPaused=false;histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;
  currentWeather=null;weatherCooldown=1e8;A11Y.noDeath=true;A11Y.reduceMotion=false;timeOfDay=12;currentSeason='hot';document.activeElement?.blur();
  let arena=null;
  for(let y=120;y<1900&&!arena;y+=80)for(let x=80;x<850&&!arena;x+=80){let valid=true;for(let dy=-50;dy<=50&&valid;dy+=5)for(let dx=-50;dx<=50;dx+=5)if(FarmWorldDepth.isBlocked(x+dx,y+dy,{x:x+dx,y:y+dy})){valid=false;break;}if(valid)arena={x,y};}
  if(!arena)throw Error('Nenhuma área livre de100×100 encontrada no mundo real');
  const TAU=Math.PI*2;const read=()=>({x:player.x,y:player.y,anim:player.anim,phase:((player.anim%TAU)+TAU)%TAU,pose:FarmCharacterArt.locomotionInfo?.(player,{time:window.__visualNow||0}),dir:player.dir,moving:player.moving,running:player.running,
   blend:player.gaitBlend??null,runBlend:player.gaitRunBlend??null,steps:FarmOriginalAudio.state().footsteps.count,action:player.actionTimer});
  const snapshot=()=>{const c=document.createElement('canvas');c.width=112;c.height=112;const g=c.getContext('2d');g.fillStyle='#d7dfc3';g.fillRect(0,0,112,112);g.imageSmoothingEnabled=false;
   g.scale(2,2);FarmCharacterArt.drawPlayer(g,player,{x:28,y:34,time:1000,winter:false});return c.toDataURL();};
  const reset=()=>{for(const k of Object.keys(keys))delete keys[k];player.x=arena.x;player.y=arena.y;player.dir=2;player.anim=0;player.gaitBlend=0;player.gaitRunBlend=0;
   player.moving=false;player.running=false;player.actionTimer=0;player.resting=false;player.dead=false;player.temp=37;player.hyd=100;player.en=100;player.upgrades.boots=0;
   FarmOriginalAudio.resetFootsteps();histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;isPaused=false;_camSnap=true;render();};
  const step=(n,dt)=>{const samples=[];for(let i=0;i<n;i++){const previous=read();window.__visualNow+=dt*1000;update(dt);updateAudioState();const next=read();samples.push({...next,distance:Math.hypot(next.x-previous.x,next.y-previous.y),contact:next.steps>previous.steps});}render();return samples;};
  window.__movement={arena,read,step,reset,snapshot};reset();
 });
 report.arena=await page.evaluate(()=>__movement.arena);
 await key('d');const before=(await step(17)).at(-1);const beforeImage=await page.evaluate(()=>__movement.snapshot());await key('d',false);const stopped=(await step()).at(-1),stopImage=await page.evaluate(()=>__movement.snapshot());
 const settled=(await step(20)).at(-1);await key('d');const resumed=(await step()).at(-1),resumeImage=await page.evaluate(()=>__movement.snapshot());await key('d',false);
 report.samples.stop={before,stopped,settled,resumed};check('Parar conserva fase da passada, sem reiniciar o mesmo pé',Math.abs(stopped.anim-before.anim)<1e-8,report.samples.stop);
 check('Retomar continua fase anterior',resumed.anim>before.anim&&resumed.anim-before.anim<.5,report.samples.stop);
 check('Transição visual assenta gradualmente até repouso',before.blend>.9&&stopped.blend>0&&stopped.blend<before.blend&&settled.blend<.03,report.samples.stop);
 const sheets=[{name:'parada-retomada',frames:[{label:'Último passo',url:beforeImage},{label:'Soltou a tecla',url:stopImage},{label:'Retomou',url:resumeImage}]}];
 await reset();await key('d');const walk=(await step(17)).at(-1);await key('Shift');const run=(await step()).at(-1);await key('Shift',false);const walkAgain=(await step()).at(-1);await key('d',false);
 report.samples.shift={walk,run,walkAgain};check('Shift mistura gesto sem trocar amplitude instantaneamente',run.runBlend>0&&run.runBlend<1&&walkAgain.runBlend>=0&&walkAgain.runBlend<run.runBlend,report.samples.shift);
 await reset();await key('d');await step(15);await key('d',false);await page.evaluate(()=>triggerPlayerAction('water'));const action=(await step(8)).at(-1);check('Ação preserva fase de locomoção enquanto planta os pés',action.anim>0,action);
 const cadence=[];await reset();await key('d');
 for(let block=0;block<8;block++){await key('Shift',block%2===1);const samples=await step(10);cadence.push(...samples.map(s=>({...s,block})));}
 await key('Shift',false);await key('d',false);const contacts=cadence.filter(s=>s.contact).map(s=>({...s,error:Math.min(s.phase%Math.PI,Math.PI-s.phase%Math.PI)}));
 const phaseErrors=cadence.slice(1).map((s,i)=>s.distance>.001&&s.pose?.stridePixels?{block:s.block,error:Math.abs((s.anim-cadence[i].anim)-s.distance*Math.PI*2/s.pose.stridePixels),stride:s.pose.stridePixels}:null).filter(Boolean);check('A fase usa o mesmo comprimento de passada desenhado durante Shift',phaseErrors.length>40&&phaseErrors.every(s=>s.error<1e-6),phaseErrors);
 report.samples.contacts=contacts;check('Contato sonoro acompanha0/π mesmo alternandoShift',contacts.length>=3&&contacts.every(s=>s.error<.35),contacts);
 await reset();await page.evaluate(()=>{player.y=8;player.x=40;player.dir=3;});await key('w');await key('d');const sliding=await step(12);await key('w',false);await key('d',false);
 check('Deslizar na borda acompanha direção do deslocamento real',sliding.at(-1).x>40&&sliding.at(-1).y===8&&sliding.at(-1).dir===2,sliding.at(-1));
 await reset();await page.evaluate(()=>{player.x=8;player.y=120;player.anim=1.5;});await key('a');await key('Shift');const blocked=await step(30);await key('a',false);await key('Shift',false);
 check('Colisão não avança passada nem dispara passos',blocked.every(s=>s.distance===0&&!s.moving&&!s.running&&!s.contact&&Math.abs(s.anim-1.5)<1e-8),blocked.at(-1));
 const rates=[];for(const fps of [30,60,120]){await reset();await key('d');const trace=await step(fps*.6,1/fps);await key('d',false);rates.push({fps,distance:trace.reduce((sum,s)=>sum+s.distance,0),anim:trace.at(-1).anim,contacts:trace.filter(s=>s.contact).length});}
 report.samples.rates=rates;check('Distância e fase são iguais em30/60/120Hz',Math.max(...rates.map(s=>s.distance))-Math.min(...rates.map(s=>s.distance))<1e-6&&Math.max(...rates.map(s=>s.anim))-Math.min(...rates.map(s=>s.anim))<1e-6,rates);
 await reset();await key('d');const straight=await step(20);await key('d',false);await reset();await key('d');await key('s');const diagonal=await step(20);await key('d',false);await key('s',false);
 check('Diagonal não acelera deslocamento nem animação',Math.abs(straight.reduce((s,v)=>s+v.distance,0)-diagonal.reduce((s,v)=>s+v.distance,0))<1e-6&&Math.abs(straight.at(-1).anim-diagonal.at(-1).anim)<1e-6,{straight:straight.at(-1),diagonal:diagonal.at(-1)});
 

 const extended=await page.evaluate(()=>{
  const result=[],check=(name,pass,evidence)=>result.push({name,pass:!!pass,evidence});
  const TAU=Math.PI*2;
  function stable(){return{x:player.x,y:player.y,anim:player.anim,en:player.en,hyd:player.hyd,clock:timeOfDay,action:FarmPlayerActions.info(),animals:scenes.main.objects.filter(o=>o.type==='animal').map(a=>({x:a.x,y:a.y,clock:a.animalClock,well:a.well,phase:a.animalPhase})),npcs:FarmStoryIntegration.navigationState()};}
  __movement.reset();keys.d=true;__movement.step(12,1/60);keys.d=false;
  const prev=stable();FarmWorldMap.open();keys.d=true;keys.shift=true;for(let i=0;i<90;i++){update(1/60);FarmStoryIntegration.update(1/60);}keys.d=false;keys.shift=false;const after=stable();FarmWorldMap.close();
  check('Mapa aberto pausa deslocamento, fase, NPCs, animais e relógio',JSON.stringify(prev)===JSON.stringify(after),{before:prev,after});

  const performed=[];
  function clearAction(){FarmPlayerActions.reset(player);FarmRestVisual.reset();player.resting=false;player.dead=false;player.en=90;player.hyd=70;player.temp=37;A11Y.reduceMotion=false;for(const k in keys)delete keys[k];}
  function recordAction(kind,effect){const pose=FarmPlayerActions.pose(player,currentScene),info=FarmPlayerActions.info();performed.push({kind,effect,active:info?.kind===kind,target:pose.actionTarget,position:{x:player.x,y:player.y}});}
  __movement.reset();let field=null;for(let y=0;y<MH&&!field;y++)for(let x=0;x<MW&&!field;x++)if(map[y][x]===T.FIELD&&!FarmWorldDepth.isBlocked(x*TS+8,y*TS+8))field={x,y};
  if(field){
   player.x=field.x*TS+8;player.y=field.y*TS+8;player.selectedSeed='tomato';player.inv.seeds.tomato=10;setCrop(field.x,field.y,null);clearAction();plantCrop();recordAction('plant',player.inv.seeds.tomato===9&&getCrop(field.x,field.y)?.stage===1);
   clearAction();waterCrop();recordAction('water',getCrop(field.x,field.y)?.water===1);
   clearAction();getCrop(field.x,field.y).stage=3;const veg=player.inv.veg||0;harvestCrop();recordAction('harvest',(player.inv.veg||0)===veg+1&&!getCrop(field.x,field.y));
  }
  clearAction();const pile=objects.find(o=>o.type==='woodpile');player.x=pile.x;player.y=pile.y;const wood=player.inv.wood||0;tryInteract();recordAction('collect',player.inv.wood===wood+1);
  function approach(a){const radius=FarmAnimalLife.contactRadii[a.kind==='cow'?'cow':a.kind==='sheep'?'sheep':'chicken'];for(let d=radius+.3;d<28;d+=1)for(let n=0;n<64;n++){const x=a.x+Math.cos(n*Math.PI/32)*d,y=a.y+Math.sin(n*Math.PI/32)*d;if(!FarmWorldDepth.isBlocked(x,y)&&!FarmAnimalLife.blocksPlayer(x,y,null,objects)){player.x=x;player.y=y;if(reachableAnimal(a))return true;}}return false;}
  clearAction();const cow=objects.find(o=>o.type==='animal'&&o.kind==='cow');if(approach(cow)){cow.well=.4;player.inv.hay=2;const hay=player.inv.hay;careForAnimal('feed',cow);recordAction('feed',cow.well===1&&player.inv.hay===hay-1);clearAction();careForAnimal('pet',cow);recordAction('pet',FarmAnimalLife.snapshot(cow).reaction==='pet');}
  clearAction();const sheep=objects.find(o=>o.type==='animal'&&o.kind==='sheep');currentSeason='cold';if(approach(sheep)){sheep.well=1;sheep.shorn=false;const wool=player.inv.wool||0;careForAnimal('shear',sheep);recordAction('shear',sheep.shorn&&player.inv.wool===wool+1);}currentSeason='hot';
  clearAction();const spot=objects.find(o=>o.type==='fishing_spot');player.x=spot.x-8;player.y=spot.y;spot.fishCooldown=0;const random=Math.random;Math.random=()=>.1;try{handleFishing(spot);}finally{Math.random=random;}recordAction('fish',player.hyd===90&&player.en===100);
  check('Oito interações reais entregam efeito e gesto no alvo da atividade',performed.length===8&&performed.every(r=>r.effect&&r.active&&r.target&&Number.isFinite(r.target.x)&&Number.isFinite(r.target.y)),performed);

  __movement.reset();const phases=[];for(let n=0;n<16;n++){player.anim=(n+.05)*TAU/16;player.moving=true;player.gaitBlend=1;player.gaitRunBlend=0;const p=FarmCharacterArt.locomotionInfo?.(player);if(p)phases.push(p);}
  check('Diagnóstico de locomoção cobre os dezesseis quadros e âncora original',phases.length===16&&phases.every(p=>(p.anchorY??p.feetOffsetY)===10&&p.feet.length===2&&p.feet.every(f=>Number.isFinite(f.x)&&Number.isFinite(f.y))),phases);
  if(phases.length){
   check('Ao andar há apoio em todos os quadros e pé apoiado fica no chão',phases.every(p=>p.feet.some(f=>f.contact)&&p.feet.filter(f=>f.contact).every(f=>Math.abs(f.lift??f.y)<.01)),phases.map(p=>({frame:p.frame,feet:p.feet})));
   const supports=phases.map(p=>p.feet.filter(f=>f.contact).map(f=>f.side));check('Os dois pés alternam o apoio durante o ciclo',new Set(supports.flat()).size===2,supports);
  }
  const visualRows=[];
  const canvas=document.createElement('canvas');canvas.width=200;canvas.height=200;const g=canvas.getContext('2d');
  const digest=()=>{const data=g.getImageData(0,0,200,200).data;let n=2166136261;for(const v of data)n=Math.imul(n^v,16777619)>>>0;return n;};
  for(const gender of ['m','f'])for(const dir of [0,1,2,3])for(const kit of ['leve','inverno']){
   __movement.reset();Object.assign(player,{gender,dir,hat:true,boots:kit==='inverno',coatEquipped:kit==='inverno',glovesEquipped:kit==='inverno',scarf:kit==='inverno',blanketEquipped:false,towelTimer:0,moving:true,gaitBlend:1});
   const hashes=[];for(let i=0;i<16;i++){player.anim=(i+.05)*TAU/16;g.clearRect(0,0,200,200);FarmCharacterArt.drawPlayer(g,player,{x:100,y:120,time:1000});hashes.push(digest());}visualRows.push({gender,dir,kit,distinct:new Set(hashes).size});
  }
  check('Masculino/feminino, quatro vistas e equipamento têm ciclos desenhados',visualRows.every(r=>r.distinct>=10),visualRows);
  const npcs=[];
  for(const id of FarmCharacterArt.keys){
   const actor=scenes.main.objects.find(o=>o.type==='story_npc'&&o.npcId===id);if(!actor){npcs.push({id,missing:true});continue;}
   const mouths=new Set(),gestures=new Set();for(let i=0;i<180;i++){const p=FarmCharacterArt.actingInfo({...actor,npcActivity:'talk',moving:false,gaitBlend:0},{speaking:true,speechTime:i*.05,time:i*50,gesture:'explain',expression:'warm'});mouths.add(p.mouth);gestures.add(p.phase);}
   npcs.push({id,mouths:mouths.size,gestures:gestures.size,stationary:FarmCharacterArt.actingInfo({...actor,moving:false,gaitBlend:0},{speaking:true,gesture:'explain',speechTime:.8}).moving===false});
  }
  check('Nove NPCs preservam identidade, pausas de fala e gestos com pés estáveis',npcs.length===9&&npcs.every(r=>!r.missing&&r.mouths>=3&&r.gestures>=3&&r.stationary),npcs);
  FarmStoryUI.close();__movement.reset();player.x=40;player.y=1000;timeOfDay=7;const navigationBefore=FarmStoryIntegration.navigationState();let movedNPC=false;
  for(let i=0;i<240;i++)FarmStoryIntegration.update(1/60);const navigationAfter=FarmStoryIntegration.navigationState();
  for(let i=0;i<navigationAfter.length;i++)if(Math.hypot(navigationAfter[i].x-navigationBefore[i].x,navigationAfter[i].y-navigationBefore[i].y)>.05)movedNPC=true;
  check('Rotinas dos NPCs ainda percorrem o mapa real',navigationAfter.length===9&&movedNPC&&navigationAfter.every(r=>!FarmWorldDepth.isBlocked(r.x,r.y)),{before:navigationBefore,after:navigationAfter});
  const animals=[];
  for(const kind of ['cow','sheep','chick']){
   const a={type:'animal',kind,x:80,y:80,well:.8},pen={type:'pen',x:0,y:0,w:180,h:180},list=[pen,a],trace=[];
   for(let n=0;n<1100;n++){const x=a.x,y=a.y,phase=a.animalPhase||0;FarmAnimalLife.update(1/60,list,{timeOfDay:11});const distance=Math.hypot(a.x-x,a.y-y);if(a.moving)trace.push({distance,phaseDelta:a.animalPhase-phase,dir:a.dir});}
   const walk=trace.length>10;const before={x:a.x,y:a.y};FarmAnimalLife.react(a,'pet',{x:a.x-24,y:a.y});for(let n=0;n<32;n++)FarmAnimalLife.update(1/60,list,{timeOfDay:11});const pet=FarmAnimalLife.visualState(a),still=before.x===a.x&&before.y===a.y;
   FarmAnimalLife.react(a,'feed',{x:a.x-24,y:a.y});for(let n=0;n<35;n++)FarmAnimalLife.update(1/60,list,{timeOfDay:11});const fed=FarmAnimalLife.visualState(a);
   const reducedStart={x:a.x,y:a.y,phase:a.animalPhase};for(let n=0;n<90;n++)FarmAnimalLife.update(1/60,list,{timeOfDay:11,reducedMotion:true});const reduced=FarmAnimalLife.visualState(a,true);
   animals.push({kind,walk,trace:trace.slice(0,5),pet:{reaction:pet.reaction,heart:pet.heart,still},feed:{reaction:fed.reaction,fed:fed.fed},reduced:{stable:reducedStart.x===a.x&&reducedStart.y===a.y&&reducedStart.phase===a.animalPhase,frame:reduced.frame,tail:reduced.tail,graze:reduced.graze}});
  }
  check('Vaca, ovelha e galinha caminham, recebem carinho e comem sem deslizar durante reação',animals.every(a=>a.walk&&a.pet.reaction==='pet'&&a.pet.heart&&a.pet.still&&a.feed.reaction==='feed'&&a.feed.fed),animals);
  check('Redução de movimento mantém animais estáveis e afeto visível',animals.every(a=>a.reduced.stable&&a.reduced.frame===0&&a.reduced.tail===0&&a.reduced.graze===0),animals);
  __movement.reset();A11Y.reduceMotion=true;keys.d=true;const reducedMove=__movement.step(15,1/60);keys.d=false;const reducedPose=FarmCharacterArt.locomotionInfo?.(player,{reducedMotion:true});A11Y.reduceMotion=false;
  check('Reduzir movimento mantém a locomoção física e congela apenas a passada',reducedMove.at(-1).x>__movement.arena.x&&reducedMove.at(-1).moving&&!!reducedPose&&reducedPose.gait===0,reducedPose);
  const beforeCache=FarmCharacterArt.cacheInfo();
  for(let n=0;n<900;n++){const actor={npcId:FarmCharacterArt.keys[n%9],x:80,y:90,dir:n%4,moving:true,anim:n*.37,gaitBlend:(n%9)/8,gaitRunBlend:(n%9)/8};FarmCharacterArt.drawNPC(g,actor,{time:n*50});}
  const caches={character:FarmCharacterArt.cacheInfo(),animals:FarmAnimalLife.info()};check('Caches permanecem limitados após diversidade de poses',caches.character.sprites<=caches.character.maxSprites&&caches.animals.cache<=caches.animals.maxSprites,{before:beforeCache,after:caches});
  return result;
 });report.checks.push(...extended);

 for(const sheet of sheets){const url=await page.evaluate(async frames=>{const c=document.createElement('canvas');c.width=frames.length*236;c.height=272;const g=c.getContext('2d');g.fillStyle='#d7dfc3';g.fillRect(0,0,c.width,c.height);g.imageSmoothingEnabled=false;g.fillStyle='#203b31';g.font='16px sans-serif';for(let i=0;i<frames.length;i++){const img=new Image();img.src=frames[i].url;await img.decode();g.drawImage(img,i*236,35,224,224);g.fillText(frames[i].label,i*236+10,24);}return c.toDataURL();},sheet.frames);const file='integracao-'+label+'-'+sheet.name+'.png';fs.writeFileSync(path.join(out,file),Buffer.from(url.split(',')[1],'base64'));report.artifacts.push(file);}
 if(process.env.LOCOMOCAO_VIDEO==='1'){
  const movie=await page.evaluate(async()=>{__movement.reset();const canvas=document.getElementById('game'),stream=canvas.captureStream(30),chunks=[],rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:1800000});
   const ended=new Promise(resolve=>rec.onstop=async()=>{const blob=new Blob(chunks,{type:'video/webm'}),reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob);});rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   rec.start();let frame=0;await new Promise(resolve=>{const id=setInterval(()=>{for(const key of ['w','a','s','d','shift'])delete keys[key];if(frame<28)keys.d=true;else if(frame<38){}else if(frame<60){keys.a=true;keys.shift=frame<48;}else if(frame<88)keys.w=true;else if(frame<98){}else if(frame<125){keys.s=true;keys.shift=true;}
    update(1/30);updateAudioState();render();frame++;if(frame>=140){clearInterval(id);resolve();}},1000/30);});rec.stop();const url=await ended;stream.getTracks().forEach(t=>t.stop());return url;});
  const file='integracao-'+label+'-sequencia.webm';fs.writeFileSync(path.join(out,file),Buffer.from(movie.split(',')[1],'base64'));report.artifacts.push(file);
 }
 check('Sem erros JavaScript ou rede externa',!report.errors.length&&!report.external.length,{errors:report.errors,external:report.external});
})().catch(e=>report.fatal=e.stack).finally(async()=>{if(browser)await browser.close();report.status=report.fatal||report.checks.some(c=>!c.pass)?'FALHA':'OK';fs.writeFileSync(path.join(out,'integracao-'+label+'.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks.length,failed:report.checks.filter(c=>!c.pass),fatal:report.fatal,sha256:report.sha256},null,2));if(!baseline&&report.status!=='OK')process.exitCode=1;});
