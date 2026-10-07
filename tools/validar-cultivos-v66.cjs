/* Arte dos sete cultivos no drawer real. Matriz completa, estado preservado,
   redução de movimento, silhuetas maduras e custo isolado (não mede FPS). */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/cultivos-v66'),base=process.env.FARM37_URL||'http://127.0.0.1:8766';
const baseline=process.env.FARM37_BASELINE||path.join(root,'../backups/antes-vida-v66-20261007/jogo.html');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');let browser;
const report={created:new Date().toISOString(),method:'Edge; RAF suspenso; drawCrop real em canvas; tempo controlado apenas nas amostras de arte; microcusto CPU sem getImageData no intervalo medido. Imagens exigem inspeção humana.',checks:[],errors:[],versions:[],captures:[]};
fs.mkdirSync(out,{recursive:true});
const check=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});assert.ok(pass,name);};
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});
 for(const variant of [fs.existsSync(baseline)?'antes':null,'depois'].filter(Boolean)){
  const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push({variant,message:e.message}));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;let n=246813579;Math.random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);localStorage.setItem('farm37_seen_intro','1');});
  const bytes=variant==='antes'?fs.readFileSync(baseline):null;
  await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==new URL(base).origin)return r.abort();if(bytes&&u.pathname==='/jogo.html')return r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:bytes});return r.continue();});
  const response=await page.goto(base+'/jogo.html?v=cultivos-v66-'+Date.now()),build=sha(await response.body());
  await page.evaluate(()=>{startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();soundEnabled=false;isPaused=false;histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;FarmStoryUI.close();FarmStoryCinematics.reset();currentWeather=null;weatherCooldown=1e8;A11Y.noDeath=true;A11Y.relaxed=true;});
  const data=await page.evaluate(()=>{
   const types=['tomato','corn','carrot','lettuce','sweetpotato','pumpkin','forage'],names=['Tomate','Milho','Cenoura','Alface','Batata-doce','Abóbora','Forragem'];
   const saved={ctx,season:currentSeason,motion:A11Y.reduceMotion,wind:windStrength,now:Object.getOwnPropertyDescriptor(performance,'now')},realNow=performance.now.bind(performance);
   const state=()=>JSON.stringify({player,crops,map,scenes,storage:Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))});
   const physicalBefore=state(),canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;
   const actualCreate=document.createElement.bind(document),calls={canvases:0};let counted=false,clock=0;
   document.createElement=function(tag,...args){if(counted&&String(tag).toLowerCase()==='canvas')calls.canvases++;return actualCreate(tag,...args);};
   Object.defineProperty(performance,'now',{configurable:true,value:()=>clock});
   const signature=p=>{let n=2166136261;for(const v of p)n=Math.imul(n^v,16777619)>>>0;return n.toString(16);};
   const sample=(type,stage,water,winter,time,reduced=true)=>{
    currentSeason=winter?'cold':'hot';A11Y.reduceMotion=reduced;clock=time;ctx=g;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,32,32);g.translate(8,8);
    const c=Object.freeze({type,stage,water,t:7,frost:0});counted=true;try{drawCrop(0,0,c);}finally{counted=false;}
    return new Uint8ClampedArray(g.getImageData(0,0,32,32).data);
   };
   const matrix=[],sheets=[],ripe={},edgePumpkin={},motion=[];
   try{
    windStrength=2;
    for(const winter of [false,true]){
     const sheet=actualCreate('canvas');sheet.width=900;sheet.height=664;const sg=sheet.getContext('2d');sg.imageSmoothingEnabled=false;sg.fillStyle='#e0dec9';sg.fillRect(0,0,900,664);sg.fillStyle='#263f36';sg.font='bold 18px sans-serif';sg.fillText(winter?'Cultivos — frio':'Cultivos — quente',16,25);
     sg.font='bold 12px sans-serif';for(let stage=1;stage<=3;stage++)sg.fillText(['Broto','Crescendo','Maduro'][stage-1],116+(stage-1)*258,43);
     sg.font='11px sans-serif';for(let stage=1;stage<=3;stage++)for(let water=0;water<=2;water++)sg.fillText('água '+water,116+((stage-1)*3+water)*86,58);
     const field=actualCreate('canvas');field.width=16;field.height=16;const fg=field.getContext('2d');TILE_DRAWERS[T.FIELD](fg,0,0,10,60,winter);
     for(let row=0;row<types.length;row++){
      const type=types[row];sg.fillStyle='#263f36';sg.font='bold 14px sans-serif';sg.fillText(names[row],10,100+row*84);
      for(let stage=1;stage<=3;stage++)for(let water=0;water<=2;water++){
       const first=sample(type,stage,water,winter,0),second=sample(type,stage,water,winter,2597);
       let painted=0,outside=0;for(let y=0;y<32;y++)for(let x=0;x<32;x++)if(first[(y*32+x)*4+3]){painted++;if(x<8||x>=24||y<8||y>=24)outside++;}
       matrix.push({type,stage,water,winter,first:signature(first),second:signature(second),painted,outside});
       sample(type,stage,water,winter,0);const x=116+((stage-1)*3+water)*86,y=65+row*84;sg.drawImage(field,x,y,64,64);sg.drawImage(canvas,8,8,16,16,x,y,64,64);
       if(stage===3&&water===0){ripe[type+':'+winter]=Array.from(first);if(['pumpkin','lettuce'].includes(type)&&!winter)edgePumpkin[type]=[...new Set(Array.from(first).filter((_,i)=>i%4===3))].sort((a,b)=>a-b);}
      }
     }
     sheets.push({winter,url:sheet.toDataURL('image/png')});
    }
    // Espécies maduras devem ser reconhecíveis por forma/cor, mesmo no frio.
    const distances=[];for(const winter of [false,true])for(let a=0;a<types.length;a++)for(let b=a+1;b<types.length;b++){
     const p=ripe[types[a]+':'+winter],q=ripe[types[b]+':'+winter];let changed=0;for(let i=0;i<p.length;i+=4)if(p[i]!==q[i]||p[i+1]!==q[i+1]||p[i+2]!==q[i+2]||p[i+3]!==q[i+3])changed++;distances.push({a:types[a],b:types[b],winter,changed});
    }
    // Compare as mesmas primitivas opacas: ponta move no máximo um pixel
    // em relação à pose estática, mantendo o eixo vertical e os tamanhos.
    const record=(type,stage,time,reduced)=>{const list=[],fill=g.fillRect,ellipse=g.ellipse;g.fillRect=function(...args){if(!String(g.fillStyle).startsWith('rgba')&&!String(g.fillStyle).startsWith('rgb('))list.push({op:'rect',args});return fill.apply(this,args);};g.ellipse=function(...args){list.push({op:'ellipse',args});return ellipse.apply(this,args);};try{sample(type,stage,0,false,time,reduced);}finally{g.fillRect=fill;g.ellipse=ellipse;}return list;};
    for(const type of types)for(const stage of [2,3]){const fixed=record(type,stage,0,true);let maxDX=0,alteredOtherAxis=false;for(const time of [0,300,700,1100,1700,2400,3100,3900]){const live=record(type,stage,time,false);if(live.length!==fixed.length)alteredOtherAxis=true;for(let i=0;i<Math.min(fixed.length,live.length);i++){maxDX=Math.max(maxDX,Math.abs(live[i].args[0]-fixed[i].args[0]));if(live[i].args.slice(1).join(',')!==fixed[i].args.slice(1).join(','))alteredOtherAxis=true;}}motion.push({type,stage,primitives:fixed.length,maxDX,alteredOtherAxis});}
    const dry=sample('tomato',1,0,false,0),wet=sample('tomato',1,1,false,0),corners=[[1,1],[14,1],[1,14],[14,14]].map(([x,y])=>{const i=((y+8)*32+x+8)*4;return {x,y,changed:dry.slice(i,i+4).join(',')!==wet.slice(i,i+4).join(',')};});
    const cache=()=>{const a=FarmWorldArt.state();return {tileSprites:a.tileSprites,objectSprites:a.objectSprites,cacheBytes:a.cacheBytes,rooms:FarmInteriorArt.state()};};
    const cacheBefore=cache(),times=[];currentSeason='hot';A11Y.reduceMotion=false;ctx=g;
    for(let batch=0;batch<40;batch++){const start=realNow();counted=true;try{for(let i=0;i<126;i++){clock=batch*250+i*7;drawCrop(0,0,{type:types[i%7],stage:1+i%3,water:i%3,frost:0});}}finally{counted=false;}times.push(realNow()-start);}
    times.sort((a,b)=>a-b);const cost={batches:40,drawsPerBatch:126,medianMs:times[20],p95Ms:times[38],maxMs:times[39],newCanvases:calls.canvases,cacheBefore,cacheAfter:cache()};
    return {matrix,sheets,distances,edgePumpkin,motion,corners,cost,physicalUnchanged:physicalBefore===state()};
   }finally{ctx=saved.ctx;currentSeason=saved.season;A11Y.reduceMotion=saved.motion;windStrength=saved.wind;document.createElement=actualCreate;if(saved.now)Object.defineProperty(performance,'now',saved.now);else delete performance.now;}
  });
  for(const sheet of data.sheets){const file=`cultivos-v66-${variant}-${sheet.winter?'frio':'quente'}.png`;fs.writeFileSync(path.join(out,file),Buffer.from(sheet.url.split(',')[1],'base64'));report.captures.push({variant,file,build});}delete data.sheets;
  report.versions.push({variant,build,...data});
  if(variant==='depois'){
   check('126 combinações desenhadas e contidas no tile',data.matrix.length===126&&data.matrix.every(c=>c.painted>0&&c.outside===0));
   check('Todas as combinações ficam idênticas em dois tempos com redução de movimento',data.matrix.every(c=>c.first===c.second));
   check('Sete cultivos maduros distintos no quente e no frio',data.distances.every(d=>d.changed>=20),{minimumPixelsChanged:Math.min(...data.distances.map(d=>d.changed))});
   check('Vento limitado a um pixel horizontal',data.motion.every(m=>m.primitives>0&&m.maxDX<=1&&!m.alteredOtherAxis),data.motion);
   check('Umidade preserva os quatro cantos do terreno',data.corners.every(c=>!c.changed),data.corners);
   check('Abóbora e alface sem borda antialias no quente',Object.values(data.edgePumpkin).length===2&&Object.values(data.edgePumpkin).every(alpha=>alpha.every(a=>a===0||a===255)),data.edgePumpkin);
   check('Drawer não cria canvases nem amplia caches',data.cost.newCanvases===0&&JSON.stringify(data.cost.cacheBefore)===JSON.stringify(data.cost.cacheAfter),data.cost);
   check('Estado físico e save local não alterados pelo desenho',data.physicalUnchanged);
   for(const room of [{name:'horta',scene:'main',x:260,y:1030,zoom:2},{name:'estufa',scene:'greenhouse',x:248,y:176,zoom:1}]){
    const url=await page.evaluate(async r=>{setSceneTo(r.scene,r.x,r.y);ZOOM=r.zoom;timeOfDay=12;_camSnap=true;A11Y.reduceMotion=true;currentSeason='hot';player.temp=37;player.en=100;player.hyd=100;render();const url=document.getElementById('game').toDataURL('image/png');const s=await fetch('/shot?name=cultivos-v66-'+r.name,{method:'POST',body:url});if(!s.ok)throw Error('Captura '+s.status);return url;},room);
    const file='cultivos-v66-'+room.name+'.png';fs.writeFileSync(path.join(out,file),Buffer.from(url.split(',')[1],'base64'));report.captures.push({variant,file,build});
   }
  }
  await context.close();
 }
 check('Nenhum erro JavaScript',report.errors.length===0,report.errors);report.pass=true;
})().catch(e=>{report.fatal=e.stack;report.pass=false;process.exitCode=1;}).finally(async()=>{await browser?.close();fs.writeFileSync(path.join(out,'cultivos-v66.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,checks:report.checks,builds:report.versions.map(v=>({variant:v.variant,build:v.build,cost:v.cost})),fatal:report.fatal},null,2));});
