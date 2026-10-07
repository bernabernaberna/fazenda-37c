/* Atuação e encenação V6.5 na build real. Requer capsrv.py 8766.
   Progresso é preparado somente para inspecionar todas as cenas; este arquivo
   não substitui o percurso narrativo de aceites, ações e entregas reais.
   As capturas exigem inspeção visual: hashes não aprovam qualidade artística. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'analise','atuacao-v65');fs.mkdirSync(dir,{recursive:true});
const base=process.env.FARM37_URL||'http://127.0.0.1:8766';
const report={geradoEm:new Date().toISOString(),metodo:'Edge isolado, RAF suspenso, input real e atualização explícita. Registra argumentos e transformações do desenho original, sem substituir a arte.',checagens:[],erros:[],externos:[],capturas:[],planos:[],limites:['A fixture libera lembranças por restore, sem conceder recompensas. A progressão real é coberta pelas regressões narrativas separadas.','Imagens precisam ser abertas e avaliadas; este teste não atribui uma nota estética por pixels.','Desempenho desta rodada é medido separadamente, sem disputar navegador com esta captura.']};
let browser,page,expectedCast={};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function check(nome,passou,evidencia){report.checagens.push({nome,passou:!!passou,evidencia});assert.ok(passou,nome);}
async function sim(){return page.evaluate(()=>JSON.stringify({scene:currentScene,player,timeOfDay,seasonTimer,currentSeason,currentWeather,weatherTimer,weatherCooldown,story:FarmStoryWorld.serialize(),saga:FarmValleySaga.serialize(),farm:FarmLife.serialize(),npcs:FarmStoryIntegration.navigationState()}));}
async function calls(){return page.evaluate(()=>({info:FarmStoryCinematics.info(),actors:__actingActors,portrait:__actingPortrait,text:document.querySelector('#valeCinema .vc-line').textContent,full:document.querySelector('#valeCinema .vc-sr').textContent}));}
async function frame(dt=0){await page.evaluate(dt=>{__actingActors=[];FarmStoryCinematics.update(dt);},dt);return calls();}
async function capture(name,viewport={width:1280,height:800}){
 await page.setViewportSize(viewport);await frame(0);
 const r=await page.evaluate(async name=>{const c=document.querySelector('#valeCinema .vc-stage'),data=c.toDataURL('image/png'),r=await fetch('/shot?name='+name,{method:'POST',body:data});if(!r.ok)throw Error('Falha em /shot: '+r.status);return{data,canvas:{width:c.width,height:c.height,smoothing:c.getContext('2d').imageSmoothingEnabled},info:FarmStoryCinematics.info()};},name);
 const file=path.join(root,'site','shots',name+'.png'),viewportFile=path.join(dir,name+'-viewport.png');if(r.info.revealed<r.info.total)await reveal();await page.screenshot({path:viewportFile});
 report.capturas.push({name,file,viewportFile,viewport,quadro:'PNG do palco durante fala; viewport após Mostrar fala, para avaliar texto integral.',canvas:r.canvas,SHA256:sha(Buffer.from(r.data.split(',')[1],'base64')),info:r.info});
}
async function start(id){await page.evaluate(id=>{if(FarmStoryCinematics.isOpen())FarmStoryCinematics.close();__actingActors=[];if(!FarmStoryCinematics.play(id,{replay:true}))throw Error('Cena indisponível '+id);},id);return frame(0);}
async function reveal(){await page.locator('#valeCinema .vc-next').click();return frame(0);}
async function close(){if(await page.evaluate(()=>FarmStoryCinematics.isOpen()))await page.keyboard.press('Escape');}
async function runCatalogue(ids,collect){
 for(const id of ids){
  await start(id);let safety=0;
  while(await page.evaluate(()=>FarmStoryCinematics.isOpen())){
   if(++safety>60)throw Error('Cena não terminou: '+id);
   const first=await frame(.08),shot=first.info.shot;
   assert.ok(first.actors.length>=2,'Elenco presente em '+id+'/'+shot);
   assert.deepEqual(first.actors.map(a=>a.id).sort(),expectedCast[id],'Elenco inteiro permanece em todos os planos de '+id+'/'+shot);
   assert.ok(first.actors.every(a=>Number.isFinite(a.feet.x)&&Number.isFinite(a.feet.y)&&a.feet.x>5&&a.feet.x<955&&a.feet.y>35&&a.feet.y<475),'Pés enquadrados em '+id+'/'+shot);
   assert.equal(first.actors.filter(a=>a.speaking).length,first.portrait.speaking?1:0,'Um único falante sincronizado em '+id+'/'+shot);
   assert.ok(first.actors.some(a=>a.id===first.portrait.id),'Falante pertence ao elenco em '+id+'/'+shot);
   if(first.info.prop?.holder){assert.ok(await page.evaluate(kind=>FarmCharacterArt.heldProps?.includes(kind),first.info.prop.kind),'Arte suporta o adereço anunciado em '+id+'/'+shot+': '+first.info.prop.kind);const holders=first.actors.filter(a=>a.heldProp===first.info.prop.kind);assert.equal(holders.length,1,'Um único portador do objeto dramático em '+id+'/'+shot);assert.equal(holders[0].id,first.info.prop.holder,'Adereço permanece com a pessoa que o trouxe');}
   assert.ok(Array.isArray(first.info.actors)&&first.info.actors.length===first.actors.length,'Diagnóstico corresponde ao elenco desenhado em '+id+'/'+shot);
   const ground=await page.evaluate(actors=>actors.map(a=>({id:a.id,blocked:FarmWorldDepth.isBlocked(a.worldX,a.worldY),tile:scenes.main.map[Math.floor((a.worldY+7)/TS)]?.[Math.floor(a.worldX/TS)],solid:[T.WATER,T.RIVER,T.OASIS,T.FENCE,T.FIELD].includes(scenes.main.map[Math.floor((a.worldY+7)/TS)]?.[Math.floor(a.worldX/TS)])})),first.info.actors);
   assert.ok(ground.every(a=>!a.blocked&&!a.solid),'Elenco apoiado em chão navegável em '+id+'/'+shot+': '+JSON.stringify(ground));
   // Regressão observada em a2d1f29b4c: Nico atravessava cabeça/haste do
   // espantalho. O prop não tem colisão física; confrontamos sua área pintada
   // (-7..+7, -7..+16) com o corpo do ator, sem depender de isBlocked.
   const intersections=await page.evaluate(actors=>actors.flatMap(a=>scenes.main.objects.filter(o=>o.type==='scarecrow'&&a.worldX+8>o.x-7&&a.worldX-8<o.x+7&&a.worldY+10>o.y-7&&a.worldY-28<o.y+16).map(o=>({actor:a.id,x:a.worldX,y:a.worldY,scarecrow:{x:o.x,y:o.y}}))),first.info.actors);
   assert.equal(intersections.length,0,'Corpo do ator não cruza a pintura do espantalho em '+id+'/'+shot+': '+JSON.stringify(intersections));
   const speaker=first.info.actors.find(a=>a.id===first.portrait.id),vectors=[[0,1],[-1,0],[1,0],[0,-1]];
   for(const actor of first.info.actors.filter(a=>a.id!==first.portrait.id)){
    const dx=speaker.worldX-actor.worldX,dy=speaker.worldY-actor.worldY,v=vectors[actor.dir];
    assert.ok(v&&dx*v[0]+dy*v[1]>0,'Ouvinte olha para o falante em '+id+'/'+shot+': '+JSON.stringify(actor));
   }
   for(const actor of first.info.actors){const nearest=Math.min(...first.info.actors.filter(a=>a.id!==actor.id).map(a=>Math.hypot(a.worldX-actor.worldX,a.worldY-actor.worldY)));assert.ok(nearest<=80,'Conversação mantém companhia próxima, sem atores isolados do outro lado da rua em '+id+'/'+shot+': '+nearest.toFixed(1));}
   const ended=await reveal();
   assert.equal(ended.info.shot,shot,'Primeiro clique revela a fala sem saltar plano');
   assert.ok(ended.actors.every(a=>!a.speaking)&&!ended.portrait.speaking,'Bocas param depois de Mostrar fala em '+id+'/'+shot);
   assert.deepEqual(ended.info.actors.map(a=>[a.id,a.worldX,a.worldY]),first.info.actors.map(a=>[a.id,a.worldX,a.worldY]),'Respiração e câmera não arrastam os pés sobre o chão');
   await frame(.1);
   if(collect)report.planos.push({id,shot,actors:first.actors,portrait:first.portrait,info:first.info});
   await page.keyboard.press('Enter');
  }
 }
}
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});report.navegador=browser.version();page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.erros.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.setItem('farm37_seen_intro','1');let seed=731947;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin===new URL(base).origin)return r.continue();report.externos.push(u.href);return r.abort();});
 const response=await page.goto(base+'/jogo.html?v=atuacao-v65-'+Date.now());assert.ok(response.ok());report.jogoSHA256=sha(await response.body());
 await page.evaluate(()=>{
  startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryIntegration.reset();FarmStoryCinematics.reset();FarmValleySaga.reset();FarmLife.reset();
  FarmStoryUI.close();FarmValleyPanels.close(false);FarmStoryCinematics.close();histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;
  A11Y.noDeath=true;A11Y.relaxed=true;A11Y.reduceMotion=false;currentWeather=null;weatherCooldown=1e9;timeOfDay=12;currentSeason='hot';isPaused=false;soundEnabled=false;
  player.name='Lua';player.gender='f';player.en=90;player.hyd=90;player.temp=37;player.resting=false;player.moving=false;player.running=false;player.actionTimer=0;
  const story=FarmStoryWorld.serialize();story.main.forEach(r=>{r.status='completed';r.paid=true;});FarmStoryWorld.restore(story);
  const saga=FarmValleySaga.serialize();saga.episodes.forEach(r=>Object.assign(r,{status:'completed',paid:true,choice:0,acceptedAt:0}));FarmValleySaga.restore(saga);
  FarmStoryIntegration.initializeCinematics();FarmStoryCinematics.restore({version:1,seenScenes:[]},{chapterIndex:6});setSceneTo('house',112,86);
  const art=FarmCharacterArt,record=(id,g,a,o)=>{const p=g.getTransform().transformPoint({x:Number.isFinite(o.x)?o.x:a.x,y:(Number.isFinite(o.y)?o.y:a.y)+10});(g.canvas.id==='game'?window.__worldActors:window.__actingActors).push({id,dir:o.facing??a.dir,x:a.x,y:a.y,feet:{x:p.x,y:p.y},speaking:!!o.speaking,expression:o.expression,gesture:o.gesture,gaze:o.gaze,heldProp:o.heldProp,speechTime:o.speechTime,reducedMotion:!!o.reducedMotion});};
  window.__actingActors=[];window.__worldActors=[];window.__actingPortrait=null;window.FarmCharacterArt={...art,
   drawNPC(g,a,o={}){if(g.canvas.id==='game'||g.canvas===document.querySelector('#valeCinema .vc-stage'))record(a.npcId||a.id,g,a,o);return art.drawNPC(g,a,o);},
   drawPlayer(g,a,o={}){if(g.canvas.id==='game'||g.canvas===document.querySelector('#valeCinema .vc-stage'))record('player',g,a,o);return art.drawPlayer(g,a,o);},
   drawPortrait(c,id,o={}){if(c===document.querySelector('#valeCinema .vc-portrait'))window.__actingPortrait={id,speaking:!!o.speaking,expression:o.expression,gesture:o.gesture,speechTime:o.speechTime,reducedMotion:!!o.reducedMotion};return art.drawPortrait(c,id,o);}
  };
 });
 const catalogue=await page.evaluate(()=>FarmStoryCinematics.catalogue());check('Catálogo integrado libera as seis cenas e oito episódios da saga',catalogue.length===14&&catalogue.every(f=>f.available),catalogue.map(f=>f.id));
 expectedCast=await page.evaluate(()=>Object.fromEntries(Object.entries({carta:['rosa','player'],horta:['nico','rosa','player'],rio:['lia','player'],abrigo:['ines','tomas','player'],oasis:['caio','nico','player'],reabertura:['rosa','lia','tomas','ines','caio','nico'],...Object.fromEntries(FarmValleySaga.cinematicScenes().map(f=>[f.id,f.cast]))}).map(([id,cast])=>[id,[...new Set(cast)].sort()])));
 const ids=catalogue.map(f=>f.id),before=await sim();await start('carta');
 await page.keyboard.down('d');await page.evaluate(()=>{for(let i=0;i<30;i++){update(.05);updateWeather(.05);}});await page.keyboard.up('d');
 check('Cena aberta desde o interior pausa mundo, jogador, recursos e relógios',before===await sim());
 await close();check('Esc encerra a cena e devolve foco ao jogo',await page.evaluate(()=>!FarmStoryCinematics.isOpen()&&document.activeElement.id==='game'));
 check('Pular registra apenas a lembrança e preserva recompensas e progresso',before===await sim()&&await page.evaluate(()=>FarmStoryCinematics.serialize().seenScenes.includes('carta')));
 await runCatalogue(ids,true);check('Todos os planos enquadram elenco e sincronizam bocas com a fala',true,{planos:report.planos.length});
 check('Rever todas as cenas preserva estado da partida e recompensas',before===await sim());
 const cacheWarm=await page.evaluate(()=>FarmCharacterArt.cacheInfo());await runCatalogue(ids,false);const cacheAgain=await page.evaluate(()=>FarmCharacterArt.cacheInfo());
 check('Repetir os mesmos planos mantém os caches estáveis e dentro dos limites',JSON.stringify(cacheWarm)===JSON.stringify(cacheAgain)&&cacheAgain.sprites<=cacheAgain.maxSprites&&cacheAgain.portraits<=cacheAgain.maxPortraits&&cacheAgain.speechBanks<=cacheAgain.maxSpeechBanks,{cacheWarm,cacheAgain});
 const captures=['carta','horta','rio','abrigo','oasis','reabertura',ids.find(x=>x.startsWith('saga-')),ids.at(-1)];
 for(const id of [...new Set(captures)]){await start(id);await frame(.1);await capture('atuacao-v65-'+id+'-1280x800');await close();}
 for(const viewport of [{width:1024,height:640},{width:390,height:844}]){await start('reabertura');await frame(.1);await capture('atuacao-v65-reabertura-'+viewport.width+'x'+viewport.height,viewport);const fit=await page.locator('#valeCinema .vc-film').evaluate(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight};});check('Cena e controles cabem em '+viewport.width+'x'+viewport.height,fit.x>=-1&&fit.y>=-1&&fit.right<=fit.width+1&&fit.bottom<=fit.height+1,fit);await close();}
 await page.setViewportSize({width:1280,height:800});
 await page.evaluate(()=>{const n=FarmStoryIntegration.read().npcs.find(o=>o.npcId==='rosa');setSceneTo('main',n.x+15,n.y);player.moving=false;player.running=false;player.resting=false;document.getElementById('game').focus();window.__dirsBefore={player:player.dir,rosa:n.dir};});
 await page.keyboard.press('e');
 const worldTalk=await page.evaluate(()=>{FarmStoryUI.update(.1);window.__worldActors=[];snapCamera();render();return{speaker:FarmStoryUI.presentation()?.npcId,actors:__worldActors.filter(a=>a.id==='player'||a.id==='rosa'),dirsBefore:__dirsBefore,dirsAfter:{player:player.dir,rosa:FarmStoryIntegration.read().npcs.find(o=>o.npcId==='rosa').dir}};});
 check('Conversa por E orienta Rosa e protagonista um para o outro sem alterar a direção da simulação',worldTalk.speaker==='rosa'&&worldTalk.actors.find(a=>a.id==='rosa')?.dir===2&&worldTalk.actors.find(a=>a.id==='player')?.dir===1&&JSON.stringify(worldTalk.dirsBefore)===JSON.stringify(worldTalk.dirsAfter),worldTalk);
 await page.evaluate(async()=>{const r=await fetch('/shot?name=atuacao-v65-conversa-mundo',{method:'POST',body:document.getElementById('game').toDataURL('image/png')});if(!r.ok)throw Error('Falha captura da conversa');});await page.screenshot({path:path.join(dir,'atuacao-v65-conversa-mundo-viewport.png')});report.capturas.push({name:'conversa-mundo',file:path.join(root,'site/shots/atuacao-v65-conversa-mundo.png'),viewportFile:path.join(dir,'atuacao-v65-conversa-mundo-viewport.png')});
 await page.keyboard.press('Escape');
 await page.setViewportSize({width:1280,height:800});await page.evaluate(()=>A11Y.reduceMotion=true);await start('rio');
 const reducedBefore=await page.evaluate(()=>({stage:document.querySelector('.vc-stage').toDataURL(),portrait:document.querySelector('.vc-portrait').toDataURL(),text:document.querySelector('.vc-line').textContent,full:document.querySelector('.vc-sr').textContent}));
 await page.evaluate(()=>{for(let i=0;i<80;i++)FarmStoryCinematics.update(.05);});
 const reducedAfter=await page.evaluate(()=>({stage:document.querySelector('.vc-stage').toDataURL(),portrait:document.querySelector('.vc-portrait').toDataURL()}));
 check('Reduzir movimento mostra fala completa e congela palco e retrato',reducedBefore.full.endsWith(reducedBefore.text)&&reducedBefore.text.length>20&&reducedBefore.stage===reducedAfter.stage&&reducedBefore.portrait===reducedAfter.portrait);
 await page.keyboard.press('Enter');check('Reduzir movimento avança diretamente sem clique extra de revelação',(await calls()).info.shot===1);await close();
 const savedSeen=await page.evaluate(()=>{saveGame(true);return FarmStoryCinematics.serialize();});await page.reload();await page.locator('#continueBtn').click();
 check('Continuar preserva lembranças vistas e não reabre a cena',await page.evaluate(expected=>JSON.stringify(FarmStoryCinematics.serialize())===JSON.stringify(expected)&&!FarmStoryCinematics.isOpen(),savedSeen));
 check('Sem erros JavaScript nem dependências de rede externas',report.erros.length===0&&report.externos.length===0,{erros:report.erros,externos:report.externos});
})().catch(e=>{report.falha=e.stack;process.exitCode=1;}).finally(async()=>{await browser?.close();report.passou=!report.falha&&!report.erros.length&&report.checagens.every(c=>c.passou);fs.writeFileSync(path.join(dir,'encenacao-v65.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passou:report.passou,checagens:report.checagens.length,planos:report.planos.length,capturas:report.capturas.length,erros:report.erros,falha:report.falha}));if(!report.passou)process.exitCode=1;});
