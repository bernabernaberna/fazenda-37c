/* CPU do loop RAF real: não calcula FPS nem lê pixels durante a medição.
   Contexto novo por cenário. Executar somente com a build final integrada. */
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/otimizacao-v4');
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
 {name:'mapa-aberto',scene:'main',x:380,y:936,zoom:1,mapOpen:true}
];
const report={created:new Date().toISOString(),method:'Contextos descartáveis independentes; loop RAF real com jogo ativo; 40 quadros de aquecimento +180 amostras; tempos CPU via performance.now. Sem getImageData, sem código visual injetado. Não mede GPU, FPS universal ou projetor.',scenes:[],errors:[],external:[],checks:[],gallery:[]};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
fs.mkdirSync(out,{recursive:true});let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});report.browser=browser.version();
 report.sourceHashes=Object.fromEntries(['14-story-world.js','15-story-ui.js','16-story-integration.js','17-world-map.js','18-object-queries.js','19-rest-visual.js','28-character-art.js','29-world-depth.js','31-interior-art.js','32-animal-life.js','70-synth-sfx.js','71-original-audio.js','90-ambient-synth.js'].map(name=>{const file=path.join(root,'src/modules',name);return[name,fs.existsSync(file)?hash(fs.readFileSync(file)):null];}));
 for(const scene of scenes){
  const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});
  try{
   const page=await context.newPage();page.on('pageerror',e=>report.errors.push({scene:scene.name,message:e.message}));
   await page.route('**/*',route=>{const url=route.request().url();if(new URL(url).origin===new URL(base).origin)return route.continue();report.external.push({scene:scene.name,url});return route.abort();});
   await page.addInitScript(()=>localStorage.setItem('farm37_seen_intro','1'));
   const response=await page.goto(base+'/jogo.html?v=render-final-v4-'+Date.now());
   const sha256=hash(await response.body());
   const modules=await page.evaluate(()=>({characters:!!window.FarmCharacterArt,interiors:!!window.FarmInteriorArt,map:!!window.FarmWorldMap,animals:!!window.FarmAnimalLife}));
   if(Object.values(modules).some(v=>!v))throw new Error('Build final incompleta: '+JSON.stringify(modules));
   await page.evaluate(s=>{
    startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();soundEnabled=false;isPaused=false;
    histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;FarmStoryUI.close();
    currentWeather=null;weatherCooldown=1e8;A11Y.noDeath=true;A11Y.relaxed=true;currentSeason='hot';
    setSceneTo(s.scene,s.x,s.y);ZOOM=s.zoom;timeOfDay=s.night?21:11;
    player.temp=37;player.en=100;player.hyd=100;player.moving=false;player.running=false;player.gaitBlend=0;player.gaitRunBlend=0;player.actionTimer=0;_camSnap=true;
    for(const key of Object.keys(keys))delete keys[key];
   },scene);
   if(scene.running){await page.keyboard.down('d');await page.keyboard.down('Shift');}
   if(scene.mapOpen){await page.keyboard.press('g');await page.waitForFunction(()=>FarmWorldMap.isOpen());}
   await page.evaluate(({warm,samples})=>{
    const perf=window.__qaPerf={frame:0,done:false,inMap:false,mapPaints:0,start:{x:player.x,y:player.y},render:[],update:[],mapAll:[],mapTicks:[],loop:[],intervals:[],dt:[],moving:[],hud:0,previous:null};
    const recording=()=>perf.frame>=warm&&perf.frame<warm+samples;
    const r=render,u=update,m=FarmWorldMap.update,l=loop,h=updateBars;updateBars=function(...args){if(recording())perf.hud++;return h.apply(this,args);};FarmObjectQueries.resetMetrics();
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
    return{hudRefreshes:p.hud,hudRefreshHz:p.hud/p.dt.reduce((a,b)=>a+b,0),objectQueries:FarmObjectQueries.info(),render:summary(p.render),update:summary(p.update),mapUpdate:summary(p.mapAll),mapRefreshTicks:summary(p.mapTicks),loopCPU:summary(p.loop),rafInterval:summary(p.intervals),sampledSimulationSeconds:p.dt.reduce((a,b)=>a+b,0),mapRefreshHz:p.mapTicks.length/p.dt.reduce((a,b)=>a+b,0),movingFrames:p.moving.filter(s=>s.moving&&s.running).length,position:{start:p.start,end:{x:player.x,y:player.y}},scene:currentScene,mapOpen:FarmWorldMap.isOpen(),modules:{world:FarmWorldDepth.cacheInfo(),terrain:FarmWorldArt.state(),interior:FarmInteriorArt.state(),characters:FarmCharacterArt.cacheInfo(),animals:FarmAnimalLife.info()},canvas:{width:document.getElementById('game').width,height:document.getElementById('game').height},userAgent:navigator.userAgent};
   });
   // Leitura de captura acontece APÓS o benchmark, e este contexto será fechado.
   const capture='render-final-'+scene.name+'.png';
   const data=await page.evaluate(()=>document.getElementById('game').toDataURL());fs.writeFileSync(path.join(out,capture),Buffer.from(data.split(',')[1],'base64'));
   let uiCapture=null;if(scene.mapOpen){uiCapture='render-final-'+scene.name+'-ui.png';await page.screenshot({path:path.join(out,uiCapture)});}
   if(scene.running){await page.keyboard.up('Shift');await page.keyboard.up('d');}
   report.scenes.push({...scene,...stats,expectedScene:scene.scene,expectedMapOpen:!!scene.mapOpen,sha256,capture,uiCapture});
   console.log(scene.name+': render p95 '+stats.render.p95Ms.toFixed(2)+'ms; update '+(stats.update.p95Ms??'pausado')+'ms; mapa/tick p95 '+(stats.mapRefreshTicks.p95Ms?.toFixed(2)??'ausente')+'ms (max '+(stats.mapRefreshTicks.maxMs?.toFixed(2)??'ausente')+'ms)');
  }finally{await context.close();}
 }
 report.checks.push({name:'Mesma build nas dez cenas',pass:new Set(report.scenes.map(s=>s.sha256)).size===1&&report.scenes.length===10});
 report.checks.push({name:'Cenas e mapa aberto correspondem ao roteiro',pass:report.scenes.every(s=>s.scene===s.expectedScene&&s.mapOpen===s.expectedMapOpen)});
 report.checks.push({name:'180 amostras após40 de aquecimento em cada cena',pass:report.scenes.every(s=>s.render.samples===SAMPLES&&s.loopCPU.samples===SAMPLES&&s.mapUpdate.samples===SAMPLES&&s.update.samples===(s.mapOpen?0:SAMPLES))});
 report.checks.push({name:'CPU p95 do loop abaixo16,67ms neste navegador',pass:report.scenes.every(s=>s.loopCPU.p95Ms<16.67&&s.render.p95Ms<16.67&&(s.update.p95Ms??0)<16.67&&s.mapRefreshTicks.p95Ms<16.67)});
 report.checks.push({name:'Mapa atualiza próximo10Hz, sem refazer em todo RAF',pass:report.scenes.every(s=>s.mapRefreshHz>=7&&s.mapRefreshHz<=13&&s.mapRefreshTicks.samples<s.mapUpdate.samples/2)});
 report.checks.push({name:'Corrida manteve deslocamento real durante a amostragem',pass:report.scenes.find(s=>s.name==='corrida')?.movingFrames>SAMPLES*.9});
 report.checks.push({name:'Sem erros JS ou dependências externas',pass:!report.errors.length&&!report.external.length});
 report.checks.push({name:'HUD próximo10Hz e sem varredura de índices após aquecimento',pass:report.scenes.every(s=>s.hudRefreshHz<11&&s.objectQueries.rebuilds===0)});report.pass=report.checks.every(c=>c.pass);
 if(false){for(const scene of report.scenes.filter(s=>s.gallery)){const target=path.join(root,'site/shots',scene.gallery);fs.copyFileSync(path.join(out,scene.capture),target);report.gallery.push({file:target,sha256:hash(fs.readFileSync(target)),buildSHA256:scene.sha256});}}
})().catch(e=>{report.fatal=e.stack;report.pass=false;process.exitCode=1;}).finally(async()=>{
 await browser?.close();if(!report.pass)process.exitCode=1;
 fs.writeFileSync(path.join(out,'render-final-v4.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,checks:report.checks,errors:report.errors,fatal:report.fatal,gallery:report.gallery},null,2));
});
