/* Compara o mundo completo anterior e atual sem filtrar propriedades dos
   objetos. A variante anterior é servida por rota; saves nunca tocam o perfil
   normal do jogador. Não modifica fontes nem evidências de versões antigas. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/biomas-v613'),base=process.env.FARM37_URL||'http://127.0.0.1:8766';
const baseline=process.env.FARM37_V613_BASELINE||path.resolve(root,'../backups/antes-graficos-v613-20261020/jogo.html');
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:JSON.stringify(x)).digest('hex');
const report={created:new Date().toISOString(),method:'Edge real, HTML V612 via rota, semente e relógio fixos; comparação de todos os tiles, objetos, cultivos, IDs, volumes e amostras térmicas.',checks:[],versions:[],errors:[]};
const check=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});assert.ok(pass,name);};let browser,before,beforeSave;
fs.mkdirSync(out,{recursive:true});
(async()=>{
 assert.ok(fs.existsSync(baseline),'Backup V612 obrigatório');browser=await chromium.launch({channel:'msedge',headless:true});report.browser=browser.version();
 for(const variant of ['antes','depois']){
  const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1}),page=await context.newPage();
  try{
   page.on('pageerror',e=>report.errors.push({variant,message:e.message}));
   await page.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(performance,'now',{value:()=>0});Date.now=()=>1792490000000;let seed=246813579;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);localStorage.setItem('farm37_seen_intro','1');});
   const bytes=variant==='antes'?fs.readFileSync(baseline):null;
   await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==new URL(base).origin)return route.abort();if(bytes&&u.pathname==='/jogo.html')return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:bytes});return route.continue();});
   const response=await page.goto(base+'/jogo.html?v=fisica-biomas-v613-'+variant+'-'+Date.now());assert.ok(response.ok());report.versions.push({variant,sha256:hash(await response.body())});
   await page.evaluate(()=>{startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();FarmStoryCinematics.close();FarmStoryCinematics.reset();FarmValleyPanels.close(false);FarmAnimalCare.close();FarmWorldMap.close();isPaused=false;histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;currentWeather=null;weatherCooldown=1e9;A11Y.noDeath=true;A11Y.relaxed=true;A11Y.reduceMotion=true;soundEnabled=false;});
   const snapshot=await page.evaluate(()=>{
    const main=scenes.main,tree=main.objects.filter(o=>o.type==='tree'),physical=JSON.parse(JSON.stringify({width:main.MW,height:main.MH,map:main.map,objects:main.objects,crops:main.crops,stateIds:keyedObjectStates(main.objects).map(({key})=>key)})),weights=[],collision=[],volumes=[],shadows=[],thermal=[];
    for(let y=0;y<main.MH;y++)for(let x=0;x<main.MW;x++)weights.push(regionWeights(y+.5,x+.5));
    for(let y=4;y<main.MH*TS;y+=8)for(let x=4;x<main.MW*TS;x+=8)collision.push(FarmWorldDepth.isBlocked(x,y)?1:0);
    for(const o of main.objects)volumes.push({footprint:FarmWorldDepth.footprint(o),depth:FarmWorldDepth.depth(o)});
    for(const hour of [7,12,17]){timeOfDay=hour;const sun=sunShadowVec();for(const o of tree){const ellipse=treeShadowEllipse(o,sun);shadows.push({x:o.x,y:o.y,shadeR:o.shadeR,hour,ellipse});for(const [dx,dy]of [[0,0],[.5,.5],[1.01,0],[0,1.01]]){player.x=ellipse.cx+ellipse.rx*dx;player.y=ellipse.cy+ellipse.ry*dy;shadows.push({x:player.x,y:player.y,inShade:inShade()});}}
     for(const season of ['hot','cold']){currentSeason=season;for(const [x,y]of [[380,936],[250,310],[655,1770],[1240,584],[1352,1560],[1800,408],[1784,952],[2088,1688],[959,936],[960,936],[1535,936],[1536,936]]){player.x=x;player.y=y;thermal.push({x,y,hour,season,weights:regionWeights(y/TS,x/TS),zone:getZoneThermal(),shade:inShade()});}}
    }
    setSceneTo('main',380,936);currentSeason='hot';timeOfDay=12;player.temp=37;player.en=92;player.hyd=88;player.coins=237;player.inv.wood=19;player.inv.hay=8;
    for(const [i,o]of main.objects.entries()){if(o.type==='animal'){o.shorn=o.kind==='sheep'&&i%2===0;o.well=.3+(i%6)*.1;o.woolGrowth=o.shorn?37:0;}if(o.type==='mtn_fire'){o.lit=false;o.fuel=123;}}
    if(!saveGame(true))throw Error('Falha ao salvar fixture');
    return{physical:JSON.parse(JSON.stringify(physical)),weights,collision,volumes,shadows,thermal,save:JSON.parse(localStorage.getItem(SAVE_KEY))};
   });
   if(variant==='antes'){
    before=snapshot;beforeSave=snapshot.save;
    before.roundTrip=await page.evaluate(data=>{if(!loadGameFromData(data))throw Error('ControleV612 recusou o próprio save');saveGame(true);return JSON.parse(localStorage.getItem(SAVE_KEY));},beforeSave);
    continue;
   }
   check('Mundo144×124 conserva exatamente todos os17.856tiles',snapshot.physical.width===144&&snapshot.physical.height===124&&hash(snapshot.physical.map)===hash(before.physical.map),{tiles:144*124,before:hash(before.physical.map),after:hash(snapshot.physical.map)});
   check('Todos os objetos preservam todas as propriedades, IDs e ordem',hash(snapshot.physical.objects)===hash(before.physical.objects),{count:before.physical.objects.length,before:hash(before.physical.objects),after:hash(snapshot.physical.objects)});
   check('Cultivos e cada stateId permanecem idênticos',hash(snapshot.physical.crops)===hash(before.physical.crops)&&hash(snapshot.physical.stateIds)===hash(before.physical.stateIds),{stateIds:before.physical.stateIds.length,crops:Object.keys(before.physical.crops).length});
   check('71.424amostras de colisão, todos os volumes e profundidades preservados',hash(snapshot.collision)===hash(before.collision)&&hash(snapshot.volumes)===hash(before.volumes),{collisionSamples:snapshot.collision.length,volumes:snapshot.volumes.length});
   check('Gradiente térmico mantém todos os pesos do mapa',hash(snapshot.weights)===hash(before.weights),{samples:snapshot.weights.length,sha256:hash(snapshot.weights)});
   check('Efeitos térmicos e sombra nas duas estações e três horários mantêm valores',hash(snapshot.thermal)===hash(before.thermal),{samples:snapshot.thermal.length,sha256:hash(snapshot.thermal)});
   check('Todas as elipses das árvores e a função inShade conservam a geometria',hash(snapshot.shadows)===hash(before.shadows),{samples:snapshot.shadows.length,sha256:hash(snapshot.shadows)});
   check('Savev2 inteiro conserva conteúdo e formato',hash(snapshot.save)===hash(beforeSave),{before:hash(beforeSave),after:hash(snapshot.save),keys:Object.keys(snapshot.save),differentKeys:Object.keys(snapshot.save).filter(k=>hash(snapshot.save[k])!==hash(beforeSave[k]))});
   const restored=await page.evaluate(data=>{
    const loaded=loadGameFromData(data);if(!loaded)throw Error('Save anterior recusado');const state={player:JSON.parse(JSON.stringify(player)),crops:JSON.parse(JSON.stringify(crops)),objects:keyedObjectStates(objects).map(({o,key})=>({stateId:key,type:o.type,kind:o.kind||null,shorn:!!o.shorn,lit:!!o.lit,fuel:Number(o.fuel)||0,...(o.type==='animal'?{woolGrowth:o.shorn&&Number.isFinite(o.woolGrowth)?Math.max(0,Math.min(180,o.woolGrowth)):0,well:typeof o.well==='number'&&Number.isFinite(o.well)?Math.max(0,Math.min(1,o.well)):.85}:{})})),coins:player.coins};
    saveGame(true);state.saved=JSON.parse(localStorage.getItem(SAVE_KEY));return state;
   },beforeSave);
   check('SaveV612 carrega posição, inventário, moedas, cultivos e todos os objetos',restored.player.x===beforeSave.player.x&&restored.player.y===beforeSave.player.y&&hash(restored.player.inv)===hash(beforeSave.player.inv)&&restored.coins===beforeSave.player.coins&&hash(restored.crops)===hash(beforeSave.crops)&&hash(restored.objects)===hash(beforeSave.objects),{coins:restored.coins,objects:restored.objects.length});
   const storyKeys=['storyWorld','storyCinematics','valleySaga','frontierStory','villageStories','expeditionStory','farmLife','skinLearning'];
   check('Histórias e missões fazem o mesmo round-tripV612, sem crédito por carregar',storyKeys.every(k=>hash(restored.saved[k])===hash(before.roundTrip[k]))&&restored.coins===beforeSave.player.coins,{keys:storyKeys,differentKeys:storyKeys.filter(k=>hash(restored.saved[k])!==hash(before.roundTrip[k])),normalizationsAlreadyPresent:storyKeys.filter(k=>hash(before.roundTrip[k])!==hash(beforeSave[k]))});
  }finally{await context.close();}
 }
 check('Comparação não gera errosJavaScript',report.errors.length===0,report.errors);report.pass=true;
})().catch(e=>{report.pass=false;report.fatal=e.stack;process.exitCode=1;}).finally(async()=>{await browser?.close();fs.writeFileSync(path.join(out,'fisica.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,versions:report.versions,checks:report.checks.length,failed:report.checks.filter(c=>!c.pass),errors:report.errors,fatal:report.fatal},null,2));});
