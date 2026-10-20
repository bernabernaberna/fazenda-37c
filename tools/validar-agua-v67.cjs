/* Água e vegetação ribeirinha: drawers reais, mapa/bordas preservados,
   movimento reduzido, custo isolado e capturas no navegador de referência. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/agua-v67'),base=process.env.FARM37_URL||'http://127.0.0.1:8766';
const baseline=process.env.FARM37_BASELINE||path.join(root,'../backups/antes-acoes-v67-20261007/jogo.html');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');let browser;
const report={created:new Date().toISOString(),method:'Edge; jogo real com RAF suspenso, semente e relógio controlados. Drawers em pixels de mundo, comparados à arte estática. Custo CPU isolado não é benchmark dos16cenários. Capturas exigem inspeção visual.',checks:[],errors:[],versions:[],captures:[]};
fs.mkdirSync(out,{recursive:true});
const check=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});assert.ok(pass,name);};
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});
 for(const variant of [fs.existsSync(baseline)?'antes':null,'depois'].filter(Boolean)){
  const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push({variant,message:e.message}));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;window.__realWaterNow=performance.now.bind(performance);window.__waterClock=10000;Object.defineProperty(performance,'now',{configurable:true,value:()=>window.__waterClock});let n=246813579;Math.random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);localStorage.setItem('farm37_seen_intro','1');});
  const bytes=variant==='antes'?fs.readFileSync(baseline):null;
  await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==new URL(base).origin)return r.abort();if(bytes&&u.pathname==='/jogo.html')return r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:bytes});return r.continue();});
  const response=await page.goto(base+'/jogo.html?v=agua-v67-'+Date.now()),build=sha(await response.body());
  await page.evaluate(()=>{startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();soundEnabled=false;isPaused=false;histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;FarmStoryUI.close();FarmStoryCinematics.reset();currentWeather=null;weatherCooldown=1e8;A11Y.noDeath=true;A11Y.relaxed=true;A11Y.reduceMotion=false;});
  const data=await page.evaluate(variant=>{
   const saved={ctx,scene:currentScene,season:currentSeason,motion:A11Y.reduceMotion,player:{x:player.x,y:player.y}},main=scenes.main;
   setSceneTo('main',512,960);currentSeason='hot';
   const state=()=>JSON.stringify({map,objects,crops,storage:Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))}),physicalBefore=state();
   const sig=p=>{let n=2166136261;for(const v of p)n=Math.imul(n^v,16777619)>>>0;return n.toString(16);};
   const tc=document.createElement('canvas');tc.width=MW*TS;tc.height=MH*TS;const tg=tc.getContext('2d');tg.imageSmoothingEnabled=false;
   for(let y=0;y<MH;y++)for(let x=0;x<MW;x++)drawTile(x,y,map[y][x],tg);
   const staticPixels=tg.getImageData(0,0,tc.width,tc.height).data,staticHash=sig(tg.getImageData(0,0,59*TS,tc.height).data),physicalHash=sig(new TextEncoder().encode(JSON.stringify({map:map.map(row=>row.slice(0,60)),objects:objects.filter(o=>!o._openWorld&&['river_lily','river_cattail','fishing_spot','bridge'].includes(o.type))})));
   const c=document.createElement('canvas');c.width=MW*TS;c.height=MH*TS;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
   const types=['river_lily','river_cattail','fishing_spot'],riverObjects=objects.filter(o=>types.includes(o.type));
   const waterColors=new Set(['2d696b','306f70','327575','357a78','387e7b','3c837f','337c75','37817a','3b877e','3f8b82','438f84','479389','69a79c','2d686a']);
   const pixels=[];let ellipses=0,fractional=0,counting=false,canvases=0;
   const originalRect=g.fillRect,originalEllipse=g.ellipse,create=document.createElement.bind(document);
   g.fillRect=function(x,y,w,h){if(counting){if([x,y,w,h].some(v=>!Number.isInteger(v)))fractional++;for(let j=0;j<h;j++)for(let i=0;i<w;i++)pixels.push([Math.floor(x+i),Math.floor(y+j)]);}return originalRect.call(this,x,y,w,h);};
   g.ellipse=function(...args){if(counting)ellipses++;return originalEllipse.apply(this,args);};
   document.createElement=function(tag,...args){if(String(tag).toLowerCase()==='canvas')canvases++;return create(tag,...args);};
   const drawObject=o=>(OBJECT_DRAWERS[o.type]||({river_lily:drawRiverLily,river_cattail:drawRiverCattail,fishing_spot:drawFishingSpot})[o.type])(o,g);
   const drawSurface=()=>{ctx=g;drawRiverAnimation(0,0,MW*TS,MH*TS);};
   const sample=(fn,time,motion)=>{window.__waterClock=time;A11Y.reduceMotion=motion;g.clearRect(0,0,c.width,c.height);fn();return sig(g.getImageData(0,0,c.width,c.height).data);};
   try{
    ctx=g;player.x=0;player.y=0;const reduced=[],animated=[];
    for(const type of types){const o=riverObjects.find(o=>o.type===type);reduced.push({type,stable:sample(()=>drawObject(o),0,true)===sample(()=>drawObject(o),2700,true)});const normal=sample(()=>drawObject(o),0,false);animated.push({type,moves:[700,1700,2700,4300].some(t=>normal!==sample(()=>drawObject(o),t,false))});}
    A11Y.reduceMotion=false;counting=true;
    for(const time of [0,1600,3200,5000]){window.__waterClock=time;drawSurface();}
    counting=false;
    const bad=[];for(const [x,y]of pixels){const i=(y*tc.width+x)*4,color=[...staticPixels.slice(i,i+3)].map(v=>v.toString(16).padStart(2,'0')).join('');if(!waterColors.has(color))bad.push({x,y,color,tile:map[Math.floor(y/TS)]?.[Math.floor(x/TS)]});}
    const surface={pixels:pixels.length,leaks:bad.length,examples:bad.slice(0,10)};pixels.length=0;
    const objectPixels=[];
    for(const o of riverObjects){pixels.length=0;counting=true;drawObject(o);counting=false;if(o.type!=='river_cattail')objectPixels.push({type:o.type,physical:{x:o.x,y:o.y},pixels:[...new Set(pixels.map(p=>p.join(',')))]});}
    const overlaps=[];for(let i=0;i<objectPixels.length;i++)for(let j=i+1;j<objectPixels.length;j++){
      const a=objectPixels[i],b=objectPixels[j],other=new Set(b.pixels),count=a.pixels.filter(p=>other.has(p)).length;if(count)overlaps.push({a:a.physical,b:b.physical,pixels:count});
    }
    const objectRaster={ellipses,fractional};
    const targets=variant==='depois'?riverObjects.filter(o=>o.type==='fishing_spot').map(o=>{const p=FarmWaterLife.fishingTarget(o);return {physical:{x:o.x,y:o.y},visual:p,tile:p?map[Math.floor(p.y/TS)]?.[Math.floor(p.x/TS)]:null,surface:!!p&&FarmWaterLife.surfaceAt(p.x,p.y),distance:p?Math.hypot(p.x-o.x,p.y-o.y):null};}):[];
    let invalidTarget=null,coldPixels=null,cost=null,cache=null,reducedWater=null;
    if(variant==='depois'){
      invalidTarget=FarmWaterLife.fishingTarget({x:16,y:16});
      reducedWater=sample(drawSurface,0,true)===sample(drawSurface,2700,true);
      currentSeason='cold';A11Y.reduceMotion=false;pixels.length=0;counting=true;drawSurface();counting=false;
      coldPixels={total:pixels.length,outsideOasis:pixels.filter(([x,y])=>map[Math.floor(y/TS)]?.[Math.floor(x/TS)]!==T.OASIS).length};currentSeason='hot';
      const cacheSnapshot=()=>{const s=FarmWaterLife.info();return {tileMasks:s.tileMasks,maskBytes:s.maskBytes,anchors:s.anchors};};
      drawSurface();for(const o of riverObjects)drawObject(o);const before=cacheSnapshot();
      const times=[];counting=false;
      // Relógio nativo separado do tempo controlado da animação.
      for(let batch=0;batch<15;batch++){const start=window.__realWaterNow();for(let j=0;j<30;j++){window.__waterClock=batch*1200+j*29;drawRiverAnimation(540,900,384,250);for(const o of riverObjects)drawObject(o);}times.push((window.__realWaterNow()-start)/30);}
      times.sort((a,b)=>a-b);cost={draws:450,medianMs:times[7],p95Ms:times[14]};
      cache={before,after:cacheSnapshot(),limit:MW*MH};
    }
    return {staticHash,physicalHash,physicalUnchanged:physicalBefore===state(),surface,reduced,animated,objectRaster,overlaps,targets,invalidTarget,coldPixels,reducedWater,cost,cache,canvases};
   }finally{ctx=saved.ctx;currentSeason=saved.season;A11Y.reduceMotion=saved.motion;player.x=saved.player.x;player.y=saved.player.y;document.createElement=create;g.fillRect=originalRect;g.ellipse=originalEllipse;}
  },variant);
  report.versions.push({variant,build,...data});
  const locations=[['rio',712,988,'hot',null],['pesca',650,1036,'hot',null],['oasis',624,1736,'hot',null],['lago',344,464,'hot',null],['chuva',712,988,'hot','rainstorm'],['neve',344,464,'cold',null],['nevasca',344,464,'cold','blizzard']];
  for(const [name,x,y,season,weather]of locations){
   await page.evaluate(p=>{setSceneTo('main',p.x,p.y);currentSeason=p.season;currentWeather=p.weather;weatherCooldown=1e8;A11Y.reduceMotion=false;timeOfDay=12;ZOOM=2;_camSnap=true;player.temp=37;player.en=100;player.hyd=100;player.moving=false;player.running=false;player.actionTimer=0;player.gaitBlend=0;player.resting=false;for(let i=0;i<20;i++){window.__waterClock=10000+i*16;render();}}, {x,y,season,weather});
   const file=`agua-v67-${variant}-${name}.png`,url=await page.evaluate(async name=>{const url=document.getElementById('game').toDataURL('image/png');const response=await fetch('/shot?name='+name,{method:'POST',body:url});if(!response.ok)throw Error('Captura HTTP '+response.status);return url;},file.slice(0,-4));
   fs.writeFileSync(path.join(out,file),Buffer.from(url.split(',')[1],'base64'));report.captures.push({variant,name,file,build});
  }
  await context.close();
 }
 const actual=report.versions.find(v=>v.variant==='depois'),prior=report.versions.find(v=>v.variant==='antes');
 check('Arte estática original idêntica à V6.6 antes da borda leste',!prior||actual.staticHash===prior.staticHash,{before:prior?.staticHash,after:actual.staticHash,rectangle:'x0..943,y0..1983'});
 check('Mapa e objetos ribeirinhos idênticos à V6.6',!prior||actual.physicalHash===prior.physicalHash,{before:prior?.physicalHash,after:actual.physicalHash});
 check('Desenhos não alteram mapa, objetos, cultivos nem save',actual.physicalUnchanged);
 check('Cristas dinâmicas não atravessam a margem estática',actual.surface.pixels>0&&actual.surface.leaks===0,actual.surface);
 check('Lírios, taboas e pesca em pixels inteiros, sem elipses',actual.objectRaster.ellipses===0&&actual.objectRaster.fractional===0,actual.objectRaster);
 check('Lírios e ondas de pesca não se sobrepõem',actual.overlaps.length===0,actual.overlaps);
 check('Redução de movimento estabiliza os três objetos e água',actual.reduced.every(r=>r.stable)&&actual.reducedWater,actual.reduced);
 check('Animações presentes sem redução de movimento',actual.animated.every(r=>r.moves),actual.animated);
 check('Pesca desenhada sobre água válida; ponto físico preservado',actual.targets.length>0&&actual.targets.every(p=>p.surface&&p.distance>0&&p.distance<=48),actual.targets);
 check('Sem água próxima não inventa alvo em terra',actual.invalidTarget===null);
 check('No frio apenas o oásis tem cristas líquidas',actual.coldPixels.total>0&&actual.coldPixels.outsideOasis===0,actual.coldPixels);
 check('Caches estabilizam e respeitam o limite do mapa',JSON.stringify(actual.cache.before)===JSON.stringify(actual.cache.after)&&actual.cache.after.tileMasks<=actual.cache.limit&&actual.cache.after.anchors<=64,actual.cache);
 check('Drawers não criam canvases',actual.canvases===0,{canvases:actual.canvases,cost:actual.cost});
 check('Nenhum erro JavaScript',report.errors.length===0,report.errors);report.pass=true;
})().catch(e=>{report.pass=false;report.fatal=e.stack;process.exitCode=1;}).finally(async()=>{await browser?.close();fs.writeFileSync(path.join(out,'agua-v67.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,checks:report.checks,fatal:report.fatal},null,2));});
