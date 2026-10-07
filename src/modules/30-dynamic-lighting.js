/* ============================================================
   Dynamic lighting pass
   ---------------------
   Renders soft point lights from lit fire sources (fireplace,
   indoor fireplace, barn stove). Each light has:
     - flickering radius (org +/- 8% via sin noise)
     - warm radial gradient (orange→yellow core)
     - bloom ring drawn with screen blend
     - rising sparks particles
   Also draws subtle sun god-rays at low sun angles (morning/dusk).

   Depends on:  `objects`, `nightOverlayAlpha`, `timeOfDay`, `isFrio`,
                `isIndoor`, `TS`, `currentScene`, `ctx`
   Exposes:    `drawDynamicLights(camX, camY, visW, visH)`
   ============================================================ */
(function(){
  const FIRE_TYPES = new Set(['fireplace','mtn_fire','i_fireplace','b_stove']);
  const _sparks = [];
  let _scene = null;
  const reduced = ()=>typeof A11Y!=='undefined'&&!!A11Y.reduceMotion;

  function _flicker(seed, t){
    // Stable per-source flicker — mixes two sin waves for warm jitter
    return Math.sin(t*4.1 + seed*7.3) * 0.5 + Math.sin(t*7.7 + seed*2.9) * 0.5;
  }

  function _spawnSpark(x, y, seed){
    _sparks.push({
      x: x + (Math.random()-0.5)*4,
      y: y - 2,
      vx: (Math.random()-0.5)*0.4,
      vy: -0.6 - Math.random()*0.7,
      life: 28 + Math.random()*22,
      maxLife: 50,
      color: Math.random() < 0.4 ? '#ffe48a' : '#ff9c3a',
      size: Math.random() < 0.3 ? 2 : 1,
      seed,
    });
  }

  function _updateSparks(){
    for(let i=_sparks.length-1; i>=0; i--){
      const s = _sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.012;           // sparks slow as they rise (decel)
      s.vx *= 0.96;
      s.life--;
      if(s.life <= 0) _sparks.splice(i, 1);
    }
  }

  function _drawSparks(camX, camY, visW, visH){
    if(!_sparks.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for(const s of _sparks){
      if(s.x < camX-4 || s.x > camX+visW+4 || s.y < camY-4 || s.y > camY+visH+4) continue;
      const a = s.life / s.maxLife;
      ctx.fillStyle = s.color;
      ctx.globalAlpha = a;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), s.size, s.size);
    }
    ctx.restore();
  }

  function _isLitFire(o){
    if(!FIRE_TYPES.has(o.type)) return false;
    if(o.lit===false)return false;
    // i_fireplace / b_stove are always lit (interior); fireplace needs o.lit
    if(o.type === 'fireplace') return !!o.lit;
    return true;
  }

  function _drawSunRays(camX, camY, visW, visH){
    // Sun god-rays at low angles (morning ~6-9, dusk ~16-19)
    if(typeof timeOfDay === 'undefined') return;
    const tod = timeOfDay;
    let intensity = 0, fromLeft = true;
    if(tod >= 6 && tod < 9.5){
      intensity = Math.sin((tod-6) / 3.5 * Math.PI) * 0.7;
      fromLeft = true;
    } else if(tod >= 16 && tod < 19){
      intensity = Math.sin((tod-16) / 3 * Math.PI) * 0.6;
      fromLeft = false;
    }
    if(intensity <= 0.05) return;
    if(typeof isFrio === 'function' && isFrio()) intensity *= 0.55; // softer in winter
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const t = reduced()?0:performance.now()/4000;
    const beams = 5;
    for(let i=0; i<beams; i++){
      const phase = (i / beams) + (t * 0.05);
      const offset = Math.sin(phase * Math.PI*2) * 30;
      const startX = fromLeft ? camX - 20 : camX + visW + 20;
      const endX   = fromLeft ? camX + visW + 40 : camX - 40;
      const startY = camY + 20 + i*18 + offset;
      const endY   = camY + visH * 0.6 + i*22 + offset;
      const grad = ctx.createLinearGradient(startX, startY, endX, endY);
      grad.addColorStop(0, `rgba(255,230,160,${0.04*intensity})`);
      grad.addColorStop(0.5, `rgba(255,210,130,${0.10*intensity})`);
      grad.addColorStop(1, `rgba(255,200,120,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.lineTo(endX, endY+24);
      ctx.lineTo(startX, startY+24);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function _drawFireLight(o, camX, camY, visW, visH, t, nightAlpha){
    // Cull if off-screen (with generous padding for the light radius)
    if(o.x < camX-140 || o.x > camX+visW+140 || o.y < camY-140 || o.y > camY+visH+140) return;
    const seed = (o.x*7 + o.y*3) % 1000;
    const flick = _flicker(seed, t);
    // Indoor fires have boosted reach since they're enclosed
    const baseRadius = o.type === 'b_stove' ? 110 : (o.type === 'i_fireplace' ? 130 : 100);
    const radius = baseRadius * (1 + flick*0.08);
    // Visibility scales with night darkness, plus a minimum bloom during the day
    const nightMul = Math.max(0.25, nightAlpha);  // always visible a little
    const indoorMul = (typeof isIndoor === 'function' && isIndoor()) ? 1.0 : 1.0;
    const alpha = (0.65 + flick*0.08) * nightMul * indoorMul;
    // ----- Warm radial gradient (the main glow) -----
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const grad = ctx.createRadialGradient(o.x, o.y-4, 4, o.x, o.y-4, radius);
    grad.addColorStop(0,    `rgba(255,240,200,${alpha*1.0})`);
    grad.addColorStop(0.15, `rgba(255,200,120,${alpha*0.75})`);
    grad.addColorStop(0.45, `rgba(255,150, 80,${alpha*0.40})`);
    grad.addColorStop(0.75, `rgba(220,100, 50,${alpha*0.18})`);
    grad.addColorStop(1,    'rgba(120, 40, 20,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(o.x - radius, o.y - radius - 4, radius*2, radius*2);
    ctx.restore();
    // ----- Bloom core (smaller, brighter, "lighter" blend) -----
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const coreR = 14 + flick*2;
    const coreGrad = ctx.createRadialGradient(o.x, o.y-4, 0, o.x, o.y-4, coreR);
    coreGrad.addColorStop(0, `rgba(255,255,220,${0.55 + flick*0.10})`);
    coreGrad.addColorStop(0.5, `rgba(255,200,120,${0.20})`);
    coreGrad.addColorStop(1, 'rgba(255,160, 80,0)');
    ctx.fillStyle = coreGrad;
    ctx.fillRect(o.x - coreR, o.y - 4 - coreR, coreR*2, coreR*2);
    ctx.restore();
    // ----- Sparks rising from the fire -----
    // Spawn rate proportional to fire size; throttled by time
    const sparkChance = (o.type === 'fireplace' ? 0.25 : 0.18);
    if(!reduced()&&Math.random() < sparkChance){
      _spawnSpark(o.x + (Math.random()-0.5)*8, o.y - 6, seed);
    }
  }

  function drawDynamicLights(camX, camY, visW, visH){
    const nightAlpha = (typeof nightOverlayAlpha === 'function') ? nightOverlayAlpha() : 0;
    const still=reduced(),scene=typeof currentScene==='string'?currentScene:'';
    if(_scene!==scene||still){_sparks.length=0;_scene=scene;}
    const t = still?0:performance.now() / 1000;
    const indoor=typeof isIndoor==='function'&&isIndoor();

    // 1) Sun god-rays (outdoor only)
    if(!indoor){
      _drawSunRays(camX, camY, visW, visH);
    }

    // 2) Fire-source point lights
    ctx.save();
    // Uma sala é um recorte do prédio. O fogo pode iluminar a parede,
    // mas o halo não atravessa a moldura para a área externa do mapa.
    if(indoor&&typeof MW==='number'&&typeof MH==='number'){
      ctx.beginPath();ctx.rect(3,0,MW*TS-6,MH*TS-4);ctx.clip();
    }
    if(typeof objects !== 'undefined' && Array.isArray(objects)){
      for(const o of objects){
        if(_isLitFire(o)){
          _drawFireLight(o, camX, camY, visW, visH, t, nightAlpha);
        }
      }
    }
    ctx.restore();

    // 3) Update + draw sparks (after lights so they overlay)
    if(!still){
      _updateSparks();
      ctx.save();
      // As fagulhas do fogão ficam dentro da sala; não sobem através da
      // parede norte nem sobrevivem à troca de cena.
      if(indoor&&typeof MW==='number'&&typeof MH==='number'){
        ctx.beginPath();ctx.rect(4,17,MW*TS-8,MH*TS-21);ctx.clip();
      }
      _drawSparks(camX, camY, visW, visH);
      ctx.restore();
    }
  }

  // Expose
  window.drawDynamicLights = drawDynamicLights;
  window.FarmDynamicLighting={info:()=>({sparks:_sparks.length,scene:_scene,reducedMotion:reduced()})};
})();
