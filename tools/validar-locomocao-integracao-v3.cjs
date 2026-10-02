/* Teclado real, update/render reais, relógio de simulação controlado.
   Sem alterar fonte/mundo. --baseline conserva falhas como diagnóstico.
   Cenas/controles são preparados; vídeo mostra sequência contínua a 30 Hz. */
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/movimento-mapa-v3');fs.mkdirSync(out,{recursive:true});
const baseline=process.argv.includes('--baseline'),phaseOnly=process.argv.includes('--phase-only'),label=process.env.LOCOMOCAO_LABEL||(phaseOnly?'audio-fase':baseline?'antes':'depois');
const report={at:new Date().toISOString(),baseline,checks:[],errors:[],external:[],samples:{},artifacts:[],limits:['Posições preparadas; teclas reais; update em intervalos controlados.','Vídeo de render real a30Hz; não é ensaio humano nem captura de monitor físico.','Critérios de pixels complementam inspeção visual; não avaliam beleza por contagem de quadros.']};
const check=(name,pass,evidence)=>report.checks.push({name,pass:!!pass,evidence});let browser,page;
async function key(k,on=true){await page.keyboard[on?'down':'up'](k);}
async function step(n=1,dt=1/60){return page.evaluate(({n,dt})=>window.__movement.step(n,dt),{n,dt});}
async function reset(){await page.evaluate(()=>window.__movement.reset());}
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:1280,height:800}});
 if(phaseOnly){
  await page.setContent('<button id="audit">Validar contatos da passada</button>');const source=fs.readFileSync(path.join(root,'src/modules/71-original-audio.js'),'utf8');report.source71SHA256=createHash('sha256').update(source).digest('hex');await page.addScriptTag({content:source});
  await page.evaluate(()=>document.getElementById('audit').onclick=()=>{
   const bank=FarmOriginalAudio,cases=[],count=()=>bank.state().footsteps.count;
   const send=(x,phase,props={})=>bank.updateFootsteps({x,y:100,scene:'audit',moving:true,surface:'wood',phase,...props});
   let before=count();send(100,2.95,{moving:false});send(101,3.2);cases.push({name:'Retoma perto do contato preservando fração anterior',pass:count()===before+1,state:bank.state().footsteps});
   before=count();send(102,3.4,{running:true});send(103,3.6,{running:false});cases.push({name:'Alternar corrida não reintepreta distância como contato',pass:count()===before,state:bank.state().footsteps});
   before=count();send(114,6.3,{running:true});cases.push({name:'Próximo contato sai em2π',pass:count()===before+1,state:bank.state().footsteps});
   before=count();send(114,9.5);cases.push({name:'Sem deslocamento não toca mesmo que fase mude',pass:count()===before,state:bank.state().footsteps});
   before=count();send(600,12.7);send(601,12.8);cases.push({name:'Teleporte resincroniza sem rajada',pass:count()===before,state:bank.state().footsteps});
   bank.resetFootsteps();before=count();send(100,6.1,{moving:false});send(101,.1);cases.push({name:'Fase normalizada cruza2π sem perder contato',pass:count()===before+1,state:bank.state().footsteps});
   before=count();send(120,3.05,{blocked:true});send(121,3.3);cases.push({name:'Pausa ancora fase e som retoma no contato seguinte',pass:count()===before+1,state:bank.state().footsteps});
   before=count();send(122,22);cases.push({name:'Salto inválido de fase não multiplica vozes',pass:count()===before,state:bank.state().footsteps});
   bank.resetFootsteps();before=count();send(0,undefined);send(18,undefined);cases.push({name:'API legada semphase ainda reconhece18px',pass:count()===before+1,state:bank.state().footsteps});
   bank.stopAll();window.__phaseCases=cases;
  });await page.locator('#audit').click();await page.waitForFunction(()=>window.__phaseCases);report.checks=await page.evaluate(()=>window.__phaseCases);return;
 }
 page.on('pageerror',e=>report.errors.push(e.message));await page.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.clear();localStorage.setItem('farm37_seen_intro','1');});
 const base=process.env.FARM37_URL||'http://127.0.0.1:8766';await page.route('**/*',r=>{if(new URL(r.request().url()).origin===new URL(base).origin)return r.continue();report.external.push(r.request().url());return r.abort();});
 const response=await page.goto(base+'/jogo.html?v=locomocao-v3-'+Date.now());report.sha256=createHash('sha256').update(await response.body()).digest('hex');
 await page.getByRole('button',{name:'COMEÇAR NOVO JOGO',exact:false}).click();await page.locator('.cs-option[data-gender="f"]').click();await page.locator('#csName').fill('Passadas');await page.locator('#csStartBtn').click();
 await page.evaluate(()=>{
  _pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();isPaused=false;histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;
  currentWeather=null;weatherCooldown=1e8;A11Y.noDeath=true;A11Y.reduceMotion=false;timeOfDay=12;currentSeason='hot';document.activeElement?.blur();
  let arena=null;
  for(let y=120;y<1900&&!arena;y+=80)for(let x=80;x<850&&!arena;x+=80){let valid=true;for(let dy=-50;dy<=50&&valid;dy+=5)for(let dx=-50;dx<=50;dx+=5)if(FarmWorldDepth.isBlocked(x+dx,y+dy,{x:x+dx,y:y+dy})){valid=false;break;}if(valid)arena={x,y};}
  if(!arena)throw Error('Nenhuma área livre de100×100 encontrada no mundo real');
  const TAU=Math.PI*2;const read=()=>({x:player.x,y:player.y,anim:player.anim,phase:((player.anim%TAU)+TAU)%TAU,dir:player.dir,moving:player.moving,running:player.running,
   blend:player.gaitBlend??null,runBlend:player.gaitRunBlend??null,steps:FarmOriginalAudio.state().footsteps.count,action:player.actionTimer});
  const snapshot=()=>{const c=document.createElement('canvas');c.width=112;c.height=112;const g=c.getContext('2d');g.fillStyle='#d7dfc3';g.fillRect(0,0,112,112);g.imageSmoothingEnabled=false;
   g.scale(2,2);FarmCharacterArt.drawPlayer(g,player,{x:28,y:34,time:1000,winter:false});return c.toDataURL();};
  const reset=()=>{for(const k of Object.keys(keys))delete keys[k];player.x=arena.x;player.y=arena.y;player.dir=2;player.anim=0;player.gaitBlend=0;player.gaitRunBlend=0;
   player.moving=false;player.running=false;player.actionTimer=0;player.resting=false;player.dead=false;player.temp=37;player.hyd=100;player.en=100;player.upgrades.boots=0;
   FarmOriginalAudio.resetFootsteps();histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;isPaused=false;_camSnap=true;render();};
  const step=(n,dt)=>{const samples=[];for(let i=0;i<n;i++){const previous=read();update(dt);updateAudioState();const next=read();samples.push({...next,distance:Math.hypot(next.x-previous.x,next.y-previous.y),contact:next.steps>previous.steps});}render();return samples;};
  window.__movement={arena,read,step,reset,snapshot};reset();
 });
 report.arena=await page.evaluate(()=>__movement.arena);
 await key('d');const before=(await step(17)).at(-1);const beforeImage=await page.evaluate(()=>__movement.snapshot());await key('d',false);const stopped=(await step()).at(-1),stopImage=await page.evaluate(()=>__movement.snapshot());
 const settled=(await step(20)).at(-1);await key('d');const resumed=(await step()).at(-1),resumeImage=await page.evaluate(()=>__movement.snapshot());await key('d',false);
 report.samples.stop={before,stopped,settled,resumed};check('Parar conserva fase da passada, sem reiniciar o mesmo pé',Math.abs(stopped.anim-before.anim)<1e-8,report.samples.stop);
 check('Retomar continua fase anterior',resumed.anim>before.anim&&resumed.anim-before.anim<.5,report.samples.stop);
 check('Transição visual assenta gradualmente até repouso',before.blend>.9&&stopped.blend>0&&stopped.blend<before.blend&&settled.blend<.03,report.samples.stop);
 const sheets=[{name:'parada-retomada',frames:[{label:'Último passo',url:beforeImage},{label:'Soltou a tecla',url:stopImage},{label:'Retomou',url:resumeImage}]}];
 await reset();await key('d');const walk=(await step(17)).at(-1);await key('Shift');const run=(await step()).at(-1);await key('Shift',false);const walkAgain=(await step()).at(-1);await key('d',false);
 report.samples.shift={walk,run,walkAgain};check('Shift mistura gesto sem trocar amplitude instantaneamente',run.runBlend>0&&run.runBlend<1&&walkAgain.runBlend>=0&&walkAgain.runBlend<run.runBlend,report.samples.shift);
 await reset();await key('d');await step(15);await key('d',false);await page.evaluate(()=>triggerPlayerAction('water'));const action=(await step(8)).at(-1);check('Ação preserva fase de locomoção enquanto planta os pés',action.anim>0,action);
 const cadence=[];await reset();await key('d');
 for(let block=0;block<8;block++){await key('Shift',block%2===1);const samples=await step(10);cadence.push(...samples.map(s=>({...s,block})));}
 await key('Shift',false);await key('d',false);const contacts=cadence.filter(s=>s.contact).map(s=>({...s,error:Math.min(s.phase%Math.PI,Math.PI-s.phase%Math.PI)}));
 report.samples.contacts=contacts;check('Contato sonoro acompanha0/π mesmo alternandoShift',contacts.length>=3&&contacts.every(s=>s.error<.35),contacts);
 await reset();await page.evaluate(()=>{player.y=8;player.x=40;player.dir=3;});await key('w');await key('d');const sliding=await step(12);await key('w',false);await key('d',false);
 check('Deslizar na borda acompanha direção do deslocamento real',sliding.at(-1).x>40&&sliding.at(-1).y===8&&sliding.at(-1).dir===2,sliding.at(-1));
 await reset();await page.evaluate(()=>{player.x=8;player.y=120;player.anim=1.5;});await key('a');await key('Shift');const blocked=await step(30);await key('a',false);await key('Shift',false);
 check('Colisão não avança passada nem dispara passos',blocked.every(s=>s.distance===0&&!s.moving&&!s.running&&!s.contact&&Math.abs(s.anim-1.5)<1e-8),blocked.at(-1));
 const rates=[];for(const fps of [30,60,120]){await reset();await key('d');const trace=await step(fps*.6,1/fps);await key('d',false);rates.push({fps,distance:trace.reduce((sum,s)=>sum+s.distance,0),anim:trace.at(-1).anim,contacts:trace.filter(s=>s.contact).length});}
 report.samples.rates=rates;check('Distância e fase são iguais em30/60/120Hz',Math.max(...rates.map(s=>s.distance))-Math.min(...rates.map(s=>s.distance))<1e-6&&Math.max(...rates.map(s=>s.anim))-Math.min(...rates.map(s=>s.anim))<1e-6,rates);
 await reset();await key('d');const straight=await step(20);await key('d',false);await reset();await key('d');await key('s');const diagonal=await step(20);await key('d',false);await key('s',false);
 check('Diagonal não acelera deslocamento nem animação',Math.abs(straight.reduce((s,v)=>s+v.distance,0)-diagonal.reduce((s,v)=>s+v.distance,0))<1e-6&&Math.abs(straight.at(-1).anim-diagonal.at(-1).anim)<1e-6,{straight:straight.at(-1),diagonal:diagonal.at(-1)});
 for(const sheet of sheets){const url=await page.evaluate(async frames=>{const c=document.createElement('canvas');c.width=frames.length*236;c.height=272;const g=c.getContext('2d');g.fillStyle='#d7dfc3';g.fillRect(0,0,c.width,c.height);g.imageSmoothingEnabled=false;g.fillStyle='#203b31';g.font='16px sans-serif';for(let i=0;i<frames.length;i++){const img=new Image();img.src=frames[i].url;await img.decode();g.drawImage(img,i*236,35,224,224);g.fillText(frames[i].label,i*236+10,24);}return c.toDataURL();},sheet.frames);const file='integracao-'+label+'-'+sheet.name+'.png';fs.writeFileSync(path.join(out,file),Buffer.from(url.split(',')[1],'base64'));report.artifacts.push(file);}
 if(process.env.LOCOMOCAO_VIDEO==='1'){
  const movie=await page.evaluate(async()=>{__movement.reset();const canvas=document.getElementById('game'),stream=canvas.captureStream(30),chunks=[],rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:1800000});
   const ended=new Promise(resolve=>rec.onstop=async()=>{const blob=new Blob(chunks,{type:'video/webm'}),reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob);});rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   rec.start();let frame=0;await new Promise(resolve=>{const id=setInterval(()=>{for(const key of ['w','a','s','d','shift'])delete keys[key];if(frame<28)keys.d=true;else if(frame<38){}else if(frame<60){keys.a=true;keys.shift=frame<48;}else if(frame<88)keys.w=true;else if(frame<98){}else if(frame<125){keys.s=true;keys.shift=true;}
    update(1/30);updateAudioState();render();frame++;if(frame>=140){clearInterval(id);resolve();}},1000/30);});rec.stop();const url=await ended;stream.getTracks().forEach(t=>t.stop());return url;});
  const file='integracao-'+label+'-sequencia.webm';fs.writeFileSync(path.join(out,file),Buffer.from(movie.split(',')[1],'base64'));report.artifacts.push(file);
 }
 check('Sem erros JavaScript ou rede externa',!report.errors.length&&!report.external.length,{errors:report.errors,external:report.external});
})().catch(e=>report.fatal=e.stack).finally(async()=>{if(browser)await browser.close();report.status=report.fatal||report.checks.some(c=>!c.pass)?'FALHA':'OK';fs.writeFileSync(path.join(out,'integracao-'+label+'.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks.length,failed:report.checks.filter(c=>!c.pass),fatal:report.fatal,sha256:report.sha256},null,2));if(!baseline&&report.status!=='OK')process.exitCode=1;});
