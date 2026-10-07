/* Edge real: arte desenhada pelos drawers existentes e caminhada física.
   Episódios/recursos são preparados para isolar escolhas; não é um percurso
   completo da saga nem benchmark. A folha de arte exige inspeção humana. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise','consequencias-v66');fs.mkdirSync(out,{recursive:true});
const base=process.env.FARM37_URL||'http://127.0.0.1:8766',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const report={geradoEm:new Date().toISOString(),checagens:[],erros:[],capturas:[],limites:['Fixtures preparam episódios anteriores e materiais. Aceite, objetivos e entrega da etapa visual são executados pelas APIs narrativas; ações físicas completas são validadas pela regressão integrada da saga.','As caminhadas usam FarmStoryIntegration.update real, com passos de0,05s e relógio fixado para isolar a rotina.','Qualidade visual exige abrir os PNGs; comparação de pixels só identifica alterações.']};
let browser,page;
function check(nome,passou,evidencia){report.checagens.push({nome,passou:!!passou,evidencia});assert.ok(passou,nome);}
async function capture(name){const data=await page.evaluate(async name=>{fx.length=0;snapCamera();render();const data=document.getElementById('game').toDataURL();const r=await fetch('/shot?name='+name,{method:'POST',body:data});if(!r.ok)throw Error('/shot '+r.status);return data;},name);const file=path.join(root,'site','shots',name+'.png');report.capturas.push({file,SHA256:sha(Buffer.from(data.split(',')[1],'base64'))});return file;}
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});report.navegador=browser.version();page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.erros.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.setItem('farm37_seen_intro','1');let seed=927161;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
 const response=await page.goto(base+'/jogo.html?v=consequencias-v66-'+Date.now());assert.ok(response.ok());report.jogoSHA256=sha(await response.body());
 await page.evaluate(()=>{
  startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryIntegration.reset();FarmStoryCinematics.reset();FarmValleySaga.reset();FarmLife.reset();
  FarmStoryUI.close();FarmValleyPanels.close(false);FarmStoryCinematics.close();histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;
  A11Y.noDeath=true;A11Y.relaxed=true;A11Y.reduceMotion=true;currentWeather=null;weatherCooldown=1e9;timeOfDay=12;currentSeason='hot';isPaused=false;soundEnabled=false;
  player.name='Alex';player.en=90;player.hyd=90;player.temp=37;player.resting=false;player.moving=false;player.running=false;player.actionTimer=0;setSceneTo('main',320,864);
  window.__v66Fresh=FarmValleySaga.serialize();window.__v66FreshFarm=FarmLife.serialize();window.__v66Rows=[];
  window.__v66Specs=[['rosa',0,'seedbox','carta-perdida','shared','reference'],['lia',1,'notebook','horta-caderno','questions','collective'],['tomas',0,'workbench','oficina','signed','demonstration'],['ines',1,'routeboard','cabana-fita','notices','observations'],['caio',1,'reserve','oasis-caixa','community','shared-work'],['nico',1,'mapboard','mapa-nico','presentation','collective']];
  window.__v66Close=()=>{FarmValleySaga.close();FarmStoryWorld.close();FarmStoryUI.close();FarmValleyPanels.close(false);FarmStoryCinematics.close();};
  window.__v66Fixture=(npcId,step,choice,status='offered',built=true,archive=0)=>{
   __v66Close();const saved=JSON.parse(JSON.stringify(__v66Fresh));saved.episodes.forEach(r=>Object.assign(r,{status:'completed',paid:true,choice:archive,acceptedAt:0}));
   if(npcId){for(let i=0;i<step;i++)Object.assign(saved.arcs[npcId][i],{status:'completed',paid:true,choice,acceptedAt:0});if(status!=='offered')Object.assign(saved.arcs[npcId][step],{status,paid:status==='completed',choice,acceptedAt:0});}
   FarmValleySaga.restore(saved);const farm=JSON.parse(JSON.stringify(__v66FreshFarm));farm.projects.oficina=built;FarmLife.restore(farm);FarmStoryIntegration.restore(FarmStoryWorld.serialize());__v66Close();
  };
  window.__v66Object=id=>scenes.main.objects.find(o=>o.type==='farm_life_project'&&o.projectId===id||o.type==='farm_life_clue'&&o.clueId===id);
  window.__v66Paint=id=>{const o=__v66Object(id);if(!o)throw Error('Objeto ausente '+id);const c=document.createElement('canvas');c.width=80;c.height=80;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.translate(40-o.x,56-o.y);OBJECT_DRAWERS[o.type](o,g);return c;};
  window.__v66Facts=()=>JSON.stringify({saga:FarmValleySaga.serialize(),farm:FarmLife.serialize(),story:FarmStoryWorld.serialize(),player,timeOfDay,map:scenes.main.map,objects:scenes.main.objects.map(o=>({type:o.type,stateId:o.stateId,x:o.x,y:o.y,clueId:o.clueId,projectId:o.projectId,stationId:o.stationId}))});
  window.__v66Actions=()=>{const s=FarmValleySaga;for(const c of s.clueCatalogue())s.record('inspect',{clueId:c.id});for(const npcId of ['rosa','lia','tomas','ines','caio','nico'])s.record('talk',{npcId});for(const region of ['farm','mountain','desert'])s.record('visit',{region});for(const event of ['plant','water','harvest','sell','repair','craft','produce','order','skin'])s.record(event,{amount:6});for(const item of ['wool','ice','oasisWater'])s.record('collect',{item,amount:6});s.record('rest',{safe:true});s.record('equip',{item:'coat',equipped:true});s.record('use',{item:'oasisWater'});for(const studyId of ['barreira','evaporacao','vasos'])s.record('study',{studyId,correct:true});};
 });
 check('Módulo de consequências integrado à build real',await page.evaluate(()=>!!FarmValleyDetails&&!!FarmValleySaga.decorationState));
 const outcomes=await page.evaluate(()=>{
  const results=[];for(const [npcId,step,surface,id,...variants]of __v66Specs){let beforeCanvas;const variantsResult=[];
   for(let choice=0;choice<2;choice++){
    __v66Fixture(npcId,step,choice);const before=__v66Paint(id);beforeCanvas??=before;const absentBefore=!FarmValleyDetails.info().details.some(d=>d.surface===surface);
    const prefix='saga:arc:'+npcId+':'+step;FarmValleySaga.interact(npcId);FarmValleySaga.choose(prefix+':offer');FarmValleySaga.choose(prefix+':accept:'+choice);__v66Close();
    const active=__v66Paint(id),absentActive=!FarmValleyDetails.info().details.some(d=>d.surface===surface);__v66Actions();const ready=__v66Paint(id);const absentReady=!FarmValleyDetails.info().details.some(d=>d.surface===surface);
    FarmValleySaga.interact(npcId);FarmValleySaga.choose(prefix+':offer');FarmValleySaga.choose(prefix+':deliver');__v66Close();const after=__v66Paint(id),d=FarmValleyDetails.info().details.find(d=>d.surface===surface);
    const save=FarmValleySaga.serialize(),facts=__v66Facts(),refreshes=FarmValleyDetails.info().refreshes;for(let k=0;k<100;k++)__v66Paint(id);const pure=__v66Facts()===facts,refreshStable=FarmValleyDetails.info().refreshes===refreshes;
    FarmValleySaga.restore(save);__v66Close();const restored=__v66Paint(id);
    variantsResult.push({choice,variant:d?.variant,expected:variants[choice],absentBefore,absentActive,absentReady,activeSame:before.toDataURL()===active.toDataURL(),readySame:before.toDataURL()===ready.toDataURL(),changed:before.toDataURL()!==after.toDataURL(),restoredSame:after.toDataURL()===restored.toDataURL(),pure,refreshStable});
    (__v66Rows.find(r=>r.surface===surface)||(__v66Rows.push({surface,before:beforeCanvas,variants:[]}),__v66Rows.at(-1))).variants.push(after);
   }
   results.push({surface,variants:variantsResult,pixelsDiffer:__v66Rows.at(-1).variants[0].toDataURL()!==__v66Rows.at(-1).variants[1].toDataURL()});
  }return results;
 });
 for(const row of outcomes)check('Escolhas de '+row.surface+' aparecem somente depois da entrega e persistem',row.pixelsDiffer&&row.variants.every(v=>v.variant===v.expected&&v.absentBefore&&v.absentActive&&v.absentReady&&v.activeSame&&v.readySame&&v.changed&&v.restoredSame&&v.pure&&v.refreshStable),row);
 const archive=await page.evaluate(()=>{
  __v66Fixture(null,0,0);const fresh=JSON.parse(JSON.stringify(__v66Fresh));FarmValleySaga.restore(fresh);const before=__v66Paint('arquivo-casa'),absent=FarmValleyDetails.info().seedBank===null;
  const variants=[];for(const choice of [0,1]){__v66Fixture(null,0,0,'offered',true,choice);variants.push({name:FarmValleyDetails.info().seedBank,canvas:__v66Paint('arquivo-casa')});}
  __v66Rows.push({surface:'archive',before,variants:variants.map(v=>v.canvas)});return{absent,names:variants.map(v=>v.name),changed:variants.every(v=>v.canvas.toDataURL()!==before.toDataURL()),distinct:variants[0].canvas.toDataURL()!==variants[1].canvas.toDataURL()};
 });check('Arquivo distingue banco comunitário e catálogo por rota',archive.absent&&archive.names.join(',')==='shared,catalogued'&&archive.changed&&archive.distinct,archive);
 const sheet=await page.evaluate(async()=>{const c=document.createElement('canvas');c.width=780;c.height=80+__v66Rows.length*250;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#182a24';g.fillRect(0,0,c.width,c.height);g.fillStyle='#e5d4a9';g.font='18px sans-serif';['Antes','Escolha 0 concluída','Escolha 1 concluída'].forEach((s,i)=>g.fillText(s,20+i*260,30));__v66Rows.forEach((r,i)=>{g.fillStyle='#e5d4a9';g.font='14px sans-serif';g.fillText(r.surface,20,62+i*250);[r.before,...r.variants].forEach((image,j)=>{g.fillStyle='#7c8d6c';g.fillRect(j*260+20,i*250+70,240,210);g.drawImage(image,j*260+20,i*250+40,240,240);});});const data=c.toDataURL(),r=await fetch('/shot?name=consequencias-v66-folha',{method:'POST',body:data});if(!r.ok)throw Error('/shot '+r.status);return data;});report.capturas.push({file:path.join(root,'site/shots/consequencias-v66-folha.png'),SHA256:sha(Buffer.from(sheet.split(',')[1],'base64'))});
 const cache=await page.evaluate(()=>{const before=FarmValleyDetails.info();for(let round=0;round<5;round++)for(const choice of [0,1]){__v66Fixture(null,0,choice);const s=FarmValleySaga.serialize();for(const records of Object.values(s.arcs))for(const r of records)Object.assign(r,{status:'completed',paid:true,choice,acceptedAt:0});s.episodes.forEach(r=>r.choice=choice);FarmValleySaga.restore(s);for(const id of ['oficina','carta-perdida','horta-caderno','cabana-fita','oasis-caixa','mapa-nico','arquivo-casa'])__v66Paint(id);}return{before,after:FarmValleyDetails.info()};});
 check('Revisitas às 14 variações mantêm cache limitado',cache.before.sprites===14&&cache.after.sprites===14&&cache.after.sprites<=cache.after.maxSprites,cache);
 const gates=await page.evaluate(()=>{const rows=[];for(const [label,choice,status,built]of [['oposta',0,'completed',true],['ativa',1,'active',true],['sem-oficina',1,'completed',false],['mentoria',1,'completed',true]]){__v66Fixture('tomas',1,choice,status,built);rows.push({label,targets:['tomas','nico'].map(id=>FarmValleyDetails.mentorDestination(id,12))});}return rows;});
 check('Mentoria exige escolha concluída e oficina construída',gates.slice(0,3).every(g=>g.targets.every(t=>t===null))&&gates[3].targets.every(Boolean),gates);
 const walk=await page.evaluate(()=>{
  __v66Fixture('tomas',1,1,'completed',true);timeOfDay=12;player.x=320;player.y=880;__v66Close();isPaused=false;const actors=FarmStoryIntegration.read().npcs.filter(a=>['tomas','nico'].includes(a.npcId)),start=actors.map(a=>({id:a.npcId,x:a.x,y:a.y})),targets=actors.map(a=>{const t=FarmValleyDetails.mentorDestination(a.npcId,12);return{id:a.npcId,...t,blocked:FarmWorldDepth.isBlocked(t.x,t.y)};});
  const trace=[];let maxStep=0,blocked=0,arrivedAt=null;for(let tick=0;tick<2400;tick++){const old=actors.map(a=>({x:a.x,y:a.y}));FarmStoryIntegration.update(.05);for(let i=0;i<actors.length;i++){const a=actors[i];maxStep=Math.max(maxStep,Math.hypot(a.x-old[i].x,a.y-old[i].y));if(FarmWorldDepth.isBlocked(a.x,a.y))blocked++;}if(tick%100===0)trace.push(actors.map(a=>({id:a.npcId,x:a.x,y:a.y,key:a._routineKey,route:a._route.length})));if(actors.every((a,i)=>Math.hypot(a.x-targets[i].x,a.y-targets[i].y)<1&&!a._route.length)){arrivedAt=tick*.05;break;}}
  for(let i=0;i<20;i++)FarmStoryIntegration.update(.05);
  const end=actors.map(a=>({id:a.npcId,x:a.x,y:a.y,key:a._routineKey,route:a._route.length,activity:a.npcActivity,dir:a.dir}));
  // A colisão do tear é menor que a pintura. Os montantes/travessas de27
  // ocupam x-12..x+12,y-20..y+13; não basta um destino fisicamente livre.
  const occlusions=actors.flatMap(a=>scenes.main.objects.filter(o=>o.type==='loom'&&a.x+7>o.x-12&&a.x-7<o.x+12&&a.y+10>o.y-20&&a.y-29<o.y+13).map(o=>({npcId:a.npcId,loom:{x:o.x,y:o.y}})));
  const state=__v66Facts();for(let i=0;i<100;i++){snapCamera();render();}const drawPure=state===__v66Facts();return{start,targets,end,maxStep,blocked,arrivedAt,drawPure,trace,occlusions};
 });check('Tomás e Nico caminham sem teleporte para pontos distintos e livres',walk.arrivedAt!==null&&walk.maxStep<=.951&&walk.blocked===0&&walk.drawPure&&Math.hypot(walk.end[0].x-walk.end[1].x,walk.end[0].y-walk.end[1].y)>20&&walk.targets.every(t=>!t.blocked),walk);
 check('Chegada encerra caminhada e orienta trabalho e observação para o parceiro',walk.end[0].activity==='work'&&walk.end[1].activity==='observe'&&walk.end[0].dir===0&&walk.end[1].dir===3&&walk.end.every(a=>a.route===0),walk.end);
 await page.evaluate(()=>{player.x=416;player.y=880;snapCamera();render();});await capture('consequencias-v66-mentoria-mundo');
 check('Pose final da mentoria mantém os corpos fora da pintura do tear',walk.occlusions.length===0,walk.occlusions);
 const attention=await page.evaluate(()=>{const n=FarmStoryIntegration.read().npcs.find(a=>a.npcId==='nico');player.x=n.x+24;player.y=n.y;FarmStoryIntegration.update(.05);const result={activity:n.npcActivity,dir:n.dir,distance:Math.hypot(player.x-n.x,player.y-n.y),blocked:FarmWorldDepth.isBlocked(player.x,player.y)};player.x=320;player.y=880;FarmStoryIntegration.update(.05);return{...result,resumed:{activity:n.npcActivity,dir:n.dir}};});
 check('Ao aproximar jogador, Nico olha para ele antes de voltar ao mentor',attention.activity==='talk'&&attention.dir===2&&attention.distance===24&&!attention.blocked&&attention.resumed.activity==='observe'&&attention.resumed.dir===3,attention);
 const gather=await page.evaluate(()=>{timeOfDay=16;const before=FarmStoryIntegration.navigationState();FarmStoryIntegration.update(.05);return{before,after:FarmStoryIntegration.read().npcs.filter(a=>['tomas','nico'].includes(a.npcId)).map(a=>({id:a.npcId,key:a._routineKey,routine:a.routineDescription,x:a.x,y:a.y}))};});
 check('Encontro das 16h substitui a mentoria e usa caminhada',gather.after.every(a=>a.key.startsWith('gather:')&&a.routine.includes('Casa das Sementes')),gather);
 await page.evaluate(()=>{__v66Fixture('rosa',0,0,'completed',true);player.x=232;player.y=920;timeOfDay=12;snapCamera();render();});await capture('consequencias-v66-sementes-mundo');
 check('Sem erros JavaScript no navegador',report.erros.length===0,report.erros);report.passou=true;
})().catch(async error=>{report.passou=false;report.falha=error.stack;process.exitCode=1;await page?.screenshot({path:path.join(out,'falha.png')}).catch(()=>{});}).finally(async()=>{fs.writeFileSync(path.join(out,'consequencias-v66.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passou:report.passou,checagens:report.checagens.length,capturas:report.capturas.length,erros:report.erros,falha:report.falha}));await browser?.close();});
