/* Comparação gráfica das salas e contratos da luz. Edge local, RAF suspenso;
   capturas são do render real. Não mede FPS ou qualidade visual automaticamente. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/interiores-v66'),base=process.env.FARM37_URL||'http://127.0.0.1:8766';
const baseline=process.env.FARM37_BASELINE||path.join(root,'../backups/antes-vida-v66-20261007/jogo.html');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const report={created:new Date().toISOString(),checks:[],errors:[],shots:[],sources:{},baseline:null};
fs.mkdirSync(out,{recursive:true});let browser;
const check=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});assert.ok(pass,name);};
const rooms=[{scene:'house',x:112,y:86,zoom:2},{scene:'barn',x:128,y:86,zoom:2},{scene:'greenhouse',x:248,y:176,zoom:1}];
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});const physical={};
 for(const variant of [fs.existsSync(baseline)?'antes':null,'depois'].filter(Boolean)){
  const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push({variant,message:e.message}));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;let n=246813579;Math.random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);localStorage.setItem('farm37_seen_intro','1');});
  const baselineBytes=variant==='antes'?fs.readFileSync(baseline):null;
  await page.route('**/*',r=>{const url=new URL(r.request().url());if(url.origin!==new URL(base).origin)return r.abort();if(baselineBytes&&url.pathname==='/jogo.html')return r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:baselineBytes});return r.continue();});
  const response=await page.goto(base+'/jogo.html?v=interiores-v66-'+Date.now());report.sources[variant]=sha(await response.body());if(baselineBytes)report.baseline=baseline;
  await page.evaluate(()=>{startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();soundEnabled=false;isPaused=false;histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;FarmStoryUI.close();FarmStoryCinematics.reset();currentWeather=null;weatherCooldown=1e8;A11Y.noDeath=true;A11Y.relaxed=true;A11Y.reduceMotion=true;currentSeason='hot';});
  physical[variant]={};
  for(const room of rooms){
   const state=await page.evaluate(r=>{setSceneTo(r.scene,r.x,r.y);ZOOM=r.zoom;timeOfDay=11;_camSnap=true;player.temp=37;player.en=100;player.hyd=100;player.moving=false;player.running=false;player.gaitBlend=0;player.actionTimer=0;render();const s=scenes[r.scene];return {map:s.map,objects:s.objects,crops:s.crops,spawn:s.spawn,MW:s.MW,MH:s.MH};},room);
   physical[variant][room.scene]=state;
   const file=`interiores-v66-${variant}-${room.scene}.png`,data=await page.evaluate(async name=>{const url=document.getElementById('game').toDataURL('image/png');const r=await fetch('/shot?name='+name,{method:'POST',body:url});if(!r.ok)throw Error('Captura HTTP '+r.status);return url;},file.slice(0,-4));
   fs.writeFileSync(path.join(out,file),Buffer.from(data.split(',')[1],'base64'));report.shots.push({variant,scene:room.scene,file,build:report.sources[variant]});
  }
  if(variant==='depois'){
   const lighting=await page.evaluate(async()=>{
    const saved=ctx,c=document.createElement('canvas');c.width=512;c.height=352;const g=c.getContext('2d');const result=[];
    try{
     ctx=g;
     for(const scene of ['house','barn']){
      setSceneTo(scene);A11Y.reduceMotion=true;timeOfDay=12;
      const draw=()=>{g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,c.width,c.height);drawDynamicLights(0,0,c.width,c.height);return c.toDataURL();};
      const first=draw();await new Promise(r=>setTimeout(r,180));const second=draw();
      result.push({scene,still:first===second,sparksReduced:FarmDynamicLighting.info().sparks});
      A11Y.reduceMotion=false;let max=0;for(let i=0;i<360;i++){draw();max=Math.max(max,FarmDynamicLighting.info().sparks);}
      const pixels=g.getImageData(0,0,c.width,c.height).data;let leaked=0;
      for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if((x<3||x>=MW*TS-3||y>=MH*TS-4)&&pixels[(y*c.width+x)*4+3])leaked++;
      result.at(-1).maxSparks=max;result.at(-1).leakedPixels=leaked;
     }
     setSceneTo('greenhouse');drawDynamicLights(0,0,512,352);result.push({scene:'greenhouse',staleSparks:FarmDynamicLighting.info().sparks});
    }finally{ctx=saved;A11Y.reduceMotion=true;}
    return result;
   });
   check('Luzes estáticas e zero fagulhas com redução de movimento',lighting.filter(s=>s.still!==undefined).every(s=>s.still&&s.sparksReduced===0),lighting);
   check('Luz não atravessa a moldura das salas; partículas limitadas',lighting.filter(s=>s.leakedPixels!==undefined).every(s=>s.leakedPixels===0&&s.maxSparks<40),lighting);
   check('Troca de cena remove fagulhas anteriores',lighting.at(-1).staleSparks===0,lighting.at(-1));
   const caches=await page.evaluate(()=>{
    const snapshot=()=>{const a=FarmWorldArt.state();return {room:FarmInteriorArt.state(),tiles:a.tileSprites,objects:a.objectSprites,bytes:a.cacheBytes};};
    const cycle=()=>{for(const room of ['house','barn','greenhouse']){setSceneTo(room);_camSnap=true;render();}};
    cycle();const before=snapshot();for(let i=0;i<30;i++)cycle();return {before,after:snapshot()};
   });
   check('Caches estabilizam após visitar os três ambientes',JSON.stringify(caches.before)===JSON.stringify(caches.after),caches);
  }
  await context.close();
 }
 if(physical.antes)for(const room of rooms)check('Mapa, objetos, cultivos e entrada preservados: '+room.scene,JSON.stringify(physical.antes[room.scene])===JSON.stringify(physical.depois[room.scene]));
 check('Nenhum erro de JavaScript',report.errors.length===0,report.errors);
 report.pass=true;
})().catch(e=>{report.fatal=e.stack;report.pass=false;process.exitCode=1;}).finally(async()=>{await browser?.close();fs.writeFileSync(path.join(out,'interiores-v66.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
