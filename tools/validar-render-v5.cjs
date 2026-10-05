/* CPU do loop RAF real: não calcula FPS nem lê pixels durante a medição.
   Contexto novo por cenário. Executar somente com a build final integrada. */
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/desempenho-v6');
const base=process.env.FARM37_URL||'http://127.0.0.1:8766',WARM=40,SAMPLES=180;
const scenes=[
 {name:'fazenda',scene:'main',x:380,y:936,zoom:1,gallery:'site_farm.png'},
 {name:'montanha',scene:'main',x:250,y:310,zoom:1,gallery:'site_mountain.png'},
 {name:'deserto',scene:'main',x:655,y:1770,zoom:1,gallery:'site_desert.png'},
 {name:'fachada',scene:'main',x:168,y:900,zoom:2},
 {name:'noite',scene:'main',x:520,y:264,zoom:2,night:true},
 {name:'casa',scene:'house',x:112,y:86,zoom:2},
 {name:'celeiro',scene:'barn',x:128,y:86,zoom:2},
 {name:'estufa',scene:'greenhouse',x:248,y:176,zoom:1},
 {name:'corrida',scene:'main',x:264,y:952,zoom:2,running:true},
 {name:'mapa-aberto',scene:'main',x:380,y:936,zoom:1,mapOpen:true},
 {name:'conversa',scene:'main',x:264,y:920,zoom:2,dialogue:true},
 {name:'cutscene',scene:'main',x:264,y:920,zoom:2,cinematic:true},
 {name:'obras-fazenda',scene:'main',x:408,y:1070,zoom:2,farmWorks:true},
 {name:'pele',scene:'main',x:380,y:936,zoom:1,skin:true},
 {name:'caderno-saga',scene:'main',x:380,y:936,zoom:1,notebook:true},
 {name:'nova-cena-saga',scene:'main',x:264,y:920,zoom:2,sagaCinema:true}
];
const report={created:new Date().toISOString(),method:'Contextos descartáveis independentes; loop RAF real com jogo ativo; 40 quadros de aquecimento +180 amostras; tempos CPU via performance.now. Sem getImageData, sem código visual injetado. Não mede GPU, FPS universal ou projetor.',scenes:[],errors:[],external:[],checks:[],gallery:[]};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
fs.mkdirSync(out,{recursive:true});let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});report.browser=browser.version();
 report.sourceHashes=Object.fromEntries(['14-story-world.js','15-story-ui.js','16-story-integration.js','17-world-map.js','18-object-queries.js','19-rest-visual.js','28-character-art.js','29-world-depth.js','31-interior-art.js','32-animal-life.js','34-story-cinematics.js','35-valley-saga.js','36-farm-life.js','37-valley-panels.js','38-skin-learning.js','70-synth-sfx.js','71-original-audio.js','90-ambient-synth.js'].map(name=>{const file=path.join(root,'src/modules',name);return[name,fs.existsSync(file)?hash(fs.readFileSync(file)):null];}));
 for(const scene of scenes){
  const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});
  try{
   const page=await context.newPage();page.on('pageerror',e=>report.errors.push({scene:scene.name,message:e.message}));
   await page.route('**/*',route=>{const url=route.request().url();if(new URL(url).origin===new URL(base).origin)return route.continue();report.external.push({scene:scene.name,url});return route.abort();});
   await page.addInitScript(()=>localStorage.setItem('farm37_seen_intro','1'));
   const response=await page.goto(base+'/jogo.html?v=render-final-v6-'+Date.now());
   const sha256=hash(await response.body());
   const modules=await page.evaluate(()=>({characters:!!window.FarmCharacterArt,interiors:!!window.FarmInteriorArt,map:!!window.FarmWorldMap,animals:!!window.FarmAnimalLife,saga:!!window.FarmValleySaga,life:!!window.FarmLife,panels:!!window.FarmValleyPanels,skin:!!window.FarmSkinLearning}));
   if(Object.values(modules).some(v=>!v))throw new Error('Build final incompleta: '+JSON.stringify(modules));
   await page.evaluate(s=>{
    startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();soundEnabled=false;isPaused=false;
    histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;FarmStoryUI.close();FarmStoryIntegration.restore(FarmStoryWorld.serialize());FarmStoryCinematics.reset();
    currentWeather=null;weatherCooldown=1e8;A11Y.noDeath=true;A11Y.relaxed=true;currentSeason='hot';
    if(s.farmWorks){player.coins=1000;Object.assign(player.inv,{wood:100,wool:30,veg:30,hay:30,water:5});for(const d of FarmLife.snapshot().projects){player.x=d.x+16;player.y=d.y+12;const result=FarmLife.build(d.id);if(!result.ok)throw Error('Obra não construída: '+result.message);}}
    if(s.sagaCinema){const state=FarmValleySaga.serialize();state.sequence=100;state.episodes[0]={status:'completed',choice:0,acceptedAt:1,counts:{},paid:true};FarmValleySaga.restore(state);FarmStoryIntegration.restore(FarmStoryWorld.serialize());FarmStoryCinematics.reset();}
    setSceneTo(s.scene,s.x,s.y);ZOOM=s.zoom;timeOfDay=s.night?21:11;
    player.temp=37;player.en=100;player.hyd=100;player.moving=false;player.running=false;player.gaitBlend=0;player.gaitRunBlend=0;player.actionTimer=0;_camSnap=true;
    for(const key of Object.keys(keys))delete keys[key];
    if(s.dialogue){const n=FarmStoryIntegration.read().npcs.find(n=>n.npcId==='rosa');player.x=n.x+15;player.y=n.y;FarmStoryWorld.interact('rosa');}
    if(s.cinematic)FarmStoryCinematics.play('carta',{replay:true});
    if(s.sagaCinema&&!FarmStoryCinematics.play('saga-envelope',{replay:true}))throw Error('Nova cena não abriu depois do episódio completo.');
    if(s.notebook&&!FarmValleyPanels.open('saga'))throw Error('Caderno da saga não abriu.');
   },scene);
   if(scene.running){await page.keyboard.down('d');await page.keyboard.down('Shift');}
   if(scene.mapOpen){await page.keyboard.press('g');await page.waitForFunction(()=>FarmWorldMap.isOpen());}
   if(scene.skin){await page.keyboard.press('h');await page.waitForFunction(()=>skinOpen);}
   const initialMap=await page.evaluate(()=>({undiscovered:FarmLife.snapshot().clues.filter(c=>!c.found).map(c=>c.id),cluePins:FarmWorldMap.snapshot().markers.filter(m=>m.id.startsWith('clue:')).map(m=>m.id),projects:FarmLife.snapshot().projects.map(p=>({id:p.id,built:p.built}))}));
   await page.evaluate(({warm,samples})=>{
    const perf=window.__qaPerf={frame:0,done:false,inMap:false,mapPaints:0,start:{x:player.x,y:player.y},render:[],update:[],mapAll:[],mapTicks:[],loop:[],intervals:[],dt:[],moving:[],hud:0,previous:null,farmSnapshots:0,mapFarmSnapshots:0};
    const recording=()=>perf.frame>=warm&&perf.frame<warm+samples;
    const r=render,u=update,m=FarmWorldMap.update,l=loop,h=updateBars;updateBars=function(...args){if(recording())perf.hud++;return h.apply(this,args);};FarmObjectQueries.resetMetrics();
    const life=FarmLife,lifeSnapshot=life.snapshot;window.FarmLife={...life,snapshot(...args){if(recording()){perf.farmSnapshots++;if(perf.inMap)perf.mapFarmSnapshots++;}return lifeSnapshot.apply(life,args);}};
    // Conta apenas desenhos do mapa durante seu update. Não modifica pixels,
    // tamanho de canvas, frequência do loop ou o trabalho realizado por refresh.
    for(const canvas of [document.querySelector('#worldMapMini canvas'),document.getElementById('worldMapCanvas')]){
     const g=canvas.getContext('2d'),clear=g.clearRect;
     g.clearRect=function(...args){if(perf.inMap)perf.mapPaints++;return clear.apply(this,args);};
    }
    render=function(...args){const t=performance.now();const result=r.apply(this,args);if(recording())perf.render.push(performance.now()-t);return result;};
    update=function(...args){const t=performance.now();const result=u.apply(this,args);if(recording())perf.update.push(performance.now()-t);return result;};
    FarmWorldMap.update=function(dt){const before=perf.mapPaints,t=performance.now();perf.inMap=true;let result;try{result=m.call(this,dt);}finally{perf.inMap=false;}const elapsed=performance.now()-t;if(recording()){perf.mapAll.push(elapsed);perf.dt.push(dt);if(perf.mapPaints>before)perf.mapTicks.push(elapsed);}return result;};
    loop=function(now){const t=performance.now();const result=l(now);if(recording()){perf.loop.push(performance.now()-t);if(perf.previous!==null)perf.intervals.push(now-perf.previous);perf.moving.push({x:player.x,y:player.y,moving:player.moving,running:player.running});}perf.previous=now;perf.frame++;if(perf.frame>=warm+samples)perf.done=true;return result;};
   },{warm:WARM,samples:SAMPLES});
   await page.waitForFunction(()=>window.__qaPerf?.done,null,{timeout:20000});
   const stats=await page.evaluate(()=>{
    const p=__qaPerf,summary=a=>{if(!a.length)return{samples:0,medianMs:null,p95Ms:null,maxMs:null};const sorted=[...a].sort((a,b)=>a-b);return{samples:a.length,medianMs:sorted[Math.floor(a.length*.5)],p95Ms:sorted[Math.floor(a.length*.95)],maxMs:sorted.at(-1)};};
    return{hudRefreshes:p.hud,hudRefreshHz:p.hud/p.dt.reduce((a,b)=>a+b,0),farmSnapshotCalls:p.farmSnapshots,mapFarmSnapshotCalls:p.mapFarmSnapshots,objectQueries:FarmObjectQueries.info(),render:summary(p.render),update:summary(p.update),mapUpdate:summary(p.mapAll),mapRefreshTicks:summary(p.mapTicks),loopCPU:summary(p.loop),rafInterval:summary(p.intervals),sampledSimulationSeconds:p.dt.reduce((a,b)=>a+b,0),mapRefreshHz:p.mapTicks.length/p.dt.reduce((a,b)=>a+b,0),movingFrames:p.moving.filter(s=>s.moving&&s.running).length,position:{start:p.start,end:{x:player.x,y:player.y}},scene:currentScene,mapOpen:FarmWorldMap.isOpen(),cinema:FarmStoryCinematics.info(),dialogue:FarmStoryUI.presentation(),skinOpen,notebook:FarmValleyPanels.snapshot(),saga:{index:FarmValleySaga.snapshot().act.index,completed:FarmValleySaga.snapshot().episodes[0].status==='completed'},modules:{world:FarmWorldDepth.cacheInfo(),terrain:FarmWorldArt.state(),interior:FarmInteriorArt.state(),characters:FarmCharacterArt.cacheInfo(),animals:FarmAnimalLife.info(),farm:FarmLife.cacheInfo()},canvas:{width:document.getElementById('game').width,height:document.getElementById('game').height},userAgent:navigator.userAgent};
   });
   // Leitura de captura acontece APÓS o benchmark, e este contexto será fechado.
   const capture='render-final-'+scene.name+'.png';
   const data=await page.evaluate(()=>document.getElementById('game').toDataURL());fs.writeFileSync(path.join(out,capture),Buffer.from(data.split(',')[1],'base64'));
   let uiCapture=null;if(scene.mapOpen||scene.cinematic||scene.dialogue||scene.skin||scene.notebook||scene.sagaCinema){uiCapture='render-final-'+scene.name+'-ui.png';await page.screenshot({path:path.join(out,uiCapture)});}
   if(scene.running){await page.keyboard.up('Shift');await page.keyboard.up('d');}
   report.scenes.push({...scene,...stats,initialMap,expectedScene:scene.scene,expectedMapOpen:!!scene.mapOpen,expectedPaused:!!(scene.mapOpen||scene.cinematic||scene.dialogue||scene.skin||scene.notebook||scene.sagaCinema),expectedMapVisible:!(scene.cinematic||scene.dialogue||scene.skin||scene.notebook||scene.sagaCinema),sha256,capture,uiCapture});
   console.log(scene.name+': loop p95 '+stats.loopCPU.p95Ms.toFixed(2)+'ms; render p95 '+stats.render.p95Ms.toFixed(2)+'ms; update '+(stats.update.p95Ms??'pausado')+'ms; mapa/tick p95 '+(stats.mapRefreshTicks.p95Ms?.toFixed(2)??'ausente')+'ms (max '+(stats.mapRefreshTicks.maxMs?.toFixed(2)??'ausente')+'ms); snapshots mapa '+stats.mapFarmSnapshotCalls);
  }finally{await context.close();}
 }
 report.checks.push({name:'Mesma build nos dezesseis cenários',pass:new Set(report.scenes.map(s=>s.sha256)).size===1&&report.scenes.length===16});
 report.checks.push({name:'Cenas e mapa aberto correspondem ao roteiro',pass:report.scenes.every(s=>s.scene===s.expectedScene&&s.mapOpen===s.expectedMapOpen)});
 report.checks.push({name:'180 amostras após40 de aquecimento em cada cena',pass:report.scenes.every(s=>s.render.samples===SAMPLES&&s.loopCPU.samples===SAMPLES&&s.mapUpdate.samples===SAMPLES&&s.update.samples===(s.expectedPaused?0:SAMPLES))});
 report.checks.push({name:'CPU p95 do loop abaixo16,67ms neste navegador',pass:report.scenes.every(s=>s.loopCPU.p95Ms<16.67&&s.render.p95Ms<16.67&&(s.update.p95Ms??0)<16.67&&s.mapRefreshTicks.p95Ms<16.67)});
 report.checks.push({name:'Mapa visível atualiza próximo10Hz; mapa oculto nas leituras não redesenha',pass:report.scenes.every(s=>!s.expectedMapVisible?s.mapRefreshTicks.samples===0:s.mapRefreshHz>=7&&s.mapRefreshHz<=13&&s.mapRefreshTicks.samples<s.mapUpdate.samples/2)});
 report.checks.push({name:'Conversa e cutscene ficaram abertas durante medição',pass:report.scenes.find(s=>s.name==='conversa')?.dialogue?.total>0&&report.scenes.find(s=>s.name==='cutscene')?.cinema.open});
 report.checks.push({name:'Pele, caderno e nova cena medidos realmente abertos',pass:report.scenes.find(s=>s.name==='pele')?.skinOpen&&report.scenes.find(s=>s.name==='caderno-saga')?.notebook.open&&report.scenes.find(s=>s.name==='nova-cena-saga')?.cinema.id==='saga-envelope'&&report.scenes.find(s=>s.name==='nova-cena-saga')?.saga.completed});
 report.checks.push({name:'Quatro obras reais construídas no cenário da fazenda',pass:report.scenes.find(s=>s.name==='obras-fazenda')?.initialMap.projects.every(p=>p.built)});
 report.checks.push({name:'Pistas desconhecidas não aparecem nos pinos do mapa',pass:report.scenes.every(s=>s.initialMap.undiscovered.length===7&&s.initialMap.cluePins.length===0)});
 report.checks.push({name:'Pinos usam locais cacheados sem clonar FarmLife por quadro',pass:report.scenes.every(s=>s.mapFarmSnapshotCalls===0)});
 report.checks.push({name:'Corrida manteve deslocamento real durante a amostragem',pass:report.scenes.find(s=>s.name==='corrida')?.movingFrames>SAMPLES*.9});
 report.checks.push({name:'Sem erros JS ou dependências externas',pass:!report.errors.length&&!report.external.length});
 report.checks.push({name:'HUD próximo10Hz e sem varredura de índices após aquecimento',pass:report.scenes.every(s=>s.hudRefreshHz<11&&s.objectQueries.rebuilds===0)});report.pass=report.checks.every(c=>c.pass);
 if(false){for(const scene of report.scenes.filter(s=>s.gallery)){const target=path.join(root,'site/shots',scene.gallery);fs.copyFileSync(path.join(out,scene.capture),target);report.gallery.push({file:target,sha256:hash(fs.readFileSync(target)),buildSHA256:scene.sha256});}}
})().catch(e=>{report.fatal=e.stack;report.pass=false;process.exitCode=1;}).finally(async()=>{
 await browser?.close();if(!report.pass)process.exitCode=1;
 fs.writeFileSync(path.join(out,'render-final-v6.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,checks:report.checks,errors:report.errors,fatal:report.fatal,gallery:report.gallery},null,2));
});
