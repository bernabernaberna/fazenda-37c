/* Compatibilidade da expansão: compara a faixa completa de96×124 com o
   HTML publicado anterior. O modo --vm cobre apenas narrativa e ambiência.
   O percurso usa colisão real em segmentos de4px, sem teleporte entre áreas. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/compat-expansao-v612');
const baseline=process.env.FARM37_V612_BASELINE||path.resolve(root,'../backups/antes-expansao-v612-20261020/jogo.html');
const base=process.env.FARM37_URL||'http://127.0.0.1:8766',onlyVM=process.argv.includes('--vm');
const report={created:new Date().toISOString(),mode:onlyVM?'VM':'VM e navegador',checks:[],versions:[],captures:[],errors:[],limits:['A preparação posiciona o jogador para validar mapa, save e enquadramento. A conectividade é calculada com colisão física; não substitui uma sessão humana longa.','A ambiência é validada por composição e limites de ganho. Não representa avaliação auditiva humana.']};
let browser,page;fs.mkdirSync(out,{recursive:true});
const copy=x=>JSON.parse(JSON.stringify(x));
const hash=x=>crypto.createHash('sha256').update(Buffer.isBuffer(x)||typeof x==='string'?x:JSON.stringify(x)).digest('hex');
function check(name,pass,evidence){report.checks.push({name,pass:!!pass,...(evidence===undefined?{}:{evidence})});assert.ok(pass,name);}
function moduleVM(files){const env={window:{},console,setTimeout,clearTimeout};vm.createContext(env);for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),env,{filename:file});return env.window;}
function pureChecks(){
 const folder=path.join(root,'src/modules'),priorFolder=path.join(path.dirname(baseline),'src/modules');
 const current=moduleVM(['14-story-world.js','44-frontier-story.js','48-village-stories.js'].map(f=>path.join(folder,f)));
 const context={region:'farm',season:'hot',scene:'main',timeOfDay:12,active:true,paused:false};
 const stores=[current.FarmStoryWorld,current.FarmFrontierStory,current.FarmVillageStories];
 for(const api of stores)api.init({readState:()=>context});
 const states=[];
 for(const region of ['highlands','meadow','coast']){context.region=region;for(const api of stores)api.update(.1,context);states.push({region,stored:stores.map(api=>api.serialize().lastRegion)});}
 check('Regiões novas não se transformam em visitas falsas à fazenda',states.every(r=>r.stored.every(id=>id===r.region)),states);
 const before=moduleVM([path.join(priorFolder,'90-ambient-synth.js')]).AmbientSynth;
 const after=moduleVM([path.join(folder,'90-ambient-synth.js')]).AmbientSynth;
 let compared=0;
 for(const region of ['farm','mountain','desert','forest','wetland'])for(const cold of [false,true])for(const resting of [false,true])for(const timeOfDay of [5,8,12,17,22])for(const paused of [false,true]){
  const options={weights:[[region,1]],cold,resting,timeOfDay,paused,riverProximity:.6,fireVolume:.3,heatStress:.4};
  assert.deepEqual(copy(after.mixScene(options)),copy(before.mixScene(options)));compared++;
 }
 check('Ambiência das cinco regiões anteriores permanece idêntica',compared===200,{compared});
 const mixes=[];
 for(const region of ['highlands','meadow','coast'])for(const cold of [false,true])for(const resting of [false,true])for(const timeOfDay of [8,12,22]){
  const options={weights:[[region,1]],cold,resting,timeOfDay,riverProximity:.6};
  const mix=after.mixScene(options),levels=[...Object.values(mix.loops),mix.river,mix.crickets];
  assert.ok(levels.every(v=>Number.isFinite(v)&&v>=0&&v<=1));assert.ok(levels.some(v=>v>0));assert.equal(mix.music.region,region);
  const paused=after.mixScene({...options,paused:true});assert.ok([...Object.values(paused.loops),paused.river,paused.crickets].every(v=>v===0));
  mixes.push({region,cold,resting,timeOfDay,mix});
 }
 check('Novos ambientes têm ganhos finitos, identidade própria e silêncio durante pausa',new Set(mixes.filter(m=>!m.cold&&!m.resting&&m.timeOfDay===12).map(m=>hash(m.mix))).size===3,{combinations:mixes.length});
 const endpoints=['forest','highlands','meadow','coast'];let blended=0;
 for(let i=1;i<endpoints.length;i++){
  const options={timeOfDay:12,cold:false,riverProximity:.5},a=after.mixScene({...options,weights:[[endpoints[i-1],1]]}),b=after.mixScene({...options,weights:[[endpoints[i],1]]}),middle=after.mixScene({...options,weights:[[endpoints[i-1],.5],[endpoints[i],.5]]});
  for(const key of Object.keys(a.loops))assert.ok(Math.abs(middle.loops[key]-(a.loops[key]+b.loops[key])/2)<1e-12);
  for(const key of ['river','crickets'])assert.ok(Math.abs(middle[key]-(a[key]+b[key])/2)<1e-12);blended++;
 }
 check('Misturas sonoras interpolam sem saltos entre os biomas',blended===3,{boundaries:blended});
}
async function prepare(){await page.evaluate(()=>{startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();FarmStoryCinematics.close();FarmValleyPanels.close(false);FarmAnimalCare.close();FarmWorldMap.close();isPaused=false;histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;currentWeather=null;weatherCooldown=1e9;A11Y.noDeath=true;A11Y.relaxed=true;A11Y.reduceMotion=true;soundEnabled=false;});}
async function browserChecks(){
 const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 assert.ok(fs.existsSync(baseline),'Backup V6.11 obrigatório: '+baseline);
 browser=await chromium.launch({channel:'msedge',headless:true});report.browser=browser.version();
 let oldSnapshot,oldSave;
 for(const variant of ['before','after']){
  const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});page=await context.newPage();
  page.on('pageerror',error=>report.errors.push({variant,message:error.message}));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;let seed=246813579;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);localStorage.setItem('farm37_seen_intro','1');});
  const bytes=variant==='before'?fs.readFileSync(baseline):null;
  await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==new URL(base).origin)return route.abort();if(bytes&&url.pathname==='/jogo.html')return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:bytes});return route.continue();});
  const response=await page.goto(base+'/jogo.html?v=compat-v612-'+variant+'-'+Date.now());assert.ok(response.ok());const body=await response.body();report.versions.push({variant,sha256:hash(body)});await prepare();
  const snapshot=await page.evaluate(()=>({width:scenes.main.MW,height:scenes.main.MH,map:scenes.main.map.map(row=>row.slice(0,96)),objects:scenes.main.objects.filter(o=>o.x<96*TS).map(o=>Object.fromEntries(['type','kind','npcId','x','y','w','h','stateId','shadeR','s','landmarkId'].filter(k=>k in o).map(k=>[k,o[k]]))),crops:scenes.main.crops,weights:Array.from({length:124},(_,y)=>Array.from({length:13},(_,n)=>regionWeights(y,n===12?95.99:n*8)))}));
  if(variant==='before'){
   oldSnapshot=snapshot;oldSave=await page.evaluate(()=>{player.coins=237;const sheep=objects.filter(o=>o.type==='animal'&&o.kind==='sheep');sheep.forEach((o,i)=>{o.shorn=i%2===0;o.well=.3+i*.2;o.woolGrowth=o.shorn?23:0;});const fire=objects.find(o=>o.type==='mtn_fire');if(fire){fire.lit=false;fire.fuel=123;}saveGame(true);return JSON.parse(localStorage.getItem(SAVE_KEY));});await context.close();continue;
  }
  report.oldWorld={beforeHash:hash(oldSnapshot.map),afterHash:hash(snapshot.map),columns:96,rows:124};
  check('Todos os96×124 tiles anteriores são preservados exatamente',oldSnapshot.width===96&&snapshot.width===144&&snapshot.height===124&&hash(oldSnapshot.map)===hash(snapshot.map),report.oldWorld);
  check('Objetos, portas, moradores e cultivos anteriores conservam identidade e posição',hash(oldSnapshot.objects)===hash(snapshot.objects)&&hash(oldSnapshot.crops)===hash(snapshot.crops),{objectsBefore:oldSnapshot.objects.length,objectsAfter:snapshot.objects.length});
  check('Gradiente térmico de toda a faixa antiga continua idêntico',hash(oldSnapshot.weights)===hash(snapshot.weights));
  const geometry=await page.evaluate(()=>{
   const main=scenes.main,world=window.FarmExpeditionWorld;if(!world)throw Error('FarmExpeditionWorld ausente');
   const previous={map:main.map,count:main.objects.length};world.expand(main);const idempotent=previous.map===main.map&&previous.count===main.objects.length;
   const width=main.MW,height=main.MH,seen=new Int32Array(width*height).fill(-1),queue=new Int32Array(width*height),start=59*width+24;seen[start]=start;queue[0]=start;let head=0,tail=1;
   const blocked=(x,y)=>FarmWorldDepth.isBlocked(x,y)||[T.FENCE,T.WATER,T.RIVER,T.OASIS].includes(main.map[Math.floor(y/TS)]?.[Math.floor(x/TS)]);
   while(head<tail){const from=queue[head++],x=from%width,y=Math.floor(from/width);for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){
    const nx=x+dx,ny=y+dy,k=ny*width+nx;if(nx<0||ny<0||nx>=width||ny>=height||seen[k]!==-1)continue;let clear=true;
    for(let i=1;i<=4;i++)if(blocked(x*TS+8+dx*i*4,y*TS+8+dy*i*4)){clear=false;break;}
    if(clear){seen[k]=from;queue[tail++]=k;}
   }}
   const paths=world.landmarks.map(point=>{
    const marker=main.objects.find(o=>o.x===point.x&&o.y===point.y),volume=marker&&FarmWorldDepth.footprint(marker);
    const inMarker=(x,y)=>volume&&x>volume.x&&x<volume.x+volume.w&&y+7>volume.y&&y+7<volume.y+volume.h;
    let approach=null;for(let dy=-24;dy<=24&&!approach;dy+=4)for(let dx=-24;dx<=24;dx+=4){const distance=Math.hypot(dx,dy),x=point.x+dx,y=point.y+dy;if(distance>=26||distance<4||blocked(x,y))continue;const tx=Math.floor(x/TS),ty=Math.floor(y/TS),k=ty*width+tx;if(seen[k]<0)continue;let clear=true;
     for(let s=1,n=Math.max(1,Math.ceil(distance/2));s<=n;s++){const sx=x+(point.x-x)*s/n,sy=y+(point.y-y)*s/n,tile=main.map[Math.floor(sy/TS)]?.[Math.floor(sx/TS)];if([T.FENCE,T.WATER,T.RIVER,T.OASIS].includes(tile)||(FarmWorldDepth.isBlocked(sx,sy)&&!inMarker(sx,sy))){clear=false;break;}}
     if(clear){let count=0,index=k;while(seen[index]!==index&&count<width*height){index=seen[index];count++;}approach={x,y,distance,steps:count};break;}
    }return{id:point.id,region:point.region,x:point.x,y:point.y,approach};
   });
   let weightError=0,maxStep=0,invalid=0;const boundaries=[];
   for(let y=0;y<height;y+=.5)for(let x=95;x<width;x+=.5){const a=regionWeights(y,x),b=regionWeights(y,x+.01),dict=Object.fromEntries(a),other=Object.fromEntries(b);weightError=Math.max(weightError,Math.abs(a.reduce((sum,[,w])=>sum+w,0)-1));for(const id of new Set([...Object.keys(dict),...Object.keys(other)])){const delta=Math.abs((dict[id]||0)-(other[id]||0));if(!Number.isFinite(delta))invalid++;maxStep=Math.max(maxStep,delta);}}
   const thermal=Object.values(world.regions).map(region=>{const point=world.landmarks.find(p=>p.region===region.id)||{x:region.mapX*TS+8,y:region.mapY*TS+8};player.x=point.x;player.y=point.y;return{id:region.id,current:currentRegion(),weights:regionWeights(player.y/TS,player.x/TS),zone:getZoneThermal()};});
   for(let y=0;y<height;y+=.5){const a=Object.fromEntries(regionWeights(y,95.99)),b=Object.fromEntries(regionWeights(y,96));for(const id of new Set([...Object.keys(a),...Object.keys(b)]))maxStep=Math.max(maxStep,Math.abs((a[id]||0)-(b[id]||0)));}
   for(const y of [28,58,60,82,109])boundaries.push({y,weights:[95.99,96,96.01,100,104].map(x=>({x,weights:regionWeights(y,x)}))});
   return{width,height,idempotent,landmarks:world.landmarks,regions:world.regions,paths,reachedTiles:tail,weightError,maxStep,invalid,boundaries,thermal};
  });report.geometry=geometry;
  check('Expansão144×124 é idempotente e mantém os três novos biomas',geometry.width===144&&geometry.height===124&&geometry.idempotent&&['highlands','meadow','coast'].every(id=>geometry.regions[id]),{width:geometry.width,height:geometry.height,idempotent:geometry.idempotent});
  check('Todos os nove lugares novos têm aproximação física por E desde a fazenda',geometry.paths.length===9&&geometry.paths.every(p=>p.approach),geometry.paths);
  check('Mistura térmica nova é normalizada e contínua',geometry.weightError<1e-9&&geometry.maxStep<.008&&geometry.invalid===0,{error:geometry.weightError,step:geometry.maxStep,invalid:geometry.invalid});
  check('Biomas novos têm identidade e efeitos térmicos finitos',geometry.thermal.every(t=>t.current===t.id&&['tempDelta','hydDelta','sweatBoost'].every(key=>Number.isFinite(t.zone[key]))),geometry.thermal);
  const saved=await page.evaluate(({data,point})=>{
   const loaded=loadGameFromData(data);const checkOld={loaded,position:player.x===data.player.x&&player.y===data.player.y,coins:player.coins===data.player.coins,crops:JSON.stringify(crops)===JSON.stringify(data.crops)};
   const oldStates=new Map(data.objects.map(o=>[o.stateId,o])),matches=keyedObjectStates(objects).filter(({o})=>o.type==='animal'||o.type==='mtn_fire').map(({o,key})=>{const old=oldStates.get(key);return !old||o.type==='animal'?(old?!!o.shorn===!!old.shorn&&Math.abs(o.well-old.well)<1e-12&&o.woolGrowth===old.woolGrowth:true):!!o.lit===!!old.lit&&o.fuel===old.fuel;});
   setSceneTo('main',point.x,point.y);player.coins=391;saveGame(true);const save=JSON.parse(localStorage.getItem(SAVE_KEY));player.x=384;player.y=944;player.coins=0;const resumed=loadGameFromData(save);
   const result={old:checkOld,objectStates:matches.every(Boolean),resumed,position:player.x===point.x&&player.y===point.y,coins:player.coins===391,version:save.version,states:Object.keys(save).filter(k=>/Story|Stories|Saga|Cinematics|storyWorld/.test(k)),newStories:JSON.stringify(save.expeditionStory||null)};
   result.noExtraReward=loadGameFromData(save)&&player.coins===391;return result;
  },{data:oldSave,point:geometry.paths.at(-1).approach});
  check('Save V6.11 conserva posição, dinheiro, cultivos, ovelhas e fogo',Object.values(saved.old).every(Boolean)&&saved.objectStates,saved);
  check('Posição nova persiste no savev2 e carregar novamente não paga recompensas',saved.resumed&&saved.position&&saved.coins&&saved.version===2&&saved.noExtraReward,saved);
  await page.evaluate(()=>FarmValleyPanels.open('journal'));const blank=await page.evaluate(()=>({clues:FarmExpeditionStory.snapshot().clues.length,text:document.querySelector('#valleyNotebook .v6-body').innerText}));
  check('Caderno inicial não inventa lugares descobertos',blank.clues===0&&!blank.text.includes('Lugares encontrados na expedição'),blank);await page.keyboard.press('Escape');
  for(const target of geometry.paths){
   const coins=await page.evaluate(p=>{FarmStoryUI.close();FarmValleyPanels.close(false);FarmWorldMap.close();setSceneTo('main',p.x,p.y);player.resting=false;player.temp=37;player.hyd=100;player.en=100;document.getElementById('game').focus();snapCamera();render();return player.coins;},target.approach);
   await page.keyboard.press('e');const dialogue=await page.evaluate(id=>({dialogue:FarmStoryWorld.currentDialogue(),clues:FarmExpeditionStory.snapshot().clues.map(c=>c.id),coins:player.coins}),target.id);
   check('E alcança e registra a observação de '+target.id,dialogue.dialogue?.kind==='expedition'&&dialogue.dialogue.npcId==='player'&&dialogue.clues.includes(target.id)&&dialogue.coins===coins,dialogue);
   if(target.id==='exp_observatory'){
    await page.locator('[data-vale-choice="expedition:survey:exp_observatory:compare"]').click();
    const observation=await page.evaluate(()=>FarmExpeditionStory.snapshot().surveys.exp_observatory);
    check('Comparação no lugar registra método e cooldown real',observation.rounds===1&&observation.lastMethod==='compare'&&observation.cooldown===90,observation);
   }
   await page.keyboard.press('Escape');
  }
  const recovered=await page.evaluate(()=>{saveGame(true);const save=JSON.parse(localStorage.getItem(SAVE_KEY)),before=FarmExpeditionStory.serialize(),coins=player.coins;FarmExpeditionStory.reset();const loaded=loadGameFromData(save);return{loaded,before,after:FarmExpeditionStory.serialize(),coins,afterCoins:player.coins};});
  check('Nove descobertas e comparação persistem sem pagar ao carregar',recovered.loaded&&recovered.before.clues.length===9&&hash(recovered.before)===hash(recovered.after)&&recovered.coins===recovered.afterCoins,recovered);
  await page.evaluate(()=>FarmValleyPanels.open('saga'));const summary=await page.evaluate(()=>({text:document.querySelector('#valleyNotebook .v6-body').innerText,remote:Array.from(document.querySelectorAll('#valleyNotebook [data-valley-action]')).filter(b=>/expedition:.*(?:accept|claim)/.test(b.dataset.valleyAction)).length}));
  check('História apresenta as três expedições sem aceite ou entrega remotos',['A carta que seguiu adiante','A água entre duas datas','Quem esperava no último marco'].every(title=>summary.text.includes(title))&&summary.remote===0,summary);await page.keyboard.press('Escape');
  await page.evaluate(()=>FarmValleyPanels.open('people'));const people=await page.evaluate(()=>({text:document.querySelector('#valleyNotebook .v6-body').innerText,leaders:['rosa','lia','ines'].map(id=>({id,text:document.querySelector('[data-valley-item="person:'+id+'"]').innerText}))}));
  check('Cards de Rosa, Lia e Inês incluem as expedições correspondentes',people.leaders.every((item,index)=>item.text.includes(['A carta que seguiu adiante','A água entre duas datas','Quem esperava no último marco'][index])),people.leaders);await page.keyboard.press('Escape');
  await page.evaluate(()=>FarmValleyPanels.open('journal'));const journal=await page.evaluate(()=>({text:document.querySelector('#valleyNotebook .v6-body').innerText,places:document.querySelector('#valleyNotebook .v6-body .v6-card')?.querySelectorAll('details').length,markup:document.querySelector('#valleyNotebook .v6-body').textContent}));
  check('Caderno mostra só as nove descobertas reais e a comparação realizada',journal.places===9&&journal.markup.includes('1 observação registrada')&&!journal.markup.includes('Expedições do vale · player'),journal);const journalShot=path.join(out,'caderno-expedicoes.png');await page.screenshot({path:journalShot});report.captures.push({file:journalShot,region:'caderno',width:1280,height:800});await page.keyboard.press('Escape');
  const mapTargets=await page.evaluate(()=>FarmExpeditionWorld.landmarks.map(p=>{setSceneTo('main',p.x-16,p.y);FarmWorldMap.invalidate();const info=FarmWorldMap.snapshot(),id='place:'+p.id,selected=FarmWorldMap.setDestination(id),destination=FarmWorldMap.snapshot().destination;return{id,region:info.region,listed:info.markers.some(m=>m.id===id),selected,destination};}));
  check('Minimapa e mapa completo incluem todos os novos destinos e regiões',mapTargets.every(t=>t.listed&&t.selected&&t.destination&&['highlands','meadow','coast'].includes(t.region)),mapTargets);
  for(const [width,height]of [[1280,800],[1024,640],[390,844]]){
   await page.setViewportSize({width,height});
   for(const region of ['highlands','meadow','coast']){
    const destination=geometry.paths.find(p=>p.region===region)?.approach;assert.ok(destination,'Ponto de aproximação para '+region);
    await page.evaluate(({x,y})=>{FarmWorldMap.close();FarmWorldMap.clearDestination();FarmStoryUI.close();FarmValleyPanels.close(false);FarmStoryCinematics.close();setSceneTo('main',x,y);currentSeason='hot';timeOfDay=12;ZOOM=2;_camSnap=true;A11Y.reduceMotion=true;player.temp=37;player.hyd=100;player.en=100;player.resting=false;player.moving=false;resize();updateBars(false);for(let i=0;i<5;i++)render();FarmWorldMap.draw();},destination);
    const file=path.join(out,region+'-'+width+'x'+height+'.png');await page.screenshot({path:file});report.captures.push({file,region,width,height});
   }
   await page.evaluate(()=>FarmWorldMap.open());
   const dimensions=await page.evaluate(()=>{const c=document.getElementById('worldMapCanvas'),b=c.getBoundingClientRect();return{width:c.width,height:c.height,shownWidth:b.width,shownHeight:b.height,viewportWidth:innerWidth,viewportHeight:innerHeight};});
   check('Mapa completo tem proporção e enquadramento em '+width+'×'+height,dimensions.width===600&&dimensions.height===517&&Math.abs(dimensions.shownWidth/dimensions.shownHeight-144/124)<.015&&dimensions.shownWidth<=width-20,dimensions);
   const file=path.join(out,'mapa-'+width+'x'+height+'.png');await page.screenshot({path:file});report.captures.push({file,width,height,region:'mapa'});await page.evaluate(()=>FarmWorldMap.close());
  }
  const cache=await page.evaluate(points=>{
   A11Y.reduceMotion=false;const sample=()=>({art:FarmWorldArt.state(),water:FarmWaterLife.info(),depth:FarmWorldDepth.cacheInfo(),expedition:FarmExpeditionWorld.artInfo()});
   for(const season of ['hot','cold']){currentSeason=season;invalidateTileCache();for(const point of points){setSceneTo('main',point.x,point.y);snapCamera();render();}}
   const before=sample();for(let n=0;n<15;n++)for(const point of points){setSceneTo('main',point.x,point.y);snapCamera();render();}const after=sample();return{before,after,tileCache:{width:_tileCache.width,height:_tileCache.height}};
  },geometry.paths.map(p=>p.approach));report.cache=cache;
  check('Cache do mundo usa a nova largura sem ampliar efeitos dinâmicos',cache.tileCache.width===144*16*3&&cache.tileCache.height===124*16*3&&cache.after.water.groups<=96&&cache.after.water.anchors<=64&&cache.after.expedition.sprites<=cache.after.expedition.maxSprites,cache);
  check('Caches aquecidos estabilizam ao percorrer repetidamente a expansão',cache.before.art.tileSprites===cache.after.art.tileSprites&&cache.before.art.objectSprites===cache.after.art.objectSprites&&cache.before.water.tileMasks===cache.after.water.tileMasks&&cache.before.depth.sprites===cache.after.depth.sprites&&cache.before.expedition.sprites===cache.after.expedition.sprites,cache);
  await context.close();
 }
 check('Nenhum erro JavaScript na comparação',report.errors.length===0,report.errors);
}
(async()=>{pureChecks();if(!onlyVM)await browserChecks();report.pass=true;})().catch(error=>{report.pass=false;report.fatal=error.stack;process.exitCode=1;}).finally(async()=>{await browser?.close();fs.writeFileSync(path.join(out,onlyVM?'vm.json':'compat.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,checks:report.checks.length,failed:report.checks.filter(c=>!c.pass),fatal:report.fatal,captures:report.captures.length},null,2));});
