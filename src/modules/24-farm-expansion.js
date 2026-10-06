/* ============================================================
   Fatia E (2/2) — Conteúdo e atividades das novas áreas da fazenda
   Após ampliar o mapa (60×40), povoa o LESTE (além do rio, via ponte)
   com um pomar e o SUL com um prado, e adiciona atividades novas:
   arbustos de frutas silvestres (forrageio) e uma estação
   meteorológica educativa. Tudo via a API FarmBiomes.
   ============================================================ */
(function(){
  (window.__farmBiomes = window.__farmBiomes || []).push(function(API){
    const TS = API.TS;
    const px = (tx)=> tx*TS + 8;

    // ---------- Objetos das novas áreas ----------
    // LESTE — pomar do outro lado do rio (colunas 49–58)
    const east = [
      {type:'fx_fruittree', x:px(50), y:px(8)+8,  kind:0},
      {type:'fx_fruittree', x:px(53), y:px(11)+8, kind:1},
      {type:'fx_fruittree', x:px(56), y:px(7)+8,  kind:0},
      {type:'fx_fruittree', x:px(52), y:px(14)+8, kind:1},
      {type:'fx_fruittree', x:px(57), y:px(13)+8, kind:0},
      {type:'fx_berry', x:px(54), y:px(10)+8, _pickT:0},
      {type:'fx_weather', x:px(51), y:px(19)+8},
    ];
    // SUL — prado com fenos e mirante (linhas 33–38)
    const south = [
      {type:'fx_hay', x:px(14), y:px(35)+8},
      {type:'fx_hay', x:px(34), y:px(36)+8},
      {type:'fx_berry', x:px(20), y:px(37)+8, _pickT:0},
      {type:'fx_lookout', x:px(30), y:px(37)+8},
      {type:'fx_fruittree', x:px(8),  y:px(36)+8, kind:1},
      {type:'fx_fruittree', x:px(44), y:px(35)+8, kind:0},
    ];
    [...east, ...south].forEach(o=> API.addObjectToMain(o));

    /* ================= DESENHOS ================= */
    API.registerObjectDrawer('fx_fruittree', (o,ctx)=>{
      ctx.fillStyle='#5a3a1c'; ctx.fillRect(o.x-3, o.y-6, 6, 8);            // tronco
      ctx.fillStyle='#2f7a34'; ctx.fillRect(o.x-11, o.y-20, 22, 15);       // copa
      ctx.fillStyle='#3c9142'; ctx.fillRect(o.x-9, o.y-24, 18, 8);
      ctx.fillStyle='#4fa657'; ctx.fillRect(o.x-6, o.y-27, 12, 6);
      // frutas
      ctx.fillStyle = o.kind ? '#f4c430' : '#e0402a';                      // amarela ou vermelha
      ctx.fillRect(o.x-7, o.y-16, 2, 2); ctx.fillRect(o.x+4, o.y-19, 2, 2);
      ctx.fillRect(o.x-2, o.y-12, 2, 2); ctx.fillRect(o.x+6, o.y-13, 2, 2);
      ctx.fillStyle='#66bd6d'; ctx.fillRect(o.x-9, o.y-24, 4, 2);          // brilho
    });
    API.registerObjectDrawer('fx_berry', (o,ctx)=>{
      const ripe = !(o._pickT && (performance.now() - o._pickT) < 25000);
      ctx.fillStyle='#2e6b34'; ctx.fillRect(o.x-8, o.y-9, 16, 9);          // arbusto
      ctx.fillStyle='#3c8a44'; ctx.fillRect(o.x-6, o.y-12, 12, 5);
      if(ripe){
        ctx.fillStyle='#d12a5a';                                          // frutinhas
        ctx.fillRect(o.x-5, o.y-6, 2, 2); ctx.fillRect(o.x+1, o.y-8, 2, 2);
        ctx.fillRect(o.x+4, o.y-5, 2, 2); ctx.fillRect(o.x-2, o.y-3, 2, 2);
        ctx.fillStyle='#ff6b8f'; ctx.fillRect(o.x-5, o.y-6, 1, 1);
      }
    });
    API.registerObjectDrawer('fx_hay', (o,ctx)=>{
      ctx.fillStyle='#d6a640'; ctx.fillRect(o.x-10, o.y-10, 20, 11);       // fardo
      ctx.fillStyle='#c8952f'; for(let i=-9;i<10;i+=3) ctx.fillRect(o.x+i, o.y-10, 1, 11);
      ctx.fillStyle='#8a5a1e'; ctx.fillRect(o.x-10, o.y-2, 20, 2);         // cinta
      ctx.fillRect(o.x-4, o.y-10, 2, 11);
      ctx.fillStyle='#e8c064'; ctx.fillRect(o.x-10, o.y-10, 20, 2);
    });
    API.registerObjectDrawer('fx_lookout', (o,ctx)=>{
      ctx.fillStyle='#6b4a26'; ctx.fillRect(o.x-2, o.y-2, 4, 2);           // base
      ctx.fillStyle='#8a6a3a'; ctx.fillRect(o.x-2, o.y-16, 3, 15);         // poste
      ctx.fillStyle='#a9834a'; ctx.fillRect(o.x-11, o.y-22, 24, 8);        // placa
      ctx.fillStyle='#3a2610'; ctx.font='7px monospace'; ctx.fillText('MIRANTE', o.x-10, o.y-16);
      ctx.fillStyle='#f0e4c0'; ctx.fillRect(o.x-11, o.y-22, 24, 1);
    });
    API.registerObjectDrawer('fx_weather', (o,ctx)=>{
      ctx.fillStyle='#8b8f96'; ctx.fillRect(o.x-2, o.y-20, 4, 20);         // mastro
      ctx.fillStyle='#c9ccd2'; ctx.fillRect(o.x-9, o.y-26, 18, 8);         // caixa branca (abrigo termométrico)
      ctx.fillStyle='#e6e9ee'; ctx.fillRect(o.x-9, o.y-26, 18, 2);
      ctx.fillStyle='#5a5f6a'; for(let i=-7;i<8;i+=3) ctx.fillRect(o.x+i, o.y-24, 1, 5); // venezianas
      // catavento
      ctx.fillStyle='#e0402a'; ctx.fillRect(o.x, o.y-30, 6, 2);
      ctx.fillStyle='#3a6ea5'; ctx.fillRect(o.x-6, o.y-30, 6, 2);
      ctx.fillStyle='#2a2f36'; ctx.fillRect(o.x-1, o.y-32, 2, 4);
    });

    /* ================= ATIVIDADES ================= */
    // Frutas silvestres: forrageio com recarga (~25s). Recupera água e energia.
    API.registerInteraction('fx_berry', (o)=>{
      const now = performance.now();
      if(o._pickT && now - o._pickT < 25000){
        API.showAlert('🌱 As frutas ainda estão crescendo — volte daqui a pouco.');
        return;
      }
      o._pickT = now;
      const p = API.player;
      if(typeof p.hyd === 'number') p.hyd = Math.min(100, p.hyd + 12);
      if(typeof p.en === 'number')  p.en  = Math.min(100, p.en  + 10);
      API.flashFx(o.x, o.y-14, '🍓 +água +energia', '#ff6b8f');
      API.spawnBurst(o.x, o.y-6, {count:12, speed:1.2, lift:1.6, gravity:0.08, color:'220,60,110', life:28, size:2});
      API.playSfx('pop');
    });
    // Estação meteorológica: lê o estado térmico atual e explica a resposta da pele.
    API.registerInteraction('fx_weather', (o)=>{
      const t = API.player.temp || 37;
      let msg;
      if(t > 38.3) msg = '🌡️ '+t.toFixed(1)+' °C — CALOR: sua pele faz vasodilatação e sudorese para liberar calor. Beba água para suar bem!';
      else if(t < 36.4) msg = '🌡️ '+t.toFixed(1)+' °C — FRIO: vasoconstrição conserva calor e o corpo pode tremer (termogênese). Aqueça-se!';
      else msg = '🌡️ '+t.toFixed(1)+' °C — CONFORTO: a pele mantém o equilíbrio térmico com pequenos ajustes de fluxo sanguíneo e sudorese.';
      API.showToast(msg, 'info', 4200);
      API.playSfx('click');
    });
    // Mirante: dica sobre as novas áreas.
    API.registerInteraction('fx_lookout', (o)=>{
      API.showToast('🔭 Daqui você vê a fazenda inteira: a ponte leva ao pomar do leste, e as trilhas levam à montanha (norte) e ao deserto (sul).', 'info', 4200);
      API.playSfx('click');
    });
  });
})();
