/* Expansão real: preservação, caminhos com colisão, transições térmicas,
   mapa completo e capturas em três tamanhos de tela. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/mundo-aberto-v67'),base=process.env.FARM37_URL||'http://127.0.0.1:8766';
const baseline=process.env.FARM37_BASELINE||path.join(root,'../backups/antes-acoes-v67-20261007/jogo.html');
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:JSON.stringify(x)).digest('hex');
const report={created:new Date().toISOString(),checks:[],errors:[],captures:[],versions:[]};let browser;
const check=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});assert.ok(pass,name);};
fs.mkdirSync(out,{recursive:true});
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});
 let before=null,legacySave=null;
 for(const variant of ['antes','depois']){
  const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push({variant,message:e.message}));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;window.__worldClock=12000;Object.defineProperty(performance,'now',{configurable:true,value:()=>window.__worldClock});let n=246813579;Math.random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);localStorage.setItem('farm37_seen_intro','1');});
  const bytes=variant==='antes'?fs.readFileSync(baseline):null;
  await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==new URL(base).origin)return r.abort();if(bytes&&u.pathname==='/jogo.html')return r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:bytes});return r.continue();});
  const response=await page.goto(base+'/jogo.html?v=aberto-v67-'+Date.now()),build=hash(await response.body());
  await page.evaluate(()=>{startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();soundEnabled=false;isPaused=false;histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;FarmStoryUI.close();FarmStoryCinematics.reset();currentWeather=null;weatherCooldown=1e8;A11Y.noDeath=true;A11Y.relaxed=true;A11Y.reduceMotion=true;});
  const snapshot=await page.evaluate(()=>({map:scenes.main.map.map(r=>r.slice(0,60)),doors:scenes.main.objects.filter(o=>['door_house','door_barn','gh_path','story_seed_door','bridge'].includes(o.type)),objects:scenes.main.objects.filter(o=>!o._openWorld&&o.x<960&&o.type!=='story_npc').map(o=>({type:o.type,x:o.x,y:o.y,id:o.id})),crops:scenes.main.crops,oldWeights:Array.from({length:124},(_,y)=>regionWeights(y,30))}));
  report.versions.push({variant,build,mapHash:hash(snapshot.map),doorsHash:hash(snapshot.doors),objectsHash:hash(snapshot.objects)});
  if(variant==='antes'){before=snapshot;legacySave=await page.evaluate(()=>{saveGame(true);return JSON.parse(localStorage.getItem(SAVE_KEY));});await context.close();continue;}
  check('60×124 tiles originais intactos',hash(before.map)===hash(snapshot.map));
  check('Portas, ponte e objetos originais mantêm posições',hash(before.doors)===hash(snapshot.doors)&&hash(before.objects)===hash(snapshot.objects));
  check('Cultivos existentes preservados',hash(before.crops)===hash(snapshot.crops));
  check('Gradiente original norte-sul idêntico',hash(before.oldWeights)===hash(snapshot.oldWeights));
  const data=await page.evaluate(()=>{
   const main=scenes.main,world=FarmOpenWorld,objectsBefore=main.objects.length,mapBefore=main.map;
   world.expand(main);const idempotent=main.objects.length===objectsBefore&&main.map===mapBefore;
   const W=main.MW,H=main.MH,seen=new Int32Array(W*H).fill(-1),queue=[];
   const start={x:24,y:59},key=(x,y)=>y*W+x;seen[key(start.x,start.y)]=key(start.x,start.y);queue.push(start);
   const blocked=(x,y)=>FarmWorldDepth.isBlocked(x,y);
   for(let i=0;i<queue.length;i++){
    const a=queue[i];for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){
     const x=a.x+dx,y=a.y+dy,k=key(x,y);if(x<0||y<0||x>=W||y>=H||seen[k]!==-1)continue;
     let clear=true;for(let s=1;s<=4;s++)if(blocked(a.x*TS+8+dx*s*4,a.y*TS+8+dy*s*4)){clear=false;break;}
     if(clear){seen[k]=key(a.x,a.y);queue.push({x,y});}
    }
   }
   const destinations=[...world.landmarks,...Object.entries(world.npcSpawns).map(([id,p])=>({id,...p}))];
   const paths=destinations.map(p=>{
    const x=Math.floor(p.x/TS),y=Math.floor(p.y/TS),walkable=!blocked(p.x,p.y);let steps=0,k=key(x,y),reached=seen[k]>=0;
    if(reached)while(seen[k]!==k&&steps<W*H){k=seen[k];steps++;}
    return {id:p.id,x:p.x,y:p.y,reached,walkable,steps};
   });
   let error=0,jump=0;for(let y=0;y<124;y+=.5)for(let x=59;x<96;x+=.5){
    const w=world.blendWeights(x,y,[['farm',1]]),sum=w.reduce((s,[,k])=>s+k,0);error=Math.max(error,Math.abs(sum-1));
    const next=world.blendWeights(x+.01,y,[['farm',1]]),weights=Object.fromEntries(w),other=Object.fromEntries(next);for(const name of new Set([...Object.keys(weights),...Object.keys(other)]))jump=Math.max(jump,Math.abs((weights[name]||0)-(other[name]||0)));
   }
   const newObjects=main.objects.filter(o=>o._openWorld),outside=newObjects.filter(o=>o.x<960||o.x>=W*TS||o.y<0||o.y>=H*TS),trailBlocks=[];
   for(const points of world.routes)for(const [x,y]of points)if(blocked(x*TS+8,y*TS+8))trailBlocks.push({x,y});
   const seams=[];for(let y=55;y<=61;y++)seams.push({y,clear:[59,60,61].every(x=>!blocked(x*TS+8,y*TS+8))});
   const targets=world.landmarks.map(p=>{setSceneTo('main',p.x-16,p.y);FarmWorldMap.draw();const s=FarmWorldMap.snapshot(),id='place:'+p.id;return {id,region:s.region,listed:s.markers.some(m=>m.id===id),selected:FarmWorldMap.setDestination(id),destination:FarmWorldMap.snapshot().destination};});
   const temperatures=[];for(const [x,y]of [[59,58],[60,58],[63,58],[66,58],[78,35],[78,58],[84,97]]){player.x=x*TS+8;player.y=y*TS+8;temperatures.push({x,y,weights:regionWeights(y,x),region:currentRegion(),thermal:getZoneThermal()});}
   return {width:W,height:H,idempotent,paths,visited:queue.length,weightError:error,maxWeightStep:jump,newObjects:newObjects.length,outside,trailBlocks,seams,targets,temperatures};
  });
  report.geometry=data;
  check('Expansão96×124 idempotente',data.width===96&&data.height===124&&data.idempotent);
  check('Todos os NPCs e marcos alcançáveis com colisão real',data.paths.every(p=>p.reached&&p.walkable),data.paths);
  check('Entrada contínua pela borda original; trilhas livres',data.seams.some(s=>s.clear)&&data.trailBlocks.length===0,{seams:data.seams,blocked:data.trailBlocks});
  check('Pesos térmicos contínuos e normalizados',data.weightError<1e-9&&data.maxWeightStep<.004,{error:data.weightError,maxStep:data.maxWeightStep});
  check('Objetos novos ficam na expansão',data.newObjects>10&&data.outside.length===0,{count:data.newObjects,outside:data.outside});
  check('Mapa/minimapa mostram regiões e destinos corretos',data.targets.every(t=>t.listed&&t.selected&&t.destination&&['forest','wetland'].includes(t.region)),data.targets);
  check('Temperatura sem valores inválidos nas regiões',data.temperatures.every(t=>Number.isFinite(t.thermal.tempDelta)&&Number.isFinite(t.thermal.hydDelta)),data.temperatures);
  const saves=await page.evaluate(legacy=>{
   const oldLoaded=loadGameFromData(legacy),oldPosition=player.x===legacy.player.x&&player.y===legacy.player.y,oldCoins=player.coins===legacy.player.coins;
   const target=FarmOpenWorld.npcSpawns.davi;setSceneTo('main',target.x,target.y);player.coins=237;saveGame(true);const saved=JSON.parse(localStorage.getItem(SAVE_KEY));
   player.x=384;player.y=944;player.coins=0;const newLoaded=loadGameFromData(saved);
   return {oldLoaded,oldPosition,oldCoins,newLoaded,newPosition:player.x===target.x&&player.y===target.y,newCoins:player.coins===237,version:saved.version,worldWidth:scenes.main.MW,landmarks:scenes.main.objects.filter(o=>o.type==='open_world_landmark').length};
  },legacySave);
  check('Save V6.6 carrega e posição nova persiste em savev2',saves.oldLoaded&&saves.oldPosition&&saves.oldCoins&&saves.newLoaded&&saves.newPosition&&saves.newCoins&&saves.version===2&&saves.worldWidth===96&&saves.landmarks===3,saves);
  for(const [width,height]of [[1280,800],[1024,640],[390,844]]){
   await page.setViewportSize({width,height});
   for(const [name,x,y]of [['entrada',60,58],['nascente',78,36],['clareira',78,59],['veredas',83,97]]){
    await page.evaluate(p=>{FarmWorldMap.close();FarmStoryUI.close();setSceneTo('main',p.x*TS+8,p.y*TS+8);currentSeason='hot';currentWeather=null;timeOfDay=12;ZOOM=2;_camSnap=true;player.temp=37;player.hyd=100;player.en=100;player.actionTimer=0;player.moving=false;player.running=false;A11Y.reduceMotion=true;for(let i=0;i<10;i++)render();FarmWorldMap.draw();}, {x,y});
    const file=`mundo-v67-${name}-${width}x${height}.png`,url=await page.evaluate(async name=>{const u=document.getElementById('game').toDataURL('image/png');await fetch('/shot?name='+name,{method:'POST',body:u});return u;},file.slice(0,-4));
    fs.writeFileSync(path.join(out,file),Buffer.from(url.split(',')[1],'base64'));report.captures.push({file,width,height,name,build});
   }
   await page.evaluate(()=>FarmWorldMap.open());
   const file=`mundo-v67-mapa-${width}x${height}.png`;await page.screenshot({path:path.join(out,file)});report.captures.push({file,width,height,name:'mapa',build});
   const map=await page.evaluate(()=>{const c=document.getElementById('worldMapCanvas'),b=c.getBoundingClientRect();return {width:c.width,height:c.height,shownWidth:b.width,shownHeight:b.height,viewport:{width:innerWidth,height:innerHeight}};});
   check('Mapa mantém proporção e escala dos rótulos em '+width+'×'+height,map.width===600&&map.height===775&&Math.abs(map.width/map.height-96/124)<1e-6&&Math.abs(map.shownWidth/map.shownHeight-96/124)<.01,map);
  }
  await context.close();
 }
 check('Nenhum erro JavaScript',report.errors.length===0,report.errors);report.pass=true;
})().catch(e=>{report.pass=false;report.fatal=e.stack;process.exitCode=1;}).finally(async()=>{await browser?.close();fs.writeFileSync(path.join(out,'mundo-aberto-v67.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,checks:report.checks,fatal:report.fatal},null,2));});
