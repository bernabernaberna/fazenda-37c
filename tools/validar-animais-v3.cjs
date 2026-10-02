/* Movimento real dos animais e desenhos do renderer registrado. --baseline
   documenta defeitos anteriores; --source injeta só32 para desenvolvimento. */
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/movimento-mapa-v3');fs.mkdirSync(out,{recursive:true});
const baseline=process.argv.includes('--baseline'),source=process.argv.includes('--source'),video=process.env.ANIMAIS_VIDEO==='1',label=process.env.ANIMAIS_LABEL||(baseline?'antes':source?'fonte':'depois');
const report={at:new Date().toISOString(),baseline,source,checks:[],errors:[],external:[],artifacts:[],limits:['Simulação controlada da IA em objetos do jogo; não altera o mundo salvo do usuário.','Sprites e vídeo complementam verificações geométricas; não substituem inspeção visual.','Vídeo opcional usa RAF e dt reais; não é captura de um monitor físico.']};
const check=(name,pass,evidence)=>report.checks.push({name,pass:!!pass,evidence});let browser,page;
(async()=>{browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{window.__animalRAF=requestAnimationFrame.bind(window);requestAnimationFrame=()=>0;localStorage.clear();localStorage.setItem('farm37_seen_intro','1');});const base=process.env.FARM37_URL||'http://127.0.0.1:8766';
 await page.route('**/*',r=>{if(new URL(r.request().url()).origin===new URL(base).origin)return r.continue();report.external.push(r.request().url());return r.abort();});
 const response=await page.goto(base+'/jogo.html?v=animais-v3-'+Date.now());report.sha256=createHash('sha256').update(await response.body()).digest('hex');
 if(source){const text=fs.readFileSync(path.join(root,'src/modules/32-animal-life.js'),'utf8');report.source32SHA256=createHash('sha256').update(text).digest('hex');await page.addScriptTag({content:text});}
 await page.evaluate(()=>{startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();soundEnabled=false;AudioManager.muteAll();AmbientMusic.stop();isPaused=false;histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;FarmStoryUI.close();currentWeather=null;weatherCooldown=1e8;A11Y.noDeath=true;A11Y.reduceMotion=false;timeOfDay=12;currentSeason='hot';player.x=32*TS;player.y=58*TS;player.temp=37;player.hyd=100;player.en=100;_camSnap=true;render();});
 const before=await page.evaluate(()=>objects.filter(o=>o.type==='animal').map(o=>({kind:o.kind,x:o.x,y:o.y,penX:o.penX,penY:o.penY,penW:o.penW,penH:o.penH,tx:o.tx,ty:o.ty,well:o.well,shorn:!!o.shorn})));
 report.before=before;await page.screenshot({path:path.join(out,'animais-'+label+'-curral-inicio.png')});report.artifacts.push('animais-'+label+'-curral-inicio.png');
 const sheets=await page.evaluate(()=>{
  const out=[];const hash=c=>{let h=2166136261;for(const n of c.getContext('2d').getImageData(0,0,c.width,c.height).data)h=Math.imul(h^n,16777619);return h>>>0;};
  for(const kind of ['cow','sheep','chick']){
   const sheet=document.createElement('canvas');sheet.width=1000;sheet.height=840;const g=sheet.getContext('2d');g.fillStyle='#d7dfc3';g.fillRect(0,0,1000,840);g.fillStyle='#203b31';g.font='18px sans-serif';g.fillText(kind+' · quatro direções / oito fases',20,24);const rows=[];
   for(let dir=0;dir<4;dir++){const hashes=[];g.fillText(['Frente','Esquerda','Direita','Costas'][dir],10,55+dir*193);
    for(let f=0;f<8;f++){const c=document.createElement('canvas');c.width=80;c.height=72;const cg=c.getContext('2d');const a={type:'animal',kind,x:40,y:42,well:.8,dir,facing:dir===1?-1:1,moving:true,animT:f*Math.PI/4,animalPhase:f*Math.PI/4,animalBlend:1,animalActivity:'walk'};
     OBJECT_DRAWERS.animal(a,cg);hashes.push(hash(c));g.imageSmoothingEnabled=false;g.drawImage(c,10+f*123,56+dir*193,120,108);g.font='12px sans-serif';g.fillText(String(f),65+f*123,178+dir*193);g.font='18px sans-serif';}
    rows.push({dir,distinct:new Set(hashes).size,hashes});}
   out.push({kind,url:sheet.toDataURL(),rows});
  }return out;
 });
 for(const sheet of sheets){const file='animais-'+label+'-'+sheet.kind+'.png';fs.writeFileSync(path.join(out,file),Buffer.from(sheet.url.split(',')[1],'base64'));report.artifacts.push(file);}
 report.spriteRows=sheets.map(({kind,rows})=>({kind,rows}));check('Espécies têm frente e costas próprias',sheets.every(s=>s.rows[0].hashes[0]!==s.rows[3].hashes[0]),report.spriteRows);
 check('Passadas têm ao menos seis poses distintas por direção',sheets.every(s=>s.rows.every(r=>r.distinct>=6)),report.spriteRows);
 const simulation=await page.evaluate(({source})=>{
  const animals=objects.filter(o=>o.type==='animal'),pen=objects.find(o=>o.type==='pen'),start=animals.map(a=>({x:a.x,y:a.y,well:a.well??.85,shorn:!!a.shorn,kind:a.kind,stateId:a.stateId??null}));
  const tick=dt=>source?FarmAnimalLife.update(dt,objects,{cold:false,timeOfDay:12,reducedMotion:false}):updateAnimals(dt);
  const trace=[];let outside=0,maxStep=0,minGap=Infinity,motionlessPhase=0;
  for(let frame=0;frame<2400;frame++){const old=animals.map(a=>({x:a.x,y:a.y,phase:a.animalPhase??a.animT??0}));tick(.05);
   for(let i=0;i<animals.length;i++){const a=animals[i],distance=Math.hypot(a.x-old[i].x,a.y-old[i].y);maxStep=Math.max(maxStep,distance);if(a.x<pen.x||a.x>pen.x+pen.w||a.y<pen.y||a.y>pen.y+pen.h)outside++;
    if(distance<.00001&&Math.abs((a.animalPhase??a.animT??0)-old[i].phase)>.00001)motionlessPhase++;
    for(let j=0;j<i;j++)minGap=Math.min(minGap,Math.hypot(a.x-animals[j].x,a.y-animals[j].y));}
   if(frame%120===0)trace.push({seconds:frame*.05,animals:animals.map(a=>({kind:a.kind,x:a.x,y:a.y,moving:a.moving,dir:a.dir,activity:a.animalActivity,phase:a.animalPhase,well:a.well}))});
  }
  const after=animals.map(a=>({x:a.x,y:a.y,kind:a.kind,well:a.well,shorn:!!a.shorn,stateId:a.stateId??null,penY:a.penY,ty:a.ty}));render();return{start,after,pen:{x:pen.x,y:pen.y,w:pen.w,h:pen.h},outside,maxStep,minGap,motionlessPhase,trace};
 },{source});report.simulation=simulation;
 check('120s no curral sem fuga ou teleporte',simulation.outside===0&&simulation.maxStep<1.5,simulation);
 check('Fase dos pés avança só com deslocamento',simulation.motionlessPhase===0,{motionlessPhase:simulation.motionlessPhase});
 check('Separação evita centros sobrepostos',simulation.minGap>=7,{minGap:simulation.minGap});
 check('Saciedade e estados econômicos mantêm regras existentes',simulation.after.every((a,i)=>Math.abs(a.well-Math.max(0,simulation.start[i].well-.003*120))<1e-6&&a.shorn===simulation.start[i].shorn&&a.kind===simulation.start[i].kind&&a.stateId===simulation.start[i].stateId),{before:simulation.start,after:simulation.after});
 await page.screenshot({path:path.join(out,'animais-'+label+'-curral-120s.png')});report.artifacts.push('animais-'+label+'-curral-120s.png');
 if(!baseline){
 const extra=await page.evaluate(()=>{
  const api=FarmAnimalLife,hash=c=>{let h=2166136261;for(const n of c.getContext('2d').getImageData(0,0,c.width,c.height).data)h=Math.imul(h^n,16777619);return h>>>0;};
  const pens=objects.filter(o=>o.type==='pen'),pen=pens[0],fixture=()=>[{...pen},...objects.filter(o=>o.type==='animal').map((a,i)=>({...a,x:pen.x+30+i*17,y:pen.y+25+(i%2)*20,well:.8,animalPhase:0,animalBlend:0,animalActivity:'look'}))];
  const cases=[],record=(name,pass,evidence)=>cases.push({name,pass:!!pass,evidence});
  const tiny=document.createElement('canvas');tiny.width=128;tiny.height=112;const cg=tiny.getContext('2d');
  const paint=(a,props={})=>{cg.clearRect(0,0,128,112);api.draw(cg,{...a,x:64,y:62},{...props});return hash(tiny);};
  const states=document.createElement('canvas');states.width=1050;states.height=530;const sg=states.getContext('2d');sg.fillStyle='#d7dfc3';sg.fillRect(0,0,1050,530);sg.fillStyle='#203b31';sg.font='17px sans-serif';
  const columns=['Em pé','Pasto / bico','Saciado','Repouso','Tosquiada','Movimento reduzido'];columns.forEach((title,i)=>sg.fillText(title,12+i*174,25));
  for(const [row,kind] of ['cow','sheep','chick'].entries())for(let col=0;col<6;col++){
   const a={kind,x:64,y:62,well:.8,dir:2,animalPhase:Math.PI*.4,animalBlend:0,moving:false,animalActivity:col===1?(kind==='chick'?'peck':'graze'):col===3?'rest':'look',animalClock:col===1?(4/(kind==='chick'?4.4:2.2)):0,animalFed:col===2,shorn:col===4};
   paint(a,{reducedMotion:col===5});sg.imageSmoothingEnabled=false;sg.drawImage(tiny,32,15,64,62,14+col*174,40+row*156,154,149);
  }
  // Captura o canvas realmente enviado ao drawImage, incluindo cache e recorte.
  const captures=[];const proxy=new Proxy(cg,{get(t,k){if(k==='drawImage')return(c,...args)=>{captures.push(c);return t.drawImage(c,...args);};const v=Reflect.get(t,k,t);return typeof v==='function'?v.bind(t):v;},set(t,k,v){t[k]=v;return true;}});
  let clipped=0;const heights={};
  for(const kind of ['cow','sheep','chick'])for(let dir=0;dir<4;dir++)for(let mode=0;mode<5;mode++)for(let f=0;f<16;f++){
   const a={kind,x:64,y:62,well:.8,dir,animalPhase:f*Math.PI/8,animalBlend:mode===0?1:0,moving:mode===0,animalActivity:mode===1?'graze':mode===2?'rest':'look',animalClock:f/(kind==='chick'?4.4:2.2),shorn:mode===3};
   captures.length=0;api.draw(proxy,a,{reducedMotion:mode===4});const c=captures[0],pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let top=c.height,bottom=0;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(pixels[(y*c.width+x)*4+3]){top=Math.min(top,y);bottom=Math.max(bottom,y);if(x===0||x===c.width-1||y===0||y===c.height-1)clipped++;}
   heights[kind]=Math.max(heights[kind]||0,bottom-top+1);
  }
  record('Chifres, cristas, patas e repouso sem corte em 960 poses',clipped===0,{clipped,heights});
  record('Galinha proporcional à vaca e ao protagonista',heights.chick<=23&&heights.chick<heights.cow*.67,{heights});
  const wool={kind:'sheep',dir:2,animalPhase:0,animalActivity:'look',animalClock:0,moving:false,well:.8};
  const woolHashes=[paint({...wool,shorn:false}),paint({...wool,shorn:true})];record('Tosquia altera a lã visível',woolHashes[0]!==woolHashes[1],{hashes:woolHashes});
  const night=fixture();api.update(.05,night,{timeOfDay:22,cold:true});const aNight=night.filter(o=>o.type==='animal'),nightStart=aNight.map(a=>({x:a.x,y:a.y,phase:a.animalPhase,well:a.well}));
  for(let i=0;i<60;i++)api.update(1/60,night,{timeOfDay:22,cold:true});
  record('Noite repousa sem patinar e conserva taxa de frio',aNight.every((a,i)=>a.animalActivity==='rest'&&!a.moving&&a.x===nightStart[i].x&&a.y===nightStart[i].y&&a.animalPhase===nightStart[i].phase&&Math.abs(a.well-nightStart[i].well+.005)<1e-8),aNight.map(a=>({kind:a.kind,activity:a.animalActivity,phase:a.animalPhase,well:a.well})));
  api.update(.05,night,{timeOfDay:12});record('Amanhecer desperta sem teleporte',aNight.every((a,i)=>a.animalActivity!=='rest'&&Math.hypot(a.x-nightStart[i].x,a.y-nightStart[i].y)<.01),aNight.map(a=>a.animalActivity));
  const reduced=fixture();api.update(.05,reduced,{timeOfDay:12,reducedMotion:true});const aReduced=reduced.filter(o=>o.type==='animal'),reduceStart=aReduced.map(a=>({x:a.x,y:a.y,phase:a.animalPhase,hash:paint(a,{reducedMotion:true})}));
  for(let i=0;i<300;i++)api.update(1/60,reduced,{timeOfDay:12,reducedMotion:true});
  record('Redução de movimento conserva pés, corpo e pixels em repouso',aReduced.every((a,i)=>!a.moving&&a.x===reduceStart[i].x&&a.y===reduceStart[i].y&&a.animalPhase===reduceStart[i].phase&&paint(a,{reducedMotion:true})===reduceStart[i].hash),aReduced.map(a=>({kind:a.kind,phase:a.animalPhase,activity:a.animalActivity})));
  api.update(.05,reduced,{timeOfDay:23,reducedMotion:true});record('Repouso noturno permanece legível com movimento reduzido',aReduced.every(a=>a.animalActivity==='rest'&&api.visualState(a,true).rest),aReduced.map(a=>a.animalActivity));
  const feeding=fixture();api.update(.05,feeding,{timeOfDay:12});const af=feeding[1];af.well=1;af.shorn=true;api.update(.05,feeding,{timeOfDay:12});const feedHash=paint(af),fed=af.animalFed;
  const bareHash=paint({...af,animalFed:false});for(let i=0;i<120;i++)api.update(1/60,feeding,{timeOfDay:12});
  record('Alimentação responde, coração expira e não muda lã/recompensa',fed&&feedHash!==bareHash&&!af.animalFed&&af.shorn===true&&Math.abs(af.well-(1-.003*2.05))<1e-8,{fed,afterFed:af.animalFed,well:af.well,shorn:af.shorn,feedHash,bareHash});
  const migration=fixture();for(const a of migration.filter(o=>o.type==='animal')){a.penY=pen.y-672;a.ty=pen.y-672;}
  const old=migration.filter(o=>o.type==='animal').map(a=>({x:a.x,y:a.y}));api.update(.05,migration,{timeOfDay:12});
  record('Limites locais antigos migram uma vez sem somar posição de novo',migration.filter(o=>o.type==='animal').every((a,i)=>a.penY===pen.y+8&&a.x===old[i].x&&a.y===old[i].y&&a.ty>=pen.y),migration.filter(o=>o.type==='animal').map(a=>({y:a.y,penY:a.penY,ty:a.ty})));
  const rates=[];for(const fps of [30,60,120]){const list=fixture(),animals=list.filter(o=>o.type==='animal'),distance=animals.map(()=>0);let maxPhaseError=0;
   for(let i=0;i<fps*8;i++){const prev=animals.map(a=>({x:a.x,y:a.y,phase:a.animalPhase||0}));api.update(1/fps,list,{timeOfDay:12});animals.forEach((a,j)=>{const d=Math.hypot(a.x-prev[j].x,a.y-prev[j].y);distance[j]+=d;const cycle=api.info().cycle[a.kind==='chick'?'chicken':a.kind];maxPhaseError=Math.max(maxPhaseError,Math.abs((a.animalPhase-prev[j].phase)-d*Math.PI*2/cycle));});}
   rates.push({fps,distance,positions:animals.map(a=>({x:a.x,y:a.y})),maxPhaseError});}
  record('30/60/120 FPS preservam ciclo por distância em aglomeração',rates.every(r=>r.maxPhaseError<1e-8),rates);
  // A ordem de desvios pode legitimamente mudar a escolha do próximo destino
  // entre vários bichos. Compare velocidade por FPS também sem esse conflito.
  const isolated=[];for(const kind of ['cow','sheep','chick']){const samples=[];for(const fps of [30,60,120]){const a={type:'animal',kind,x:pen.x+50,y:pen.y+40,well:.8},list=[{...pen},a];let distance=0;
   for(let i=0;i<fps*8;i++){const x=a.x,y=a.y;api.update(1/fps,list,{timeOfDay:12});distance+=Math.hypot(a.x-x,a.y-y);}samples.push({fps,distance,x:a.x,y:a.y});}isolated.push({kind,samples});}
  record('Velocidade livre não acelera com FPS',isolated.every(r=>r.samples.every(s=>Math.abs(s.distance-r.samples[1].distance)<.65)),isolated);
  const escaped={type:'animal',kind:'cow',x:pen.x-4,y:pen.y+35,penY:pen.y-672,well:.8},recovery=[{...pen},escaped];let recoveryMaxStep=0;
  for(let i=0;i<900;i++){const x=escaped.x,y=escaped.y;api.update(.05,recovery,{timeOfDay:12});recoveryMaxStep=Math.max(recoveryMaxStep,Math.hypot(escaped.x-x,escaped.y-y));}
  record('Animal de sessão antiga volta ao curral andando',escaped.x>=pen.x+14&&escaped.x<=pen.x+pen.w-14&&escaped.y>=pen.y+10&&escaped.y<=pen.y+pen.h-12&&recoveryMaxStep<=.301,{x:escaped.x,y:escaped.y,recoveryMaxStep,penY:escaped.penY});
  const start=performance.now();for(let i=0;i<1000;i++)api.update(1/60,objects,{timeOfDay:12});const updateMs=(performance.now()-start)/1000,canvas=document.getElementById('game'),renderTimes=[];
  for(let i=0;i<90;i++){const t=performance.now();render();renderTimes.push(performance.now()-t);}renderTimes.sort((a,b)=>a-b);
  record('IA e cache mantêm orçamento do frame',updateMs<2&&renderTimes[85]<16.67&&api.info().cache<=api.info().maxSprites,{updateMeanMs:updateMs,renderP95Ms:renderTimes[85],cache:api.info(),canvas:{width:canvas.width,height:canvas.height}});
  return{cases,states:states.toDataURL()};
 });
 for(const c of extra.cases)check(c.name,c.pass,c.evidence);const statesFile='animais-'+label+'-estados.png';fs.writeFileSync(path.join(out,statesFile),Buffer.from(extra.states.split(',')[1],'base64'));report.artifacts.push(statesFile);
 await page.evaluate(()=>{const pen=objects.find(o=>o.type==='pen');player.x=pen.x+pen.w/2;player.y=pen.y+pen.h+19;_camSnap=true;render();});
 await page.screenshot({path:path.join(out,'animais-'+label+'-escala.png')});report.artifacts.push('animais-'+label+'-escala.png');
 if(video){const capture=await page.evaluate(async({source})=>{
  const canvas=document.getElementById('game'),stream=canvas.captureStream(30),recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9'}),chunks=[],frames=[];
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};const done=new Promise(resolve=>recorder.onstop=resolve);recorder.start();let start=null,last=null,nextCapture=0,elapsed=0,rafCount=0;
  await new Promise(resolve=>{const tick=now=>{if(start===null)start=last=now;elapsed=(now-start)/1000;const dt=Math.min(.05,(now-last)/1000);last=now;if(source)FarmAnimalLife.update(dt,objects,{cold:false,timeOfDay:12,reducedMotion:false});else updateAnimals(dt);render();rafCount++;
   if(elapsed>=nextCapture){frames.push(canvas.toDataURL());nextCapture+=2;}if(elapsed<10)__animalRAF(tick);else resolve();};__animalRAF(tick);});
  recorder.stop();await done;stream.getTracks().forEach(t=>t.stop());const data=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(new Blob(chunks,{type:'video/webm'}));});
  const film=document.createElement('canvas');film.width=1280;film.height=800;const fg=film.getContext('2d');fg.imageSmoothingEnabled=false;
  for(let i=0;i<Math.min(6,frames.length);i++){const im=new Image();im.src=frames[i];await im.decode();fg.drawImage(im,0,0,im.width,im.height,(i%3)*426,Math.floor(i/3)*400,426,400);}
  return{data,film:film.toDataURL(),elapsed,rafCount};
 },{source});const videoFile='animais-'+label+'-ao-vivo.webm',filmFile='animais-'+label+'-ao-vivo.png';fs.writeFileSync(path.join(out,videoFile),Buffer.from(capture.data.split(',')[1],'base64'));fs.writeFileSync(path.join(out,filmFile),Buffer.from(capture.film.split(',')[1],'base64'));report.artifacts.push(videoFile,filmFile);report.video={elapsed:capture.elapsed,rafCount:capture.rafCount};}
 if(!source){const reset=await page.evaluate(()=>{resetSandboxRun();const animals=objects.filter(o=>o.type==='animal');return animals.map(a=>({kind:a.kind,x:a.x,y:a.y,well:a.well,moving:a.moving,phase:a.animalPhase,blend:a.animalBlend,fed:a.animalFed}));});check('Nova partida reinicia animais após passeio sem herdar saciedade ou pose',reset.every((a,i)=>a.x===before[i].x&&a.y===before[i].y&&a.well===.85&&!a.moving&&a.phase===0&&a.blend===0&&!a.fed),reset);}
 }
 check('Sem erro JavaScript ou rede externa',!report.errors.length&&!report.external.length,{errors:report.errors,external:report.external});
})().catch(e=>report.fatal=e.stack).finally(async()=>{if(browser)await browser.close();report.status=report.fatal||report.checks.some(c=>!c.pass)?'FALHA':'OK';fs.writeFileSync(path.join(out,'animais-'+label+'.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks.length,failed:report.checks.filter(c=>!c.pass).map(c=>({name:c.name,evidence:c.name.includes('120s')?{outside:c.evidence.outside,maxStep:c.evidence.maxStep}:c.evidence})),fatal:report.fatal,sha256:report.sha256},null,2));if(!baseline&&report.status!=='OK')process.exitCode=1;});
