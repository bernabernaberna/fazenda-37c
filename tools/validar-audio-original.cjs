/* Regressão reprodutível do banco original no Edge/Web Audio real.
   Inicie tools/capsrv.py 8766; não precisa iniciar uma partida ou backend.
   Somente localhost é permitido. PCM é inspecionado e renderizado offline;
   isto não é uma avaliação humana da qualidade sonora. Saída: JSON no stdout. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const raiz=path.resolve(__dirname,'..');
const origin=process.env.FARM37_URL||'http://127.0.0.1:8766';
const expected=['farm_ambience','birds_loop','cicadas_loop','cold_wind','fireplace',
  'heavy_breathing','teeth_chatter','heartbeat_warning','grass_steps','dirt_steps',
  'watering_can','planting','harvest','drink_water','shop_sell','inventory_open',
  'coat_equip','death_sound','wool_collect','fire_action','room_tone','desert_breeze','barn_room'];
(async()=>{
  const url=new URL(origin);
  assert.equal(url.hostname,'127.0.0.1','Auditoria somente no servidor local');
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage();
    const erros=[],externos=[];
    page.on('pageerror',e=>erros.push(e.message));
    await page.route('**/*',route=>{
      const u=new URL(route.request().url());
      if(u.origin===url.origin) return route.continue();
      externos.push(u.href); return route.abort();
    });
    await page.goto(origin+'/jogo.html?v=audio-original-'+Date.now());
    // Testa a fonte em desenvolvimento mesmo antes do próximo build integrado.
    await page.addScriptTag({content:fs.readFileSync(path.join(raiz,'src/modules/71-original-audio.js'),'utf8')});
    await page.evaluate(()=>{
      const b=document.createElement('button');
      b.id='audioOriginalAudit'; b.textContent='Validar áudio original';
      b.style='position:fixed;left:0;top:0;z-index:999999';
      document.body.appendChild(b);
      b.onclick=async()=>{
        try{
          const bank=window.FarmOriginalAudio;
          const inicio=performance.now(),prepared=await bank.prepare();
          const preparationMs=performance.now()-inicio;
          bank.setMaster(0.75);
          const sounds=bank.keys.map(key=>{const audio=bank.createSound(key);audio.volume=0.05;return audio;});
          const inicioPlay=performance.now();
          await Promise.all(sounds.map(audio=>audio.play()));
          const firstPlaybackMs=performance.now()-inicioPlay,init=bank.state();
          const original=sounds.find(audio=>audio.name==='death_sound');
          const clone=original.cloneNode();clone.volume=0.3;await clone.play();
          const cloneIndependent=clone.volume===0.3 && original.volume===0.05;
          bank.setMaster(0.25);
          const scaledClone=clone.volume,loopVolume=sounds[0].volume;
          bank.setMaster(0);const zeroClone=clone.volume;
          bank.setMaster(0.75);const restoredClone=clone.volume;
          for(let i=0;i<32;i++){
            const audio=bank.createSound('death_sound');audio.volume=0.01;await audio.play();
          }
          const capped=bank.state();bank.setEnabled(false);
          // AudioParam aplica automação na próxima janela de processamento.
          await new Promise(resolve=>setTimeout(resolve,40));const muted=bank.state();
          const silent=bank.createSound('planting');silent.volume=0.2;await silent.play();
          const noPlaybackWhileMuted=silent.paused;
          await bank.suspend();const suspended=bank.state();
          bank.setEnabled(true);await bank.resume();const resumed=bank.state();
          bank.stopAll();const stopped=bank.state();
          const short=bank.createSound('inventory_open');short.volume=0.1;await short.play();
          const clockBefore=bank.state().currentTime,deadline=performance.now()+4000;
          // O dispositivo inicia o relógio de áudio independentemente da
          // parede. Só exige onended depois dos .28 s completos do buffer.
          while(performance.now()<deadline){
            await new Promise(resolve=>setTimeout(resolve,40));
            if(bank.state().currentTime>clockBefore+.35&&short.paused)break;
          }
          const realtimeClockAdvanced=bank.state().currentTime>clockBefore+.35;
          const endedCleanup=realtimeClockAdvanced?(short.paused && bank.state().effects===0):null;
          bank.stopAll();const afterTimedCleanup=bank.state();
          const pcm=[];
          for(const key of bank.keys){
            const data=bank.generate(key),repeat=bank.generate(key);
            let sum=0,peak=0,reproducible=true,finite=true;
            for(let i=0;i<data.length;i++){
              sum+=data[i]*data[i];peak=Math.max(peak,Math.abs(data[i]));
              finite=finite&&Number.isFinite(data[i]);reproducible=reproducible&&Object.is(data[i],repeat[i]);
            }
            const offline=new OfflineAudioContext(1,data.length,bank.sampleRate);
            const buffer=offline.createBuffer(1,data.length,bank.sampleRate);buffer.copyToChannel(data,0);
            const source=offline.createBufferSource();source.buffer=buffer;source.connect(offline.destination);source.start();
            const rendered=await offline.startRendering();let renderedSum=0;
            for(const value of rendered.getChannelData(0)) renderedSum+=value*value;
            pcm.push({key,seconds:data.length/bank.sampleRate,peak,rms:Math.sqrt(sum/data.length),
              renderedRms:Math.sqrt(renderedSum/rendered.length),reproducible,finite,
              zeroEdges:data[0]===0 && data.at(-1)===0});
          }
          window.__originalAudioAudit={keys:bank.keys,preparationMs,firstPlaybackMs,prepared,init,
            cloneIndependent,scaledClone,loopVolume,zeroClone,restoredClone,capped,muted,
            noPlaybackWhileMuted,suspended,resumed,stopped,realtimeClockAdvanced,endedCleanup,afterTimedCleanup,pcm};
        }catch(error){window.__originalAudioAudit={error:error.stack};}
      };
    });
    // Clique real mantém as regras de autoplay do navegador em vigor.
    await page.locator('#audioOriginalAudit').click();
    await page.waitForFunction(()=>window.__originalAudioAudit);
    const r=await page.evaluate(()=>window.__originalAudioAudit);
    assert.ok(!r.error,r.error);assert.deepEqual(r.keys,expected);
    assert.equal(r.prepared.context,'not-created');assert.equal(r.prepared.prepared,23);
    assert.equal(r.init.buffers,23);assert.equal(r.init.prepared,0);assert.equal(r.init.loops,13);
    assert.ok(r.cloneIndependent);assert.ok(Math.abs(r.scaledClone-0.1)<1e-9);
    assert.equal(r.loopVolume,0.05,'Master global não duplica o ganho dos loops');
    assert.equal(r.zeroClone,0);assert.ok(Math.abs(r.restoredClone-0.3)<1e-9);
    assert.ok(r.capped.effects<=16);assert.equal(r.muted.enabled,false);assert.equal(r.muted.outputGain,0);
    assert.ok(r.noPlaybackWhileMuted);assert.equal(r.suspended.context,'suspended');
    assert.equal(r.resumed.context,'running');assert.equal(r.stopped.voices,0);
    if(r.realtimeClockAdvanced) assert.ok(r.endedCleanup);
    assert.equal(r.afterTimedCleanup.voices,0);
    for(const p of r.pcm){
      assert.ok(p.peak>0.01 && p.peak<=0.720001,p.key+': amplitude');
      assert.ok(p.finite && p.reproducible && p.zeroEdges,p.key+': PCM/seed/bordas');
      assert.ok(Math.abs(p.rms-p.renderedRms)<0.000001,p.key+': render Web Audio');
    }
    assert.deepEqual(erros,[]);assert.deepEqual(externos,[]);
    console.log(JSON.stringify({status:'OK',keys:r.keys.length,preparationMs:r.preparationMs,
      firstPlaybackMs:r.firstPlaybackMs,bytes:r.init.bytes,loops:r.init.loops,maxEffects:r.capped.effects,
      cloneIndependent:r.cloneIndependent,masterAffectsLiveClones:true,realtimeClockAdvanced:r.realtimeClockAdvanced,
      endedCleanup:r.endedCleanup,limitations:r.realtimeClockAdvanced?[]:['Relógio Web Audio realtime parado neste Edge headless; fim automático e escuta não verificados.'],
      pcm:r.pcm,erros,pedidosExternos:externos},null,2));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
