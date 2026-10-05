/* Descanso real: poses de apoio, ancoragem na cama, teclado e save legado.
   REST_SOURCE=1 permite validar só a arte antes da integração do build.
   --sprites-only isola a arte; o modo padrão exige os hooks reais do jogo. */
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/descanso-v4');fs.mkdirSync(out,{recursive:true});
const label=process.env.REST_LABEL||'atual',spriteOnly=process.argv.includes('--sprites-only');
const report={date:new Date().toISOString(),mode:process.env.REST_SOURCE==='1'?'Fonte28 injetada no build':'Build integrada',checks:[],errors:[],captures:[],limits:['Posições de teste preparadas; teclado/update/render reais.','As capturas precisam de inspeção visual; contagens não medem beleza.']};let browser,page;
const check=(name,pass,evidence)=>report.checks.push({name,pass:!!pass,evidence});
const shot=async name=>{const file=name+'-'+label+'.png';await page.screenshot({path:path.join(out,file)});report.captures.push(file);};
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.clear();localStorage.setItem('farm37_seen_intro','1');});
 const response=await page.goto((process.env.FARM37_URL||'http://127.0.0.1:8766')+'/jogo.html?v=descanso-v4-'+Date.now());report.sha256=createHash('sha256').update(await response.body()).digest('hex');
 const source=fs.readFileSync(path.join(root,'src/modules/28-character-art.js'),'utf8');report.source28SHA256=createHash('sha256').update(source).digest('hex');if(process.env.REST_SOURCE==='1')await page.addScriptTag({content:source});
 const art=await page.evaluate(()=>{
  const base={x:48,y:52,gender:'f',hat:true,temp:37,dir:0,resting:true,restTimer:4,gaitBlend:1,gaitRunBlend:1,anim:3};
  const make=(actor={},opts={},npc=false)=>{const c=document.createElement('canvas');c.width=96;c.height=96;FarmCharacterArt[npc?'drawNPC':'drawPlayer'](c.getContext('2d'),{...base,...actor},{time:1000,restBlend:1,...opts});return c;};
  const bytes=c=>c.getContext('2d').getImageData(0,0,96,96).data;
  const hash=c=>{let h=2166136261;for(const v of bytes(c))h=Math.imul(h^v,16777619);return h>>>0;};
  const crop=(c,y0,y1)=>{let h=2166136261;const b=bytes(c);for(let y=y0;y<y1;y++)for(let x=0;x<96;x++)for(let k=0;k<4;k++)h=Math.imul(h^b[(y*96+x)*4+k],16777619);return h>>>0;};
  const calm=[.7,2].map(restTimer=>make({restTimer})),feet=calm.map(c=>crop(c,60,66));
  const reduced=[0,.1,2,4,5,10].map(restTimer=>hash(make({restTimer},{reducedMotion:true})));const rests=[];
  for(const mode of ['sit','bed'])for(const gender of ['m','f'])for(const dir of [0,1,2,3]){const c=make({dir,gender},{restMode:mode});const b=bytes(c);let border=0,below=0;for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(b[(y*96+x)*4+3]){if(x===0||y===0||x===95||y===95)border++;if(y>62)below++;}rests.push({mode,gender,dir,border,below});}
  const plain=hash(make({hat:false})),equipment=['hat','coatEquipped','scarf','boots','glovesEquipped','blanketEquipped'].map(key=>({key,changes:hash(make({hat:false,[key]:true}))!==plain}));
  const npc=FarmCharacterArt.keys.map(npcId=>({npcId,changes:hash(make({resting:false,npcId,npcActivity:'rest',activityPhase:.7}, {},true))!==hash(make({resting:false,npcId,npcActivity:'rest',activityPhase:2}, {},true))}));
  const sheet=document.createElement('canvas');sheet.width=1200;sheet.height=624;const g=sheet.getContext('2d');g.fillStyle='#dce3cd';g.fillRect(0,0,sheet.width,sheet.height);g.fillStyle='#183b36';g.font='20px Segoe UI';g.fillText('Descanso autoral: pés apoiados, olhos fechados, respiração calma',18,28);g.imageSmoothingEnabled=false;
  for(const [row,mode]of ['sit','bed'].entries())for(const dir of [0,1,2,3]){g.drawImage(make({dir},{restMode:mode}),20+dir*290,36+row*160,192,192);g.fillStyle='#183b36';g.font='15px Segoe UI';g.fillText((mode==='bed'?'Deitado':'Sentado')+' · '+['frente','esquerda','direita','costas'][dir],25+dir*290,58+row*160);}
  for(let i=0;i<6;i++){const id=FarmCharacterArt.keys[i];g.drawImage(make({resting:false,npcId:id,npcActivity:'rest',activityPhase:4,gender:'m'}, {},true),8+i*198,365,160,160);g.fillStyle='#183b36';g.fillText(FarmCharacterArt.definitions[id].name,20+i*198,554);}
  return{breathHashes:calm.map(hash),feet,reduced,rests,equipment,npc,cache:FarmCharacterArt.cacheInfo(),sheet:sheet.toDataURL()};
 });
 check('Respiração muda tórax/roupa sem congelar o descanso',new Set(art.breathHashes).size===2,art.breathHashes);
 check('Pés e contato ficam imóveis durante a respiração',new Set(art.feet).size===1,art.feet);
 check('Redução de movimento conserva pose estável inclusive entrada',new Set(art.reduced).size===1,art.reduced);
 check('Nenhum descanso recorta margem do sprite',art.rests.every(r=>r.border===0),art.rests);
 check('Cama não projeta sombra no piso abaixo do colchão',art.rests.filter(r=>r.mode==='bed').every(r=>r.below===0),art.rests.filter(r=>r.mode==='bed'));
 check('Seis equipamentos continuam distintos ao sentar',art.equipment.every(r=>r.changes),art.equipment);
 check('Seis moradores têm descanso com respiração própria',art.npc.every(r=>r.changes),art.npc);
 check('Cache finito conserva limite de768sprites',art.cache.sprites<=art.cache.maxSprites,art.cache);
 const sheet='poses-'+label+'.png';fs.writeFileSync(path.join(out,sheet),Buffer.from(art.sheet.split(',')[1],'base64'));report.captures.push(sheet);
 if(spriteOnly)return;
 await page.evaluate(()=>{startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();soundEnabled=false;isPaused=false;histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;A11Y.noDeath=true;currentWeather=null;weatherCooldown=1e8;currentSeason='hot';timeOfDay=11;});
 const read=()=>page.evaluate(()=>{const info=window.FarmRestVisual?.info();return{resting:player.resting,timer:player.restTimer,blend:info?.blend??null,context:info?.scene?{scene:info.scene,type:info.bed}:null,x:player.x,y:player.y,anim:player.anim};});
 const step=(n=1,dt=1/60)=>page.evaluate(({n,dt})=>{for(let i=0;i<n;i++)update(dt);render();},{n,dt});
 for(const name of ['house','barn']){
  const prepared=await page.evaluate(name=>{setSceneTo(name);const bed=objects.find(o=>['i_bed','b_cot'].includes(o.type));if(!bed)throw Error('Cama ausente');player.x=bed.x+bed.w+1;player.y=bed.y+bed.h/2;player.resting=false;player.restTimer=0;player.gaitBlend=0;player.actionTimer=0;player.temp=37;player.hyd=100;player.en=75;_camSnap=true;render();return{bed:{x:bed.x,y:bed.y,w:bed.w,h:bed.h},x:player.x,y:player.y,free:!furnitureCollides(player.x,player.y)};},name);
  check('Posição de interação acessível ao lado da cama de '+name,prepared.free,prepared);
  await page.keyboard.press('e');await step(20);const entered=await read();check('E inicia repouso ancorado na cama de '+name,entered.resting&&entered.context?.type===(name==='house'?'i_bed':'b_cot')&&entered.blend>.95&&entered.x===prepared.x&&entered.y===prepared.y,{prepared,entered});
  await step(200);
  const anchor=await page.evaluate(()=>{
   const bed=objects.find(o=>o.type===window.FarmRestVisual?.info().bed);if(!bed)return{pass:false,reason:'Contexto de cama ausente'};
   const art=FarmCharacterArt,bedDrawer=OBJECT_DRAWERS[bed.type],playerDrawer=OBJECT_DRAWERS.player,order=[];let options;
   window.FarmCharacterArt={...art,drawPlayer(g,a,opts){options={...opts};return art.drawPlayer(g,a,opts);}};
   OBJECT_DRAWERS[bed.type]=(o,g)=>{if(o===bed)order.push('bed');bedDrawer(o,g);};
   OBJECT_DRAWERS.player=(o,g)=>{order.push('player');if(playerDrawer)playerDrawer(o,g);else drawPlayer();};
   try{render();}finally{window.FarmCharacterArt=art;OBJECT_DRAWERS[bed.type]=bedDrawer;if(playerDrawer)OBJECT_DRAWERS.player=playerDrawer;else delete OBJECT_DRAWERS.player;}
   const target={x:bed.x+bed.w/2,y:bed.y+bed.h-15};
   return{pass:options?.restMode==='bed'&&Math.abs(options.x-target.x)<=1&&Math.abs(options.y-target.y)<=1&&order.indexOf('bed')<order.indexOf('player'),target,options,order};
  });
  check('Colchão recebe pose na âncora e depois do móvel de '+name,anchor.pass,anchor);
  await shot('cama-'+name);await page.keyboard.down('d');await step();const exitStart=await read();await step(20);await page.keyboard.up('d');const exited=await read();check('WASD levanta e retoma passagem de '+name,!exitStart.resting&&exitStart.blend>0&&exitStart.blend<1&&!exited.resting&&exited.context===null&&Math.hypot(exited.x-entered.x,exited.y-entered.y)>1,{exitStart,exited});
 }
 for(const name of ['greenhouse','main']){
  await page.evaluate(name=>{setSceneTo(name);if(name==='greenhouse'){player.x=15*TS+8;player.y=9*TS+8;}player.dir=0;player.resting=false;player.restTimer=0;player.gaitBlend=0;player.actionTimer=0;player.temp=37;player.en=100;player.hyd=100;_camSnap=true;},name);
  await page.keyboard.press('r');await step(220);const rested=await read();await shot('sentado-'+name);check('R senta no ambiente '+name,rested.resting&&rested.blend>.95&&!rested.context?.type,rested);
  await page.keyboard.press('r');await step(20);const ended=await read();check('R encerra descanso em '+name,!ended.resting&&ended.blend===0&&ended.context===null,ended);
 }
 await page.evaluate(()=>{setSceneTo('house');const bed=objects.find(o=>o.type==='i_bed');player.x=bed.x+bed.w+1;player.y=bed.y+bed.h/2;player.resting=false;player.restTimer=0;player.actionTimer=0;A11Y.reduceMotion=true;});
 await page.keyboard.press('e');await step();const reduceStart=await page.evaluate(()=>({info:FarmRestVisual.info(),pose:FarmRestVisual.pose(player,currentScene)}));await step(60);const reduceAfter=await page.evaluate(()=>({info:FarmRestVisual.info(),pose:FarmRestVisual.pose(player,currentScene)}));
 check('Movimento reduzido assenta direto sem deslizar até o colchão',reduceStart.info.blend===1&&reduceStart.pose.x===reduceAfter.pose.x&&reduceStart.pose.y===reduceAfter.pose.y,{reduceStart,reduceAfter});
 await page.keyboard.press('r');await step();const reduceExit=await read();check('Movimento reduzido encerra direto sem pose transitória',!reduceExit.resting&&reduceExit.blend===0&&reduceExit.context===null,reduceExit);await page.evaluate(()=>A11Y.reduceMotion=false);
 const save=await page.evaluate(()=>{saveGame(true);const old=JSON.parse(localStorage.getItem(SAVE_KEY)),transientSaved='restContext' in old.player||'restBlend' in old.player;delete old.player.restContext;delete old.player.restBlend;old.player.resting=true;old.player.restTimer=4;loadGameFromData(old);render();return{resting:player.resting,info:window.FarmRestVisual?.info(),transientSaved,finite:Number.isFinite(player.x)&&Number.isFinite(player.y)};});
 check('Save antigo não prende âncora de cama nem torna posição inválida',save.finite&&!save.info?.bed&&save.info?.blend===0,save);
 check('Save persiste só gameplay, sem contexto visual transitório',!save.transientSaved,save);
 const scene=await page.evaluate(()=>{toggleRest();for(let i=0;i<20;i++)update(1/60);setSceneTo('house');return{resting:player.resting,info:window.FarmRestVisual?.info()};});
 check('Trocar cena limpa pose e âncora transitórias',!scene.resting&&!scene.info?.scene&&scene.info?.blend===0,scene);
})().catch(e=>report.fatal=e.stack).finally(async()=>{if(browser)await browser.close();check('Sem erros JavaScript',report.errors.length===0,report.errors);report.status=report.fatal||report.checks.some(c=>!c.pass)?'FALHA':'OK';fs.writeFileSync(path.join(out,'descanso-'+label+'.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks.length,failed:report.checks.filter(c=>!c.pass),fatal:report.fatal,sha256:report.sha256,source28SHA256:report.source28SHA256,captures:report.captures},null,2));if(report.status!=='OK')process.exitCode=1;});
