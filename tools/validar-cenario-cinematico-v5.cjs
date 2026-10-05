/* Cenário real das cutscenes: captura sem transportar ou modificar a partida. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/cutscenes-v5');fs.mkdirSync(out,{recursive:true});
const report={checks:[],errors:[],captures:[]};let browser,page;
const check=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});assert.ok(pass,name);};
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('farm37_seen_intro','1');requestAnimationFrame=()=>0;});
 const response=await page.goto('http://127.0.0.1:8766/jogo.html?v=cenarios-v5-'+Date.now());report.buildSHA256=crypto.createHash('sha256').update(await response.body()).digest('hex');
 await page.evaluate(()=>{startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();histologyMissionQueue.length=0;_lastHistMissionAt=1e9;setSceneTo('house',112,86);});
 const result=await page.evaluate(()=>{
  const refs=()=>({ctx,map,objects,crops,MW,MH,currentScene}),beforeRefs=refs();
  const state=()=>JSON.stringify({player,story:FarmStoryWorld.serialize(),cinema:FarmStoryCinematics.serialize(),currentScene,MW,MH,main:scenes.main,weather:currentWeather,time:timeOfDay,seasonTimer});
  const before=state(),films=[{id:'carta',x:264,y:920,region:'farm'},{id:'horta',x:376,y:968,region:'farm'},{id:'rio',x:744,y:884,region:'farm'},{id:'abrigo',x:520,y:252,region:'mountain'},{id:'oasis',x:632,y:1816,region:'desert'},{id:'reabertura',x:608,y:1212,region:'farm'}];
  const results=[];window.__backgrounds=[];
  for(const film of films){
   const c=document.createElement('canvas');c.width=960;c.height=480;const g=c.getContext('2d');g.translate(3,4);g.globalAlpha=.75;
   const transform=JSON.stringify(g.getTransform()),alpha=g.globalAlpha,t=performance.now(),ok=drawCinematicWorld(g,{width:960,height:480,zoom:3,focusX:film.x,focusY:film.y,region:film.region}),ms=performance.now()-t;
   let h=2166136261;for(const b of g.getImageData(0,0,960,480).data)h=Math.imul(h^b,16777619);
   results.push({id:film.id,ok,hash:h>>>0,ms,stateSame:before===state(),refsSame:Object.entries(beforeRefs).every(([k,v])=>refs()[k]===v),contextSame:transform===JSON.stringify(g.getTransform())&&alpha===g.globalAlpha});
   window.__backgrounds.push({id:film.id,data:c.toDataURL('image/png')});
  }
  // Exerce também a restauração se um pintor do cenário falhar.
  const object=scenes.main.objects.find(o=>typeof OBJECT_DRAWERS[o.type]==='function'),original=OBJECT_DRAWERS[object.type];let caught=false;
  OBJECT_DRAWERS[object.type]=()=>{throw new Error('Falha de desenho preparada');};
  const c=document.createElement('canvas');c.width=960;c.height=480;const g=c.getContext('2d');g.translate(7,9);const transform=JSON.stringify(g.getTransform());
  try{drawCinematicWorld(g,{focusX:object.x,focusY:object.y});}catch(e){caught=e.message==='Falha de desenho preparada';}finally{OBJECT_DRAWERS[object.type]=original;}
  return {results,error:{caught,stateSame:before===state(),refsSame:Object.entries(beforeRefs).every(([k,v])=>refs()[k]===v),contextSame:transform===JSON.stringify(g.getTransform())},world:{width:scenes.main.MW*TS,height:scenes.main.MH*TS},scene:currentScene};
 });
 check('Seis fundos reais distintos, inclusive montanha e oásis',result.results.every(r=>r.ok)&&new Set(result.results.map(r=>r.hash)).size===6,result.results);
 check('Capturar desde o interior preserva mundo, jogador, clocks e recompensas',result.scene==='house'&&result.results.every(r=>r.stateSame&&r.refsSame),result);
 check('Contexto e transformações devolvidos a cada captura',result.results.every(r=>r.contextSame));
 check('Falha de um pintor também restaura referências e contexto',Object.values(result.error).every(Boolean),result.error);
 check('Recorte usa dimensões reais do vale',result.world.width===960&&result.world.height===1984,result.world);
 const captures=await page.evaluate(async()=>{for(const b of window.__backgrounds){const r=await fetch('/shot?name=v5-fundo-'+b.id,{method:'POST',body:b.data});if(!r.ok)throw new Error('Captura '+b.id+' falhou');}return window.__backgrounds.map(b=>'site/shots/v5-fundo-'+b.id+'.png');});report.captures=captures;
 // O desenho do mapa durante conversa deve mostrar os interlocutores acima da caixa.
 await page.evaluate(()=>{setSceneTo('main',264,920);const n=FarmStoryIntegration.read().npcs.find(o=>o.npcId==='rosa');player.x=n.x+15;player.y=n.y;A11Y.reduceMotion=true;FarmStoryWorld.interact('rosa');snapCamera();render();});
 const framing=await page.evaluate(()=>{const n=FarmStoryIntegration.read().npcs.find(o=>o.npcId==='rosa'),top=document.querySelector('.vale-dialog-card').getBoundingClientRect().top,canvas=document.getElementById('game').getBoundingClientRect(),scale=Math.max(canvas.width/VW,canvas.height/VH),offset=canvas.top+(canvas.height-VH*scale)/2;return{footY:offset+(n.y+10-_camRenderY)*ZOOM*scale,top,playerY:offset+(player.y+10-_camRenderY)*ZOOM*scale};});
 check('Interlocutores ficam visíveis acima da conversa no desktop',framing.footY<framing.top-15&&framing.footY>110&&framing.playerY<framing.top-15,framing);
 await page.evaluate(async()=>{await fetch('/shot?name=v5-fala-mundo',{method:'POST',body:document.getElementById('game').toDataURL('image/png')});});
 await page.screenshot({path:path.join(out,'fala-enquadrada-1280.png')});report.captures.push('site/shots/v5-fala-mundo.png','analise/cutscenes-v5/fala-enquadrada-1280.png');
})().catch(e=>{report.fatal=e.stack;process.exitCode=1;}).finally(async()=>{await browser?.close();report.pass=!report.fatal&&!report.errors.length&&report.checks.every(c=>c.pass);fs.writeFileSync(path.join(out,'cenarios-v5.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;});
