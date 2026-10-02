/* ============================================================
   Fatia B — Repaginação de tiles (primeira passada)
   Sobrescreve tiles existentes via API.registerTileDrawer para
   melhorar a coesão visual. Nesta passada: água de lago/poço
   (WATER) ganha bordas de ESPUMA cientes dos vizinhos, para não
   encostar "no seco" de forma abrupta. Reproduz fielmente o
   verão e o inverno do desenho original e acrescenta a borda.
   (Repaginação de grama/caminho/rio pode vir numa próxima passada.)
   ============================================================ */
(function(){
  (window.__farmBiomes = window.__farmBiomes || []).push(function(API){
    const T = API.T, TS = API.TS;
    const isWater = (t)=> t===T.WATER || t===T.RIVER || t===T.OASIS;

    API.registerTileDrawer(T.WATER, (g, px, py, x, y, winter)=>{
      // ---- corpo da água (fiel ao original) ----
      if(winter){
        g.fillStyle='#a9d6e8'; g.fillRect(px,py,TS,TS);
        g.fillStyle='#e3f5ff'; g.fillRect(px+1,py+1,TS-2,TS-2);
        g.fillStyle='#c5ecff'; g.fillRect(px+3,py+4,7,1); g.fillRect(px+8,py+9,4,1); g.fillRect(px+4,py+12,6,1);
        g.fillStyle='#84c2dd'; g.fillRect(px,py+TS-2,TS,2);
      } else {
        g.fillStyle='#5bb7df'; g.fillRect(px,py,TS,TS);
        // brilho/ondulações suaves
        g.fillStyle='#8fe7ff'; g.fillRect(px+2,py+3,4,1); g.fillRect(px+9,py+10,3,1); g.fillRect(px+6,py+6,5,1);
        g.fillStyle='#6fd0f0'; g.fillRect(px+3,py+8,5,1); g.fillRect(px+10,py+4,3,1);
        g.fillStyle='#3289ba'; g.fillRect(px,py+TS-2,TS,2);
        // cintilância pontual determinística
        if((x*7+y*13)%5===0){ g.fillStyle='rgba(255,255,255,.7)'; g.fillRect(px+ (x*3)%12, py+ (y*3)%10, 1,1); }
      }

      // ---- bordas de espuma onde encosta na TERRA (vizinho não-água) ----
      const up    = API.tileAt(x, y-1), down = API.tileAt(x, y+1);
      const left  = API.tileAt(x-1, y), right = API.tileAt(x+1, y);
      const foam = winter ? 'rgba(255,255,255,.85)' : 'rgba(226,247,255,.9)';
      const foam2 = winter ? 'rgba(210,235,245,.7)' : 'rgba(150,225,255,.55)';
      g.fillStyle = foam;
      if(up   !== undefined && !isWater(up))   { g.fillRect(px, py, TS, 2); }
      if(down !== undefined && !isWater(down)) { g.fillRect(px, py+TS-2, TS, 2); }
      if(left !== undefined && !isWater(left)) { g.fillRect(px, py, 2, TS); }
      if(right!== undefined && !isWater(right)){ g.fillRect(px+TS-2, py, 2, TS); }
      // segunda linha de espuma (mais suave), quebra a dureza da borda
      g.fillStyle = foam2;
      if(up   !== undefined && !isWater(up) && ((x)%2===0))   g.fillRect(px+2, py+2, TS-4, 1);
      if(down !== undefined && !isWater(down) && ((x)%2===1)) g.fillRect(px+2, py+TS-3, TS-4, 1);
      if(left !== undefined && !isWater(left) && ((y)%2===0)) g.fillRect(px+2, py+2, 1, TS-4);
      if(right!== undefined && !isWater(right) && ((y)%2===1))g.fillRect(px+TS-3, py+2, 1, TS-4);
    });
  });
})();
