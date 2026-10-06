/* ============================================================
   Fatia D — Bioma DESERTO ÁRIDO  (v2, refeito)
   Cena grande (preenche a tela) de calor extremo e seco:
   vasodilatação, sudorese écrina e sua dependência da hidratação,
   e hipertermia. Registrado via FarmBiomes (ver BIOME_API.md).
   ============================================================ */
(function(){
  (window.__farmBiomes = window.__farmBiomes || []).push(function(API){
    const T = API.T, TS = API.TS;
    const W = 48, H = 34;

    // ---------- Mapa ----------
    const map = API.makeBlankMap(W, H, T.SAND);
    // faixas de dunas
    API.paintRect(map, 0, 0, W, 2, T.DUNE);
    for(let x=0;x<W;x++){ if((x*5)%3===0) map[2][x]=T.DUNE; }
    API.paintRect(map, 5, 6, 8, 2, T.DUNE);
    API.paintRect(map, 30, 5, 9, 2, T.DUNE);
    API.paintRect(map, 20, 26, 10, 2, T.DUNE);
    // solo rachado
    API.paintRect(map, 6, 13, 6, 4, T.CRACKED);
    API.paintRect(map, 36, 18, 6, 4, T.CRACKED);
    API.paintRect(map, 8, 24, 5, 3, T.CRACKED);
    // oásis (água) — elipse no centro-leste
    for(let y=13;y<22;y++) for(let x=27;x<40;x++){
      const dx=(x-33)/6, dy=(y-17)/3.6;
      if(dx*dx+dy*dy < 1) map[y][x]=T.OASIS;
    }

    // ---------- Objetos ----------
    const O=[]; const add=(o)=>O.push(o);
    // Cactos variados espalhados
    const cacti = [
      [5,10,'saguaro'],[10,20,'barrel'],[16,8,'saguaro'],[8,29,'prickly'],[14,25,'barrel'],
      [43,10,'saguaro'],[45,22,'prickly'],[40,28,'barrel'],[19,30,'saguaro'],[3,17,'prickly'],
      [22,6,'barrel'],[35,30,'saguaro'],[24,22,'prickly']
    ];
    cacti.forEach(([tx,ty,k])=> add({type:'des_cactus', x:tx*TS+8, y:ty*TS+15, kind:k}));
    // formações de rocha / mesa
    [[12,5],[38,12],[6,20],[30,24],[44,6]].forEach(([tx,ty])=> add({type:'des_mesa', x:tx*TS+8, y:ty*TS+14}));
    // ossada
    add({type:'des_bones', x:18*TS+8, y:11*TS+12});
    add({type:'des_bones', x:33*TS+8, y:28*TS+12});
    // palmeiras no oásis
    add({type:'des_palm', x:27*TS+8, y:14*TS+18});
    add({type:'des_palm', x:37*TS+8, y:19*TS+18});
    // Areia caminhável na margem sul do oásis, sem exigir entrar na água.
    add({type:'des_oasis_fillpoint', x:33*TS+8, y:21*TS+14, interactionHint:'coletar água do oásis'});
    // placa de saída (visual)
    add({type:'des_exit', x:23*TS+8, y:(H-1)*TS+8, exit:true, _dest:{scene:'main', x:40*TS+8, y:26*TS+8}});

    API.registerScene({
      name:'desert', MW:W, MH:H, map, objects:O, crops:{}, indoor:false,
      spawn:{ x:23*TS+8, y:(H-3)*TS },
      onEnterMsg:'🏜️ Deserto árido: no calor extremo a pele faz vasodilatação e sua para perder calor — mas o suor exige água. Refresque-se no oásis!'
    });

    /* ================= TILES ================= */
    API.registerTileDrawer(T.SAND, (g,px,py,x,y)=>{
      g.fillStyle = ((x+y)&1) ? '#e7cd93' : '#e0c283'; g.fillRect(px,py,TS,TS);
      // variação ampla de tom (baixa freq)
      const v = Math.sin(x*0.38 + y*0.24) + Math.cos(x*0.21 - y*0.31);
      if(v > 1.0){ g.fillStyle='rgba(245,224,170,.5)'; g.fillRect(px,py,TS,TS); }
      else if(v < -1.0){ g.fillStyle='rgba(198,158,98,.35)'; g.fillRect(px,py,TS,TS); }
      // ondulações de areia (linhas onduladas determinísticas)
      const s=(x*13+y*7)%100;
      g.fillStyle='#cda863';
      if(s<40){ g.fillRect(px+1,py+6,7,1); g.fillRect(px+3,py+7,6,1); }
      if(s>60){ g.fillRect(px+7,py+12,7,1); g.fillRect(px+8,py+13,5,1); }
      // grão claro + pedrinha ocasional
      g.fillStyle='#f2dfa8'; g.fillRect(px+(x*7)%14, py+(y*5)%14, 1,1);
      if(s%17===0){ g.fillStyle='#a98545'; g.fillRect(px+(x*3)%13, py+(y*3)%13, 2,1); }
    });
    API.registerTileDrawer(T.DUNE, (g,px,py,x,y)=>{
      g.fillStyle='#e3c384'; g.fillRect(px,py,TS,TS);
      g.fillStyle='#c69f56'; g.fillRect(px,py+8,TS,8);           // sombra da duna
      g.fillStyle='#f3ddaa'; g.fillRect(px,py+6,TS,2);           // crista
      g.fillStyle='#b58a4c'; if((x+y)&1) g.fillRect(px+2,py+12,7,1); else g.fillRect(px+5,py+13,6,1);
      g.fillStyle='#fbeac2'; g.fillRect(px+(x*5)%12,py+6,2,1);
    });
    API.registerTileDrawer(T.CRACKED, (g,px,py,x,y)=>{
      g.fillStyle='#cbb383'; g.fillRect(px,py,TS,TS);
      g.fillStyle='#9c8158';
      const s=(x*11+y*5)%100;
      if(s<50){ g.fillRect(px+3,py+1,1,9); g.fillRect(px+3,py+6,7,1); g.fillRect(px+9,py+6,1,7); g.fillRect(px+3,py+11,5,1); }
      else { g.fillRect(px+9,py+1,1,8); g.fillRect(px+2,py+8,8,1); g.fillRect(px+5,py+8,1,6); g.fillRect(px+9,py+9,4,1); }
      g.fillStyle='#e0ca9a'; g.fillRect(px+1,py+1,2,1);
    });
    API.registerTileDrawer(T.OASIS, (g,px,py,x,y)=>{
      // água do oásis: gradiente + reflexos
      g.fillStyle='#2f9fd8'; g.fillRect(px,py,TS,TS);
      g.fillStyle='#1c7db5'; g.fillRect(px,py+9,TS,7);
      g.fillStyle='#57bde8'; g.fillRect(px,py,TS,3);
      const s=(x*7+y*11)%100;
      g.fillStyle='#a9e2f6'; if(s<50) g.fillRect(px+3,py+4,6,1); else g.fillRect(px+6,py+7,5,1);
      g.fillStyle='rgba(255,255,255,.75)'; g.fillRect(px+(x*5)%12,py+2,2,1);
    });

    /* ================= OBJETOS ================= */
    API.registerObjectDrawer('des_cactus', (o,ctx)=>{
      ctx.fillStyle='rgba(120,90,40,.18)'; ctx.fillRect(o.x-8, o.y+1, 16, 3);   // sombra
      const k=o.kind;
      if(k==='saguaro'){
        const H2=30;
        ctx.fillStyle='#3f7d4a'; ctx.fillRect(o.x-4, o.y-H2, 8, H2);            // corpo
        ctx.fillStyle='#356b3f'; ctx.fillRect(o.x-4, o.y-H2, 3, H2);            // sombra
        ctx.fillStyle='#4c9057'; ctx.fillRect(o.x+1, o.y-H2, 2, H2);           // luz
        ctx.fillStyle='#3f7d4a';                                               // braços
        ctx.fillRect(o.x-11, o.y-H2+9, 7, 4); ctx.fillRect(o.x-11, o.y-H2+4, 4, 9);
        ctx.fillRect(o.x+4, o.y-H2+14, 7, 4); ctx.fillRect(o.x+7, o.y-H2+6, 4, 12);
        ctx.fillStyle='#dff0c0'; for(let i=3;i<H2;i+=4){ ctx.fillRect(o.x-1,o.y-H2+i,1,1); ctx.fillRect(o.x-3,o.y-H2+i+1,1,1);}
        ctx.fillStyle='#f4a5c0'; ctx.fillRect(o.x-1, o.y-H2-3, 3, 3);          // flor
      } else if(k==='barrel'){
        ctx.fillStyle='#3f7d4a'; ctx.fillRect(o.x-7, o.y-13, 14, 13);
        ctx.fillStyle='#356b3f'; ctx.fillRect(o.x-7, o.y-13, 4, 13);
        ctx.fillStyle='#4c9057'; ctx.fillRect(o.x+3, o.y-13, 3, 13);
        ctx.fillStyle='#2e5e37'; for(let i=-5;i<7;i+=3) ctx.fillRect(o.x+i, o.y-13, 1, 13); // gomos
        ctx.fillStyle='#dff0c0'; for(let i=-5;i<7;i+=3) ctx.fillRect(o.x+i, o.y-10, 1, 1);
        ctx.fillStyle='#f6c945'; ctx.fillRect(o.x-2, o.y-16, 4, 3);            // flor amarela
      } else { // prickly pear (raquetes)
        ctx.fillStyle='#3f7d4a'; ctx.fillRect(o.x-3, o.y-8, 6, 8);            // base
        ctx.fillStyle='#4c9057'; ctx.fillRect(o.x-9, o.y-16, 9, 9);          // raquete esq
        ctx.fillStyle='#3f7d4a'; ctx.fillRect(o.x+1, o.y-19, 9, 10);         // raquete dir
        ctx.fillStyle='#356b3f'; ctx.fillRect(o.x-9, o.y-16, 3, 9);
        ctx.fillStyle='#dff0c0'; ctx.fillRect(o.x-6,o.y-13,1,1); ctx.fillRect(o.x+4,o.y-15,1,1); ctx.fillRect(o.x-3,o.y-10,1,1);
        ctx.fillStyle='#e0402a'; ctx.fillRect(o.x+5, o.y-20, 2, 2); ctx.fillRect(o.x-7, o.y-17, 2, 2); // frutos (tunas)
      }
    });
    API.registerObjectDrawer('des_mesa', (o,ctx)=>{
      ctx.fillStyle='rgba(120,90,40,.18)'; ctx.fillRect(o.x-13, o.y+1, 26, 3);
      // rocha estratificada avermelhada
      ctx.fillStyle='#b5713e'; ctx.fillRect(o.x-13, o.y-16, 26, 17);
      ctx.fillStyle='#9c5c30'; ctx.fillRect(o.x-13, o.y-6, 26, 3);
      ctx.fillStyle='#c98a55'; ctx.fillRect(o.x-13, o.y-12, 26, 2);
      ctx.fillStyle='#a5642f'; ctx.fillRect(o.x-13, o.y-1, 26, 2);
      ctx.fillStyle='#caa06a'; ctx.fillRect(o.x-11, o.y-15, 8, 2);           // topo iluminado
      ctx.fillStyle='#7c4a26'; ctx.fillRect(o.x-2, o.y-16, 2, 17);           // fenda
    });
    API.registerObjectDrawer('des_bones', (o,ctx)=>{
      ctx.fillStyle='rgba(120,90,40,.15)'; ctx.fillRect(o.x-9, o.y+1, 18, 2);
      ctx.fillStyle='#efe6cf';
      ctx.fillRect(o.x-8, o.y-2, 16, 2);                                     // coluna
      for(let i=-7;i<=7;i+=3) ctx.fillRect(o.x+i, o.y-5, 1, 6);              // costelas
      // crânio de boi com chifres
      ctx.fillRect(o.x-11, o.y-6, 6, 6);
      ctx.fillStyle='#d8c8a4'; ctx.fillRect(o.x-13, o.y-7, 3, 1); ctx.fillRect(o.x-6, o.y-7, 3, 1); // chifres
      ctx.fillStyle='#b8a684'; ctx.fillRect(o.x-10, o.y-4, 1, 1); ctx.fillRect(o.x-8, o.y-4, 1, 1); // órbitas
    });
    API.registerObjectDrawer('des_palm', (o,ctx)=>{
      ctx.fillStyle='rgba(20,90,110,.2)'; ctx.fillRect(o.x-6, o.y+1, 12, 3);
      ctx.fillStyle='#7a5a34'; ctx.fillRect(o.x-2, o.y-26, 4, 26);           // tronco curvo
      ctx.fillStyle='#6a4d2c'; ctx.fillRect(o.x-2, o.y-26, 2, 26);
      for(let i=0;i<26;i+=4){ ctx.fillStyle='#8a6a3c'; ctx.fillRect(o.x-2, o.y-26+i, 4, 1); } // anéis
      // folhas (frondes) irradiando
      ctx.fillStyle='#2f8a44';
      ctx.fillRect(o.x-16, o.y-27, 14, 3); ctx.fillRect(o.x+2, o.y-27, 14, 3);
      ctx.fillRect(o.x-13, o.y-31, 11, 3);  ctx.fillRect(o.x+2, o.y-31, 11, 3);
      ctx.fillStyle='#3fa055';
      ctx.fillRect(o.x-6, o.y-34, 12, 3);
      ctx.fillRect(o.x-15, o.y-24, 12, 2); ctx.fillRect(o.x+3, o.y-24, 12, 2);
      ctx.fillStyle='#7a4a20'; ctx.fillRect(o.x-3, o.y-27, 3, 2); ctx.fillRect(o.x+1, o.y-26, 2, 2); // cocos
    });
    API.registerObjectDrawer('des_oasis_fillpoint', (o,ctx)=>{
      // Base de pedra e recipiente de barro azulado — pixel art própria.
      ctx.fillStyle='rgba(120,90,40,.18)'; ctx.fillRect(o.x-11, o.y+1, 22, 3);
      ctx.fillStyle='#9c8158'; ctx.fillRect(o.x-11, o.y-3, 22, 4);
      ctx.fillStyle='#e0ca9a'; ctx.fillRect(o.x-10, o.y-4, 20, 2);
      ctx.fillStyle='#305b72'; ctx.fillRect(o.x-5, o.y-15, 10, 12); ctx.fillRect(o.x-7, o.y-12, 14, 7);
      ctx.fillStyle='#4fa8d8'; ctx.fillRect(o.x-4, o.y-14, 8, 10); ctx.fillRect(o.x-6, o.y-11, 12, 5);
      ctx.fillStyle='#a9e2f6'; ctx.fillRect(o.x-4, o.y-14, 8, 2); ctx.fillRect(o.x-4, o.y-11, 2, 5);
      ctx.fillStyle='#1c7db5'; ctx.fillRect(o.x+2, o.y-11, 3, 6);
      ctx.fillStyle='#7a5a34'; ctx.fillRect(o.x-3, o.y-18, 6, 3);
      ctx.fillStyle='#c9a672'; ctx.fillRect(o.x-3, o.y-18, 6, 1);
      // Gotinha sobre a placa, legível mesmo no terreno claro.
      ctx.fillStyle='#305b72'; ctx.fillRect(o.x+10, o.y-18, 2, 15);
      ctx.fillStyle='#2f9fd8'; ctx.fillRect(o.x+7, o.y-19, 8, 4); ctx.fillRect(o.x+9, o.y-22, 4, 3);
      ctx.fillStyle='#a9e2f6'; ctx.fillRect(o.x+9, o.y-19, 2, 2);
    });
    API.registerObjectDrawer('des_exit', (o,ctx)=>{
      // placa de madeira desbotada com seta ↓
      ctx.fillStyle='#8a5f30'; ctx.fillRect(o.x-2, o.y-16, 4, 16);
      ctx.fillStyle='#a9834a'; ctx.fillRect(o.x-17, o.y-26, 34, 11);
      ctx.fillStyle='#c9a672'; ctx.fillRect(o.x-17, o.y-26, 34, 2);
      ctx.fillStyle='#7c5a34';
      ctx.fillRect(o.x-2, o.y-24, 4, 6); ctx.fillRect(o.x-6, o.y-19, 12, 3);
      ctx.beginPath(); ctx.moveTo(o.x-6,o.y-18); ctx.lineTo(o.x,o.y-13); ctx.lineTo(o.x+6,o.y-18); ctx.closePath(); ctx.fill();
    });
    // marco de acesso no mapa principal (sul)
    API.registerObjectDrawer('des_trailhead', (o,ctx)=>{
      ctx.fillStyle='rgba(120,90,40,.18)'; ctx.fillRect(o.x-12, o.y+3, 24, 3);
      ctx.fillStyle='#e3c384'; ctx.fillRect(o.x-13, o.y-4, 26, 8);          // monte de areia
      ctx.fillStyle='#c69f56'; ctx.fillRect(o.x-13, o.y+2, 26, 2);
      ctx.fillStyle='#3f7d4a'; ctx.fillRect(o.x+4, o.y-16, 5, 12);          // cactinho
      ctx.fillRect(o.x+1, o.y-11, 3, 2); ctx.fillRect(o.x+9, o.y-13, 3, 2);
      ctx.fillStyle='#8a5f30'; ctx.fillRect(o.x-14, o.y+4, 28, 8);          // placa
      ctx.fillStyle='#fff2cc'; ctx.font='8px monospace'; ctx.textAlign='center'; ctx.fillText('☀ Deserto', o.x, o.y+10); ctx.textAlign='left';
    });

    /* ============ INTERAÇÕES ============ */
    API.registerInteraction('des_oasis_fillpoint', (o)=>{
      const p=API.player, count=Math.max(0, Math.floor(Number(p.inv?.oasisWater)||0));
      if(count>=3){ API.showToast('💧 Você já carrega 3 porções de água do oásis. Use uma antes de coletar mais.', 'info', 3200); return true; }
      if(!Number.isFinite(p.en) || p.en<2){ API.showToast('💧 Coletar água do oásis custa 2 de energia. Descanse antes de tentar novamente.', 'info', 3200); return true; }
      if(!p.inv) p.inv={};
      p.inv.oasisWater=count+1; p.en-=2;
      window.FarmStoryIntegration?.record('collect',{item:'oasisWater',amount:1});
      API.refreshInventory();
      API.flashFx(o.x,o.y-20,'+1 água do oásis · −2 energia','#a9e2f6'); API.playSfx('splash');
      API.showToast('💧 Água do oásis guardada ('+(count+1)+'/3). Use na mochila para recuperar a hidratação.', 'info', 3400);
      return true;
    });
    API.registerInteraction('des_palm', (o)=>{
      API.showToast('🌴 Sombra da palmeira: menos radiação solar direta reduz o ganho de calor pela pele.', 'info', 3400);
      const p=API.player; p.temp=Math.max(37.0,(p.temp||37)-0.2);
    });

    /* ============ ZONA TÉRMICA (calor forte + desidratação) ============ */
    API.registerThermalZone('desert', ()=>{
      let d=0.05, hyd=-0.6, sweat=1.4, thermalCause='calor do deserto';
      if(API.nearObj(['des_palm'],36)){ d=0.006; thermalCause='calor residual sob a palmeira'; }
      const p=API.player, tx=Math.floor(p.x/TS), ty=Math.floor(p.y/TS);
      let nearWater=false;
      for(let j=-1;j<=1 && !nearWater;j++) for(let i=-1;i<=1;i++){ if(API.tileAt(tx+i,ty+j)===T.OASIS){ nearWater=true; break; } }
      if(nearWater){ d=-0.02; hyd=0.5; sweat=0; thermalCause='água do oásis'; }
      return { tempDelta:d, hydDelta:hyd, sweatBoost:sweat, label:'deserto_calor', thermalCause };
    });

    /* ============ ACESSO (trilha no main + gatilhos) ============ */
    API.addObjectToMain({ type:'des_trailhead', x:40*TS+8, y:29*TS+8 });
    let lastExitAt=0;
    API.registerSceneTrigger((scene)=>{
      if(scene==='main'){
        if(performance.now()-lastExitAt<900) return false;
        if(API.nearObj(['des_trailhead'],20)){ API.setSceneTo('desert'); return true; }
      } else if(scene==='desert'){
        const e=API.nearObj(['des_exit'],20);
        if(e && API.player.y > (API.scenes.desert.MH-1)*TS-4){ lastExitAt=performance.now(); API.setSceneTo('main', e._dest.x, e._dest.y); return true; }
      }
      return false;
    });

    /* ============ QUIZZES ============ */
    API.addMission({ id:'des_vasodilatacao', title:'Missão Histológica', subtitle:'Explique o que aconteceu',
      question:'No calor do deserto sua pele ficou avermelhada e quente. Qual resposta LIBERA calor pela pele?',
      options:['Vasodilatação dos vasos dérmicos','Vasoconstrição cutânea','Piloereção (arrepio)','Redução da sudorese'],
      correctIndex:0,
      explanationCorrect:'A vasodilatação aumenta o fluxo de sangue na pele, trazendo calor do interior para a superfície, onde ele é liberado (por isso a pele fica avermelhada — eritema).',
      explanationWrong:'A resposta certa é a vasodilatação: os vasos se dilatam, mais sangue quente chega à pele e o calor é transferido ao ambiente.',
      concept:'Vasodilatação cutânea no calor', category:'vasos', difficulty:'basico',
      trigger:()=> API.currentScene==='desert' && API.player.temp > 38.0, completed:false });
    API.addMission({ id:'des_sudorese', title:'Missão Histológica', subtitle:'Explique o que aconteceu',
      question:'Você começou a suar muito no deserto. Qual estrutura produz o suor que resfria o corpo ao evaporar?',
      options:['Glândula sudorípara écrina','Glândula sebácea','Melanócito','Músculo eretor do pelo'],
      correctIndex:0,
      explanationCorrect:'As glândulas sudoríparas écrinas, na derme, secretam suor que sobe pelos ductos até os poros; ao evaporar, o suor remove calor.',
      explanationWrong:'É a glândula sudorípara écrina: ela produz o suor, e a evaporação na pele remove calor do corpo.',
      concept:'Glândulas sudoríparas écrinas e evaporação', category:'glandulas', difficulty:'intermediario',
      trigger:()=> API.currentScene==='desert' && API.player.temp > 38.4, completed:false });
    API.addMission({ id:'des_desidratacao', title:'Missão Histológica', subtitle:'Explique o que aconteceu',
      question:'Sua hidratação caiu e a sudorese ficou menos eficiente. Por que a desidratação atrapalha o resfriamento?',
      options:['O suor depende da água corporal; com pouca água, a sudorese diminui','Porque a epiderme deixa de existir','Porque os ossos passam a esquentar','Porque os melanócitos produzem suor'],
      correctIndex:0,
      explanationCorrect:'A produção de suor consome água. Desidratado, o corpo reduz a sudorese para poupar água e o resfriamento por evaporação piora — risco de hipertermia.',
      explanationWrong:'O suor depende da água do corpo: desidratado, a sudorese diminui e o resfriamento por evaporação fica pior.',
      concept:'Hidratação e eficiência da sudorese', category:'glandulas', difficulty:'avancado',
      trigger:()=> API.currentScene==='desert' && API.player.hyd < 40, completed:false });
  });
})();
