/* ============================================================
   Grass sway + ambient wind streaks
   ---------------------------------
   Two cheap, big-impact additions:
   1. A handful of grass blade tips on visible grass tiles sway
      slightly in the wind (sin(time + tile_coord)).
   2. Faint horizontal wind streaks drift across open areas.

   To keep cost in check, we only animate tiles in the visible
   range and only a fixed pixel per tile.

   Depends on: `map`, `T`, `MW`, `MH`, `TS`, `currentScene`, `isIndoor`,
               `isFrio`, `ctx`
   Exposes:    window.drawGrassSway(camX, camY, visW, visH)
   ============================================================ */
(function(){
  function _shouldAnimate(){
    return typeof isIndoor === 'function' && !isIndoor();
  }

  function drawGrassSway(camX, camY, visW, visH){
    if(!_shouldAnimate()) return;
    if(!map || !map[0]) return;
    const winter = typeof isFrio === 'function' && isFrio();
    // Intensidade do vento global (acompanha o clima); cai para 1 se indefinido.
    const wind = (typeof windStrength === 'number') ? windStrength : 1;
    const t = performance.now() / 600;       // ~slow breeze
    const tx0 = Math.max(0, Math.floor(camX/TS));
    const tx1 = Math.min(MW-1, Math.ceil((camX+visW)/TS));
    const ty0 = Math.max(0, Math.floor(camY/TS));
    const ty1 = Math.min(MH-1, Math.ceil((camY+visH)/TS));

    ctx.save();
    // Use a slightly brighter color in summer, washed in winter
    const colorTip   = winter ? '#c7dddd' : '#9bd86c';
    const colorMid   = winter ? '#7d9491' : '#54a142';

    for(let ty=ty0; ty<=ty1; ty++){
      const row = map[ty]; if(!row) continue;
      for(let tx=tx0; tx<=tx1; tx++){
        const tile = row[tx];
        if(tile !== T.GRASS && tile !== T.GRASS2) continue;
        const seed = (tx*13 + ty*7) % 100;
        // Only 60% of grass tiles get an animated blade — saves overdraw
        if(seed > 60) continue;
        const px = tx*TS;
        const py = ty*TS;
        // Per-tile sway phase (intensidade acompanha o vento global)
        const sway = Math.sin(t + seed*0.13) * 1.4 * wind;
        // Position of blade base
        const bx = px + 4 + (seed % 6);
        const by = py + 11 + ((seed*3) % 3);
        // Stem (static)
        ctx.fillStyle = colorMid;
        ctx.fillRect(bx, by, 1, 3);
        // Tip (swaying)
        ctx.fillStyle = colorTip;
        ctx.fillRect(bx + Math.round(sway), by-1, 1, 1);
        if(tile === T.GRASS2){
          // Second blade for grass2 — opposite phase
          const sway2 = Math.sin(t + seed*0.13 + Math.PI*0.6) * 1.2;
          ctx.fillStyle = colorMid;
          ctx.fillRect(bx + 5, by-1, 1, 3);
          ctx.fillStyle = colorTip;
          ctx.fillRect(bx + 5 + Math.round(sway2), by-2, 1, 1);
        }
      }
    }
    ctx.restore();

    // Wind streaks — only a few, only in summer, very subtle
    if(!winter){
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      const streakT = performance.now() / 1500;
      for(let i=0; i<4; i++){
        const sx = camX + ((streakT * 80 + i*180) % (visW + 60)) - 30;
        const sy = camY + 60 + i*48 + Math.sin(streakT*1.2 + i)*8;
        ctx.fillRect(sx,     sy, 8, 1);
        ctx.fillRect(sx + 10, sy, 4, 1);
      }
      ctx.restore();
    }
  }

  window.drawGrassSway = drawGrassSway;
})();
