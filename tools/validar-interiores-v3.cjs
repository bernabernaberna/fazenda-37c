/* Cenas reais em perfis descartáveis: inspeção de interiores e caminhos de uso. */
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/movimento-mapa-v3'),label=process.env.INTERIOR_LABEL||'depois';
fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true}),r={checks:[],errors:[],external:[],screenshots:[]};
try{const p=await b.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>r.errors.push(e.message));
await p.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.setItem('farm37_seen_intro','1');
 // Uma paleta com índice fracionário passa undefined ao Canvas sem lançar erro.
 // Interceptamos essa falha silenciosa enquanto as superfícies reais são criadas.
 window.__interiorInvalidColors=[];const fill=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,'fillStyle');
 Object.defineProperty(CanvasRenderingContext2D.prototype,'fillStyle',{...fill,set(value){if(value==null&&new Error().stack.includes('roomSurface'))window.__interiorInvalidColors.push(String(value));fill.set.call(this,value);}});
});
await p.route('**/*',q=>{if(new URL(q.request().url()).origin==='http://127.0.0.1:8766')return q.continue();r.external.push(q.request().url());return q.abort();});
const response=await p.goto('http://127.0.0.1:8766/jogo.html?v=interior-'+Date.now());r.sha256=createHash('sha256').update(await response.body()).digest('hex');
await p.evaluate(()=>{startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();soundEnabled=false;isPaused=false;histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;timeOfDay=11;A11Y.noDeath=true;currentWeather=null;weatherCooldown=1e8;});
for(const name of ['house','barn','greenhouse']){
 await p.evaluate(name=>{setSceneTo(name);ZOOM=2;_camSnap=true;FarmWorldMap?.update(1);render();},name);
 const file='interiores-'+label+'-'+name+'.png';await p.screenshot({path:path.join(out,file)});r.screenshots.push(file);
 await p.evaluate(async name=>{await fetch('/shot?name=interior-v3-'+name,{method:'POST',body:document.getElementById('game').toDataURL()});},name);
 const check=await p.evaluate(name=>{
  const room=scenes[name],before={x:player.x,y:player.y},mapSnapshot=JSON.stringify(room.map),objectsSnapshot=JSON.stringify(room.objects),times=[];
  for(let k=0;k<60;k++){const t=performance.now();render();times.push(performance.now()-t);}times.sort((a,b)=>a-b);
  const targets=name==='house'?['i_bed','i_wardrobe','i_fireplace','i_table','i_bookshelf']:name==='barn'?['b_trough','loom','b_chest','b_stove','b_cot']:['gh_compost','gh_mister','gh_barrel'];
  // Flood-fill do corredor até uma posição de interação de cada objeto.
  const spacing=4,width=Math.floor(room.MW*TS/spacing),height=Math.floor(room.MH*TS/spacing),queue=[],seen=new Set();
  const free=(x,y)=>{if(x<8||y<8||x>MW*TS-8||y>MH*TS-8||furnitureCollides(x,y))return false;
   if(name==='greenhouse')for(const o of objects)if(o.type==='gh_frame'&&((x>o.x-2&&x<o.x+o.w+2&&y>o.y-2&&y<o.y+6)||(x>o.x-2&&x<o.x+o.w+2&&y>o.y+o.h-6&&y<o.y+o.h+2&&!(x>15*TS-6&&x<17*TS+6))||(y>o.y-2&&y<o.y+o.h+2&&((x>o.x-2&&x<o.x+6)||(x>o.x+o.w-6&&x<o.x+o.w+2)))))return false;return true;};
  const start=[Math.round(before.x/spacing),Math.round(before.y/spacing)];queue.push(start);seen.add(start.join(','));
  for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [xx,yy]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const key=xx+','+yy;if(!seen.has(key)&&free(xx*spacing,yy*spacing)){seen.add(key);queue.push([xx,yy]);}}}
  const reach=targets.map(type=>{const o=objects.find(o=>o.type===type);return{type,reachable:!!o&&queue.some(([x,y])=>Math.hypot(x*spacing-(o.x+(o.w||0)/2),y*spacing-(o.y+(o.h||0)/2))<30)};});
  const stable=mapSnapshot===JSON.stringify(room.map)&&objectsSnapshot===JSON.stringify(room.objects);
  return{name,stable,reachable:reach,renderP95:times[57],spawnFree:free(before.x,before.y),cache:window.FarmInteriorArt?.state?.()};
 },name);r.checks.push(check);
}
r.regressions=await p.evaluate(()=>{
 setSceneTo('greenhouse');player.x=300;player.y=64;player.dir=0;player.moving=false;ZOOM=3;_camSnap=true;A11Y.reduceMotion=true;
 const originalPlayer=OBJECT_DRAWERS.player,originalBack=OBJECT_DRAWERS.interior_gh_back,originalFrame=OBJECT_DRAWERS.gh_frame,order=[];
 let rect,mask=[],paintedPixels=0,coveredPixels=0;
 const pixels=g=>g.getImageData(rect.x,rect.y,rect.w,rect.h).data;
 const changed=(a,b,i)=>a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]||a[i+3]!==b[i+3];
 OBJECT_DRAWERS.player=(o,g)=>{order.push('player');const m=g.getTransform();rect={x:Math.round((player.x-18)*m.a+m.e),y:Math.round((player.y-32)*m.d+m.f),w:Math.round(36*m.a),h:Math.round(44*m.d)};
  const before=pixels(g);if(originalPlayer)originalPlayer(o,g);else drawPlayer();const after=pixels(g);
  for(let i=0;i<after.length;i+=4)if(changed(before,after,i)){mask.push(i);paintedPixels++;}};
 if(originalBack)OBJECT_DRAWERS.interior_gh_back=(o,g)=>{order.push('north-wall');originalBack(o,g);};
 OBJECT_DRAWERS.gh_frame=(o,g)=>{order.push('front-frame');const before=rect?pixels(g):null;originalFrame(o,g);if(before){const after=pixels(g);for(const i of mask)if(changed(before,after,i))coveredPixels++;}};
 try{render();}finally{if(originalPlayer)OBJECT_DRAWERS.player=originalPlayer;else delete OBJECT_DRAWERS.player;if(originalBack)OBJECT_DRAWERS.interior_gh_back=originalBack;OBJECT_DRAWERS.gh_frame=originalFrame;}
 const frame=objects.find(o=>o.type==='gh_frame'),playerDrawable={type:'player',x:player.x,y:player.y},back=FarmInteriorArt.parts?.(frame)?.[0];
 return{floorColors:{pass:window.__interiorInvalidColors.length===0,invalid:window.__interiorInvalidColors},northWall:{pass:order.indexOf('north-wall')>=0&&order.indexOf('north-wall')<order.indexOf('player')&&paintedPixels>100&&coveredPixels===0,order,paintedPixels,coveredPixels,position:{x:player.x,y:player.y},furnitureCollision:furnitureCollides(player.x,player.y),depths:{player:FarmWorldDepth.depth(playerDrawable),north:back?FarmWorldDepth.depth(back):null,front:FarmWorldDepth.depth(frame)}}};
});
const northShot='interiores-'+label+'-estufa-parede-norte.png';await p.screenshot({path:path.join(out,northShot)});r.screenshots.push(northShot);
r.pass=!r.errors.length&&!r.external.length&&r.checks.every(c=>c.stable&&c.spawnFree&&c.reachable.every(v=>v.reachable)&&c.renderP95<16.67)&&Object.values(r.regressions).every(c=>c.pass);
}finally{await b.close();fs.writeFileSync(path.join(out,'interiores-'+label+'.json'),JSON.stringify(r,null,2));console.log(JSON.stringify(r,null,2));if(!r.pass)process.exitCode=1;}})().catch(e=>{console.error(e);process.exitCode=1;});
