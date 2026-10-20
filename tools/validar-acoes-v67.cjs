/* Arte e atuação do protagonista: quadros reais, alvo em coordenadas do mundo,
   regressão de pixels V6.6 e cache sem coordenadas livres. --source injeta
   apenas28 para revisão antes do build; o modo padrão verifica o build atual. */
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/acoes-v67');fs.mkdirSync(out,{recursive:true});
const sourceMode=process.argv.includes('--source'),label=sourceMode?'fonte':'integrado';
const report={date:new Date().toISOString(),mode:label,checks:[],errors:[],captures:[],limits:['A folha de poses usa estados preparados; a integração dos efeitos reais tem teste separado.','Igualdade de pixels verifica preservação, não qualidade artística; capturas exigem inspeção visual.']};let browser,page;
const check=(name,pass,evidence)=>report.checks.push({name,pass:!!pass,evidence});
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.clear();localStorage.setItem('farm37_seen_intro','1');});
 const response=await page.goto((process.env.FARM37_URL||'http://127.0.0.1:8766')+'/jogo.html?v=acoes-v67-'+Date.now());report.sha256=createHash('sha256').update(await response.body()).digest('hex');
 const original=fs.readFileSync(path.resolve(root,'../backups/antes-acoes-v67-20261007/src/modules/28-character-art.js'),'utf8');
 await page.evaluate(()=>window.__buildArt=FarmCharacterArt);await page.addScriptTag({content:original});await page.evaluate(()=>{window.__previousArt=FarmCharacterArt;window.FarmCharacterArt=window.__buildArt;});
 const source=fs.readFileSync(path.join(root,'src/modules/28-character-art.js'),'utf8');report.source28SHA256=createHash('sha256').update(source).digest('hex');if(sourceMode)await page.addScriptTag({content:source});
 const results=await page.evaluate(async label=>{
  const current=FarmCharacterArt,previous=window.__previousArt,kinds=['plant','water','harvest','collect','feed','fish'];
  const base={x:500,y:900,gender:'f',dir:2,anim:0,moving:false,running:false,gaitBlend:0,gaitRunBlend:0,actionTimer:.35,actionType:'plant',temp:37};
  const target=(dir,distance=24)=>({x:base.x+([0,-distance,distance,0][dir]),y:base.y+10+([distance,0,0,-distance][dir])});
  const hash=c=>{let h=2166136261;const b=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(const v of b)h=Math.imul(h^v,16777619);return h>>>0;};
  const make=(actor={},opts={},api=current)=>{const c=document.createElement('canvas');c.width=112;c.height=112;api.drawPlayer(c.getContext('2d'),{...base,...actor},{x:52,y:54,time:1000,reducedMotion:false,...opts});return c;};
  const poseCases=[],reduced=[],borderCases=[],ground=[],regression=[],sheetFiles=[];
  // Faixa sob as solas, sem incluir a mão que alcança o solo à frente.
  const groundHash=c=>{const g=c.getContext('2d'),bytes=g.getImageData(47,64,11,2).data;let h=2166136261;for(const v of bytes)h=Math.imul(h^v,16777619);return h>>>0;};
  for(const dir of [0,1,2,3]){
   const sheet=document.createElement('canvas');sheet.width=1584;sheet.height=6*212+36;const g=sheet.getContext('2d');g.fillStyle='#dce3cd';g.fillRect(0,0,sheet.width,sheet.height);g.imageSmoothingEnabled=false;g.fillStyle='#183b36';g.font='18px Segoe UI';g.fillText('Ações · '+['frente','esquerda','direita','costas'][dir]+' · preparação, contato e retorno',12,24);
   for(let row=0;row<kinds.length;row++){const kind=kinds[row],hashes=[];for(let frame=0;frame<12;frame++){
    const opts={actionKind:kind,actionProgress:(frame+.1)/12,actionTarget:target(dir)},c=make({dir,actionType:kind},opts);hashes.push(hash(c));g.drawImage(c,25,12,66,88,frame*132,row*212+54,132,176);
    const info=current.actionInfo({...base,dir,actionType:kind},opts);poseCases.push({kind,dir,frame,actual:info.frame,facing:info.direction,active:info.active});
    if(dir===2&&['plant','harvest','collect','feed'].includes(kind))ground.push({kind,frame,hash:groundHash(c)});
    // Inspeciona o sprite bruto entregue por drawImage, separado da linha/água.
    const temp=document.createElement('canvas'),cg=temp.getContext('2d'),originalDraw=cg.drawImage.bind(cg);let border=0;
    cg.drawImage=(...args)=>{const src=args[0];if(src.width===48&&src.height===52){const b=src.getContext('2d').getImageData(0,0,48,52).data;for(let x=0;x<48;x++)border+=Number(b[x*4+3]>0)+Number(b[((51*48+x)*4)+3]>0);for(let y=0;y<52;y++)border+=Number(b[y*48*4+3]>0)+Number(b[(y*48+47)*4+3]>0);}originalDraw(...args);};current.drawPlayer(cg,{...base,dir,actionType:kind},opts);borderCases.push({kind,dir,frame,border});
   }g.fillStyle='#183b36';g.fillText(kind,10,row*212+50);reduced.push({kind,dir,frames:hashes.length,unique:new Set(hashes).size,static:[0,.1,.3,.6,.9,1].map(actionProgress=>hash(make({dir,actionType:kind},{actionKind:kind,actionProgress,actionTarget:target(dir),reducedMotion:true})))});}
   const name='acoes-v67-'+label+'-'+dir;await fetch('/shot?name='+name,{method:'POST',body:sheet.toDataURL('image/png')});sheetFiles.push('site/shots/'+name+'.png');
  }
  // Ações novas não podem redesenhar o andar, as roupas, o repouso ou a fala.
  for(const gender of ['m','f'])for(const dir of [0,1,2,3])for(const running of [false,true])for(const frame of [0,2,5,8,11,15]){
   const actor={gender,dir,running,moving:true,gaitBlend:1,gaitRunBlend:Number(running),anim:frame*Math.PI/8,actionTimer:0,hat:true,coatEquipped:running};regression.push({type:'move',equal:hash(make(actor))===hash(make(actor,{},previous))});
  }
  for(const mode of ['sit','bed'])for(const dir of [0,1,2,3])for(const equipped of [false,true]){const actor={dir,resting:true,restTimer:4,actionTimer:0,hat:equipped,coatEquipped:equipped,blanketEquipped:equipped},opts={restBlend:1,restMode:mode};regression.push({type:mode,equal:hash(make(actor,opts))===hash(make(actor,opts,previous))});}
  for(const gesture of current.gestures)for(const dir of [0,1,2,3]){const actor={dir,actionTimer:0},opts={speaking:true,expression:'warm',gesture,time:1400,elapsed:1.4};regression.push({type:'speech',equal:hash(make(actor,opts))===hash(make(actor,opts,previous))});}
  const representative=kinds.map(kind=>({kind,hash:hash(make({actionType:kind},{actionKind:kind,actionProgress:.55,actionTarget:target(2)}))}));
  const states=JSON.stringify(base);make(base,{actionKind:'water',actionProgress:.5,actionTarget:target(1)});const unmodified=states===JSON.stringify(base);
  const warmed=()=>{for(const kind of kinds)for(const dir of [0,1,2,3])for(let f=0;f<12;f++)make({dir,actionType:kind},{actionKind:kind,actionProgress:f/12,actionTarget:target(dir)});};warmed();const before=current.cacheInfo();
  for(let i=0;i<300;i++){const kind=kinds[i%6],dir=i%4;make({dir,actionType:kind},{actionKind:kind,actionProgress:(i%12)/12,actionTarget:{x:target(dir).x+i*.013,y:target(dir).y+i*.009}});}const after=current.cacheInfo();
  const fallback=current.actionInfo({...base,actionTimer:.175,actionType:'water'},{});
  const priority=['dead','resting'].map(key=>({key,active:current.actionInfo({...base,[key]:true},{actionKind:'fish',actionProgress:.5,actionTarget:target(2)}).active}));
  const oldIDs=['rosa','lia','tomas','ines','caio','nico'],newIDs=['helena','davi','bia'],npcRegression=[],npcIdentity=[],npcMotion=[];
  const npcCanvas=(id,dir=0,opts={},api=current)=>{const c=document.createElement('canvas');c.width=112;c.height=112;api.drawNPC(c.getContext('2d'),{x:500,y:900,npcId:id,dir,anim:1.6,moving:!!opts.walk,gaitBlend:Number(!!opts.walk),npcActivity:opts.rest?'rest':'talk',activityPhase:4},{x:52,y:54,time:1000,...opts});return c;};
  const portrait=(id,opts={},api=current)=>{const c=document.createElement('canvas');c.width=96;c.height=96;api.drawPortrait(c,id,{time:1000,...opts});return c;};
  for(const id of oldIDs){
   for(const dir of [0,1,2,3])for(const opts of [{},{walk:true},{speaking:true,gesture:'explain',speechTime:1.1}])npcRegression.push({id,type:'sprite',equal:hash(npcCanvas(id,dir,opts))===hash(npcCanvas(id,dir,opts,previous))});
   for(const opts of [{},{speaking:true,gesture:'explain',speechTime:1.1}])npcRegression.push({id,type:'portrait',equal:hash(portrait(id,opts))===hash(portrait(id,opts,previous))});
  }
  const castSheet=document.createElement('canvas');castSheet.width=1252;castSheet.height=3*222+36;const castG=castSheet.getContext('2d');castG.fillStyle='#dce3cd';castG.fillRect(0,0,castSheet.width,castSheet.height);castG.imageSmoothingEnabled=false;castG.font='18px Segoe UI';castG.fillStyle='#183b36';castG.fillText('Moradores · quatro direções, repouso, retrato, fala e escuta',12,24);
  newIDs.forEach((id,row)=>{
   npcIdentity.push({id,registered:current.keys.includes(id),portrait:hash(portrait(id)),sprite:hash(npcCanvas(id)),differsFromNico:hash(portrait(id))!==hash(portrait('nico'))&&hash(npcCanvas(id))!==hash(npcCanvas('nico'))});
   castG.fillStyle='#183b36';castG.fillText(current.definitions[id]?.name||id,12,row*222+56);
   for(const dir of [0,1,2,3]){castG.drawImage(npcCanvas(id,dir,{walk:dir===1}),25,12,66,88,dir*132,row*222+62,132,176);}
   castG.drawImage(npcCanvas(id,2,{rest:true}),25,12,66,88,528,row*222+62,132,176);
   for(const [col,opts]of [{},{speaking:true,gesture:'explain',speechTime:.9},{speaking:false,gesture:'listen',speechTime:2.5},{speaking:true,gesture:'invite',speechTime:.8,expression:'warm'}].entries())castG.drawImage(portrait(id,opts),692+col*136,row*222+76,128,128);
   const times=[.3,.6,.9,1.2,1.6,2];npcMotion.push({id,spriteVariants:new Set(times.map(speechTime=>hash(npcCanvas(id,0,{speaking:true,gesture:'explain',speechTime})))).size,portraitVariants:new Set(times.map(speechTime=>hash(portrait(id,{speaking:true,gesture:'explain',speechTime})))).size,reducedSprite:new Set(times.map(speechTime=>hash(npcCanvas(id,0,{speaking:true,gesture:'explain',speechTime,reducedMotion:true})))).size,reducedPortrait:new Set(times.map(speechTime=>hash(portrait(id,{speaking:true,gesture:'explain',speechTime,reducedMotion:true})))).size});
  });
  const castName='moradores-v67-'+label;await fetch('/shot?name='+castName,{method:'POST',body:castSheet.toDataURL('image/png')});sheetFiles.push('site/shots/'+castName+'.png');
  return{poseCases,reduced,borderCases,ground,regression,representative,unmodified,before,after,fallback,priority,npcRegression,npcIdentity,npcMotion,sheetFiles};
 },label);
 report.captures.push(...results.sheetFiles);report.results=results;
 check('Seis ações e quatro direções percorrem12quadros válidos',results.poseCases.length===288&&results.poseCases.every(r=>r.active&&r.actual===r.frame&&r.facing===r.dir));
 check('Cada gesto tem preparação, contato e retorno visual distintos',results.reduced.every(r=>r.unique>=6),results.reduced.map(({kind,dir,unique})=>({kind,dir,unique})));
 check('Seis ferramentas/gestos têm silhuetas distintas no contato',new Set(results.representative.map(r=>r.hash)).size===6,results.representative);
 check('Movimento reduzido mantém uma pose útil estática em cada ação',results.reduced.every(r=>new Set(r.static).size===1));
 check('Nenhum quadro recorta as bordas do sprite',results.borderCases.every(r=>r.border===0),results.borderCases.filter(r=>r.border));
 check('Pés apoiados não deslizam durante trabalho no chão',['plant','harvest','collect','feed'].every(kind=>new Set(results.ground.filter(r=>r.kind===kind).map(r=>r.hash)).size===1),results.ground);
 check('144poses de locomoção, repouso e fala preservadas pixel a pixel',results.regression.every(r=>r.equal),{count:results.regression.length,differences:results.regression.filter(r=>!r.equal)});
 check('Alvo e apresentação não mutam o personagem',results.unmodified);
 check('Cache continua finito e não recebe cada coordenada de alvo',results.after.sprites<=results.after.maxSprites&&results.after.sprites-results.before.sprites<=24,{before:results.before,after:results.after});
 check('Fallback0,35s e prioridade de repouso/morte continuam ativos',results.fallback.active&&results.fallback.frame===6&&results.priority.every(r=>!r.active),{fallback:results.fallback,priority:results.priority});
 check('Helena, Davi e Bia têm perfis e retratos próprios',results.npcIdentity.every(r=>r.registered&&r.differsFromNico)&&new Set(results.npcIdentity.map(r=>r.portrait)).size===3&&new Set(results.npcIdentity.map(r=>r.sprite)).size===3,results.npcIdentity);
 check('Os seis moradores anteriores preservam sprites, retratos e fala',results.npcRegression.every(r=>r.equal),{count:results.npcRegression.length,differences:results.npcRegression.filter(r=>!r.equal)});
 check('Os novos moradores falam e respeitam redução de movimento',results.npcMotion.every(r=>r.spriteVariants>=3&&r.portraitVariants>=3&&r.reducedSprite===1&&r.reducedPortrait===1),results.npcMotion);
 const played=await page.evaluate(async label=>{
  startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();FarmStoryCinematics.reset();soundEnabled=false;isPaused=false;histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;A11Y.noDeath=true;A11Y.relaxed=true;A11Y.reduceMotion=false;currentWeather=null;weatherCooldown=1e8;currentSeason='hot';timeOfDay=11;
  const sheet=document.createElement('canvas');sheet.width=4*264;sheet.height=6*270+32;const g=sheet.getContext('2d');g.fillStyle='#dce3cd';g.fillRect(0,0,sheet.width,sheet.height);g.font='17px Segoe UI';g.fillStyle='#183b36';g.fillText('Interações reais · início, preparação, contato e retorno',12,22);g.imageSmoothingEnabled=false;
  let field=null;for(let y=0;y<MH&&!field;y++)for(let x=0;x<MW&&!field;x++)if(map[y][x]===T.FIELD&&!FarmWorldDepth.isBlocked(x*TS+8,y*TS+8))field={x,y};if(!field)throw Error('Sem lavoura livre');
  const clear=()=>{FarmPlayerActions.reset(player);FarmStoryUI.close();FarmValleyPanels.close(false);player.resting=false;player.temp=37;player.en=80;player.hyd=70;player.dead=false;for(const k of Object.keys(keys))delete keys[k];_camSnap=true;};
  const fieldPosition=()=>{player.x=field.x*TS+8;player.y=field.y*TS+8;player.selectedSeed='tomato';player.inv.seeds.tomato=10;};
  const runs=[];for(const [row,kind]of ['plant','water','harvest','collect','feed','fish'].entries()){
   clear();
   if(['plant','water','harvest'].includes(kind)){fieldPosition();setCrop(field.x,field.y,kind==='plant'?null:{stage:kind==='harvest'?3:1,water:0,t:0,type:'tomato'});({plant:plantCrop,water:waterCrop,harvest:harvestCrop})[kind]();}
   else if(kind==='collect'){const pile=objects.find(o=>o.type==='woodpile');player.x=pile.x;player.y=pile.y;tryInteract();}
   else if(kind==='feed'){
    const animal=objects.find(o=>o.type==='animal'&&o.kind==='cow');let found=false;
    for(let d=16.2;d<=26&&!found;d+=2)for(let n=0;n<32&&!found;n++){const a=n*Math.PI/16,x=animal.x+Math.cos(a)*d,y=animal.y+Math.sin(a)*d;if(FarmWorldDepth.isBlocked(x,y)||FarmAnimalLife.blocksPlayer(x,y,null,objects))continue;player.x=x;player.y=y;found=objectAtPlayer(['animal'])===animal&&!nearObj(['door_house','door_barn'],22);}
    if(!found)throw Error('Sem posição de alimentação');player.inv.hay=2;animal.well=.5;tryInteract();
   }else{const spot=objects.find(o=>o.type==='fishing_spot');player.x=spot.x-8;player.y=spot.y;spot.fishCooldown=performance.now()-6000;handleFishing(spot);}
   const duration=FarmPlayerActions.info()?.duration,run={kind,triggered:FarmPlayerActions.info()?.kind===kind,phases:[]};if(!run.triggered)throw Error('Interação não ativou '+kind);
   let elapsed=0;for(const [column,fraction]of [0,.25,.55,.9].entries()){
    const goal=duration*fraction;while(elapsed<goal){const dt=Math.min(1/60,goal-elapsed);update(dt);elapsed+=dt;}
    _shakeTimer=0;_camSnap=true;render();const pose=FarmPlayerActions.pose(player,currentScene),c=document.getElementById('game'),s=ZOOM*RS,px=(player.x-_camFloatX)*s,py=(player.y-_camFloatY)*s;
    g.drawImage(c,px-44*s,py-48*s,88*s,80*s,column*264,row*270+62,264,240);g.fillStyle='#183b36';g.fillText(kind+' · '+Math.round(fraction*100)+'%',column*264+8,row*270+55);
    run.phases.push({progress:pose.actionProgress,target:pose.actionTarget,position:{x:player.x,y:player.y},direction:FarmCharacterArt.actionInfo(player,pose).direction});
   }runs.push(run);
  }
  const name='acoes-v67-jogadas-'+label;await fetch('/shot?name='+name,{method:'POST',body:sheet.toDataURL('image/png')});return{runs,capture:'site/shots/'+name+'.png'};
 },label);
 report.played=played;report.captures.push(played.capture);check('Seis efeitos reais produzem alvo e fases no cenário',played.runs.length===6&&played.runs.every(r=>r.triggered&&r.phases.every(p=>p.target&&Number.isFinite(p.progress))),played.runs);
 check('Sem erros JavaScript',!report.errors.length,report.errors);
})().catch(e=>report.fatal=e.stack).finally(async()=>{if(browser)await browser.close();report.status=report.fatal||report.checks.some(c=>!c.pass)?'FALHA':'OK';fs.writeFileSync(path.join(out,'acoes-'+label+'.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks.length,failed:report.checks.filter(c=>!c.pass),fatal:report.fatal,sha256:report.sha256,source28SHA256:report.source28SHA256},null,2));if(report.status!=='OK')process.exitCode=1;});
