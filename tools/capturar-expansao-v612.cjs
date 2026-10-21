/* Evidência visual dos nove locais da expedição. RAF fica pausado e cada
   quadro identifica o hash real do HTML servido, sem simular desempenho. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/expansao-v612/capturas');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const report={captures:[],errors:[],method:'Edge real; RAF pausado; inspeção visual separada da medição de desempenho'};try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;window.__visualNow=0;Object.defineProperty(performance,'now',{value:()=>window.__visualNow});localStorage.setItem('farm37_seen_intro','1');});
 const response=await page.goto('http://127.0.0.1:8766/jogo.html?v=expansao-vis-'+Date.now());report.sha256=crypto.createHash('sha256').update(await response.body()).digest('hex');
 await page.evaluate(()=>{showAchievementToast=()=>{};startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();FarmStoryCinematics.reset();soundEnabled=false;histologyMissionOpen=false;isPaused=false;A11Y.reduceMotion=false;currentWeather=null;weatherCooldown=1e8;document.body.classList.add('hud-game');});
 const places=await page.evaluate(()=>FarmExpeditionWorld.landmarks.map(l=>({id:l.id,x:l.x,y:l.y,title:l.title,region:l.region})));
 async function scene(place,hour=12,motion=true,clock=0){return page.evaluate(({place,hour,motion,clock})=>{
  FarmWorldMap.close();FarmStoryUI.close();const candidates=[[place.x,place.y+20],[place.x+20,place.y+12],[place.x-20,place.y+12],[place.x,place.y+8]],p=candidates.find(([x,y])=>!FarmWorldDepth.isBlocked(x,y));if(!p)throw Error('Sem aproximação livre: '+place.id);
  setSceneTo('main',p[0],p[1]);player.temp=37;player.energy=100;player.hyd=100;timeOfDay=hour;ZOOM=2;currentSeason='hot';A11Y.reduceMotion=!motion;window.__visualNow=clock;_camSnap=true;snapCamera();render();updateBars();FarmWorldMap.draw();
  const canvas=document.getElementById('game');return{player:{x:player.x,y:player.y},blocked:FarmWorldDepth.isBlocked(player.x,player.y),region:currentRegion(),viewport:{width:innerWidth,height:innerHeight},graphics:FarmExpeditionWorld.artInfo(),canvas:{width:canvas.width,height:canvas.height}};
 },{place,hour,motion,clock});}
 async function capture(file,metadata){await page.screenshot({path:path.join(out,file)});report.captures.push({file,...metadata});}
 for(const place of places)for(const hour of[7,12,17]){const metadata=await scene(place,hour);await capture(place.id+'-'+hour+'.png',{place:place.id,hour,...metadata});}
 const mill=places.find(p=>p.id==='exp_windmill');
 for(const viewport of[{width:1280,height:800},{width:1024,height:640},{width:390,height:844}]){
  await page.setViewportSize(viewport);await page.evaluate(()=>resize());let metadata=await scene(mill);await capture('enquadramento-'+viewport.width+'x'+viewport.height+'.png',metadata);
  const map=await page.evaluate(()=>{if(!FarmWorldMap.open())throw Error('Mapa indisponível');return FarmWorldMap.snapshot();});await capture('mapa-'+viewport.width+'x'+viewport.height+'.png',{viewport,map:{world:map.world,region:map.region,markers:map.markers.length}});
 }
 await page.setViewportSize({width:1280,height:800});await page.evaluate(()=>resize());
 for(const clock of[0,1700,3400,5100]){const metadata=await scene(mill,12,true,clock);await capture('moinho-movimento-'+clock+'.png',{clock,...metadata});}
 for(const clock of[0,5100]){const metadata=await scene(mill,12,false,clock);await capture('moinho-reduzido-'+clock+'.png',{clock,...metadata});}
 report.drawContracts=await page.evaluate(()=>{
  A11Y.reduceMotion=false;const c=document.createElement('canvas');c.width=2304;c.height=1984;const g=c.getContext('2d'),before=g.getTransform();let saves=0,restores=0,bad=[];for(const method of['save','restore','fillRect','drawImage','moveTo','lineTo','translate','rotate']){const original=g[method].bind(g);g[method]=(...args)=>{if(method==='save')saves++;if(method==='restore')restores++;for(const value of args)if(typeof value==='number'&&!Number.isFinite(value))bad.push(method);return original(...args);};}
  const objects=scenes.main.objects.filter(o=>o._expedition),state=JSON.stringify(objects);for(const hour of[7,12,17]){timeOfDay=hour;for(const o of objects)OBJECT_DRAWERS[o.type]?.(o,g);FarmExpeditionWorld.drawGroundShadows(g,objects,sunShadowVec());}const after=g.getTransform();return{saves,restores,nonFinite:bad,transformStable:JSON.stringify(before)===JSON.stringify(after),objectsStable:state===JSON.stringify(objects),art:FarmExpeditionWorld.artInfo()};
 });
 const hashFile=name=>crypto.createHash('sha256').update(fs.readFileSync(path.join(out,name))).digest('hex');report.motionComparison={activeHashes:[0,1700,3400,5100].map(clock=>hashFile('moinho-movimento-'+clock+'.png')),reducedHashes:[0,5100].map(clock=>hashFile('moinho-reduzido-'+clock+'.png'))};report.motionComparison.activeDistinct=new Set(report.motionComparison.activeHashes).size===4;report.motionComparison.reducedIdentical=new Set(report.motionComparison.reducedHashes).size===1;
 if(report.errors.length||report.captures.some(c=>c.blocked)||report.drawContracts.nonFinite.length||report.drawContracts.saves!==report.drawContracts.restores||!report.drawContracts.transformStable||!report.drawContracts.objectsStable||!report.motionComparison.activeDistinct||!report.motionComparison.reducedIdentical)throw Error('Falha de contrato visual: '+JSON.stringify(report));
 fs.writeFileSync(path.join(out,'capturas.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({captures:report.captures.length,sha256:report.sha256,errors:report.errors,drawContracts:report.drawContracts}));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
