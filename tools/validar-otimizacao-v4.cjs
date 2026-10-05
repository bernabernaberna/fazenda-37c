/* Comparação diferencial com a versão anterior: geometria, ordem dos objetos,
   fogo e sombras continuam iguais; o índice consulta referências vivas. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/otimizacao-v4');fs.mkdirSync(out,{recursive:true});
const report={date:new Date().toISOString(),checks:[],errors:[]};let browser;
const check=(name,pass,evidence)=>report.checks.push({name,pass:!!pass,evidence});
(async()=>{
 const box={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'src/modules/18-object-queries.js'),'utf8'),box);
 const q=box.window.FarmObjectQueries,a={type:'tree',x:10},b={type:'fireplace',lit:false},c={type:'tree',x:30},list=[a,b,c];
 const first=q.of(list,['tree','fireplace']);check('Tipos múltiplos preservam ordem e identidade',first[0]===a&&first[1]===b&&first[2]===c);
 const again=q.of(list,['fireplace','tree','tree']);check('Consultas equivalentes reutilizam a lista',first===again);
 a.x=55;b.lit=true;check('Coordenadas e estado permanecem vivos',q.of(list,['tree'])[0].x===55&&q.of(list,['fireplace'])[0].lit);
 list.push({type:'fireplace',x:99});check('Adição reconstrói índice',q.of(list,['fireplace']).length===2);
 list.splice(0,1);check('Remoção reconstrói índice',q.of(list,['tree']).length===1);
 list[0]={type:'well',x:100};q.invalidate(list);check('Substituição explícita e troca de cena invalidam',q.of(list,['well']).length===1&&q.of([{type:'tree'}],['tree']).length===1);
 check('Tipos ausentes e lista vazia são seguros',q.of(list,['missing']).length===0&&q.of([],['tree']).length===0);
 const {sources,footprint,blocked}=JSON.parse(fs.readFileSync(path.join(root,'tools/fixtures/object-queries-before-v4.json'),'utf8'));
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.setItem('farm37_seen_intro','1');});
 await page.goto((process.env.FARM37_URL||'http://127.0.0.1:8766')+'/jogo.html?v=queries-v4-'+Date.now());
 const differential=await page.evaluate(({sources,footprint,blocked})=>{
  startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();soundEnabled=false;isPaused=false;
  const old=Object.fromEntries(Object.entries(sources).map(([k,source])=>[k,Function('return ('+source+')')()]));
  const oldBlocked=Function('API','S','T',footprint+'\nconst contains=(b,x,y)=>x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h;\nreturn ('+blocked+');')({scenes},TS,T);
  const failures=[],stats=[];let seed=19,total=0,collisions=0;
  const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  for(const scene of ['main','house','barn','greenhouse']){
   setSceneTo(scene);FarmObjectQueries.resetMetrics();
   for(let i=0;i<500;i++){
    const target=objects[i%objects.length];player.x=i<objects.length?target.x+(target.w||0)/2+(random()-.5)*60:random()*MW*TS;
    player.y=i<objects.length?target.y+(target.h||0)/2+(random()-.5)*60:random()*MH*TS;
    const queries=[['nearObj',[['tree','house','barn','story_npc','animal'],90]],['inShade',[]],['nearShelter',[]],['nearFire',[]],['fireWarmthFactor',[]],['nearestObjectDistance',['story_npc']],['findNearestLitFire',[]],['isScarecrowNearby',[player.x,player.y]]];
    for(const [name,args]of queries){const before=old[name](...args),after=window[name](...args);total++;const same=name==='findNearestLitFire'?before.obj===after.obj&&before.dist===after.dist:before===after;if(!same)failures.push({scene,name,x:player.x,y:player.y});}
    if(scene==='main'){
     const from={x:player.x,y:player.y};for(const [dx,dy]of [[0,0],[3,0],[-3,0],[0,3],[0,-3]]){collisions++;if(oldBlocked(player.x+dx,player.y+dy,from)!==FarmWorldDepth.isBlocked(player.x+dx,player.y+dy,from))failures.push({name:'collision',from,dx,dy});}
    }
   }
   stats.push({scene,objects:objects.length,...FarmObjectQueries.info()});
  }
  // Um fogo apagado/alimentado não necessita de reconstrução do índice.
  setSceneTo('main');const fire=objects.find(o=>o.type==='fireplace'),lit=fire.lit;player.x=fire.x;player.y=fire.y;fire.lit=false;const off=nearFire();fire.lit=true;const on=nearFire();fire.lit=lit;
  return{total,collisions,failures,stats,liveFire:!off&&on};
 },{sources,footprint,blocked});
 check('16.000 consultas têm resultado idêntico ao jogo anterior',differential.total===16000&&!differential.failures.length,differential);
 check('2.500 verificações de colisão preservam volumes, cercas e saída de obstáculos',differential.collisions===2500&&!differential.failures.some(f=>f.name==='collision'));
 check('Mudança de fogo responde imediatamente sem reconstrução',differential.liveFire);
 check('Índice não varre o mundo em toda consulta',differential.stats.every(s=>s.rebuilds<=1&&s.scanned<=s.objects&&s.queries>=4000),differential.stats);
 const integration=await page.evaluate(()=>{
  FarmStoryUI.close();isPaused=false;histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;currentWeather=null;weatherCooldown=1e8;A11Y.noDeath=false;
  player.resting=true;FarmRestVisual.start(currentScene);FarmRestVisual.update(.3,player,currentScene);player.temp=41;killPlayer('hyperthermia');
  const deathReset=FarmRestVisual.info().blend===0&&FarmRestVisual.info().scene===null;respawnPlayer();const respawnReset=FarmRestVisual.info().blend===0&&!player.resting;
  A11Y.noDeath=true;A11Y.relaxed=true;skinOpen=true;
  let hud=0,skin=0;const h=updateBars,v=drawSkinView;
  updateBars=function(...args){hud++;return h.apply(this,args);};drawSkinView=function(...args){skin++;return v.apply(this,args);};
  const begin=last;_hudElapsed=0;for(let i=1;i<=60;i++)loop(begin+i*1000/60);
  updateBars=h;drawSkinView=v;skinOpen=false;
  const snapshot=()=>JSON.stringify({player,timeOfDay,currentWeather,stats});
  const before=snapshot();Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});for(let i=61;i<=120;i++)loop(begin+i*1000/60);const hiddenPaused=before===snapshot();delete document.hidden;
  return{deathReset,respawnReset,hud,skin,hiddenPaused};
 });
 check('Limite térmico e retorno limpam pose transitória',integration.deathReset&&integration.respawnReset,integration);
 check('HUD10Hz mantém animação da Visão da Pele em todo quadro',integration.hud>=9&&integration.hud<=11&&integration.skin===60,integration);
 check('Aba oculta não avança jogador, clima, relógio ou tarefas',integration.hiddenPaused);
 check('Sem erros JavaScript',!report.errors.length,report.errors);
})().catch(e=>{report.fatal=e.stack;process.exitCode=1;}).finally(async()=>{await browser?.close();report.pass=!report.fatal&&report.checks.every(c=>c.pass);if(!report.pass)process.exitCode=1;fs.writeFileSync(path.join(out,'queries-v4.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
