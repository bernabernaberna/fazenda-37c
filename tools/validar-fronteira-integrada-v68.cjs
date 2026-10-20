/* Integração independente da expansão: posição/recursos são preparados,
   trabalho usa funções reais e os botões passam pela UI existente. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/fronteira-v68');fs.mkdirSync(out,{recursive:true});
const report={checks:[],errors:[],captures:[]};let browser,page;
const check=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});if(!pass)throw Error(name);};
async function choice(id){await page.locator('[data-vale-choice="'+id+'"]').click();}
async function close(){await page.evaluate(()=>{FarmStoryUI.close();FarmStoryCinematics.close();FarmValleyPanels.close(false);FarmWorldMap.close();});}
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:1280,height:800}});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='warning'&&/erro ao registrar|erro \(late\)/.test(m.text()))report.errors.push(m.text());});
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.setItem('farm37_seen_intro','1');});
 const response=await page.goto((process.env.FARM37_URL||'http://127.0.0.1:8766')+'/jogo.html?v=fronteira-'+Date.now());report.sha256=crypto.createHash('sha256').update(await response.body()).digest('hex');
 await page.evaluate(()=>{startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();FarmStoryIntegration.restore(FarmStoryWorld.serialize());FarmStoryCinematics.reset();isPaused=false;soundEnabled=false;histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;A11Y.noDeath=true;A11Y.relaxed=true;currentWeather=null;weatherCooldown=1e8;currentSeason='hot';timeOfDay=8;});
 const initial=await page.evaluate(()=>({width:MW,height:MH,npcs:FarmStoryIntegration.read().npcs.map(o=>o.npcId),scenes:FarmStoryCinematics.catalogue().filter(c=>c.id.startsWith('frontier-'))}));
 check('Mundo96×124, nove moradores e duas cenas fechadas por missão',initial.width===96&&initial.height===124&&new Set(initial.npcs).size===9&&initial.scenes.length===2&&initial.scenes.every(c=>!c.available),initial);
 await page.evaluate(()=>{const n=FarmStoryIntegration.read().npcs.find(n=>n.npcId==='bia');player.x=n.x-12;player.y=n.y;tryInteract();});
 check('E perto de Bia abre sua conversa real',(await page.evaluate(()=>FarmStoryWorld.currentDialogue()?.npcId))==='bia');
 await choice('frontier:mission:bia-nomes:offer');await choice('frontier:mission:bia-nomes:accept:1');await close();
 const baseCoins=await page.evaluate(()=>player.coins);
 await page.evaluate(()=>{const p=FarmOpenWorld.landmarks.find(p=>p.id==='open_seed_memory');player.x=p.x;player.y=p.y;tryInteract();});
 await choice('frontier:survey:open_seed_memory');await close();
 const planted=await page.evaluate(()=>{
  const fields=[];for(let y=42;y<82&&fields.length<3;y++)for(let x=0;x<60&&fields.length<3;x++)if(map[y][x]===T.FIELD&&!FarmWorldDepth.isBlocked(x*TS+8,y*TS+8))fields.push({x,y});
  player.inv.seeds.tomato=20;player.selectedSeed='tomato';player.en=100;
  for(const f of fields){player.x=f.x*TS+8;player.y=f.y*TS+8;setCrop(f.x,f.y,null);plantCrop();waterCrop();waterCrop();}
  return {mission:FarmFrontierStory.snapshot().arcs.find(a=>a.npcId==='bia').missions[0],seeds:player.inv.seeds.tomato,coins:player.coins};
 });
 check('Três plantios e primeiras regas reais cumprem o acordo; rega extra não duplica',planted.mission.status==='ready'&&planted.mission.objectives.find(g=>g.id==='plant').n===3&&planted.mission.objectives.find(g=>g.id==='water').n===3&&planted.seeds===17&&planted.coins===baseCoins,planted);
 await page.evaluate(()=>{FarmStoryWorld.interact('bia');});await choice('frontier:mission:bia-nomes:offer');await choice('frontier:mission:bia-nomes:claim');
 const paid=await page.evaluate(()=>({coins:player.coins,text:FarmStoryWorld.currentDialogue().text,state:FarmFrontierStory.serialize()}));
 check('Entrega explícita paga18 e reconhece autoria coletiva',paid.coins===baseCoins+18&&/nomes diferentes/.test(paid.text)&&paid.state.missions['bia-nomes'].paid,paid.text);
 await page.screenshot({path:path.join(out,'bia-conclusao-desktop.png')});report.captures.push('bia-conclusao-desktop.png');await close();
 await page.evaluate(()=>{FarmStoryWorld.interact('bia');FarmStoryWorld.choose('frontier:mission:bia-nomes:claim');});
 check('Botão antigo não repete a recompensa',(await page.evaluate(()=>player.coins))===paid.coins);await close();
 const pause=await page.evaluate(()=>{
  const before=FarmFrontierStory.serialize().surveys.open_seed_memory.cooldown;
  FarmStoryUI.open();for(let i=0;i<60;i++)update(1/60);FarmStoryUI.close();const book=FarmFrontierStory.serialize().surveys.open_seed_memory.cooldown;
  histologyMissionOpen=true;for(let i=0;i<60;i++)update(1/60);histologyMissionOpen=false;const quiz=FarmFrontierStory.serialize().surveys.open_seed_memory.cooldown;
  return{before,book,quiz};
 });check('Cooldown das observações pausa no diário e quiz',pause.before===pause.book&&pause.before===pause.quiz&&pause.before>0,pause);
 const saved=await page.evaluate(()=>{player.x=1240;player.y=952;FarmPlayerActions.reset(player);saveGame(true);return JSON.parse(localStorage.getItem(SAVE_KEY));});
 await page.reload();await page.evaluate(()=>{loadGame();startGame(false);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();isPaused=false;soundEnabled=false;});
 const loaded=await page.evaluate(()=>({version:JSON.parse(localStorage.getItem(SAVE_KEY)).version,x:player.x,y:player.y,coins:player.coins,state:FarmFrontierStory.serialize(),npcs:FarmStoryIntegration.read().npcs.length,world:scenes.main.MW}));
 check('Reload mantém posição leste, escolha, recompensa e cooldown sem mudar savev2',loaded.version===2&&loaded.x===saved.player.x&&loaded.y===saved.player.y&&loaded.coins===saved.player.coins&&loaded.npcs===9&&loaded.world===96&&JSON.stringify(loaded.state)===JSON.stringify(saved.frontierStory));
 const legacy=await page.evaluate(saved=>{const old=JSON.parse(JSON.stringify(saved));delete old.frontierStory;loadGameFromData(old);return{coins:player.coins,inv:player.inv,state:FarmFrontierStory.serialize(),story:FarmStoryWorld.serialize()};},saved);
 check('Save sem extensão carrega sem perder inventário ou jornada',legacy.coins===saved.player.coins&&JSON.stringify(legacy.inv)===JSON.stringify(saved.player.inv)&&legacy.state.met.length===0&&JSON.stringify(legacy.story)===JSON.stringify(saved.storyWorld));
 await page.evaluate(saved=>{loadGameFromData(saved);FarmStoryUI.close();FarmStoryCinematics.reset();},saved);
 const regions=await page.evaluate(()=>{timeOfDay=8;for(let i=0;i<8;i++)FarmStoryIntegration.update(.1);return FarmStoryIntegration.read().npcs.filter(n=>['helena','davi','bia'].includes(n.npcId)).map(n=>({id:n.npcId,region:n.region}));});
 check('Rotinas conservam a região dos novos moradores',regions.every(n=>n.region===(n.id==='davi'?'wetland':'forest')),regions);
 const thermal=await page.evaluate(()=>{
  const a=Array.from({length:25},(_,i)=>{player.x=(60+i/4)*TS;player.y=59*TS;return getZoneThermal().tempDelta;});
  const b=Array.from({length:41},(_,i)=>{player.x=78*TS;player.y=(78+i/4)*TS;return getZoneThermal().tempDelta;});
  return{a,b,mixes:['forest','wetland'].map(region=>AmbientSynth.mixScene({weights:[[region,1]],timeOfDay:12,cold:false,riverProximity:.5}))};
 });
 check('Gradientes leste e mata/vereda suaves, sem valores inválidos',thermal.a.every((n,i)=>Number.isFinite(n)&&(!i||Math.abs(n-thermal.a[i-1])<.002))&&thermal.b.every((n,i)=>Number.isFinite(n)&&(!i||Math.abs(n-thermal.b[i-1])<.007)),thermal);
 check('Novos biomas recebem mistura sonora própria',thermal.mixes.every(m=>Object.values(m.loops).every(Number.isFinite)&&m.river>0)&&thermal.mixes[0].loops.birds_loop>thermal.mixes[1].loops.birds_loop);
 // Estado de ato concluído preparado: o teste abaixo verifica portão/reprise,
 // não substitui o percurso das8missões coberto na suíte narrativa.
 const unlocked=await page.evaluate(()=>{
  const data=FarmFrontierStory.serialize();data.sequence=100;data.met.push('helena');
  for(const id of ['helena-riscos','helena-recado','helena-margem'])data.missions[id]={status:'completed',choice:0,acceptedAt:1,counts:{},paid:true};
  FarmFrontierStory.restore(data);FarmStoryIntegration.restore(FarmStoryWorld.serialize());FarmStoryCinematics.reset();return FarmStoryCinematics.catalogue().filter(s=>s.id.startsWith('frontier-'));
 });check('Cenas só desbloqueiam com missões concluídas',unlocked.every(c=>c.available));
 for(const id of ['frontier-reencontro','frontier-margem']){
  const before=await page.evaluate(()=>JSON.stringify({coins:player.coins,story:FarmFrontierStory.serialize(),x:player.x,y:player.y}));
  check(id+' abre',await page.evaluate(id=>FarmStoryCinematics.play(id,{replay:true}),id));
  await page.evaluate(()=>FarmStoryCinematics.update(.3));await page.screenshot({path:path.join(out,id+'.png')});report.captures.push(id+'.png');
  const frame=await page.evaluate(()=>FarmStoryCinematics.info());check(id+' usa atores e cenário de verdade',frame.layers>0&&frame.actors.length>=2&&frame.camera,frame);
  await page.keyboard.press('Escape');const after=await page.evaluate(()=>JSON.stringify({coins:player.coins,story:FarmFrontierStory.serialize(),x:player.x,y:player.y}));check(id+' pode ser pulada sem mover/pagar/avançar',before===after);
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{FarmStoryWorld.interact('helena');});await page.screenshot({path:path.join(out,'helena-mobile.png')});report.captures.push('helena-mobile.png');
 check('Sem erros JavaScript nem falhas silenciosas de módulos',!report.errors.length,report.errors);
 report.pass=true;
})().catch(e=>{report.fatal=e.stack;report.pass=false;process.exitCode=1;}).finally(async()=>{await browser?.close();fs.writeFileSync(path.join(out,'integracao.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,checks:report.checks.length,failed:report.checks.filter(c=>!c.pass),fatal:report.fatal,sha256:report.sha256},null,2));});
