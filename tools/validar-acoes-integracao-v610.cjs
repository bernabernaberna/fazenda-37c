/* Seis atividades reais, efeitos econômicos, pausa e save. Posições são
   preparadas; a entrada e a simulação são as mesmas usadas ao jogar. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/acoes-v610');fs.mkdirSync(out,{recursive:true});
const report={date:new Date().toISOString(),checks:[],errors:[]};let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:800}});
 page.on('pageerror',e=>report.errors.push(e.message));await page.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.clear();localStorage.setItem('farm37_seen_intro','1');});
 const response=await page.goto((process.env.FARM37_URL||'http://127.0.0.1:8766')+'/jogo.html?v=acoes-integracao-'+Date.now());
 report.sha256=crypto.createHash('sha256').update(await response.body()).digest('hex');
 await page.evaluate(()=>{startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();FarmStoryCinematics.reset();soundEnabled=false;isPaused=false;histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;A11Y.noDeath=true;A11Y.relaxed=true;currentWeather=null;weatherCooldown=1e8;currentSeason='hot';timeOfDay=11;});
 report.checks=await page.evaluate(()=>{
  const checks=[],check=(name,pass,evidence)=>{checks.push({name,pass:!!pass,evidence});if(!pass)throw Error(name);};
  const clear=()=>{FarmPlayerActions.reset(player);FarmAnimalCare.close();FarmStoryUI.close();FarmValleyPanels.close(false);player.resting=false;player.temp=37;player.en=80;player.hyd=60;player.dead=false;A11Y.reduceMotion=false;for(const k of Object.keys(keys))delete keys[k];};
  clear();const fieldsBefore=Object.keys(player).sort();
  let field=null;for(let y=0;y<MH&&!field;y++)for(let x=0;x<MW&&!field;x++)if(map[y][x]===T.FIELD&&!FarmWorldDepth.isBlocked(x*TS+8,y*TS+8))field={x,y};
  if(!field)throw Error('Campo livre ausente');
  player.x=field.x*TS+8;player.y=field.y*TS+8;setCrop(field.x,field.y,null);player.selectedSeed='tomato';player.inv.seeds.tomato=10;
  const position={x:player.x,y:player.y};plantCrop();
  check('Plantar consome uma semente e mostra gesto no tile real',player.inv.seeds.tomato===9&&getCrop(field.x,field.y).stage===1&&FarmPlayerActions.info().kind==='plant'&&FarmPlayerActions.pose(player,currentScene).actionTarget.x===position.x);
  check('A encenação não desloca jogador nem acrescenta campos ao save',position.x===player.x&&position.y===player.y&&JSON.stringify(fieldsBefore)===JSON.stringify(Object.keys(player).sort()));
  clear();waterCrop();check('Regar preserva água, energia e alvo',getCrop(field.x,field.y).water===1&&player.en===79&&FarmPlayerActions.info().kind==='water');
  waterCrop();clear();const energy=player.en;waterCrop();check('Rega recusada não cria ação nem desconta energia',!FarmPlayerActions.info()&&player.en===energy);
  getCrop(field.x,field.y).stage=3;const veg=player.inv.veg||0,seeds=player.inv.seeds.tomato;harvestCrop();
  check('Colheita paga uma vez e usa seu gesto',!getCrop(field.x,field.y)&&(player.inv.veg||0)===veg+1&&player.inv.seeds.tomato===seeds+2&&FarmPlayerActions.info().kind==='harvest');
  clear();const after=player.inv.veg;harvestCrop();check('Colheita vazia não repaga nem anima',player.inv.veg===after&&!FarmPlayerActions.info());
  const pile=objects.find(o=>o.type==='woodpile');player.x=pile.x;player.y=pile.y;const wood=player.inv.wood||0;tryInteract();
  check('Coleta real retira lenha e aponta para a pilha',player.inv.wood===wood+1&&FarmPlayerActions.info()?.kind==='collect'&&FarmPlayerActions.pose(player,currentScene).actionTarget.x===pile.x);
  clear();A11Y.reduceMotion=true;let animal=objects.find(o=>o.type==='animal'&&o.kind==='cow'),found=false;
  for(let d=16.2;d<=26&&!found;d+=2)for(let n=0;n<32&&!found;n++){const angle=n*Math.PI/16,x=animal.x+Math.cos(angle)*d,y=animal.y+Math.sin(angle)*d;if(FarmWorldDepth.isBlocked(x,y)||FarmAnimalLife.blocksPlayer(x,y,null,objects))continue;player.x=x;player.y=y;found=FarmAnimalCare.target()===animal&&!nearObj(['door_house','door_barn'],22);}
  if(!found)throw Error('Sem posição para alimentar');player.inv.hay=2;animal.well=.5;tryInteract();document.querySelector('#animalCare [data-care=feed]')?.click();
  check('Alimentação por E mantém custo e anima o animal correto',player.inv.hay===1&&animal.well===1&&FarmPlayerActions.info()?.kind==='feed'&&FarmPlayerActions.pose(player,currentScene).actionTarget.x===animal.x);
  clear();setSceneTo('barn');const trough=objects.find(o=>o.type==='b_trough');trough.fillLevel=0;player.inv.hay=4;const herd=scenes.main.objects.filter(o=>o.type==='animal');herd.forEach((a,i)=>a.well=.1+i*.1);handleFeedTrough(trough);
  check('Cocho usa o mesmo gesto e mantém transferência',player.inv.hay===1&&trough.fillLevel===0&&herd.slice(0,3).every(a=>a.well===1)&&herd[3].well===.4&&FarmPlayerActions.info()?.kind==='feed');
  setSceneTo('main');clear();const spot=objects.find(o=>o.type==='fishing_spot');player.x=spot.x-8;player.y=spot.y;
  const originalNow=Object.getOwnPropertyDescriptor(performance,'now'),random=Math.random;Object.defineProperty(performance,'now',{configurable:true,value:()=>10000});Math.random=()=>.1;
  try{
   spot.fishCooldown=0;handleFishing(spot);const pose=FarmPlayerActions.pose(player,currentScene),target=pose.actionTarget;
   check('Pesca preserva recompensa e aponta a água',player.en===100&&player.hyd===80&&pose.actionKind==='fish'&&target&&[T.WATER,T.RIVER,T.OASIS].includes(map[Math.floor(target.y/TS)][Math.floor(target.x/TS)]),pose);
   FarmPlayerActions.reset(player);const before=JSON.stringify({en:player.en,hyd:player.hyd,cooldown:spot.fishCooldown,drunk:stats.waterDrunk});handleFishing(spot);
   check('Cooldown não repaga e não reinicia a vara',before===JSON.stringify({en:player.en,hyd:player.hyd,cooldown:spot.fishCooldown,drunk:stats.waterDrunk})&&!FarmPlayerActions.info());
   spot.fishCooldown=0;Math.random=()=>.9;handleFishing(spot);
   check('Peixe escapando mantém gesto sem recompensa',FarmPlayerActions.info()?.kind==='fish'&&player.en===100&&player.hyd===80);
  }finally{Math.random=random;if(originalNow)Object.defineProperty(performance,'now',originalNow);else delete performance.now;}
  clear();player.x=400;player.y=936;triggerPlayerAction('water',{x:400,y:936});FarmStoryUI.open();const paused=player.actionTimer;for(let n=0;n<60;n++)update(1/60);FarmStoryUI.close();
  check('Leitura pausa a fase e o alvo da atividade',player.actionTimer===paused&&FarmPlayerActions.pose(player,currentScene).actionProgress===0);
  histologyMissionOpen=true;for(let n=0;n<60;n++)update(1/60);histologyMissionOpen=false;
  check('Questão de histologia também conserva a fase da atividade',player.actionTimer===paused&&FarmPlayerActions.pose(player,currentScene).actionProgress===0);
  keys.a=true;const x=player.x;update(.05);check('Antecipação mantém pés apoiados',player.x===x&&player.actionTimer>0);for(let n=0;n<28;n++)update(1/60);delete keys.a;
  check('Andar cancela retorno depois do contato',player.x<x&&player.actionTimer===0&&!FarmPlayerActions.info());
  triggerPlayerAction('fish',{x:player.x+24,y:player.y});A11Y.reduceMotion=true;keys.a=true;const reducedX=player.x;update(1/60);delete keys.a;
  check('Movimento reduzido permite sair imediatamente',player.x<reducedX&&!FarmPlayerActions.info());
  triggerPlayerAction('feed',{x:player.x+20,y:player.y});saveGame(true);const saved=JSON.parse(localStorage.getItem(SAVE_KEY));loadGameFromData(saved);
  check('Salvar durante ação mantém formato e carregar retira pose antiga',saved.version===2&&!Object.keys(saved.player).some(k=>/action(Target|Progress|Duration|Kind)/.test(k))&&!FarmPlayerActions.info()&&player.actionTimer===0);
  triggerPlayerAction('collect',{x:player.x+12,y:player.y});setSceneTo('house');check('Troca de sala não transporta ferramenta',!FarmPlayerActions.info()&&player.actionTimer===0);
  check('Sem água não fabrica alvo em terra',FarmPlayerActions.waterTarget({x:16,y:16},[[T.GRASS,T.GRASS],[T.GRASS,T.GRASS]],T,TS)===null);
  return checks;
 });
 if(report.errors.length)throw Error(report.errors.join('\n'));
})().catch(e=>{report.fatal=e.stack;process.exitCode=1;}).finally(async()=>{await browser?.close();report.pass=!report.fatal&&!report.errors.length;fs.writeFileSync(path.join(out,'integracao-v610.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,checks:report.checks.length,sha256:report.sha256,errors:report.errors,fatal:report.fatal},null,2));});
