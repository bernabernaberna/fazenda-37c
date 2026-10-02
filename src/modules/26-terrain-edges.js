/* ============================================================
   Bordas de terreno — acabamento original sobre a arte existente
   Grama avança em pequenos degraus sobre caminho e lavoura; os
   cantos diagonais e a borda do solo evitam retângulos isolados.
   Tudo fica no cache de tiles: sem desenho extra por frame,
   sorteio, imagens ou alteração das regras de movimento/plantio.
   Requer API.drawBaseTile, para preservar o desenho embutido.
   ============================================================ */
(function(){
  (window.__farmBiomes = window.__farmBiomes || []).push(function(API){
    const T = API.T, TS = API.TS;
    if(typeof API.drawBaseTile !== 'function') return;

    const quente = { sombra:'#356b29', luz:'#76c45e' };
    const frio = { sombra:'#aabac4', corpo:'#e3edf1', luz:'#f7faff' };
    const eGrama = (t)=> t === T.GRASS || t === T.GRASS2;

    // A mesma forma se aplica às quatro direções sem girar o canvas.
    // Cada retângulo permanece dentro dos 16×16 pixels do tile.
    function faixa(g, px, py, lado, inicio, largura, recuo, espessura){
      if(lado === 0) g.fillRect(px+inicio, py+recuo, largura, espessura);
      else if(lado === 1) g.fillRect(px+TS-recuo-espessura, py+inicio, espessura, largura);
      else if(lado === 2) g.fillRect(px+inicio, py+TS-recuo-espessura, largura, espessura);
      else g.fillRect(px+recuo, py+inicio, espessura, largura);
    }

    function margem(g, px, py, x, y, lado, nx, ny, winter){
      const pal = winter ? frio : quente;
      // Cor do gramado vizinho, com a mesma alternância da arte base.
      const corpo = winter ? pal.corpo : ((nx+ny)%2 ? '#5aa047' : '#5ea84a');
      const seed = x*13 + y*7 + lado*11;
      for(let i=0; i<TS; i+=4){
        // Degraus de 1–3 pixels, estáveis em cada coordenada.
        const profundidade = 1 + ((seed + i*2)%3);
        g.fillStyle = pal.sombra;
        faixa(g, px, py, lado, i, Math.min(4,TS-i), profundidade, 1);
        g.fillStyle = corpo;
        faixa(g, px, py, lado, i, Math.min(4,TS-i), 0, profundidade);
        g.fillStyle = pal.luz;
        faixa(g, px, py, lado, i+1, 2, 0, 1);
      }
    }

    function canto(g, px, py, direita, baixo, winter, nx, ny){
      const pal = winter ? frio : quente;
      const cx = direita ? px+TS-3 : px;
      const cy = baixo ? py+TS-3 : py;
      // Um canto de grama arredondado em degraus, sem traços subpixel.
      g.fillStyle = pal.sombra;
      g.fillRect(cx, cy, 3, 3);
      g.fillStyle = winter ? pal.corpo : ((nx+ny)%2 ? '#5aa047' : '#5ea84a');
      g.fillRect(direita ? cx+1 : cx, cy, 2, 3);
      g.fillRect(cx, baixo ? cy+1 : cy, 3, 2);
      g.fillStyle = pal.luz;
      g.fillRect(direita ? cx+2 : cx, baixo ? cy+2 : cy, 1, 1);
    }

    function solo(g, px, py, lado, x, y, winter){
      // Só a lavoura desenha esta margem: caminho não ganha borda dupla.
      g.fillStyle = winter ? '#796f64' : '#4f3417';
      faixa(g, px, py, lado, 0, TS, 0, 1);
      g.fillStyle = winter ? '#dce6ed' : '#9c7242';
      for(let i=(x+y)%3; i<TS-1; i+=5){
        faixa(g, px, py, lado, i, 2, 1, 1);
      }
    }

    function registrar(t){
      API.registerTileDrawer(t, function(g, px, py, x, y, winter){
        API.drawBaseTile(g, px, py, x, y, t, winter);
        // A estufa e os demais interiores mantêm seus pisos originais.
        if(API.rawScene !== 'main') return;

        const cima = API.tileAt(x,y-1), direita = API.tileAt(x+1,y);
        const baixo = API.tileAt(x,y+1), esquerda = API.tileAt(x-1,y);
        const gc = eGrama(cima), gd = eGrama(direita);
        const gb = eGrama(baixo), ge = eGrama(esquerda);
        if(gc) margem(g,px,py,x,y,0,x,y-1,winter);
        if(gd) margem(g,px,py,x,y,1,x+1,y,winter);
        if(gb) margem(g,px,py,x,y,2,x,y+1,winter);
        if(ge) margem(g,px,py,x,y,3,x-1,y,winter);

        // Cantos de uma curva: há grama na diagonal, mas as duas
        // faces do caminho/lavoura continuam ligadas ao terreno.
        if(!gc && !ge && eGrama(API.tileAt(x-1,y-1))) canto(g,px,py,false,false,winter,x-1,y-1);
        if(!gc && !gd && eGrama(API.tileAt(x+1,y-1))) canto(g,px,py,true,false,winter,x+1,y-1);
        if(!gb && !gd && eGrama(API.tileAt(x+1,y+1))) canto(g,px,py,true,true,winter,x+1,y+1);
        if(!gb && !ge && eGrama(API.tileAt(x-1,y+1))) canto(g,px,py,false,true,winter,x-1,y+1);

        if(t === T.FIELD){
          if(cima === T.PATH) solo(g,px,py,0,x,y,winter);
          if(direita === T.PATH) solo(g,px,py,1,x,y,winter);
          if(baixo === T.PATH) solo(g,px,py,2,x,y,winter);
          if(esquerda === T.PATH) solo(g,px,py,3,x,y,winter);
        }
      });
    }
    registrar(T.PATH);
    registrar(T.FIELD);
  });
})();
