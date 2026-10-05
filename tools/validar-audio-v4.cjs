/* Auditoria de áudio v4: módulos-fonte no Web Audio real e integração opcional
   (--integrated) após build do root. Não envia dados nem usa áudio de terceiros.
   WAV de comparação e métricas técnicas; qualidade percebida exige escuta. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'analise/otimizacao-v4');fs.mkdirSync(dir,{recursive:true});
const modules=['70-synth-sfx.js','71-original-audio.js','90-ambient-synth.js'];
const result={date:new Date().toISOString(),sourceHashes:{},checks:[],errors:[],humanListening:false};
function check(name,pass,evidence){result.checks.push({name,pass:!!pass,evidence});}
function wav(samples,file,rate=24000){
  const b=Buffer.alloc(44+samples.length*2);b.write('RIFF',0);b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(samples.length*2,40);
  samples.forEach((v,i)=>b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2));fs.writeFileSync(path.join(dir,file),b);
}
async function auditModules(browser){
  const page=await browser.newPage();page.on('pageerror',e=>result.errors.push(e.message));
  await page.setContent('<button id="start">Validar áudio v4</button>');
  await page.addScriptTag({content:`let soundEnabled=true;const AudioManager={master:.75};`});
  const template=fs.readFileSync(path.join(root,'src/index.template.html'),'utf8');
  const musicSource=template.slice(template.indexOf('const AmbientMusic = {'),template.indexOf('window.AmbientMusic = AmbientMusic;')+'window.AmbientMusic = AmbientMusic;'.length);
  await page.addScriptTag({content:musicSource});
  for(const name of modules){const source=fs.readFileSync(path.join(root,'src/modules',name),'utf8');result.sourceHashes[name]=createHash('sha256').update(source).digest('hex');await page.addScriptTag({content:source});}
  await page.evaluate(()=>{for(const cb of window.__farmBiomes||[])cb({});});
  const before=await page.evaluate(()=>({bank:FarmOriginalAudio.state(),ambient:AmbientSynth.state(),sfx:synthSfx.state(),music:AmbientMusic.state()}));
  check('Carregar módulos não inicia contexto, vozes ou timer sonoro',Object.values(before).every(v=>v.context==='not-created'&&!v.voices&&!v.timer),before);
  await page.evaluate(()=>{document.getElementById('start').onclick=async()=>{
    try{
      const bank=FarmOriginalAudio;await bank.prepare();const prepared=bank.state();
      AudioManager.master=0;bank.setMaster(0);const silent=bank.createSound('room_tone');silent.volume=.2;await silent.play();synthSfx.dialogue('rosa');AmbientMusic.start();AmbientSynth.setRiver(.4);AmbientSynth.setCrickets(.4);
      const zeroStart={bank:bank.state(),sfx:synthSfx.state(),music:AmbientMusic.state(),ambient:AmbientSynth.state()};
      AudioManager.master=.75;bank.setMaster(.75);const room=bank.createSound('room_tone');room.volume=.2;await room.play();
      synthSfx.dialogue('rosa');const greeting=synthSfx.state();for(let i=0;i<100;i++)synthSfx.dialogue('nico','choice');const repeated=synthSfx.state();
      await new Promise(r=>setTimeout(r,320));synthSfx.stopAll();for(let i=0;i<100;i++)synthSfx.spray();const noise=synthSfx.state();
      AmbientMusic.start();AmbientMusic.setScene({region:'farm',indoor:false,night:false,resting:false});const musicNormal=AmbientMusic.state();
      AmbientMusic.setScene({region:'farm',indoor:true,night:false,resting:true});const musicRest=AmbientMusic.state();
      AmbientMusic.setVolume(0);const musicZero=AmbientMusic.state();AmbientMusic.setVolume(.75);const musicRestored=AmbientMusic.state();
      await Promise.all([bank.suspend(),synthSfx.suspend(),AmbientSynth.suspend(),AmbientMusic.suspend()]);
      const beforeSuspendedPlay=bank.state().voices;const blocked=bank.createSound('planting');blocked.volume=.3;await blocked.play();
      bank.updateFootsteps({x:0,y:0,moving:true,scene:'test'});bank.updateFootsteps({x:25,y:0,moving:true,scene:'test'});
      const suspended={bank:bank.state(),sfx:synthSfx.state(),music:AmbientMusic.state(),ambient:AmbientSynth.state(),blocked:blocked.paused,beforeVoices:beforeSuspendedPlay};
      await Promise.all([bank.resume(),synthSfx.resume(),AmbientSynth.resume(),AmbientMusic.resume()]);
      bank.stopAll();for(let i=0;i<80;i++){const a=bank.createSound('planting');a.volume=.03;await a.play();}
      const cap=bank.state();bank.stopAll();
      for(let i=0;i<100;i++)bank.updateFootsteps({x:i*18,y:50,moving:true,scene:'test',surface:'dirt'});const stepCap=bank.state();
      const mixes={};for(const region of ['farm','mountain','desert'])for(const tod of [6,12,23])mixes[region+'-'+tod]=AmbientSynth.mixScene({weights:[[region,1]],timeOfDay:tod});
      mixes.house=AmbientSynth.mixScene({weights:[['farm',1]],indoor:true,scene:'house',timeOfDay:12});
      mixes.barn=AmbientSynth.mixScene({weights:[['farm',1]],indoor:true,scene:'barn',timeOfDay:12});
      mixes.greenhouse=AmbientSynth.mixScene({weights:[['farm',1]],scene:'greenhouse',timeOfDay:12});
      mixes.paused=AmbientSynth.mixScene({weights:[['farm',1]],paused:true,timeOfDay:12,fireVolume:.4,riverProximity:1});
      mixes.rest=AmbientSynth.mixScene({weights:[['farm',1]],timeOfDay:12,resting:true});
      mixes.mixed=AmbientSynth.mixScene({weights:[['mountain',.5],['farm',.5]],timeOfDay:12});
      const pcm=[];for(const key of bank.keys){
        const data=bank.generate(key),again=bank.generate(key);let peak=0,sum=0,dc=0,reproducible=true;
        for(let i=0;i<data.length;i++){peak=Math.max(peak,Math.abs(data[i]));sum+=data[i]**2;dc+=data[i];reproducible&&=data[i]===again[i];}
        const offline=new OfflineAudioContext(1,data.length,24000),b=offline.createBuffer(1,data.length,24000);b.copyToChannel(data,0);
        const source=offline.createBufferSource();source.buffer=b;source.connect(offline.destination);source.start();const rendered=await offline.startRendering();
        const renderedRms=Math.sqrt(rendered.getChannelData(0).reduce((s,v)=>s+v*v,0)/data.length);
        pcm.push({key,seconds:data.length/24000,peak,rms:Math.sqrt(sum/data.length),dc:dc/data.length,reproducible,finite:data.every(Number.isFinite),zeroEdges:data[0]===0&&data.at(-1)===0,renderedRms});
      }
      const clips=['farm_ambience','birds_loop','cold_wind','desert_breeze','room_tone','barn_room','fireplace'].map(key=>({key,data:[...bank.generate(key).slice(0,96000)]}));
      const tones=[220,330,440].map(freq=>{const data=AmbientMusic.generateTone(freq,.9);return{freq,data:[...data],finite:data.every(Number.isFinite),peak:Math.max(...data.map(Math.abs)),edges:data[0]===0&&data.at(-1)===0};});
      soundEnabled=false;bank.setEnabled(false);bank.stopAll();synthSfx.syncVolume();AmbientSynth.syncVolume();AmbientMusic.stop();
      const muted={bank:bank.state(),sfx:synthSfx.state(),ambient:AmbientSynth.state(),music:AmbientMusic.state()};
      AmbientSynth.dispose();window.__audioV4={prepared,zeroStart,greeting,repeated,noise,musicNormal,musicRest,musicZero,musicRestored,suspended,cap,stepCap,mixes,pcm,clips,tones,muted};
    }catch(e){window.__audioV4={error:e.stack};}
  };});
  await page.locator('#start').click();await page.waitForFunction(()=>window.__audioV4,{},{timeout:30000});const data=await page.evaluate(()=>window.__audioV4);assert.ok(!data.error,data.error);
  check('Preparar PCM mantém contexto ausente',data.prepared.context==='not-created'&&data.prepared.prepared===23,data.prepared);
  check('Volume zero não inicia Web Audio nem timers',Object.values(data.zeroStart).every(v=>v.context==='not-created'&&!v.voices&&!v.timer&&!v.timers),data.zeroStart);
  check('Saudação real toca e tecla repetida não cria cem vozes',data.greeting.voices===1&&data.greeting.timers===1&&data.repeated.voices<=2&&data.repeated.timers<=1,{greeting:data.greeting,repeated:data.repeated});
  check('Ruído de interação é cacheado e limitado',data.noise.noiseBuffers===1&&data.noise.voices<=1,data.noise);
  check('Descanso reduz música e usa perfil de interior',data.musicRest.resting&&data.musicRest.indoor&&data.musicRest.target<data.musicNormal.target*.5,{normal:data.musicNormal,rest:data.musicRest});
  check('Master zero cancela notas e agendador, restaurar retoma um agendador',data.musicZero.voices===0&&!data.musicZero.timer&&data.musicRestored.timer,{zero:data.musicZero,restored:data.musicRestored});
  check('Suspend bloqueia novos efeitos e passos sem retomar contexto',data.suspended.blocked&&data.suspended.bank.context==='suspended'&&data.suspended.bank.voices===data.suspended.beforeVoices&&!data.suspended.music.timer&&!data.suspended.ambient.timer,data.suspended);
  check('Rajadas de efeitos são limitadas a 16 vozes e passos a quatro',data.cap.effects<=16&&data.stepCap.effects<=4,{effects:data.cap.effects,footsteps:data.stepCap.effects});
  const m=data.mixes;
  check('Casa e celeiro têm som interior próprio sem fauna externa',m.house.loops.room_tone>0&&m.barn.loops.barn_room>0&&m.house.loops.birds_loop===0&&m.barn.loops.fireplace===0,{house:m.house,barn:m.barn});
  check('Deserto tem brisa seca sem repetir vento de montanha',m['desert-12'].loops.desert_breeze>0&&m['desert-12'].loops.cold_wind===0&&m['mountain-12'].loops.desert_breeze===0,{desert:m['desert-12'],mountain:m['mountain-12']});
  check('Estufa é abafada, com pequena presença exterior',m.greenhouse.music.indoor&&m.greenhouse.loops.room_tone>0&&m.greenhouse.loops.birds_loop<m['farm-12'].loops.birds_loop,m.greenhouse);
  check('Fauna respeita noite e biomas',m['farm-23'].crickets>0&&m['farm-23'].loops.birds_loop===0&&Object.entries(m).filter(([name])=>name.startsWith('mountain')||name.startsWith('desert')).every(([,mix])=>mix.crickets===0&&mix.loops.birds_loop===0),m);
  check('Descanso acalma ambiente e leitura encerra sons do mundo',m.rest.loops.birds_loop<m['farm-12'].loops.birds_loop*.5&&Object.values(m.paused.loops).every(v=>v===0)&&m.paused.river===0&&m.paused.crickets===0,{rest:m.rest,paused:m.paused});
  check('Pesos intermediários mantêm transição contínua',Object.keys(m.mixed.loops).every(key=>Math.abs(m.mixed.loops[key]-(m['farm-12'].loops[key]+m['mountain-12'].loops[key])/2)<1e-8),m.mixed);
  check('23 efeitos/ambientes têm PCM finito original, bordas sem estalo e render offline',data.pcm.length===23&&data.pcm.every(p=>p.peak>.01&&p.peak<=.720001&&p.finite&&p.reproducible&&p.zeroEdges&&Math.abs(p.rms-p.renderedRms)<1e-7),data.pcm);
  check('Timbres de música têm PCM próprio, sem clipping',data.tones.every(t=>t.finite&&t.edges&&t.peak<.95),data.tones.map(({data,...tone})=>tone));
  check('Mute limpa todas as notas/timers e fontes de ação',data.muted.bank.voices===0&&data.muted.sfx.voices===0&&data.muted.sfx.timers===0&&data.muted.ambient.chirps===0&&!data.muted.ambient.timer&&data.muted.music.voices===0&&!data.muted.music.timer,data.muted);
  const preview=[];for(const clip of data.clips){preview.push(...clip.data.map(v=>v*.65),...new Array(6000).fill(0));}
  for(const tone of data.tones)preview.push(...tone.data.map(v=>v*.25),...new Array(6000).fill(0));
  wav(preview,'audio-v4-ambientes-timbres.wav');
  result.moduleRuntime={...data,clips:data.clips.map(({data,...rest})=>rest),tones:data.tones.map(({data,...rest})=>rest)};await page.close();
}
async function auditIntegrated(browser){
  const base=process.env.FARM37_URL||'http://127.0.0.1:8766';assert.equal(new URL(base).hostname,'127.0.0.1');
  const page=await browser.newPage();page.on('pageerror',e=>result.errors.push(e.message));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.clear();localStorage.setItem('farm37_seen_intro','1');});
  const response=await page.goto(base+'/jogo.html?v=audio-v4-'+Date.now());result.buildSha256=createHash('sha256').update(await response.body()).digest('hex');
  await page.getByRole('button',{name:'COMEÇAR NOVO JOGO',exact:false}).click();await page.locator('.cs-option[data-gender="f"]').click();await page.locator('#csName').fill('Teste de áudio');await page.locator('#csStartBtn').click();
  await page.evaluate(()=>{_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();currentWeather=null;weatherCooldown=1e6;player.temp=37;player.hyd=100;player.en=100;});
  const states=await page.evaluate(async()=>{
    const snapshot=()=>({bank:FarmOriginalAudio.state(),music:AmbientMusic.state(),sfx:synthSfx.state(),ambient:AmbientSynth.state(),loopTargets:Object.fromEntries(Object.entries(AudioManager.sounds).filter(([,a])=>a.loop).map(([k,a])=>[k,+a.dataset.target]))});
    const settle=async()=>{for(let i=0;i<100;i++)updateAudioState();await new Promise(r=>setTimeout(r,100));};
    timeOfDay=12;currentSeason='hot';currentScene='main';player.x=29*TS;player.y=58*TS;await settle();const farm=snapshot();
    setSceneTo('house');player.resting=false;await settle();const house=snapshot();player.resting=true;await settle();const resting=snapshot();
    setMasterVolume(0);await settle();const zero=snapshot();setMasterVolume(.75);player.resting=false;await settle();const restored=snapshot();
    if(soundEnabled)toggleSound();await settle();const muted=snapshot();return{farm,house,resting,zero,restored,muted};
  });
  check('Integrado: interiores trocam loops e descanso chega à música',states.house.loopTargets.room_tone>0&&states.house.loopTargets.birds_loop===0&&states.resting.music.resting&&states.resting.music.target<states.house.music.target,states);
  check('Integrado: master zero libera loops, notas e agendador',states.zero.bank.voices===0&&states.zero.music.voices===0&&!states.zero.music.timer,states.zero);
  check('Integrado: restaurar volume retoma som da sala e mute limpa fontes',states.restored.bank.loops>0&&states.restored.music.timer&&states.muted.bank.voices===0&&states.muted.sfx.voices===0&&states.muted.ambient.chirps===0,states);
  result.integrated=states;await page.close();
  const visibility=await browser.newPage();visibility.on('pageerror',e=>result.errors.push(e.message));
  await visibility.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.clear();localStorage.setItem('farm37_audio_v1',JSON.stringify({soundEnabled:true,volume:0}));localStorage.setItem('farm37_seen_intro','1');
    window.__audioResumeEvents=[];const native=AudioContext.prototype.resume;AudioContext.prototype.resume=function(...args){const event={at:performance.now(),before:this.state,hidden:document.hidden,visibility:document.visibilityState,activated:navigator.userActivation.hasBeenActive,status:'pending'};__audioResumeEvents.push(event);return native.apply(this,args).then(value=>{event.status='resolved';event.after=this.state;return value;},error=>{event.status='rejected';event.error=error.message;throw error;});};});
  await visibility.goto(base+'/jogo.html?v=audio-v4-visibility-'+Date.now());
  await visibility.getByRole('button',{name:'COMEÇAR NOVO JOGO',exact:false}).click();await visibility.locator('.cs-option[data-gender="f"]').click();await visibility.locator('#csName').fill('Visibilidade');await visibility.locator('#csStartBtn').click();
  await visibility.evaluate(()=>{_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();currentWeather=null;player.temp=37;player.en=100;player.hyd=100;});
  const edges=await visibility.evaluate(async()=>{
    const state=()=>({bank:FarmOriginalAudio.state(),sfx:synthSfx.state(),ambient:AmbientSynth.state(),music:AmbientMusic.state(),soundEnabled});
    const initialZero=state();const slider=document.getElementById('accessVolume');slider.value='.75';slider.dispatchEvent(new Event('input',{bubbles:true}));updateAudioState();await new Promise(r=>setTimeout(r,100));const raised=state();
    synthSfx.click();AmbientSynth.setRiver(.4);await new Promise(r=>setTimeout(r,70));toggleSound();
    // Reproduz exatamente as propriedades/eventos consultados pelo handler
    // nativo, sem forçar APIs audio.resume manualmente dentro da regressão.
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));await new Promise(r=>setTimeout(r,70));const hidden=state();
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));await new Promise(r=>setTimeout(r,70));const visibleMuted=state();
    delete document.hidden;return{initialZero,raised,hidden,visibleMuted};
  });
  await visibility.evaluate(()=>{const button=document.createElement('button');button.id='edgeUnmuteAudit';button.textContent='Retomar som';button.style='position:fixed;left:0;top:0;z-index:999999';
    button.onclick=()=>{toggleSound();updateAudioState();synthSfx.pageTurn();AmbientSynth.setRiver(.4);};document.body.appendChild(button);});
  await visibility.locator('#edgeUnmuteAudit').click();
  try{await visibility.waitForFunction(()=>FarmOriginalAudio.state().context==='running'&&AmbientMusic.active&&synthSfx.state().context==='running'&&AmbientSynth.state().context==='running',{},{timeout:5000});}catch{}
  edges.unmuted=await visibility.evaluate(()=>{synthSfx.dialogue('nico');return{bank:FarmOriginalAudio.state(),sfx:synthSfx.state(),ambient:AmbientSynth.state(),music:AmbientMusic.state(),soundEnabled};});
  edges.resumeEvents=await visibility.evaluate(()=>({events:__audioResumeEvents,hidden:document.hidden,visibility:document.visibilityState,activated:navigator.userActivation.hasBeenActive,sounds:Object.values(AudioManager.sounds).map(a=>({name:a.name,missing:a.dataset.missing,target:a.dataset.target,paused:a.paused}))}));
  check('Volume salvo zero também conserva silêncio nos botões de menu',edges.initialZero.sfx.context==='not-created',edges.initialZero.sfx);
  check('Preferência inicial zero não cria contexto; aumentar slider inicia música',edges.initialZero.music.context==='not-created'&&edges.initialZero.bank.context==='not-created'&&edges.raised.music.active&&edges.raised.music.timer,edges);
  check('Ocultar e voltar com mute mantém contextos suspensos sem prender flags',!edges.visibleMuted.soundEnabled&&!edges.visibleMuted.bank.suspended&&edges.visibleMuted.sfx.context==='suspended'&&!edges.visibleMuted.ambient.suspended&&!edges.visibleMuted.music.timer,edges);
  check('Religar após voltar à aba retoma todos os sons sem nova partida',edges.unmuted.bank.context==='running'&&edges.unmuted.bank.loops>0&&edges.unmuted.sfx.context==='running'&&edges.unmuted.sfx.voices>0&&edges.unmuted.ambient.context==='running'&&edges.unmuted.music.active&&edges.unmuted.music.timer,edges.unmuted);
  result.visibilityEdges=edges;await visibility.close();
}
async function renderCues(browser){
  const page=await browser.newPage();
  const source=fs.readFileSync(path.join(root,'src/modules/70-synth-sfx.js'),'utf8'),cues=[];
  for(const identity of ['rosa','lia','tomas','ines','caio','nico','sleep','animal:cow','animal:sheep','animal:chicken']){
    await page.setContent('<div>Render offline das interações originais</div>');
    const data=await page.evaluate(async({source,identity})=>{
      const offline=new OfflineAudioContext(1,Math.ceil(24000*1.3),24000);let time=0,id=0;const queue=new Map();
      // O relógio virtual avança entre callbacks; assim as duas notas agendadas
      // pelo SFX real são renderizadas nos mesmos instantes do navegador.
      Object.defineProperty(offline,'currentTime',{get:()=>time});
      window.AudioContext=function(){return offline;};
      window.setTimeout=(fn,ms)=>{queue.set(++id,{fn,time:time+ms/1000});return id;};window.clearTimeout=id=>queue.delete(id);
      (0,eval)('let soundEnabled=true;const AudioManager={master:.75};'+source);
      if(identity==='sleep')synthSfx.sleep();else if(identity.startsWith('animal:'))synthSfx.animal(identity.slice(7));else synthSfx.dialogue(identity,'greet');
      while(queue.size){const [key,event]=[...queue].sort((a,b)=>a[1].time-b[1].time)[0];queue.delete(key);time=event.time;event.fn();}
      const rendered=await offline.startRendering();return [...rendered.getChannelData(0)];
    },{source,identity});
    cues.push({identity,data,peak:data.reduce((p,v)=>Math.max(p,Math.abs(v)),0),rms:Math.sqrt(data.reduce((sum,v)=>sum+v*v,0)/data.length)});
  }
  const deltas=cues.slice(0,6).map((cue,i)=>{const next=cues[(i+1)%6];return cue.data.reduce((sum,v,j)=>sum+Math.abs(v-next.data[j]),0)/cue.data.length;});
  check('Seis saudações têm identidade sonora própria e volume suave',deltas.every(d=>d>.001)&&cues.slice(0,6).every(c=>c.peak>.01&&c.peak<.1),{cues:cues.map(({data,...cue})=>cue),deltas});
  check('Descanso usa uma frase baixa e termina em silêncio',cues[6].peak<.08&&cues[6].rms>.002&&cues[6].data.slice(-2400).every(v=>Math.abs(v)<1e-6),cues[6].rms);
  check('Cuidado de animais tem resposta própria suave, sem loop',cues.slice(7).every(c=>c.peak>.01&&c.peak<.1&&c.data.slice(-2400).every(v=>Math.abs(v)<1e-6)),cues.slice(7).map(({data,...cue})=>cue));
  const samples=[];for(const cue of cues)samples.push(...cue.data,...new Array(6000).fill(0));wav(samples,'audio-v4-npcs-descanso.wav');await page.close();
}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{await auditModules(browser);await renderCues(browser);if(process.argv.includes('--integrated'))await auditIntegrated(browser);}catch(e){result.fatal=e.stack;}finally{await browser.close();}
  check('Sem erros JavaScript',result.errors.length===0,result.errors);result.status=result.fatal||result.checks.some(c=>!c.pass)?'FALHA':'OK';
  fs.writeFileSync(path.join(dir,process.argv.includes('--integrated')?'audio-v4-integrado.json':'audio-v4-modulos.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({status:result.status,checks:result.checks.length,failures:result.checks.filter(c=>!c.pass),fatal:result.fatal,sourceHashes:result.sourceHashes},null,2));if(result.status!=='OK')process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
