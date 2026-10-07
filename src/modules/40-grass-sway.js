/* Vento discreto sobre o vale. Os tufos pertencem a FarmWorldArt.drawAtmosphere;
   manter drawGrassSway como entrada evita mudar integrações existentes.
   Faixas ancoradas no mundo não acompanham a câmera. Sem estado no save. */
(function(){
  function drawGrassSway(camX,camY,visW,visH){
    if(typeof isIndoor!=='function'||isIndoor()||!map?.length||
       (typeof A11Y!=='undefined'&&A11Y.reduceMotion))return;
    const wind=Math.max(0,Math.min(2,typeof windStrength==='number'?windStrength:1));
    if(wind<.05)return;
    const t=performance.now()/1500,worldWidth=MW*TS;
    ctx.save();ctx.fillStyle=isFrio()?'rgba(207,226,222,.09)':'rgba(223,225,196,.08)';
    let count=0;
    for(let band=Math.max(0,Math.floor(camY/96)-1);band<=Math.ceil((camY+visH)/96)&&count<4;band++){
      const x=((t*24*wind+band*173)%(worldWidth+28))-14;
      const y=band*96+28+(band*29)%39;
      if(x+12<camX||x>camX+visW||y<camY||y>camY+visH)continue;
      ctx.fillRect(Math.round(x),y,7,1);ctx.fillRect(Math.round(x)+10,y,3,1);count++;
    }
    ctx.restore();
  }
  window.drawGrassSway=drawGrassSway;
})();
