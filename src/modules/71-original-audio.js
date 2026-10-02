/* Banco sonoro original da Fazenda 37 °C: somente fórmulas, ruído com seeds
   fixas e envelopes. Não lê arquivos, gravações, rede ou amostras de terceiros.
   Adaptador para AudioManager: createSound(name) substitui new Audio(src).
   loop, volume, paused, dataset, play(), pause() e cloneNode() são compatíveis
   com os usos atuais. setEnabled(false) silencia também efeitos clonados.
   Contexto Web Audio é criado apenas ao tocar, após gesto do usuário.
*/
(function(){
  const TAU=Math.PI*2, SAMPLE_RATE=24000, MAX_EFFECTS=16;
  const BANK={
    farm_ambience:{duration:12,loop:true,seed:37001,label:'Campo: brisa e pequenos chamados sintetizados'},
    birds_loop:{duration:8,loop:true,seed:37002,label:'Pássaros estilizados por senóides moduladas'},
    cicadas_loop:{duration:6,loop:true,seed:37003,label:'Cigarras estilizadas por pulsos agudos'},
    cold_wind:{duration:8,loop:true,seed:37004,label:'Vento frio por ruído filtrado e ondulações'},
    fireplace:{duration:6,loop:true,seed:37005,label:'Lareira por rumble e estalos de ruído'},
    heavy_breathing:{duration:3.2,loop:true,seed:37006,label:'Inspiração e expiração por ruído filtrado'},
    teeth_chatter:{duration:1.2,loop:true,seed:37007,label:'Dentes batendo por pequenas batidas sintéticas'},
    heartbeat_warning:{duration:1.4,loop:true,seed:37008,label:'Aviso com duas pulsações graves'},
    grass_steps:{duration:1.08,loop:true,seed:37009,label:'Passos na grama: batida e textura macia'},
    dirt_steps:{duration:1.08,loop:true,seed:37010,label:'Passos na terra: batida e pequenos grãos'},
    watering_can:{duration:1.1,loop:false,seed:37011,label:'Rega: fluxo de ruído e gotas'},
    planting:{duration:0.38,loop:false,seed:37012,label:'Plantio: terra e pequena batida'},
    harvest:{duration:0.48,loop:false,seed:37013,label:'Colheita: folhas e sinal curto'},
    drink_water:{duration:0.68,loop:false,seed:37014,label:'Beber água: bolhas graves estilizadas'},
    shop_sell:{duration:0.7,loop:false,seed:37015,label:'Venda: toque de moedas em três notas'},
    inventory_open:{duration:0.28,loop:false,seed:37016,label:'Mochila: tecido e fecho'},
    coat_equip:{duration:0.52,loop:false,seed:37017,label:'Casaco: movimento de tecido'},
    death_sound:{duration:1.15,loop:false,seed:37018,label:'Fim da tentativa: sinal musical descendente'},
    wool_collect:{duration:0.56,loop:false,seed:37019,label:'Coleta de lã: textura macia e toque'},
    fire_action:{duration:0.48,loop:false,seed:37020,label:'Acender fogo: fricção, estalo e sopro'}
  };
  let ctx=null, output=null, enabled=true, preparing=null, master=0.75;
  const buffers=new Map(), prepared=new Map(), voices=new Map();
  const stepBuffers=new Map();
  const footsteps={x:null,y:null,scene:null,distance:0,count:0,surface:null,phase:null,mode:'distance'};
  function random(seed){
    let x=seed>>>0;
    return ()=>{ x^=x<<13; x^=x>>>17; x^=x<<5; return (x>>>0)/4294967296; };
  }
  function envelope(t,start,duration,attack=0.01){
    const d=t-start;
    if(d<0 || d>=duration) return 0;
    return Math.min(1,d/attack)*Math.pow(1-d/duration,1.7);
  }
  function wave(freq,t){ return Math.sin(TAU*freq*t); }
  function generateFootstep(surface='grass',variant=0,sampleRate=SAMPLE_RATE){
    const profiles={grass:[88,.16,.45,.025],dirt:[102,.25,.25,.06],sand:[72,.09,.65,.035],snow:[165,.10,.4,.14],stone:[210,.32,.1,.09],wood:[132,.35,.12,.025]};
    const keys=Object.keys(profiles),name=profiles[surface]?surface:'grass',[pitch,thump,texture,grit]=profiles[name];
    const rate=Math.max(16000,Math.min(48000,Math.floor(Number(sampleRate)||SAMPLE_RATE))),data=new Float32Array(Math.round(rate*.24));
    const rnd=random(37300+keys.indexOf(name)*31+(variant%4)*701);let low=0,previous=0;
    for(let i=0;i<data.length;i++){
      const t=i/rate,white=rnd()*2-1;low+=.18*(white-low);
      const body=envelope(t,.004,.15,.006),scuff=envelope(t,.012,.21,.019),tone=pitch*(1+(variant%2)*.035);
      let v=wave(tone,t)*body*thump+low*scuff*texture+(white-previous)*scuff*grit;
      if(name==='wood')v+=wave(tone*2.6,t)*envelope(t,.007,.08,.002)*.12;
      if(name==='stone')v+=wave(980,t)*envelope(t,.004,.038,.001)*.1;
      if(name==='snow')v*=.8+.2*wave(83,t);
      const edge=Math.min(1,i/(rate*.003),(data.length-1-i)/(rate*.009));data[i]=v*edge;previous=white;
    }
    return data;
  }
  function resetFootsteps(stop=true){
    footsteps.x=footsteps.y=footsteps.scene=footsteps.phase=null;footsteps.distance=0;
    if(stop)for(const [audio,voice]of [...voices])if(voice.footstep)audio.pause();
  }
  function playFootstep(surface,running){
    if(!enabled||master<=0)return false;
    if(!['grass','dirt','sand','snow','stone','wood'].includes(surface))surface='grass';
    const c=ensure();if(c.state==='suspended')c.resume().catch(()=>{});
    const variant=footsteps.count%4,key=surface+':'+variant;
    if(!stepBuffers.has(key)){const pcm=generateFootstep(surface,variant),b=c.createBuffer(1,pcm.length,SAMPLE_RATE);b.copyToChannel(pcm,0);stepBuffers.set(key,b);}
    const source=c.createBufferSource(),gain=c.createGain();source.buffer=stepBuffers.get(key);
    const relative=running?.31:.24;gain.gain.value=relative*master;source.connect(gain);gain.connect(output);
    const audio={loop:false,pause(){try{source.stop();}catch{}cleanup();}};
    function cleanup(){source.disconnect();gain.disconnect();voices.delete(audio);}
    voices.set(audio,{name:'footstep_'+surface,loop:false,footstep:true,scale(value){gain.gain.setTargetAtTime(relative*value,c.currentTime,.008);}});
    source.onended=cleanup;source.start();footsteps.count++;footsteps.surface=surface;return true;
  }
  function updateFootsteps(options={}){
    const {x,y,scene='main',surface='grass',running=false}=options;
    const phase=Number.isFinite(options.phase)?options.phase:null;
    footsteps.mode=phase===null?'distance':'phase';
    if(options.blocked||!options.moving||!Number.isFinite(x)||!Number.isFinite(y)){
      resetFootsteps();
      // Mesmo parado, observa a fase. Ao retomar perto de um contato, o som
      // acompanha o pé que pousa sem perder o restante da passada anterior.
      if(phase!==null&&Number.isFinite(x)&&Number.isFinite(y)){footsteps.phase=phase;footsteps.x=x;footsteps.y=y;footsteps.scene=scene;}
      return false;
    }
    const distance=footsteps.x===null?0:Math.hypot(x-footsteps.x,y-footsteps.y);
    if(footsteps.scene!==scene||distance>48){footsteps.distance=0;footsteps.scene=scene;footsteps.x=x;footsteps.y=y;footsteps.phase=phase;return false;}
    footsteps.x=x;footsteps.y=y;
    if(phase!==null){
      const previous=footsteps.phase;footsteps.phase=phase;footsteps.distance=0;
      if(previous===null||distance<=.001)return false;
      let delta=phase-previous;
      // Suporta tanto fase acumulada quanto fase normalizada em 0..2π.
      if(delta< -Math.PI&&previous>=0&&previous<TAU&&phase>=0&&phase<TAU)delta+=TAU;
      if(delta<=0||delta>TAU)return false;
      const crossed=Math.floor((previous+delta+1e-8)/Math.PI)>Math.floor((previous+1e-8)/Math.PI);
      return crossed?playFootstep(surface,running):false;
    }
    footsteps.phase=null;footsteps.distance+=distance;
    // Compatibilidade com chamadores antigos sem fase compartilhada.
    const stride=running?22:18;if(footsteps.distance<stride)return false;
    footsteps.distance%=stride;return playFootstep(surface,running);
  }
  function chirp(t,start,duration,freq,sweep,amplitude){
    const d=t-start;
    if(d<0 || d>=duration) return 0;
    return envelope(t,start,duration,0.009)*wave(freq+sweep*d*0.5,d)*amplitude;
  }
  function generate(name,sampleRate=SAMPLE_RATE){
    const def=BANK[name];
    if(!def) throw new Error('Som desconhecido: '+name);
    const rate=Math.max(16000,Math.min(48000,Math.floor(Number(sampleRate)||SAMPLE_RATE)));
    const data=new Float32Array(Math.round(rate*def.duration));
    const rnd=random(def.seed);
    let low=0,soft=0,previous=0;
    // Eventos definidos uma vez por geração; nenhuma aleatoriedade de relógio.
    const events=Array.from({length:24},()=>({t:rnd()*def.duration,f:1100+rnd()*2900,a:0.12+rnd()*0.17}));
    for(let i=0;i<data.length;i++){
      const t=i/rate, white=rnd()*2-1;
      low+=0.025*(white-low); soft+=0.14*(white-soft);
      const high=white-previous; previous=white;
      let v=0;
      switch(name){
        case 'farm_ambience':
          v=low*(0.19+0.07*wave(0.25,t))+soft*0.035;
          for(let k=0;k<5;k++){
            const e=events[k];
            v+=chirp(t,e.t,0.16,e.f,1600,0.085);
            v+=chirp(t,e.t+0.21,0.13,e.f*1.13,-1300,0.065);
          }
          break;
        case 'birds_loop':
          for(let k=0;k<8;k++){
            const e=events[k];
            v+=chirp(t,e.t,0.18,e.f,2800,0.23);
            v+=chirp(t,e.t+0.22,0.12,e.f*1.15,-2100,0.16);
          }
          break;
        case 'cicadas_loop':{
          const gate=Math.pow(Math.max(0,wave(0.5,t)),0.45);
          v=(wave(3780,t)+wave(4310,t)*0.32)*(0.38+0.62*Math.pow(wave(31,t),2))*gate*0.17;
          break;
        }
        case 'cold_wind':
          v=(low*1.35+soft*0.13)*(0.58+0.26*wave(0.25,t)+0.13*wave(0.625,t));
          v+=wave(92,t)*wave(0.125,t)*0.011;
          break;
        case 'fireplace':
          v=low*0.75+soft*0.09;
          for(let k=0;k<events.length;k++) v+=high*envelope(t,events[k].t,0.035,0.001)*events[k].a*0.6;
          break;
        case 'heavy_breathing':{
          const inhale=envelope(t,0.08,1.08,0.23), exhale=envelope(t,1.49,1.4,0.12);
          v=(soft*0.65+low*0.55)*inhale+(soft*0.47+low*0.72)*exhale;
          break;
        }
        case 'teeth_chatter':{
          const slot=t%0.12, beat=envelope(slot,0.014,0.033,0.001);
          v=(wave(720,slot)*0.22+wave(1260,slot)*0.09+high*0.04)*beat;
          break;
        }
        case 'heartbeat_warning':
          v=wave(68,t)*envelope(t,0.08,0.19,0.015)*0.58
            +wave(83,t)*envelope(t,0.32,0.16,0.012)*0.38;
          break;
        case 'grass_steps':
        case 'dirt_steps':{
          const slot=t%0.54, beat=envelope(slot,0.035,0.12,0.006);
          const texture=envelope(slot,0.05,0.2,0.015);
          v=wave(78,slot)*beat*0.29+soft*texture*(name==='grass_steps'?0.62:0.35);
          if(name==='dirt_steps') v+=high*envelope(slot,0.04,0.07,0.003)*0.045;
          break;
        }
        case 'watering_can':
          v=(soft*0.51+white*0.06)*envelope(t,0.025,1.04,0.05);
          for(let k=0;k<8;k++) v+=chirp(t,0.1+k*0.105,0.095,330+k*29,-800,0.11);
          break;
        case 'planting':
          v=wave(95,t)*envelope(t,0.045,0.23,0.007)*0.35+soft*envelope(t,0.01,0.3,0.02)*0.44;
          break;
        case 'harvest':
          v=soft*envelope(t,0.02,0.35,0.013)*0.52+chirp(t,0.13,0.24,790,480,0.2);
          break;
        case 'drink_water':
          v=soft*envelope(t,0.015,0.55,0.035)*0.26;
          for(let k=0;k<3;k++) v+=chirp(t,0.08+k*0.16,0.14,260+k*45,-650,0.35);
          break;
        case 'shop_sell':
          [784,988,1175].forEach((f,k)=>{v+=(wave(f,t-k*0.09)+wave(f*2,t-k*0.09)*0.18)*envelope(t,0.03+k*0.09,0.42,0.003)*0.23;});
          break;
        case 'inventory_open':
          v=soft*envelope(t,0.01,0.22,0.025)*0.58+wave(1250,t)*envelope(t,0.045,0.048,0.002)*0.2;
          break;
        case 'coat_equip':
          v=(soft*0.5+low*0.28)*envelope(t,0.025,0.43,0.085);
          break;
        case 'death_sound':
          [392,330,262].forEach((f,k)=>{v+=wave(f,t-k*0.25)*envelope(t,0.015+k*0.25,0.54,0.03)*0.31;});
          break;
        case 'wool_collect':
          v=(soft*0.42+low*0.26)*envelope(t,0.025,0.39,0.04)+chirp(t,0.24,0.25,620,370,0.17);
          break;
        case 'fire_action':
          v=high*envelope(t,0.025,0.05,0.002)*0.17+soft*envelope(t,0.055,0.36,0.016)*0.52
            +wave(130,t)*envelope(t,0.095,0.22,0.01)*0.25;
          break;
      }
      data[i]=v;
    }
    // Retira DC, deixa bordas em zero e impede clipping de uma voz isolada.
    let mean=0;
    for(const v of data) mean+=v;
    mean/=data.length;
    const edge=Math.min(Math.round(rate*0.012),Math.floor(data.length/4));
    let peak=0;
    for(let i=0;i<data.length;i++){
      const fade=Math.min(1,i/edge,(data.length-1-i)/edge);
      data[i]=(data[i]-mean)*fade;
      peak=Math.max(peak,Math.abs(data[i]));
    }
    if(peak>0.72){ const scale=0.72/peak; for(let i=0;i<data.length;i++) data[i]*=scale; }
    return data;
  }
  function ensure(){
    if(ctx) return ctx;
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) throw new Error('Web Audio indisponível neste navegador');
    ctx=new AC(); output=ctx.createGain(); output.gain.value=enabled?1:0;
    // Suaviza picos quando vários efeitos de ação se sobrepõem.
    const limiter=ctx.createDynamicsCompressor();
    limiter.threshold.value=-10; limiter.knee.value=12; limiter.ratio.value=4;
    limiter.attack.value=0.005; limiter.release.value=0.12;
    output.connect(limiter); limiter.connect(ctx.destination);
    return ctx;
  }
  function buffer(name){
    if(buffers.has(name)) return buffers.get(name);
    const c=ensure(), samples=prepared.get(name)||generate(name), b=c.createBuffer(1,samples.length,SAMPLE_RATE);
    b.copyToChannel(samples,0); buffers.set(name,b); prepared.delete(name); return b;
  }
  function prepare(){
    if(preparing) return preparing;
    // Chamar no menu: cada som é preparado em outra tarefa do navegador. Não
    // cria AudioContext, não toca nada e evita gerar todo o banco no 1º frame.
    preparing=(async()=>{
      for(const name of Object.keys(BANK)){
        if(buffers.has(name)||prepared.has(name)) continue;
        await new Promise(resolve=>setTimeout(resolve,0));
        if(!buffers.has(name)&&!prepared.has(name)) prepared.set(name,generate(name));
      }
      return window.FarmOriginalAudio.state();
    })();
    return preparing;
  }
  function createSound(name){
    const def=BANK[name];
    if(!def) throw new Error('Som desconhecido: '+name);
    let volume=0,relativeVolume=0,source=null,gain=null,starting=null,startedAt=0,stopped=0;
    const listeners=new Map();
    function notify(type){ for(const fn of listeners.get(type)||[]) try{ fn({type,target:audio}); }catch{} }
    function cleanup(node){
      if(source!==node) return;
      try{ node.disconnect(); gain?.disconnect(); }catch{}
      source=null; gain=null; voices.delete(audio); notify('ended');
    }
    const audio={
      name,loop:def.loop,preload:'auto',dataset:{target:'0',missing:'0',original:'1'},
      get paused(){ return !source; },
      get volume(){ return volume; },
      set volume(value){
        volume=Math.max(0,Math.min(1,Number(value)||0));
        relativeVolume=master>0?volume/master:0;
        if(gain && ctx){ gain.gain.cancelScheduledValues(ctx.currentTime); gain.gain.setTargetAtTime(volume,ctx.currentTime,0.008); }
      },
      get currentTime(){ return source&&ctx?Math.max(0,(ctx.currentTime-startedAt)%def.duration):0; },
      play(){
        if(source) return Promise.resolve();
        if(starting) return starting;
        const token=stopped;
        starting=(async()=>{
          if(!enabled) return;
          const c=ensure();
          if(c.state==='suspended') await c.resume();
          if(!enabled || token!==stopped) return;
          // Evita crescimento ilimitado de vozes ao repetir ações rapidamente.
          if(!audio.loop){
            const effects=[...voices.keys()].filter(v=>!v.loop);
            if(effects.length>=MAX_EFFECTS) effects[0].pause();
          }
          const node=c.createBufferSource(); node.buffer=buffer(name); node.loop=!!audio.loop;
          gain=c.createGain(); gain.gain.value=volume;
          node.connect(gain); gain.connect(output); source=node; startedAt=c.currentTime;
          voices.set(audio,{name,loop:!!audio.loop,scale(nextMaster){
            // Loops recebem volume absoluto novo do AudioManager. Só efeitos
            // em andamento precisam acompanhar o slider sem ganho duplicado.
            volume=Math.max(0,Math.min(1,relativeVolume*nextMaster));
            if(gain){gain.gain.cancelScheduledValues(c.currentTime);gain.gain.setTargetAtTime(volume,c.currentTime,0.008);}
          }}); node.onended=()=>cleanup(node); node.start();
          notify('play');
        })().catch(error=>{audio.dataset.missing='1';notify('error');throw error;}).finally(()=>{starting=null;});
        return starting;
      },
      pause(){
        stopped++;
        if(!source) return;
        const old=source; try{old.stop();}catch{} cleanup(old);
      },
      cloneNode(){ const clone=createSound(name); clone.loop=audio.loop; clone.volume=volume; return clone; },
      addEventListener(type,fn){ if(typeof fn==='function'){ if(!listeners.has(type)) listeners.set(type,new Set()); listeners.get(type).add(fn); } },
      removeEventListener(type,fn){ listeners.get(type)?.delete(fn); }
    };
    return audio;
  }
  window.FarmOriginalAudio={
    keys:Object.keys(BANK),sampleRate:SAMPLE_RATE,createSound,generate,prepare,generateFootstep,updateFootsteps,resetFootsteps,
    describe(){ return Object.fromEntries(Object.entries(BANK).map(([key,value])=>[key,{...value}])); },
    setEnabled(value){
      enabled=!!value;
      if(output&&ctx){output.gain.cancelScheduledValues(ctx.currentTime);output.gain.value=enabled?1:0;}
    },
    setMaster(value){
      master=Math.max(0,Math.min(1,Number(value)||0));
      for(const voice of voices.values()) if(!voice.loop) voice.scale(master);
    },
    suspend(){ return ctx&&ctx.state!=='closed'?ctx.suspend():Promise.resolve(); },
    resume(){ return ctx&&ctx.state==='suspended'&&enabled?ctx.resume():Promise.resolve(); },
    state(){ return {enabled,master,outputGain:output?.gain.value??null,currentTime:ctx?.currentTime??null,context:ctx?.state||'not-created',buffers:buffers.size,prepared:prepared.size,
      bytes:[...buffers.values(),...stepBuffers.values()].reduce((sum,b)=>sum+b.length*4,0)+[...prepared.values()].reduce((sum,b)=>sum+b.byteLength,0),voices:voices.size,
      footsteps:{count:footsteps.count,surface:footsteps.surface,buffers:stepBuffers.size,mode:footsteps.mode,phase:footsteps.phase},
      loops:[...voices.values()].filter(v=>v.loop).length,effects:[...voices.values()].filter(v=>!v.loop).length}; },
    stopAll(){ for(const audio of [...voices.keys()]) audio.pause(); resetFootsteps(false); }
  };
})();
