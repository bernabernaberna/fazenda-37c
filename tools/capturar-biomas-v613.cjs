/* Capturas pareadas dos oito biomas. Não modifica a simulação ou a arte:
   fixa relógio/semente, pausa RAF e usa o HTML anterior por rota local. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/biomas-v613'),base=process.env.FARM37_URL||'http://127.0.0.1:8766';
const baseline=process.env.FARM37_V613_BASELINE||path.resolve(root,'../backups/antes-graficos-v613-20261020/jogo.html');
const places=[{id:'farm',x:380,y:936},{id:'mountain',x:250,y:310},{id:'desert',x:655,y:1770},{id:'forest',x:1240,y:584},{id:'wetland',x:1352,y:1560},{id:'highlands',x:1800,y:408},{id:'meadow',x:1784,y:952},{id:'coast',x:2088,y:1688}];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const report={created:new Date().toISOString(),method:'Edge real; versões pareadas, mesmo RNG/RAF/relógio, canvas e enquadramentos reais. Inspeção visual independente das asserções.',versions:[],captures:[],errors:[],motion:[]};
const afterOnly=process.argv.includes('--after');
if(afterOnly){const previous=JSON.parse(fs.readFileSync(path.join(out,'capturas.json'),'utf8'));for(const key of ['versions','captures','errors','motion'])report[key]=previous[key].filter(item=>item.variant==='antes');}
fs.mkdirSync(out,{recursive:true});let browser;
(async()=>{
 if(!fs.existsSync(baseline))throw Error('Backup anterior obrigatório: '+baseline);
 browser=await chromium.launch({channel:'msedge',headless:true});report.browser=browser.version();
 for(const variant of (afterOnly?['depois']:['antes','depois'])){
  const folder=path.join(out,variant);fs.mkdirSync(folder,{recursive:true});
  const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1}),page=await context.newPage();
  try{
   page.on('pageerror',e=>report.errors.push({variant,message:e.message}));
   await page.addInitScript(()=>{requestAnimationFrame=()=>0;window.__visualNow=0;Object.defineProperty(performance,'now',{value:()=>window.__visualNow});Date.now=()=>1792490000000;let seed=246813579;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);localStorage.setItem('farm37_seen_intro','1');});
   const bytes=variant==='antes'?fs.readFileSync(baseline):null;
   await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==new URL(base).origin)return route.abort();if(bytes&&u.pathname==='/jogo.html')return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:bytes});return route.continue();});
   const response=await page.goto(base+'/jogo.html?v=biomas-v613-'+variant+'-'+Date.now());if(!response.ok())throw Error('HTML não servido');report.versions.push({variant,sha256:hash(await response.body())});
   await page.evaluate(()=>{showAchievementToast=()=>{};startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();FarmStoryCinematics.close();FarmStoryCinematics.reset();FarmValleyPanels.close(false);FarmAnimalCare.close();FarmWorldMap.close();soundEnabled=false;histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;isPaused=false;currentWeather=null;weatherCooldown=1e9;A11Y.noDeath=true;A11Y.relaxed=true;document.body.classList.add('hud-game');});
   async function scene(place,hour=12,reduced=false,clock=2400){return page.evaluate(({place,hour,reduced,clock})=>{
    FarmWorldMap.close();FarmStoryUI.close();FarmValleyPanels.close(false);FarmAnimalCare.close();
    const candidates=[[place.x,place.y]];for(let r=4;r<=48;r+=4)for(const [dx,dy]of [[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]])candidates.push([place.x+dx*r,place.y+dy*r]);
    const p=candidates.find(([x,y])=>!FarmWorldDepth.isBlocked(x,y)&&![T.FENCE,T.WATER,T.RIVER,T.OASIS].includes(scenes.main.map[Math.floor(y/TS)]?.[Math.floor(x/TS)]));if(!p)throw Error('Sem aproximação livre: '+place.id);
    setSceneTo('main',p[0],p[1]);player.temp=37;player.en=100;player.hyd=100;player.moving=false;player.running=false;player.resting=false;player.gaitBlend=0;player.gaitRunBlend=0;player.actionTimer=0;player.anim=0;player.dir=0;timeOfDay=hour;currentSeason='hot';ZOOM=2;A11Y.reduceMotion=reduced;window.__visualNow=clock;_camSnap=true;snapCamera();render();updateBars(false);FarmWorldMap.draw();
    const canvas=document.getElementById('game');return{player:{x:player.x,y:player.y},blocked:FarmWorldDepth.isBlocked(player.x,player.y),region:currentRegion(),viewport:{width:innerWidth,height:innerHeight},canvas:{width:canvas.width,height:canvas.height},cache:window.FarmBiomeArt?.info()||null};
   },{place,hour,reduced,clock});}
   async function capture(name,metadata,ui=false){
    const data=await page.evaluate(()=>document.getElementById('game').toDataURL('image/png')),file=name+'.png';fs.writeFileSync(path.join(folder,file),Buffer.from(data.split(',')[1],'base64'));
    const capture={variant,file:variant+'/'+file,sha256:hash(fs.readFileSync(path.join(folder,file))),...metadata};
    if(ui){capture.ui=variant+'/'+name+'-ui.png';await page.screenshot({path:path.join(out,capture.ui)});}report.captures.push(capture);return capture;
   }
   for(const place of places)for(const hour of [7,12,17])await capture(place.id+'-'+hour,await scene(place,hour),true);
   for(const viewport of [{width:1024,height:640},{width:390,height:844}]){await page.setViewportSize(viewport);await page.evaluate(()=>resize());for(const place of places)await capture(place.id+'-'+viewport.width+'x'+viewport.height,await scene(place),true);}
   await page.setViewportSize({width:1280,height:800});await page.evaluate(()=>resize());
   for(const place of places){const captures=[];for(const clock of [0,5100])captures.push(await capture(place.id+'-reduzido-'+clock,{...(await scene(place,12,true,clock)),clock,reduced:true}));report.motion.push({variant,biome:place.id,identical:captures[0].sha256===captures[1].sha256});}
  }finally{await context.close();}
 }
 const old=report.captures.filter(c=>c.variant==='antes'),current=report.captures.filter(c=>c.variant==='depois');
 report.paired=old.every((a,i)=>JSON.stringify(a.player)===JSON.stringify(current[i].player)&&JSON.stringify(a.viewport)===JSON.stringify(current[i].viewport));
 report.baselineReducedDifferences=report.motion.filter(m=>m.variant==='antes'&&!m.identical);
 report.pass=!report.errors.length&&report.paired&&report.motion.filter(m=>m.variant==='depois').every(m=>m.identical)&&report.captures.length===112&&report.captures.every(c=>!c.blocked);
 if(!report.pass)throw Error('Contrato visual não passou');
})().catch(e=>{report.pass=false;report.fatal=e.stack;process.exitCode=1;}).finally(async()=>{await browser?.close();fs.writeFileSync(path.join(out,'capturas.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,captures:report.captures.length,versions:report.versions,errors:report.errors,motion:report.motion.filter(m=>!m.identical),fatal:report.fatal},null,2));});
