/* Ambiência original: pesos de bioma, água e grilos. Offline, ganho mestre único. */
(function(){
  'use strict';
  let ctx=null,master=null,river=null,crickets=null,started=false,suspended=false,timer=null;
  const continuous=[],chirps=new Set();let riverTarget=0,cricketTarget=0;
  const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
  const enabled=()=>typeof soundEnabled==='undefined'||!!soundEnabled;
  const volume=()=>typeof AudioManager==='undefined'?.75:clamp(AudioManager.master);
  function noiseBuffer(){
    const length=Math.ceil(ctx.sampleRate*3),cross=Math.ceil(ctx.sampleRate*.06),raw=new Float32Array(length+cross);let a=0,b=0,c=0;
    for(let i=0;i<raw.length;i++){const w=Math.random()*2-1;a=.99765*a+w*.099046;b=.963*b+w*.2965164;c=.57*c+w*1.0526913;raw[i]=(a+b+c+w*.1848)*.14;}
    const buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
    // Costura contínua: 60 ms de sobreposição entre fim e início, sem estalo.
    for(let i=0;i<length;i++)data[i]=i<cross?raw[length+i]*Math.cos(i/cross*Math.PI/2)+raw[i]*Math.sin(i/cross*Math.PI/2):raw[i];
    return buffer;
  }
  function clearChirps(){
    clearTimeout(timer);timer=null;
    for(const voice of [...chirps]){try{voice.osc.stop();voice.osc.disconnect();voice.gain.disconnect();}catch{}chirps.delete(voice);}
  }
  function ramp(bus,target,seconds=.2){
    if(!bus||!ctx||Math.abs((bus.target??-1)-target)<.0005)return;
    bus.target=target;const param=bus.gain.gain;param.cancelScheduledValues(ctx.currentTime);param.setTargetAtTime(target,ctx.currentTime,seconds/3);
  }
  function syncVolume(){
    const v=enabled()?volume():0;
    if(master&&ctx&&master.gain.value!==v){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.value=v;}
    if(!v)clearChirps();else if(started&&!suspended&&cricketTarget>.01&&!timer)scheduleCrickets();return v;
  }
  function ensure(){
    if(started)return true;if(!enabled()||volume()<=0)return false;
    try{
      ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=volume();master.connect(ctx.destination);
      const noise=ctx.createBufferSource();noise.buffer=noiseBuffer();noise.loop=true;
      const filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=620;filter.Q.value=.7;
      const lfo=ctx.createOscillator(),lfoGain=ctx.createGain();lfo.frequency.value=.18;lfoGain.gain.value=170;lfo.connect(lfoGain);lfoGain.connect(filter.frequency);
      const gain=ctx.createGain();gain.gain.value=0;noise.connect(filter);filter.connect(gain);gain.connect(master);
      continuous.push(noise,filter,lfo,lfoGain,gain);noise.start();lfo.start();river={gain,target:0};
      const cGain=ctx.createGain();cGain.gain.value=0;cGain.connect(master);crickets={gain:cGain,target:0};started=true;suspended=false;return true;
    }catch{return false;}
  }
  function scheduleCrickets(){
    if(timer||!started||suspended||!enabled()||volume()<=0||cricketTarget<=.01)return;
    // Uma voz por frase, liberada no fim. O alvo não é elevado ao quadrado.
    if(ctx.state==='running'){
      const osc=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime+.025;osc.type='sine';osc.frequency.value=4100+Math.random()*500;
      gain.gain.setValueAtTime(0,t);const pulses=4+(Math.random()*3|0);
      for(let i=0;i<pulses;i++){const start=t+i*.031;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.055,start+.004);gain.gain.linearRampToValueAtTime(0,start+.019);}
      const voice={osc,gain};chirps.add(voice);osc.connect(gain);gain.connect(crickets.gain);osc.onended=()=>{osc.disconnect();gain.disconnect();chirps.delete(voice);};osc.start(t);osc.stop(t+pulses*.031+.025);
    }
    timer=setTimeout(()=>{timer=null;scheduleCrickets();},850+Math.random()*900);
  }
  function mixScene(options={}){
    const weights={farm:0,mountain:0,desert:0},input=Array.isArray(options.weights)?options.weights:Object.entries(options.weights||{farm:1});
    for(const entry of input){const id=Array.isArray(entry)?entry[0]:entry.id,w=Array.isArray(entry)?entry[1]:(entry.w??entry.weight);if(id in weights)weights[id]+=clamp(w);}
    const total=Object.values(weights).reduce((a,b)=>a+b,0)||1;for(const key of Object.keys(weights))weights[key]/=total;
    const region=Object.keys(weights).reduce((a,b)=>weights[a]>=weights[b]?a:b),tod=((Number(options.timeOfDay)||0)%24+24)%24;
    const night=tod<6||tod>=19,cold=!!options.cold,indoor=!!options.indoor;
    const result={loops:{farm_ambience:0,birds_loop:0,cicadas_loop:0,cold_wind:0,fireplace:0},river:0,crickets:0,music:{region,night,indoor}};
    if(options.paused)return result;const fire=clamp(options.fireVolume),water=clamp(options.riverProximity),heat=clamp(options.heatStress);
    if(indoor){result.loops.fireplace=fire;return result;}if(options.scene==='greenhouse'){result.river=.08;return result;}
    const field=weights.farm,mountain=weights.mountain,desert=weights.desert;
    result.loops.farm_ambience=field*(cold?0:(night?0:.13));
    result.loops.birds_loop=field*(cold||night?0:tod<9?.05:tod<16?.025:.017);
    result.loops.cicadas_loop=field*(cold||night?0:(tod>=11&&tod<16?.045+heat*.035:.018));
    result.loops.cold_wind=mountain*(.34+(night?.06:0))+desert*(.12+(night?.035:0))+field*(cold?.22:.015);
    result.loops.fireplace=fire;result.river=water*(field*(cold?.16:.65)+mountain*.18+desert*.30);result.crickets=field*(night&&!cold?.48:0);return result;
  }
  window.AmbientSynth={mixScene,syncVolume,
    setRiver(value){riverTarget=clamp(value);if(riverTarget>0&&!ensure())return;if(river){syncVolume();ramp(river,riverTarget*.5,.4);}},
    setCrickets(value){cricketTarget=clamp(value);if(cricketTarget>0&&!ensure())return;if(crickets){syncVolume();ramp(crickets,cricketTarget,.45);if(cricketTarget>.01)scheduleCrickets();else clearChirps();}},
    suspend(){suspended=true;clearChirps();return ctx&&ctx.state!=='closed'?ctx.suspend().catch(()=>{}):Promise.resolve();},
    resume(){suspended=false;const promise=ctx&&ctx.state==='suspended'&&enabled()?ctx.resume().catch(()=>{}):Promise.resolve();return promise.then(()=>{syncVolume();scheduleCrickets();});},
    stopAll(){riverTarget=cricketTarget=0;clearChirps();if(river)ramp(river,0,.08);if(crickets)ramp(crickets,0,.08);},
    dispose(){this.stopAll();for(const node of continuous.splice(0)){try{node.stop?.();node.disconnect();}catch{}}try{crickets?.gain.disconnect();master?.disconnect();ctx?.close();}catch{}ctx=master=river=crickets=null;started=false;},
    isReady(){return started;},state(){return{context:ctx?.state||'not-created',currentTime:ctx?.currentTime??null,master:master?.gain.value??null,river:riverTarget,crickets:cricketTarget,chirps:chirps.size,timer:!!timer,suspended};}
  };

  // A música é declarada no template antes de drenar esta fila. Mantém seu
  // contexto e o reverb, mas troca notas aleatórias por frases do próprio vale.
  (window.__farmBiomes=window.__farmBiomes||[]).push(()=>{
    const music=window.AmbientMusic;if(!music)return;
    const profiles={
      farm:{scale:[261.63,293.66,329.63,392,440,523.25],beat:.54,motif:[0,2,3,null,2,1,0,null,3,4,3,2,null,1,0,null]},
      mountain:{scale:[293.66,349.23,392,440,523.25,587.33],beat:.72,motif:[0,null,2,null,1,null,3,null,2,null,1,null,0,null,null,null]},
      desert:{scale:[220,261.63,293.66,329.63,392,440],beat:.60,motif:[0,2,null,3,2,null,1,0,null,2,4,3,null,2,0,null]}
    };
    const notes=new Set();let token=0,step=0,profile={region:'farm',night:false,indoor:false,duck:1},requestedVolume=.75;
    function clearNotes(){for(const voice of [...notes]){try{voice.osc.stop();}catch{}voice.cleanup();}}
    music.setScene=function(next={}){
      const updated={region:profiles[next.region]?next.region:'farm',night:!!next.night,indoor:!!next.indoor,duck:next.duck===undefined?1:clamp(next.duck)};
      const changed=updated.region!==profile.region||updated.night!==profile.night||updated.indoor!==profile.indoor;
      const gainChanged=updated.duck!==profile.duck||updated.night!==profile.night||updated.indoor!==profile.indoor;
      profile=updated;if(changed)step=0;if(gainChanged)this.setVolume(requestedVolume);
    };
    music.setVolume=function(value){
      requestedVolume=clamp(value);if(!this.master||!this.ctx)return;
      const target=enabled()&&this.active?this.baseVolume*requestedVolume*profile.duck*(profile.night?.72:1)*(profile.indoor?.8:1):0;
      if(target===this._targetGain)return;this._targetGain=target;
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      if(!target)this.master.gain.setValueAtTime(0,this.ctx.currentTime);else this.master.gain.setTargetAtTime(target,this.ctx.currentTime,.18);
    };
    music.start=function(){
      if(this.active||!enabled())return;this.init();if(!this.ctx)return;const request=++token;
      const begin=()=>{if(request!==token||!enabled())return;this.active=true;this.setVolume(volume());this.scheduledUntil=this.ctx.currentTime+.02;this._scheduleLoop();};
      if(this.ctx.state==='suspended')return this.ctx.resume().then(begin).catch(()=>{});begin();
    };
    music.stop=function(){token++;this.active=false;clearTimeout(this._loopTimer);this._loopTimer=null;clearNotes();this.setVolume(requestedVolume);};
    music._scheduleLoop=function(){
      clearTimeout(this._loopTimer);this._loopTimer=null;if(!this.active||!this.ctx||this.ctx.state!=='running')return;
      const now=this.ctx.currentTime;if(this.scheduledUntil<now)this.scheduledUntil=now+.02;
      while(this.scheduledUntil<now+.85){
        const p=profiles[profile.region],index=step%p.motif.length,note=p.motif[index],beat=p.beat*(profile.night?1.25:1);
        // Uma frase de respiro a cada duas, dando espaço aos sons do mundo.
        const rest=Math.floor(step/p.motif.length)%3===2;
        if(note!==null&&!rest){const pitch=p.scale[note]*(profile.night?.5:1);this._playNote(pitch,this.scheduledUntil,beat*.88,index%4===0?.9:.65);}
        step++;this.scheduledUntil+=beat;
      }
      this._loopTimer=setTimeout(()=>this._scheduleLoop(),260);
    };
    music._playNote=function(freq,time,duration,strength=1){
      if(!this.ctx||!this.active)return;const osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type='triangle';osc.frequency.value=freq;
      gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(.14*strength,time+.035);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);gain.gain.linearRampToValueAtTime(0,time+duration+.035);
      osc.connect(gain);gain.connect(this.master);if(this.fxIn)gain.connect(this.fxIn);
      const voice={osc,cleanup(){osc.disconnect();gain.disconnect();notes.delete(voice);}};notes.add(voice);osc.onended=voice.cleanup;osc.start(time);osc.stop(time+duration+.06);
    };
    music.suspend=function(){clearTimeout(this._loopTimer);this._loopTimer=null;clearNotes();return this.ctx&&this.ctx.state!=='closed'?this.ctx.suspend():Promise.resolve();};
    music.resume=function(){if(!this.ctx||!enabled())return Promise.resolve();return this.ctx.resume().then(()=>{if(this.active){this.scheduledUntil=this.ctx.currentTime+.02;this._scheduleLoop();}}).catch(()=>{});};
    music.state=function(){return{...profile,active:this.active,voices:notes.size,timer:!!this._loopTimer,step,target:this._targetGain??0,context:this.ctx?.state||'not-created'};};
  });
})();
