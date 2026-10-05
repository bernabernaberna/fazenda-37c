/* ============================================================
   Synth SFX — procedurally generated UI/feedback sounds
   ============================================================
   These are short Web-Audio-only sounds for events that don't have
   a dedicated WAV file. They're cheap (no asset bloat) and give
   crisp game-feel feedback for actions like quiz answers,
   achievement unlocks, scene transitions, and UI clicks.

   All sounds respect `soundEnabled` and the AudioManager master volume.

   Exposed (window):
     synthSfx.chimeOk()         pleasant "correct/good" chime
     synthSfx.chimeBad()        soft "wrong" tone
     synthSfx.achievement()     ascending three-note arpeggio
     synthSfx.levelup()         triumphant fanfare (rank up)
     synthSfx.sparkle()         bright rising sparkle (new concept)
     synthSfx.whoosh()          short low-pitched whoosh (scene transition)
     synthSfx.click()           subtle UI click
     synthSfx.door()            door open thump
     synthSfx.bubble()          single water-bubble blip (pot cooking)
     synthSfx.splash()          fishing splash
     synthSfx.sleep()           gentle two-note "going to bed" sound
     synthSfx.pop()             short pop (deposit / pickup)
     synthSfx.spray()           misting spray
   ============================================================ */
(function(){
  let _ctx = null;
  let _master = null;
  const _voices=new Set(),_timers=new Set();
  const _noiseCache=new Map(),_lastCue=new Map();
  const _clock=()=>typeof performance!=='undefined'?performance.now():Date.now();
  function _allow(name,interval=120){
    if(_suspended||(typeof soundEnabled!=='undefined'&&!soundEnabled)||(typeof AudioManager!=='undefined'&&AudioManager.master<=0))return false;
    const now=_clock(),last=_lastCue.get(name);
    if(last!==undefined&&now-last<interval)return false;
    _lastCue.set(name,now);return true;
  }
  let _suspended=false;
  function _later(fn,ms){
    if(_suspended||(typeof soundEnabled!=='undefined'&&!soundEnabled)||(typeof AudioManager!=='undefined'&&AudioManager.master<=0))return;
    const id=setTimeout(()=>{_timers.delete(id);fn();},ms);_timers.add(id);return id;
  }
  function _stopAll(){
    for(const id of _timers)clearTimeout(id);_timers.clear();
    for(const voice of [..._voices]){try{voice.source.stop();}catch{}voice.cleanup();}
  }
  function _track(source,nodes){
    if(_voices.size>=12){const old=_voices.values().next().value;try{old.source.stop();}catch{}old.cleanup();}
    const voice={source,cleanup(){for(const node of nodes)try{node.disconnect();}catch{}_voices.delete(voice);}};
    _voices.add(voice);source.onended=voice.cleanup;
  }

  function _ensure(){
    if(typeof soundEnabled !== 'undefined' && !soundEnabled) return false;
    if(_suspended || (typeof AudioManager!=='undefined' && AudioManager.master<=0))return false;
    if(_ctx){if(_ctx.state==='suspended')_ctx.resume().catch(()=>{});return true;}
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      _ctx = new AC();
      _master = _ctx.createGain();
      _master.gain.value = 0.55;
      const limiter=_ctx.createDynamicsCompressor();
      limiter.threshold.value=-10;limiter.knee.value=12;limiter.ratio.value=5;
      limiter.attack.value=.003;limiter.release.value=.12;
      _master.connect(limiter);limiter.connect(_ctx.destination);
    } catch(e){ return false; }
    return true;
  }

  function _vol(){
    const m = (typeof AudioManager !== 'undefined') ? (AudioManager.master ?? 0.75) : 0.75;
    const enabled = (typeof soundEnabled === 'undefined') ? true : !!soundEnabled;
    if(_master && _ctx){_master.gain.cancelScheduledValues(_ctx.currentTime);_master.gain.value=enabled?0.55*m:0;}
    if(!enabled||m<=0)_stopAll();
    return enabled && m>0 ? 1 : 0;
  }

  // Schedule an envelope: attack → sustain → release on a gain node
  function _env(gain, t0, attack, hold, release, peak){
    gain.cancelScheduledValues(t0);
    gain.setValueAtTime(0, t0);
    gain.linearRampToValueAtTime(peak, t0 + attack);
    gain.linearRampToValueAtTime(peak * 0.8, t0 + attack + hold);
    gain.linearRampToValueAtTime(0, t0 + attack + hold + release);
  }

  // Play a single tone with envelope
  function _tone({ freq, type='sine', dur=0.15, vol=0.3, attack=0.005, release=0.08, detune=0, filter=null, pitchTo=null }){
    if(!_ensure()) return;
    const v = _vol();
    if(v <= 0) return;
    const t0 = _ctx.currentTime;
    const osc = _ctx.createOscillator();
    const gain = _ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if(pitchTo>0){osc.frequency.setValueAtTime(freq,t0);osc.frequency.exponentialRampToValueAtTime(pitchTo,t0+dur*.8);}
    if(detune) osc.detune.value = detune;
    let last = osc;
    const nodes=[osc,gain];
    if(filter){
      const lp = _ctx.createBiquadFilter();
      lp.type = filter.type || 'lowpass';
      lp.frequency.value = filter.freq || 2000;
      lp.Q.value = filter.Q || 0.7;
      last.connect(lp);
      nodes.push(lp);
      last = lp;
    }
    last.connect(gain);
    gain.connect(_master);
    _track(osc,nodes);
    _env(gain.gain, t0, attack, Math.max(0, dur - attack - release), release, vol * v);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // Brief broadband noise burst (useful for whoosh / splash)
  function _noiseBurst({ dur=0.25, vol=0.25, filterFreq=800, filterType='lowpass', sweep=0 }){
    if(!_ensure()) return;
    const v = _vol();
    if(v <= 0) return;
    const t0 = _ctx.currentTime;
    const sampleRate = _ctx.sampleRate;
    const key=sampleRate+':'+dur;
    if(!_noiseCache.has(key)){
      const buf=_ctx.createBuffer(1,Math.ceil(sampleRate*dur),sampleRate),data=buf.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
      _noiseCache.set(key,buf);
    }
    const buf=_noiseCache.get(key);
    const src = _ctx.createBufferSource();
    src.buffer = buf;
    const lp = _ctx.createBiquadFilter();
    lp.type = filterType;
    lp.frequency.value = filterFreq;
    lp.Q.value = 0.6;
    if(sweep !== 0){
      lp.frequency.setValueAtTime(filterFreq, t0);
      lp.frequency.linearRampToValueAtTime(filterFreq + sweep, t0 + dur);
    }
    const gain = _ctx.createGain();
    src.connect(lp); lp.connect(gain); gain.connect(_master);
    _track(src,[src,lp,gain]);
    _env(gain.gain, t0, 0.01, dur*0.6, dur*0.4, vol * v);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  // ===== Sound effects =====
  const synthSfx = {
    chimeOk(){
      // Two-note major-third major chord (G + B + D approximate)
      _tone({ freq: 784, type: 'sine', dur: 0.18, vol: 0.30, release: 0.12 });
      _tone({ freq: 988, type: 'sine', dur: 0.22, vol: 0.22, release: 0.16 });
      _later(()=>_tone({ freq: 1175, type: 'sine', dur: 0.30, vol: 0.20, release: 0.20 }), 80);
    },
    chimeBad(){
      // Two-note minor descent (suggests "wrong")
      _tone({ freq: 392, type: 'triangle', dur: 0.20, vol: 0.28, release: 0.14 });
      _later(()=>_tone({ freq: 311, type: 'triangle', dur: 0.30, vol: 0.25, release: 0.20 }), 110);
    },
    achievement(){
      // Ascending C-E-G-C arpeggio
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i)=>{
        _later(()=>_tone({ freq: f, type: 'triangle', dur: 0.22, vol: 0.28, release: 0.18 }), i*90);
      });
    },
    levelup(){
      // Fanfarra ascendente mais rica que achievement — usada ao subir de nível
      const notes = [523, 659, 784, 1047, 1319];
      notes.forEach((f, i)=>{
        _later(()=>_tone({ freq: f, type: 'triangle', dur: 0.26, vol: 0.30, release: 0.20 }), i*80);
      });
      // brilho sustentado no topo
      _later(()=>_tone({ freq: 1568, type: 'sine', dur: 0.55, vol: 0.16, release: 0.42 }), 420);
      _later(()=>_tone({ freq: 2093, type: 'sine', dur: 0.45, vol: 0.10, release: 0.38 }), 470);
    },
    sparkle(){
      // Brilho curto ascendente — usado ao desbloquear um novo conceito
      _tone({ freq: 1318, type: 'sine', dur: 0.12, vol: 0.18, release: 0.10 });
      _later(()=>_tone({ freq: 1760, type: 'sine', dur: 0.14, vol: 0.16, release: 0.12 }), 70);
      _later(()=>_tone({ freq: 2093, type: 'sine', dur: 0.18, vol: 0.14, release: 0.14 }), 150);
    },
    whoosh(){
      _noiseBurst({ dur: 0.32, vol: 0.18, filterFreq: 300, sweep: 800, filterType: 'lowpass' });
    },
    click(){
      _tone({ freq: 820, type: 'triangle', dur: 0.065, vol: 0.085, attack: 0.007, release: 0.05 });
    },
    door(){
      // Wood thump — low triangle + click
      _tone({ freq: 110, type: 'triangle', dur: 0.18, vol: 0.30, attack: 0.005, release: 0.14 });
      _later(()=>_tone({ freq: 90, type: 'sine', dur: 0.12, vol: 0.18, release: 0.10 }), 30);
    },
    bubble(){
      // Single water bubble — rising sine + decay
      if(!_ensure()) return;
      const v = _vol(); if(v <= 0) return;
      const t0 = _ctx.currentTime;
      const osc = _ctx.createOscillator();
      const gain = _ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, t0);
      osc.frequency.exponentialRampToValueAtTime(900, t0 + 0.10);
      osc.connect(gain); gain.connect(_master);
      _track(osc,[osc,gain]);
      _env(gain.gain, t0, 0.005, 0.04, 0.08, 0.18 * v);
      osc.start(t0); osc.stop(t0 + 0.20);
    },
    splash(){
      // Quick water splash
      _noiseBurst({ dur: 0.22, vol: 0.30, filterFreq: 1500, filterType: 'bandpass', sweep: -800 });
      _later(()=>{
        _tone({ freq: 250, type: 'sine', dur: 0.20, vol: 0.18, release: 0.16 });
      }, 40);
    },
    sleep(){
      // Tecido e duas notas graves, uma vez ao repousar. Sem ronco em loop.
      _noiseBurst({dur:.24,vol:.055,filterFreq:430});
      _tone({freq:330,dur:.48,vol:.105,attack:.04,release:.36});
      _later(()=>_tone({freq:247,dur:.62,vol:.085,attack:.055,release:.5}),190);
    },
    pop(){
      _tone({ freq: 600, type: 'sine', dur: 0.06, vol: 0.20, attack: 0.002, release: 0.04 });
    },
    spray(){
      _noiseBurst({ dur: 0.45, vol: 0.15, filterFreq: 3000, filterType: 'highpass', sweep: -1500 });
    },
    dialogue(npcId,kind='greet'){
      if(!_allow('dialogue',kind==='choice'?160:280))return false;
      const identity={rosa:[294,440,'sine'],lia:[392,523,'sine'],tomas:[196,294,'triangle'],ines:[330,494,'sine'],caio:[262,349,'triangle'],nico:[440,587,'sine']};
      const [low,high,type]=identity[npcId]||identity.rosa;
      const pitch=kind==='close'?low:kind==='choice'?high:low;
      _tone({freq:pitch,type,dur:kind==='greet'?.24:.13,vol:kind==='greet'?.12:.08,attack:.013,release:.1});
      if(kind==='greet')_later(()=>_tone({freq:high,type,dur:.22,vol:.085,attack:.018,release:.17}),105);
      return true;
    },
    pageTurn(){
      if(!_allow('page',300))return false;
      _noiseBurst({dur:.19,vol:.07,filterFreq:1000,sweep:-450});return true;
    },
    animal(kind='cow'){
      // Só responde ao cuidado real. Todos compartilham cooldown: o cocho
      // não dispara um coro, e andar junto ao cercado continua tranquilo.
      if(!_allow('animal',2600))return false;
      _noiseBurst({dur:.22,vol:.055,filterFreq:680});
      if(kind==='sheep')_tone({freq:430,pitchTo:360,type:'triangle',dur:.29,vol:.09,attack:.035,release:.2,filter:{freq:1250}});
      else if(kind==='chicken'||kind==='chick'){
        _tone({freq:720,pitchTo:940,dur:.08,vol:.07,attack:.005,release:.055});
        _later(()=>_tone({freq:980,pitchTo:740,dur:.11,vol:.065,attack:.009,release:.075}),130);
      }else{
        _tone({freq:105,pitchTo:76,type:'triangle',dur:.5,vol:.1,attack:.055,release:.34,filter:{freq:650}});
        _tone({freq:212,pitchTo:152,dur:.44,vol:.04,attack:.06,release:.3});
      }
      return true;
    },
  };

  // Um contato E repetido não acumula fanfarras/estalos. As notas da mesma
  // frase continuam livres; a barreira atua na ação, antes de agendar notas.
  for(const [name,interval]of Object.entries({chimeOk:240,chimeBad:260,achievement:850,levelup:1100,sparkle:420,whoosh:350,click:75,door:350,bubble:800,splash:450,sleep:1400,pop:100,spray:600})){
    const play=synthSfx[name];synthSfx[name]=function(){if(!_allow(name,interval))return false;play();return true;};
  }

  synthSfx.syncVolume=_vol;
  synthSfx.stopAll=_stopAll;
  synthSfx.suspend=()=>{_suspended=true;_stopAll();return _ctx&&_ctx.state!=='closed'?_ctx.suspend():Promise.resolve();};
  synthSfx.resume=()=>{_suspended=false;const audible=(typeof soundEnabled==='undefined'||soundEnabled)&&(typeof AudioManager==='undefined'||AudioManager.master>0);return _ctx&&_ctx.state==='suspended'&&audible?_ctx.resume():Promise.resolve();};
  synthSfx.state=()=>({context:_ctx?.state||'not-created',voices:_voices.size,timers:_timers.size,master:_master?.gain.value??null,noiseBuffers:_noiseCache.size,maxVoices:12});
  window.synthSfx = synthSfx;
})();
