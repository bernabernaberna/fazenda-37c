/* ============================================================
   Histology Annotations
   ---------------------
   When key thermoregulatory events happen, briefly float a scientific
   label over the player ("🔬 Glândulas écrinas em ação"). This gives
   the gameplay a constant educational layer without interrupting flow.

   Each annotation:
     - Triggers at most once every cooldown (per event type)
     - Floats upward and fades out
     - Drawn on the canvas after player but before overlays

   Depends on: `player`, `isFrio`, `nearFire`, `nearShelter`, `inShade`,
               `currentSeason`, `ctx`, `_visW`, `_visH`
   Exposes:    window.checkHistologyAnnotations(dt)
               window.drawHistologyAnnotations(camX, camY)
   ============================================================ */
(function(){
  const _active = [];          // currently floating annotations
  const _lastFired = {};       // event_id -> performance.now()

  const COOLDOWN_MS = 9000;    // 9 s between same-event annotations
  const FLOAT_DURATION = 2.6;  // seconds visible

  // ----- Annotation catalogue -----
  // Each entry: { id, label, color, condition(state) → boolean }
  const ANNOTATIONS = [
    {
      id:'sweating',
      label:'🔬 Glândulas écrinas: sudorese ativa',
      color:'#8fe7ff',
      condition: s => !s.frio && s.temp > 38.3,
    },
    {
      id:'vasodilation',
      label:'🩸 Vasodilatação dérmica',
      color:'#ff8a78',
      condition: s => !s.frio && s.temp > 38.7,
    },
    {
      id:'hyper_warning',
      label:'⚠ Termogênese descontrolada (>40°C)',
      color:'#ff5a4a',
      condition: s => s.temp > 40.0,
    },
    {
      id:'erythema',
      label:'🔬 Eritema cutâneo visível',
      color:'#ff6a55',
      condition: s => s.temp > 39.2 && !s.frio,
    },
    {
      id:'dehydration',
      label:'💧 Sudorese reduzida (desidratação)',
      color:'#ffd34a',
      condition: s => s.hyd < 28 && !s.frio,
    },
    {
      id:'vasoconstriction',
      label:'🩸 Vasoconstrição cutânea',
      color:'#9bd0ff',
      condition: s => s.frio && s.temp < 36.4,
    },
    {
      id:'piloerection',
      label:'🔬 M. eretor do pelo: piloereção',
      color:'#bcdcff',
      condition: s => s.frio && s.temp < 36.2,
    },
    {
      id:'shivering',
      label:'⚡ Termogênese por tremor',
      color:'#cce6ff',
      condition: s => s.frio && s.temp < 36.0,
    },
    {
      id:'avas_close',
      label:'🩸 AVAs fechadas (preservando núcleo)',
      color:'#7aa6ff',
      condition: s => s.frio && s.temp < 35.7,
    },
    {
      id:'hypo_warning',
      label:'⚠ Risco de congelamento (<35.5°C)',
      color:'#a6c8ff',
      condition: s => s.temp < 35.5,
    },
    {
      id:'homeostasis_ok',
      label:'✓ Homeostase térmica (36.5–37.5°C)',
      color:'#a8e890',
      condition: s => s.temp >= 36.5 && s.temp <= 37.5 && s.homeostasisTime > 30,
    },
    {
      id:'fire_warm',
      label:'🔥 Radiação infravermelha aquece a pele',
      color:'#ffb84a',
      condition: s => s.nearFire && s.temp < 36.8,
    },
    {
      id:'shelter_warm',
      label:'🏠 Hipoderme + abrigo = isolamento somado',
      color:'#dfbe7c',
      condition: s => s.shelter && s.coat && s.frio,
    },
    {
      id:'shade_relief',
      label:'🌳 Sombra: menos radiação solar absorvida',
      color:'#92d878',
      condition: s => s.shade && !s.frio && s.temp > 38.0,
    },
  ];

  function _trySpawn(now, ann){
    const last = _lastFired[ann.id] || -COOLDOWN_MS;
    if(now - last < COOLDOWN_MS) return;
    _lastFired[ann.id] = now;
    _active.push({
      label: ann.label,
      color: ann.color,
      t: 0,                                    // seconds elapsed
      lifetime: FLOAT_DURATION,
      x: player.x + (Math.random()-0.5)*16,
      y: player.y - 24,
      vy: -10,                                 // pixels/sec upward
    });
    // Cap active list (newest wins)
    while(_active.length > 5) _active.shift();
  }

  function checkHistologyAnnotations(dt){
    if(typeof player === 'undefined' || !player) return;
    if(player.dead) return;
    // Build a snapshot of state
    const frio = (typeof isFrio === 'function') && isFrio();
    const shelter = (typeof nearShelter === 'function') && nearShelter();
    const shade = (typeof inShade === 'function') && inShade();
    const nearF = (typeof nearFire === 'function') && nearFire();
    const homeoT = (typeof homeostasisTimer !== 'undefined') ? homeostasisTimer : 0;
    const state = {
      temp: player.temp,
      hyd: player.hyd,
      frio: frio,
      shelter: shelter,
      shade: shade,
      nearFire: nearF,
      coat: !!player.coatEquipped,
      homeostasisTime: homeoT,
    };
    const now = performance.now();
    for(const ann of ANNOTATIONS){
      try { if(ann.condition(state)) _trySpawn(now, ann); }
      catch(e){}
    }
    // Update active floats
    for(let i=_active.length-1; i>=0; i--){
      const a = _active[i];
      a.t += dt;
      a.y += a.vy * dt;
      if(a.t >= a.lifetime) _active.splice(i, 1);
    }
  }

  function drawHistologyAnnotations(camX, camY){
    if(!_active.length) return;
    ctx.save();
    ctx.font = 'bold 9px Trebuchet MS, monospace';
    ctx.textAlign = 'center';
    for(const a of _active){
      const progress = a.t / a.lifetime;
      // fade-in fast, fade-out slow
      const alpha = progress < 0.15 ? progress/0.15 : Math.max(0, 1 - (progress-0.15)/0.85);
      // Background pill
      const text = a.label;
      const metrics = ctx.measureText(text);
      const pw = metrics.width + 10;
      const ph = 14;
      const px = a.x - pw/2;
      const py = a.y - ph + 2;
      ctx.fillStyle = `rgba(15,10,5,${0.75*alpha})`;
      ctx.fillRect(px, py, pw, ph);
      // Coloured top bar
      ctx.fillStyle = a.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(px, py, pw, 1);
      ctx.fillRect(px, py+ph-1, pw, 1);
      ctx.globalAlpha = 1;
      // Text
      ctx.fillStyle = `rgba(255,247,225,${alpha})`;
      ctx.fillText(text, a.x, a.y - 3);
    }
    ctx.restore();
  }

  function clearHistologyAnnotations(){
    _active.length = 0;
    for(const k in _lastFired) delete _lastFired[k];
  }

  window.checkHistologyAnnotations = checkHistologyAnnotations;
  window.drawHistologyAnnotations = drawHistologyAnnotations;
  window.clearHistologyAnnotations = clearHistologyAnnotations;
})();
