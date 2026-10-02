/* ============================================================
   Fatia C — Bioma MONTANHA NEVADA  (v2, refeito)
   Cena grande (preenche a tela) de frio intenso: vasoconstrição,
   termogênese por tremor, hipotermia, isolamento (tecido adiposo).
   Registrado via a API FarmBiomes (ver src/modules/BIOME_API.md).
   ============================================================ */
(function(){
  (window.__farmBiomes = window.__farmBiomes || []).push(function(API){
    const T = API.T, TS = API.TS;
    const W = 48, H = 34;                 // grande o bastante p/ preencher o viewport (768x500)

    // ---------- Mapa ----------
    const map = API.makeBlankMap(W, H, T.SNOW);
    // Cordilheira rochosa ao norte (parede de fundo)
    API.paintRect(map, 0, 0, W, 3, T.SNOWROCK);
    for(let x=0;x<W;x++){ if((x*7)%3===0) map[3][x] = T.SNOWROCK; }   // borda irregular
    // Afloramentos de rocha espalhados
    API.paintRect(map, 6, 7, 4, 2, T.SNOWROCK);
    API.paintRect(map, 39, 6, 5, 3, T.SNOWROCK);
    API.paintRect(map, 33, 20, 4, 2, T.SNOWROCK);
    // Lago congelado (arredondado) no sudoeste
    for(let y=22;y<31;y++) for(let x=5;x<20;x++){
      const dx=(x-12)/7.5, dy=(y-26.5)/4.2;
      if(dx*dx+dy*dy < 1) map[y][x] = T.ICE;
    }

    // ---------- Objetos ----------
    const O = [];
    const add=(o)=>O.push(o);
    // Floresta de pinheiros (densa nas laterais, esparsa no meio), tamanhos variados
    const pineSpots = [
      [4,6,1.2],[8,10,1],[3,14,1.1],[6,18,0.9],[10,15,1.2],[4,26,1],[9,30,1.1],[13,9,0.9],
      [43,7,1.2],[45,12,1],[41,16,1.1],[44,20,0.9],[39,24,1.2],[43,28,1],[46,31,1.1],[37,12,0.9],
      [22,5,1],[28,7,1.1],[18,4,0.9],[31,4,1],[25,31,1.1],[30,29,0.9],[34,32,1],[20,28,1.1],
      [15,22,0.9],[36,26,1],[26,24,0.85]
    ];
    pineSpots.forEach(([tx,ty,s])=> add({type:'mtn_pine', x:tx*TS+8, y:ty*TS+15, s}));
    // Pedras nevadas (boulders)
    [[16,13],[30,18],[12,7],[35,9],[21,20],[8,23],[40,26]].forEach(([tx,ty])=> add({type:'mtn_rock', x:tx*TS+8, y:ty*TS+12}));
    // Cabana-abrigo + fogueira, num "acampamento" central
    add({type:'mtn_cabin', x:26*TS+8, y:13*TS+18});
    add({type:'mtn_fire',  x:23*TS+8, y:16*TS+14, lit:true});
    // Boneco de neve (charme)
    add({type:'mtn_snowman', x:30*TS+8, y:22*TS+14});
    // Gelo na margem leste do lago: entra no mundo junto com o carimbo do bioma.
    add({type:'mtn_ice_cache', x:19*TS+8, y:24*TS+13, interactionHint:'coletar gelo'});
    // Placa/portão de saída (visual) na borda inferior
    add({type:'mtn_exit', x:23*TS+8, y:(H-1)*TS+8, exit:true, _dest:{scene:'main', x:16*TS+8, y:5*TS+8}});

    API.registerScene({
      name:'mountain', MW:W, MH:H, map, objects:O, crops:{}, indoor:false,
      spawn:{ x:23*TS+8, y:(H-3)*TS },
      onEnterMsg:'❄️ Montanha nevada: no frio intenso a pele faz vasoconstrição e o corpo pode tremer para gerar calor. Aqueça-se na fogueira ou na cabana!'
    });

    /* ================= TILES ================= */
    API.registerTileDrawer(T.SNOW, (g,px,py,x,y)=>{
      g.fillStyle = ((x+y)&1) ? '#e9f1fb' : '#e1eaf6'; g.fillRect(px,py,TS,TS);
      // manchas amplas de luz/sombra (baixa frequência, determinístico)
      const v = Math.sin(x*0.42 + y*0.26) + Math.cos(x*0.19 - y*0.34);
      if(v > 1.0){ g.fillStyle='rgba(255,255,255,.55)'; g.fillRect(px,py,TS,TS); }
      else if(v < -1.0){ g.fillStyle='rgba(196,212,231,.5)'; g.fillRect(px,py,TS,TS); }
      const s = (x*13 + y*7) % 100;
      // pequenas ondulações/drifts de neve
      g.fillStyle = '#d1dcec';
      if(s < 30){ g.fillRect(px+2, py+10, 6, 2); g.fillRect(px+4, py+12, 3, 1); }
      g.fillStyle = '#ffffff';
      if(s > 68){ g.fillRect(px+8, py+3, 5, 2); g.fillRect(px+9, py+5, 3, 1); }
      // cristais brilhando
      g.fillStyle = 'rgba(255,255,255,.95)'; g.fillRect(px + (x*7)%14, py + (y*5)%14, 1, 1);
      if(s%13===0){ g.fillStyle='#bcccdf'; g.fillRect(px + (x*5)%13, py + (y*3)%13, 1, 1); }
    });
    API.registerTileDrawer(T.ICE, (g,px,py,x,y)=>{
      // gelo azul translúcido com brilho e rachaduras
      g.fillStyle='#bfe1f0'; g.fillRect(px,py,TS,TS);
      g.fillStyle='#a7d3e8'; g.fillRect(px,py+9,TS,7);
      g.fillStyle='#d9f2fb'; g.fillRect(px,py,TS,3);
      const s=(x*11+y*5)%100;
      g.strokeStyle='rgba(120,170,200,.5)'; g.lineWidth=1; g.beginPath();
      if(s<50){ g.moveTo(px+2,py+5); g.lineTo(px+8,py+8); g.lineTo(px+13,py+5); }
      else { g.moveTo(px+3,py+11); g.lineTo(px+9,py+7); g.lineTo(px+14,py+12); }
      g.stroke();
      g.fillStyle='rgba(255,255,255,.8)'; g.fillRect(px+4,py+2,5,1);   // reflexo
    });
    API.registerTileDrawer(T.SNOWROCK, (g,px,py,x,y)=>{
      g.fillStyle='#71778a'; g.fillRect(px,py,TS,TS);                  // rocha
      g.fillStyle='#5b6072'; g.fillRect(px+2,py+8,6,5); g.fillRect(px+9,py+10,5,4);
      g.fillStyle='#8b91a4'; g.fillRect(px+3,py+3,5,3); g.fillRect(px+10,py+4,3,2);
      g.fillStyle='#4b5062'; g.fillRect(px+7,py+6,1,7);                // fenda
      g.fillStyle='rgba(244,249,255,.95)'; g.fillRect(px,py,TS,4);     // neve por cima
      g.fillStyle='#ffffff'; if((x+y)&1) g.fillRect(px+2,py+4,4,1); else g.fillRect(px+9,py+4,4,1);
    });

    /* ================= OBJETOS ================= */
    // Pinheiro nevado em camadas (trapézios empilhados)
    API.registerObjectDrawer('mtn_pine', (o,ctx)=>{
      const s = o.s || 1;
      ctx.fillStyle='rgba(50,70,100,.16)'; ctx.fillRect(o.x-9*s, o.y+1, 18*s, 3);   // sombra
      ctx.fillStyle='#4a3320'; ctx.fillRect(o.x-2, o.y-5, 4, 7);                     // tronco
      const tiers = [[11,7],[9,7],[7,7],[5,6]];   // [meiaLargura, altura] de baixo p/ cima
      let ty = o.y - 3;
      for(let i=0;i<tiers.length;i++){
        const hw = tiers[i][0]*s, th = tiers[i][1];
        // corpo verde (triângulo aproximado por 3 faixas)
        ctx.fillStyle = i%2 ? '#2c5233' : '#31603a';
        ctx.fillRect(o.x-hw, ty-2, hw*2, 4);
        ctx.fillStyle = '#367044';
        ctx.fillRect(o.x-hw*0.7, ty-th+2, hw*1.4, th);
        ctx.fillStyle = '#3f8150';
        ctx.fillRect(o.x-hw*0.4, ty-th, hw*0.8, th-2);
        // neve na crista de cada camada
        ctx.fillStyle='rgba(255,255,255,.92)';
        ctx.fillRect(o.x-hw*0.6, ty-th+1, hw*1.2, 2);
        ctx.fillRect(o.x-hw*0.25, ty-th, hw*0.5, 1);
        ty -= th + 2;
      }
      ctx.fillStyle='#fff'; ctx.fillRect(o.x-1, ty-1, 2, 2);          // ponta nevada
    });
    API.registerObjectDrawer('mtn_rock', (o,ctx)=>{
      ctx.fillStyle='rgba(50,70,100,.16)'; ctx.fillRect(o.x-9, o.y+1, 18, 3);
      ctx.fillStyle='#6e7386'; ctx.fillRect(o.x-9, o.y-9, 18, 10);
      ctx.fillStyle='#585d70'; ctx.fillRect(o.x-9, o.y-1, 18, 2);
      ctx.fillStyle='#888ea1'; ctx.fillRect(o.x-6, o.y-7, 6, 3); ctx.fillRect(o.x+2, o.y-5, 4, 2);
      ctx.fillStyle='rgba(246,250,255,.95)'; ctx.fillRect(o.x-9, o.y-9, 18, 3);   // neve
      ctx.fillStyle='#fff'; ctx.fillRect(o.x-6, o.y-8, 5, 1);
    });
    API.registerObjectDrawer('mtn_cabin', (o,ctx)=>{
      const w=44, h=30;
      ctx.fillStyle='rgba(40,60,90,.2)'; ctx.fillRect(o.x-w/2+3, o.y-1, w, 4);     // sombra
      // corpo de madeira
      ctx.fillStyle='#6b4a2c'; ctx.fillRect(o.x-w/2, o.y-h, w, h);
      ctx.fillStyle='#5a3d24'; for(let i=1;i<5;i++) ctx.fillRect(o.x-w/2, o.y-h+i*6, w, 1);  // toras
      // porta
      ctx.fillStyle='#3a2614'; ctx.fillRect(o.x-6, o.y-13, 12, 13);
      ctx.fillStyle='#241a0f'; ctx.fillRect(o.x-5, o.y-12, 10, 12);
      ctx.fillStyle='#7a5230'; ctx.fillRect(o.x+3, o.y-7, 1, 1);   // maçaneta
      // janela iluminada
      ctx.fillStyle='#ffd98a'; ctx.fillRect(o.x-17, o.y-20, 9, 8);
      ctx.fillStyle='#3a2614'; ctx.fillRect(o.x-13, o.y-20, 1, 8); ctx.fillRect(o.x-17, o.y-16, 9, 1);
      ctx.fillStyle='rgba(255,200,110,.35)'; ctx.fillRect(o.x-20, o.y-23, 15, 14); // brilho
      // telhado nevado
      ctx.fillStyle='#7a5230'; ctx.fillRect(o.x-w/2-3, o.y-h-6, w+6, 7);
      ctx.fillStyle='rgba(248,252,255,.97)'; ctx.fillRect(o.x-w/2-3, o.y-h-9, w+6, 5);
      ctx.fillStyle='#fff'; ctx.fillRect(o.x-w/2-3, o.y-h-9, w+6, 2);
      // chaminé com fumaça
      ctx.fillStyle='#4b4b52'; ctx.fillRect(o.x+10, o.y-h-14, 6, 8);
      ctx.fillStyle='rgba(230,235,240,.5)'; ctx.fillRect(o.x+11, o.y-h-20, 4, 4); ctx.fillRect(o.x+12, o.y-h-25, 3, 4);
    });
    API.registerObjectDrawer('mtn_fire', (o,ctx)=>{
      // pedras em volta
      ctx.fillStyle='#6a6f7b'; for(let i=0;i<6;i++){ const a=i/6*Math.PI*2; ctx.fillRect(o.x+Math.cos(a)*10-2, o.y+Math.sin(a)*5-1, 4, 3); }
      // toras
      ctx.fillStyle='#5a3a20'; ctx.fillRect(o.x-8, o.y-1, 16, 3); ctx.fillStyle='#7a5230'; ctx.fillRect(o.x-8, o.y-1, 16, 1);
      if(o.lit){
        const t=(typeof performance!=='undefined')?performance.now()*0.012:0;
        const fl=Math.sin(t)*2, fl2=Math.cos(t*1.3)*1.5;
        ctx.fillStyle='rgba(255,150,60,.22)'; ctx.fillRect(o.x-16, o.y-4, 32, 8);   // brilho no chão
        ctx.fillStyle='#e0531e'; ctx.fillRect(o.x-5, o.y-13-fl*0.3, 10, 13);
        ctx.fillStyle='#ff8a2a'; ctx.fillRect(o.x-3, o.y-16-fl, 6, 15);
        ctx.fillStyle='#ffc24a'; ctx.fillRect(o.x-2, o.y-12-fl2, 4, 10);
        ctx.fillStyle='#fff0b0'; ctx.fillRect(o.x-1, o.y-8, 2, 5);
        // fagulhas
        ctx.fillStyle='rgba(255,200,120,.8)'; ctx.fillRect(o.x+2, o.y-18-fl, 1,1); ctx.fillRect(o.x-3, o.y-20+fl2,1,1);
      }
    });
    API.registerObjectDrawer('mtn_snowman', (o,ctx)=>{
      ctx.fillStyle='rgba(50,70,100,.15)'; ctx.fillRect(o.x-7, o.y+1, 14, 3);
      ctx.fillStyle='#f4f9ff'; ctx.fillRect(o.x-7, o.y-8, 14, 9);          // base
      ctx.fillStyle='#ffffff'; ctx.fillRect(o.x-6, o.y-8, 12, 4);
      ctx.fillStyle='#f4f9ff'; ctx.fillRect(o.x-5, o.y-17, 10, 10);        // meio
      ctx.fillStyle='#ffffff'; ctx.fillRect(o.x-4, o.y-17, 8, 4);
      ctx.fillStyle='#eef5ff'; ctx.fillRect(o.x-4, o.y-24, 8, 8);          // cabeça
      ctx.fillStyle='#2a2f36'; ctx.fillRect(o.x-2, o.y-22, 1,1); ctx.fillRect(o.x+1, o.y-22, 1,1); // olhos
      ctx.fillStyle='#ff8a2a'; ctx.fillRect(o.x, o.y-20, 3, 1);            // nariz cenoura
      ctx.fillStyle='#4a3320'; ctx.fillRect(o.x-8, o.y-14, 5, 1); ctx.fillRect(o.x+3, o.y-15, 5, 1); // braços
      ctx.fillStyle='#c0392b'; ctx.fillRect(o.x-4, o.y-26, 8, 2);         // gorro
    });
    API.registerObjectDrawer('mtn_ice_cache', (o,ctx)=>{
      // Blocos quebrados, contorno azul e faces claras — pixel art própria.
      ctx.fillStyle='rgba(50,70,100,.18)'; ctx.fillRect(o.x-11, o.y+1, 22, 3);
      ctx.fillStyle='#527b9b'; ctx.fillRect(o.x-10, o.y-8, 11, 9); ctx.fillRect(o.x+1, o.y-11, 9, 12);
      ctx.fillStyle='#9fd0e6'; ctx.fillRect(o.x-9, o.y-7, 9, 7); ctx.fillRect(o.x+2, o.y-10, 7, 10);
      ctx.fillStyle='#e6f7ff'; ctx.fillRect(o.x-9, o.y-7, 9, 2); ctx.fillRect(o.x+2, o.y-10, 7, 3);
      ctx.fillStyle='#bfe3f2'; ctx.fillRect(o.x-7, o.y-4, 3, 3); ctx.fillRect(o.x+5, o.y-6, 3, 5);
      ctx.fillStyle='#ffffff'; ctx.fillRect(o.x-8, o.y-6, 3, 1); ctx.fillRect(o.x+3, o.y-9, 3, 1);
      // Pequena pá de madeira identifica o ponto de coleta.
      ctx.fillStyle='#6b4a2c'; ctx.fillRect(o.x-1, o.y-18, 2, 11); ctx.fillRect(o.x-3, o.y-20, 6, 2);
      ctx.fillStyle='#71778a'; ctx.fillRect(o.x-3, o.y-9, 6, 5);
      ctx.fillStyle='#b7c7dc'; ctx.fillRect(o.x-2, o.y-9, 4, 2);
    });
    API.registerObjectDrawer('mtn_exit', (o,ctx)=>{
      // portão de madeira nevado "↓ descer a montanha"
      ctx.fillStyle='#6b4a26'; ctx.fillRect(o.x-16, o.y-22, 4, 22); ctx.fillRect(o.x+12, o.y-22, 4, 22);
      ctx.fillStyle='#8a5f30'; ctx.fillRect(o.x-18, o.y-26, 36, 6);
      ctx.fillStyle='rgba(248,252,255,.95)'; ctx.fillRect(o.x-18, o.y-29, 36, 4);   // neve na trave
      ctx.fillStyle='#2f5c3a';
      // seta para baixo (voltar)
      ctx.fillRect(o.x-2, o.y-19, 4, 9); ctx.fillRect(o.x-6, o.y-12, 12, 3);
      ctx.beginPath(); ctx.moveTo(o.x-6,o.y-11); ctx.lineTo(o.x,o.y-5); ctx.lineTo(o.x+6,o.y-11); ctx.closePath(); ctx.fill();
    });
    // marco de acesso no mapa principal (topo) — pequeno pico nevado
    API.registerObjectDrawer('mtn_trailhead', (o,ctx)=>{
      ctx.fillStyle='rgba(40,60,90,.18)'; ctx.fillRect(o.x-12, o.y+2, 24, 3);
      ctx.fillStyle='#7a808e'; ctx.beginPath(); ctx.moveTo(o.x-13,o.y+2); ctx.lineTo(o.x-3,o.y-14); ctx.lineTo(o.x+5,o.y+2); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#6a707c'; ctx.beginPath(); ctx.moveTo(o.x-2,o.y+2); ctx.lineTo(o.x+7,o.y-10); ctx.lineTo(o.x+13,o.y+2); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#f2f7ff'; ctx.beginPath(); ctx.moveTo(o.x-3,o.y-14); ctx.lineTo(o.x-6,o.y-8); ctx.lineTo(o.x,o.y-8); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#eaf1fb'; ctx.beginPath(); ctx.moveTo(o.x+7,o.y-10); ctx.lineTo(o.x+4,o.y-5); ctx.lineTo(o.x+10,o.y-5); ctx.closePath(); ctx.fill();
      // plaquinha
      ctx.fillStyle='#8a5f30'; ctx.fillRect(o.x-14, o.y+3, 28, 8);
      ctx.fillStyle='#fff2cc'; ctx.font='8px monospace'; ctx.textAlign='center'; ctx.fillText('❄ Montanha', o.x, o.y+9); ctx.textAlign='left';
    });

    /* ============ INTERAÇÕES ============ */
    API.registerInteraction('mtn_ice_cache', (o)=>{
      const p=API.player, count=Math.max(0, Math.floor(Number(p.inv?.ice)||0));
      if(count>=3){ API.showToast('🧊 Você já carrega 3 porções de gelo. Use uma antes de coletar mais.', 'info', 3200); return true; }
      if(!Number.isFinite(p.en) || p.en<2){ API.showToast('🧊 Coletar gelo custa 2 de energia. Descanse antes de tentar novamente.', 'info', 3200); return true; }
      // Só alteramos a mochila e a energia depois das duas verificações.
      if(!p.inv) p.inv={};
      p.inv.ice=count+1; p.en-=2;
      window.FarmStoryIntegration?.record('collect',{item:'ice',amount:1});
      API.refreshInventory();
      API.flashFx(o.x,o.y-18,'+1 gelo · −2 energia','#bfe3f2'); API.playSfx('pop');
      API.showToast('🧊 Gelo guardado ('+(count+1)+'/3). Use na mochila para ajudar a resfriar o corpo.', 'info', 3400);
      return true;
    });
    API.registerInteraction('mtn_fire', (o)=>{
      const p=API.player; p.temp=Math.min(37.4,(p.temp||37)+0.6);
      if(typeof p.en==='number') p.en=Math.min(100,p.en+4);
      API.flashFx(o.x,o.y-18,'🔥 aquecendo','#ffcf87'); API.playSfx('pop');
    });
    API.registerInteraction('mtn_cabin', (o)=>{
      API.showToast('🏚️ Abrigo aquecido: longe do vento, a perda de calor cai. No corpo, a hipoderme (tecido adiposo) isola termicamente e a gordura marrom gera calor sem tremor (UCP1).', 'info', 4600);
      const p=API.player; p.temp=Math.min(37.2,(p.temp||37)+0.35);
    });

    /* ============ ZONA TÉRMICA (frio forte) ============ */
    API.registerThermalZone('mountain', ()=>{
      let d=-0.05, thermalCause='frio da montanha';
      if(API.nearObj(['mtn_fire'],46)){ d=0.022; thermalCause='calor da fogueira'; }
      else if(API.nearObj(['mtn_cabin'],46)){ d=-0.008; thermalCause='frio residual na cabana'; }
      return { tempDelta:d, hydDelta:0, sweatBoost:0, label:'montanha_frio', thermalCause };
    });

    /* ============ ACESSO (trilha no main + gatilhos) ============ */
    API.addObjectToMain({ type:'mtn_trailhead', x:16*TS+8, y:2*TS+8 });
    let lastExitAt=0;
    API.registerSceneTrigger((scene)=>{
      if(scene==='main'){
        if(performance.now()-lastExitAt<900) return false;
        if(API.nearObj(['mtn_trailhead'],20)){ API.setSceneTo('mountain'); return true; }
      } else if(scene==='mountain'){
        const e=API.nearObj(['mtn_exit'],20);
        if(e && API.player.y > (API.scenes.mountain.MH-1)*TS-4){ lastExitAt=performance.now(); API.setSceneTo('main', e._dest.x, e._dest.y); return true; }
      }
      return false;
    });

    /* ============ QUIZZES ============ */
    API.addMission({ id:'mtn_vasoconstricao', title:'Missão Histológica', subtitle:'Explique o que aconteceu',
      question:'Na montanha, sua pele ficou mais pálida e fria. Qual resposta da pele CONSERVA calor no frio?',
      options:['Vasoconstrição dos vasos sanguíneos dérmicos','Vasodilatação cutânea','Aumento da sudorese','Eritema (pele avermelhada)'],
      correctIndex:0,
      explanationCorrect:'A vasoconstrição contrai os vasos da derme, reduz o fluxo de sangue na superfície e diminui a perda de calor — por isso a pele fica pálida e fria.',
      explanationWrong:'A resposta certa é a vasoconstrição: os vasos dérmicos se contraem, menos sangue quente chega à pele e o corpo conserva calor.',
      concept:'Vasoconstrição cutânea no frio', category:'vasos', difficulty:'basico',
      trigger:()=> API.currentScene==='mountain' && API.player.temp < 36.6, completed:false });
    API.addMission({ id:'mtn_tremor', title:'Missão Histológica', subtitle:'Explique o que aconteceu',
      question:'Com o frio, o corpo começou a tremer. Para que serve o tremor (calafrio)?',
      options:['Contrações musculares rápidas que GERAM calor (termogênese)','Eliminar água pela pele','Resfriar o sangue','Produzir melanina'],
      correctIndex:0,
      explanationCorrect:'O tremor é a termogênese por contrações musculares involuntárias e rápidas: o músculo gera calor para reaquecer o corpo.',
      explanationWrong:'O tremor é termogênese: contrações musculares rápidas produzem calor para combater o frio.',
      concept:'Termogênese por tremor (calafrios)', category:'integracao', difficulty:'intermediario',
      trigger:()=> API.currentScene==='mountain' && API.player.temp < 36.2, completed:false });
    API.addMission({ id:'mtn_hipotermia', title:'Missão Histológica', subtitle:'Explique o que aconteceu',
      question:'Na exposição prolongada ao frio extremo, o que caracteriza a hipotermia grave?',
      options:['Queda acentuada da temperatura central, com metabolismo e enzimas mais lentos','Aumento da sudorese e desidratação','Excesso de melanina na epiderme','Vasodilatação intensa e eritema'],
      correctIndex:0,
      explanationCorrect:'Na hipotermia a temperatura central cai muito; as reações enzimáticas e o metabolismo desaceleram, podendo causar confusão mental e arritmias.',
      explanationWrong:'A hipotermia grave é a queda acentuada da temperatura central: metabolismo e enzimas ficam mais lentos, com risco de arritmia e confusão.',
      concept:'Hipotermia', category:'integracao', difficulty:'avancado',
      trigger:()=> API.currentScene==='mountain' && API.player.temp < 35.8, completed:false });
  });
})();
