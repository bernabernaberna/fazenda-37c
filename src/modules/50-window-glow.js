/* ============================================================
   Window glow — warm light from house/barn windows at night.
   ============================================================
   When `nightOverlayAlpha() > 0.2`, paints a soft warm halo at
   each painted window position. This complements the dynamic
   lighting from fires by giving buildings life from outside.

   The house has two windows flanking the door + a circular
   attic window. The barn has one side window. Positions are
   derived from the building rectangle.

   Depends on: `objects`, `nightOverlayAlpha`, `ctx`, `isIndoor`
   Exposes:    window.drawWindowGlow(camX, camY, visW, visH)
   ============================================================ */
(function(){
  function _haloAt(x, y, r, intensity){
    // Soft warm radial gradient with 'screen' blend
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0,    `rgba(255,235,170,${intensity*0.85})`);
    g.addColorStop(0.35, `rgba(255,200,120,${intensity*0.45})`);
    g.addColorStop(0.8,  `rgba(220,140, 70,${intensity*0.12})`);
    g.addColorStop(1,    'rgba(180, 90, 40, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x-r, y-r, r*2, r*2);
  }

  function drawWindowGlow(camX, camY, visW, visH){
    if(typeof isIndoor === 'function' && isIndoor()) return;
    const nightAlpha = (typeof nightOverlayAlpha === 'function') ? nightOverlayAlpha() : 0;
    if(nightAlpha < 0.18) return;
    const intensity = Math.min(1, (nightAlpha - 0.18) / 0.5);
    if(typeof objects === 'undefined' || !Array.isArray(objects)) return;
    ctx.save();
    for(const o of objects){
      if(window.FarmWorldDepth){
        const lights=FarmWorldDepth.windowLights(o);
        if(lights){for(const light of lights)if(light.x>camX-50&&light.x<camX+visW+50&&light.y>camY-50&&light.y<camY+visH+50)_haloAt(light.x,light.y,light.r,intensity);}
        continue;
      }
      if(o.type === 'house'){
        // Walls of house — windows are at wallTop+14, x = o.x+12 and o.x+o.w-19
        // (matches drawHouse calculations)
        const roofH = 38;
        const wallTop = o.y + roofH;
        const wy = wallTop + 14 + 9;             // mid-height of the window
        const wxL = o.x + 12 + 7;
        const wxR = o.x + o.w - 26 + 7;
        // Cull
        if(o.x+o.w < camX-80 || o.x > camX+visW+80) continue;
        if(o.y+o.h < camY-80 || o.y > camY+visH+80) continue;
        _haloAt(wxL, wy, 30, intensity);
        _haloAt(wxR, wy, 30, intensity);
        // Attic round window
        const gabH = roofH - 4;
        const attY = o.y + gabH - 14;
        const cx = o.x + o.w/2;
        _haloAt(cx, attY, 20, intensity * 0.8);
      } else if(o.type === 'barn'){
        const roofH = 36;
        const wallTop = o.y + roofH + 4;
        // small window on left side at swx = o.x+8, swy = wallTop+14
        const wx = o.x + 8 + 4;
        const wy = wallTop + 14 + 4;
        if(o.x+o.w < camX-60 || o.x > camX+visW+60) continue;
        _haloAt(wx, wy, 22, intensity);
      }
    }
    ctx.restore();
  }

  window.drawWindowGlow = drawWindowGlow;
})();
