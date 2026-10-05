/* Ponte pequena entre mundo, narrativa e UI. A fonte principal chama os hooks. */
(function(){
  'use strict';
  let active=false, restoring=false, pendingSave=false, dialogueSoundNpc='';
  let cinematicReady=false,lastStory=null,lastSaga=null;
  const cinematicQueue=[];
  const chapterScenes={1:'horta',2:'rio',3:'abrigo',4:'oasis'};
  const actors=[];
  const homes={};
  let navigation=null,navVersion='',community={x:608,y:1260};
  const routines={
    rosa:[{dx:0,dy:0,activity:'sort',label:'Separando sementes',line:'Estou separando as sementes miúdas. Se deixo todas juntas, Nico planta a caixa inteira.'},
      {dx:-16,dy:-24,activity:'rest',label:'Pausa perto de casa',line:'A manhã rendeu. Agora a sombra e uma conversa me fazem companhia.'},
      {dx:32,dy:16,activity:'sort',label:'Organizando caixas',line:'Estas caixas vão para a próxima estação. Estou deixando espaço para o que você trouxer.'},
      {dx:0,dy:0,activity:'rest',label:'Guardando o caderno',line:'Deixei só uma caixa para amanhã. O resto da noite é para descansar os olhos.'}],
    lia:[{dx:0,dy:0,activity:'observe',label:'Anotando observações',line:'Estou desenhando o que vi hoje. Desenhar me faz olhar de novo.'},
      {dx:-32,dy:32,activity:'observe',label:'Comparando anotações',line:'Trouxe o caderno para um lugar mais tranquilo. Tem uma pergunta que ainda não fechei.'},
      {dx:-32,dy:64,activity:'observe',label:'Observando a horta',line:'Vim conferir o que mudou na horta desde cedo. Nico me pediu para olhar esta parte.'},
      {dx:0,dy:16,activity:'rest',label:'Fechando o caderno',line:'Já guardei os desenhos. As perguntas ficaram abertas para amanhã.'}],
    tomas:[{dx:0,dy:0,activity:'work',label:'Conferindo a madeira',line:'Esta tábua ainda serve. Basta virar e tirar a parte que soltou.'},
      {dx:32,dy:0,activity:'work',label:'Preparando ferramentas',line:'Estou amolando e conferindo as ferramentas. Ferramenta cuidada economiza esforço.'},
      {dx:-32,dy:16,activity:'work',label:'Ajustando uma caixa',line:'Escute este rangido. É a caixa avisando onde falta apertar.'},
      {dx:0,dy:16,activity:'rest',label:'Guardando ferramentas',line:'Por hoje, serrote guardado. Amanhã começo pelo encaixe que ficou faltando.'}],
    ines:[{dx:0,dy:0,activity:'route',label:'Conferindo a trilha',line:'Estou comparando a trilha com minhas marcas no mapa. O vento muda as aparências.'},
      {dx:-64,dy:16,activity:'rest',label:'Pausa junto ao acampamento',line:'Aqui eu espero um pouco antes da próxima ronda. Dá para ouvir passos chegando.'},
      {dx:-48,dy:64,activity:'route',label:'Ronda pela montanha',line:'Vou até a curva e volto. Gosto de conferir o próximo apoio antes de indicar o caminho.'},
      {dx:-32,dy:16,activity:'rest',label:'Perto do abrigo',line:'Fico mais perto do abrigo a esta hora. A trilha pode esperar até amanhã.'}],
    caio:[{dx:0,dy:0,activity:'water',label:'Cuidando das reservas',line:'Estou conferindo os recipientes. Um vazamento pequeno dá uma viagem extra.'},
      {dx:16,dy:16,activity:'rest',label:'Pausa na margem',line:'Deixei o trabalho mais pesado para depois. Agora é uma boa hora para conversar.'},
      {dx:-64,dy:16,activity:'water',label:'Organizando a margem',line:'Vim conferir a margem e separar as reservas da próxima ida à fazenda.'},
      {dx:0,dy:0,activity:'rest',label:'Contando as caixas',line:'Mais uma caixa pronta. À noite a areia parece outro lugar, não parece?'}],
    nico:[{dx:0,dy:0,activity:'plant',label:'Separando o plantio',line:'Hoje estou separando as sementes antes de plantar. Ontem tive que descobrir depois.'},
      {dx:-32,dy:16,activity:'observe',label:'Desenhando uma ideia',line:'O desenho tem uma seta demais. Ou talvez duas. Você entendeu para onde ela aponta?'},
      {dx:-32,dy:48,activity:'plant',label:'Conferindo a horta',line:'Estou olhando as plantas sem puxar nenhuma. Rosa disse que essa parte é importante.'},
      {dx:-16,dy:0,activity:'rest',label:'Guardando o caderno',line:'Já guardei quase tudo. Só falta escrever esta ideia para não esquecer amanhã.'}]
  };
  const activityLines={};
  const worldPosition=()=>currentScene==='main'?player:(scenes.main._lastPlayer||player);
  const read=()=>({season:currentSeason,timeOfDay,region:currentRegion(),scene:currentScene,
    playerName:player.name,name:player.name,gender:player.gender,x:worldPosition().x,y:worldPosition().y,
    worldWidth:scenes.main.MW*TS,worldHeight:scenes.main.MH*TS,npcs:actors,
    inventory:player.inv,coatEquipped:player.coatEquipped,energy:player.en,resting:player.resting===true,
    activities:activityLines,community:{...community}});
  const expandedRead=()=>({...read(),player,coins:player.coins,active:gameStarted,paused:isPaused||skinOpen||histologyMissionOpen||cutsceneActive||isOpen(),story:window.FarmStoryWorld?.snapshot?.(),saga:window.FarmValleySaga?.snapshot?.()});
  const farmRead=()=>({...read(),player,objects:scenes.main.objects,mainCrops:currentScene==='main'?crops:scenes.main.crops,active:gameStarted,paused:isPaused||skinOpen||histologyMissionOpen||cutsceneActive||isOpen()});
  function canOpenReading(){return gameStarted&&!player.dead&&!cutsceneActive&&!window.FarmStoryCinematics?.isOpen?.()&&!histologyMissionOpen&&!tutorialActive
    &&!(typeof _pendingTutorialAfterCutscene!=='undefined'&&_pendingTutorialAfterCutscene)&&!document.getElementById('tutorialOverlay')?.classList.contains('show');}
  function safePoint(x,y){
    const main=scenes.main;const tx=Math.floor(x/TS),ty=Math.floor(y/TS),t=main.map[ty]?.[tx];
    if(t===undefined||[T.WATER,T.RIVER,T.OASIS,T.FENCE].includes(t))return false;
    if(window.FarmWorldDepth?.isBlocked?.(x,y))return false;
    for(const o of main.objects){
      if(['house','barn','gh_frame'].includes(o.type)&&x>o.x-8&&x<o.x+(o.w||0)+8&&y>o.y-4&&y<o.y+(o.h||0)+10)return false;
      if(o.type==='mtn_cabin'&&x>o.x-24&&x<o.x+24&&y>o.y-12&&y<o.y+10)return false;
      if(['door_house','door_barn','gh_path'].includes(o.type)&&Math.hypot(x-o.x,y-o.y)<25)return false;
    }
    return x>8&&y>8&&x<main.MW*TS-8&&y<main.MH*TS-8;
  }
  function place(def){
    let x=(def.tileX+.5)*TS,y=(def.tileY+.5)*TS;
    // Definições usam coordenadas do mundo; encontra chão livre perto do ponto.
    if(!safePoint(x,y)){
      let found=false;for(let r=1;r<=6&&!found;r++)for(let dy=-r;dy<=r&&!found;dy++)for(let dx=-r;dx<=r;dx++){
        if(Math.abs(dx)!==r&&Math.abs(dy)!==r)continue;
        const nx=x+dx*TS,ny=y+dy*TS;if(safePoint(nx,ny)){x=nx;y=ny;found=true;break;}
      }
    }
    const o={type:'story_npc',npcId:def.id,id:def.id,x,y,dir:0,anim:0,moving:false,gaitBlend:0,gaitRunBlend:0,_world:true,
      interactionHint:'conversar com '+def.name,_npcTime:0,npcActivity:'talk',activityPhase:0,region:def.region,_route:[],_routineKey:''};
    homes[def.id]={x,y};FarmBiomes.addObjectToMain(o);actors.push(o);
  }
  function map(g,w,h){
    const m=scenes.main.map,mw=scenes.main.MW,mh=scenes.main.MH;
    const colors={};
    [T.GRASS,T.GRASS2,T.FLOWER].forEach(t=>colors[t]='#6d8957');[T.PATH,T.WOOD].forEach(t=>colors[t]='#b49360');
    [T.WATER,T.RIVER,T.OASIS].forEach(t=>colors[t]='#3b8591');[T.SNOW,T.ICE,T.SNOWROCK].forEach(t=>colors[t]='#c9d7d3');
    [T.SAND,T.DUNE,T.CRACKED].forEach(t=>colors[t]='#c9a16b');colors[T.FIELD]='#695846';colors[T.STONE]='#6d7269';
    for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){g.fillStyle=colors[m[y]?.[x]]||'#8c9b7c';g.fillRect(x*w/mw,y*h/mh,Math.ceil(w/mw),Math.ceil(h/mh));}
  }
  function beforeOpen(){
    if(isPaused)resumeGame();
    if(shopOpen)closeShop();if(inventoryOpen)toggleInventory(false);if(journalOpen)toggleJournal(false);if(skinOpen)toggleSkinView();
    for(const k in keys)keys[k]=false;player.moving=false;player.running=false;
  }
  function scheduleSave(){
    if(gameStarted&&!restoring&&!pendingSave){
      pendingSave=true;queueMicrotask(()=>{pendingSave=false;if(gameStarted&&!restoring)saveGame(true);});
    }
  }
  function refreshNarrative(){FarmStoryUI.refresh();window.FarmValleyPanels?.refresh?.();}
  function record(type,payload={}){
    if(!active||!gameStarted||player.dead)return false;
    // Eventos novos (estudo, oficina, produção) também chegam à saga quando o legado não os usa.
    FarmStoryWorld.record(type,payload);window.FarmValleySaga?.record?.(type,payload);return true;
  }
  function reward(event){
    const coins=Math.floor(Number(event.coins)||0);if(coins<=0||coins>1000)return;
    player.coins+=coins;renderInv();if(shopOpen)renderShop();
    showToast(event.label+' · +'+coins+' moedas','success',4800);
    flashFx(player.x,player.y-24,'+'+coins+' moedas','#efd19a');window.synthSfx?.chimeOk?.();
  }
  function queueScene(id){
    if(!id||cinematicQueue.includes(id)||window.FarmStoryCinematics?.catalogue?.().find(s=>s.id===id)?.seen)return;
    cinematicQueue.push(id);
  }
  function observeStory(snapshot){
    const current={index:snapshot.chapter?.index||0,status:snapshot.chapter?.status||'available'};
    if(lastStory&&!restoring){
      if(current.index===lastStory.index&&current.status==='active'&&lastStory.status==='available')queueScene(chapterScenes[current.index]);
      if(current.index===6&&lastStory.index<6)queueScene('reabertura');
    }
    lastStory=current;
  }
  function observeSaga(snapshot){
    const act=snapshot?.act||snapshot?.episode;
    if(!act)return;
    const current={id:act.id,index:Number(act.index)||0,status:act.status,completed:!!snapshot.completed,cinematicId:act.cinematicId||'saga-'+act.id};
    // As cenas mostram consequências: entram depois da entrega, nunca antes do trabalho.
    if(lastSaga&&gameStarted&&!restoring&&current.index>lastSaga.index&&lastSaga.id&&lastSaga.index<8)
      queueScene(lastSaga.cinematicId);
    lastSaga=current;
  }
  function initializeCinematics(){
    if(cinematicReady||!window.FarmStoryCinematics)return;cinematicReady=true;
    FarmStoryCinematics.init({readState:()=>({...read(),story:FarmStoryWorld.snapshot(),saga:window.FarmValleySaga?.snapshot?.(),reducedMotion:!!A11Y.reduceMotion}),
      beforeOpen(){window.FarmValleyPanels?.close?.(false);FarmStoryUI.close();beforeOpen();},
      onClose(){document.getElementById('game')?.focus({preventScroll:true});refreshNarrative();},
      onChange(){refreshNarrative();scheduleSave();},
      drawWorld(g,view){return window.drawCinematicWorld?.(g,view)===true;}
    });
    if(window.FarmValleySaga?.cinematicScenes)FarmStoryCinematics.registerScenes?.(FarmValleySaga.cinematicScenes());
  }
  function visualUpdate(dt){
    if(!active||!gameStarted||document.hidden)return;initializeCinematics();
    FarmStoryUI.update(dt);window.FarmStoryCinematics?.update?.(dt);
    if(!cinematicQueue.length||!window.FarmStoryCinematics||FarmStoryCinematics.isOpen()||FarmStoryUI.isOpen()||window.FarmValleyPanels?.isOpen?.()||skinOpen
      ||isPaused||cutsceneActive||player.dead||histologyMissionOpen||tutorialActive
      ||(typeof _pendingTutorialAfterCutscene!=='undefined'&&_pendingTutorialAfterCutscene)
      ||document.getElementById('tutorialOverlay')?.classList.contains('show'))return;
    FarmStoryCinematics.play(cinematicQueue.shift());
  }
  function notifyNewGame(){cinematicQueue.length=0;lastStory=null;observeStory(FarmStoryWorld.snapshot());queueScene('carta');}
  function drawNPC(o,g){
    const delivery=window.FarmStoryUI?.speechState?.(o.npcId)||{};
    const pose=delivery.expression?{...o,moving:false,gaitBlend:0,npcActivity:'talk'}:o;
    window.FarmCharacterArt?.drawNPC(g,pose,{winter:isFrio(),time:performance.now(),...delivery,reducedMotion:!!A11Y.reduceMotion});
    if(!gameStarted||cutsceneActive||player.dead||currentScene!=='main')return;
    const def=FarmStoryWorld.characters.find(n=>n.id===o.npcId),near=nearObj(['story_npc'],55)===o;
    if(!near)return;
    const label=def?.name||o.npcId;
    g.save();g.font='bold 6px Georgia';g.textAlign='center';
    const width=g.measureText(label).width+8;
    const labelY=Math.min(o.y-36,player.y-37);
    g.fillStyle='#213b32';g.fillRect(Math.round(o.x-width/2),Math.round(labelY),Math.ceil(width),9);
    g.fillStyle='#f6ddaa';g.fillText(label,Math.round(o.x),Math.round(labelY+6));
    if(Math.hypot(player.x-o.x,player.y-o.y)<28){g.fillStyle='#f5e1ac';g.fillRect(Math.round(o.x-3),Math.round(labelY-11),7,8);g.fillStyle='#28432f';g.font='bold 6px monospace';g.fillText('E',Math.round(o.x+.5),Math.round(labelY-5));}
    g.restore();
  }
  function init(){
    if(active)return;active=true;
    FarmStoryUI.init({read,drawMap:map,beforeOpen(){window.FarmValleyPanels?.close?.(false);beforeOpen();},reducedMotion:()=>!!A11Y.reduceMotion,focusGame(){document.getElementById('game')?.focus({preventScroll:true});},canOpen:canOpenReading});
    FarmStoryWorld.init({readState:read,
      reward,
      onChange(snapshot){
        observeStory(snapshot);
        FarmStoryUI.refresh();
        scheduleSave();
      },
      onDialogue(d){
        if(d){window.FarmValleyPanels?.close?.(false);beforeOpen();}FarmStoryUI.showDialogue(d);
        if(!restoring&&gameStarted){
          if(d)window.synthSfx?.dialogue?.(d.npcId,dialogueSoundNpc===d.npcId?'choice':'greet');
          else if(dialogueSoundNpc)window.synthSfx?.dialogue?.(dialogueSoundNpc,'close');
        }
        dialogueSoundNpc=d?.npcId||'';
      }
    });
    window.FarmValleySaga?.init?.({readState:read,reward,
      onDialogue(d){FarmStoryWorld.presentSaga?.(d);},
      onChange(snapshot){observeSaga(snapshot);refreshNarrative();scheduleSave();}
    });
    window.FarmLife?.init?.({readState:farmRead,onChange(){refreshNarrative();scheduleSave();},onEvent:record});
    window.FarmValleyPanels?.init?.({readState:expandedRead,canOpen:()=>canOpenReading()&&!FarmStoryWorld.isOpen(),
      beforeOpen(){FarmStoryUI.close();beforeOpen();},focusGame(){document.getElementById('game')?.focus({preventScroll:true});},
      openSkin(){toggleSkinView();},
      onTransaction(result){if(result?.ok){renderInv();window.synthSfx?.chimeOk?.();}else window.synthSfx?.cancel?.();}
    });
    for(const def of FarmStoryWorld.characters)place(def);
    observeStory(FarmStoryWorld.snapshot());if(window.FarmValleySaga)observeSaga(FarmValleySaga.snapshot());initializeCinematics();
    rebuildNavigation();
    FarmBiomes.registerObjectDrawer('story_npc',drawNPC);
    FarmBiomes.registerInteraction('story_npc',o=>{if(!gameStarted||player.dead)return false;FarmStoryWorld.interact(o.npcId);return true;});
    document.getElementById('game').tabIndex=-1;
    FarmStoryUI.refresh();
  }
  function rebuildNavigation(){
    const main=scenes.main,w=main.MW,h=main.MH;navigation={w,h,walk:new Uint8Array(w*h),edges:new Int8Array(w*h*4)};navigation.edges.fill(-1);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)navigation.walk[y*w+x]=safePoint((x+.5)*TS,(y+.5)*TS)?1:0;
    navVersion=String(window.FarmWorldDepth?.navigationVersion||'base');
  }
  function nearestCell(x,y,radius=8){
    const {w,h,walk}=navigation,tx=Math.max(0,Math.min(w-1,Math.floor(x/TS))),ty=Math.max(0,Math.min(h-1,Math.floor(y/TS)));
    if(walk[ty*w+tx])return ty*w+tx;
    for(let r=1;r<=radius;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
      if(Math.abs(dx)!==r&&Math.abs(dy)!==r)continue;const xx=tx+dx,yy=ty+dy;
      if(xx>=0&&xx<w&&yy>=0&&yy<h&&walk[yy*w+xx])return yy*w+xx;
    }
    return -1;
  }
  function route(from,to){
    if(!navigation||navVersion!==String(window.FarmWorldDepth?.navigationVersion||'base'))rebuildNavigation();
    const start=nearestCell(from.x,from.y),end=nearestCell(to.x,to.y);
    if(start<0||end<0)return [];
    const {w,h,walk}=navigation,parent=new Int32Array(w*h);parent.fill(-1);parent[start]=start;
    const queue=new Int32Array(w*h);queue[0]=start;let head=0,tail=1;
    while(head<tail&&parent[end]<0){
      const cell=queue[head++],x=cell%w,y=Math.floor(cell/w);
      const steps=[x>0?cell-1:-1,x<w-1?cell+1:-1,y>0?cell-w:-1,y<h-1?cell+w:-1];
      for(let dir=0;dir<steps.length;dir++){
        const next=steps[dir];if(next<0||!walk[next]||parent[next]>=0)continue;
        const key=cell*4+dir;let clear=navigation.edges[key];
        if(clear<0){
          const x0=(x+.5)*TS,y0=(y+.5)*TS,x1=(next%w+.5)*TS,y1=(Math.floor(next/w)+.5)*TS;
          // Cercas/troncos estreitos podem estar entre dois centros livres.
          clear=1;for(let k=1;k<4;k++)if(!safePoint(x0+(x1-x0)*k/4,y0+(y1-y0)*k/4)){clear=0;break;}
          navigation.edges[key]=clear;navigation.edges[next*4+[1,0,3,2][dir]]=clear;
        }
        if(clear){parent[next]=cell;queue[tail++]=next;}
      }
    }
    if(parent[end]<0)return [];
    const result=[];for(let cell=end;cell!==start;cell=parent[cell])result.push({x:(cell%w+.5)*TS,y:(Math.floor(cell/w)+.5)*TS});
    // Alinha antes de uma curva: o NPC nunca corta um canto de água na diagonal.
    if(Math.hypot(from.x-(start%w+.5)*TS,from.y-(Math.floor(start/w)+.5)*TS)>1)result.push({x:(start%w+.5)*TS,y:(Math.floor(start/w)+.5)*TS});
    return result.reverse();
  }
  function destination(o,index,world){
    const band=timeOfDay<6||timeOfDay>=20?3:timeOfDay<11?0:timeOfDay<15?1:2;
    const normal=routines[o.npcId][band],home=homes[o.npcId];
    if(world.gathering||world.sagaGathering){
      // Lugares ao redor da praça; espaço entre corpos e frente da porta livres.
      const seats=[[-48,16],[-16,32],[16,32],[48,16],[48,48],[-48,48]],seat=seats[index];
      return {key:'gather:'+community.x+':'+community.y,x:community.x+seat[0],y:community.y+seat[1],
        activity:'talk',label:'Encontro na Casa das Sementes',line:{
          rosa:'Guardei a caixa sem etiqueta perto da porta. Um encontro também precisa de lugar para quem ainda chegar.',
          lia:'Trouxe os três desenhos e uma página em branco. Hoje quero mais vozes nas margens do caderno.',
          tomas:'Todas as cadeiras conferidas. Agora vou sentar em uma delas antes de inventar outro reparo.',
          ines:'Da curva ouvi o movimento da casa. A última parte do caminho ficou mais leve que a primeira.',
          caio:'Minha caixa está encostada na parede. Hoje vim para a conversa que não cabe dentro dela.',
          nico:'A placa ficou um pouco torta. Eu ia endireitar, mas todo mundo entrou sem problema. Posso sentar também?'}[o.npcId]};
    }
    return {key:'routine:'+band,x:home.x+normal.dx,y:home.y+normal.dy,...normal};
  }
  function update(dt){
    if(!active||!gameStarted||player.dead||document.hidden||!Number.isFinite(dt)||dt<=0||isPaused||skinOpen||histologyMissionOpen||cutsceneActive||isOpen())return;
    FarmStoryWorld.update(dt,read());window.FarmValleySaga?.update?.(dt,read());window.FarmLife?.update?.(dt);
    const sagaWorld=window.FarmValleySaga?.worldState?.(),world={...FarmStoryWorld.worldState(),sagaGathering:!!sagaWorld?.festival&&timeOfDay>=16&&timeOfDay<20};
    // Rotinas também avançam ao entrar em casa; não somem nem teleportam na volta.
    for(let i=0;i<actors.length;i++){
      const o=actors[i];o._npcTime+=dt;o.activityPhase+=dt;
      const next=destination(o,i,world);
      if(o._routineKey!==next.key){o._routineKey=next.key;o._route=route(o,next);o._retryAt=o._npcTime+12;o.activityPhase=0;}
      const near=currentScene==='main'&&Math.hypot(player.x-o.x,player.y-o.y)<40;
      if(!o._route.length&&o._npcTime>=o._retryAt&&Math.hypot(next.x-o.x,next.y-o.y)>TS){o._route=route(o,next);o._retryAt=o._npcTime+12;}
      const remaining=o._route.length;o.routineDescription=(remaining?'A caminho · ':'')+next.label;activityLines[o.npcId]=next.line;
      o.npcActivity=near?'talk':remaining?'walk':next.activity;o.moving=false;
      if(near){const dx=player.x-o.x,dy=player.y-o.y;o.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);o.gaitBlend=(o.gaitBlend||0)*Math.exp(-dt/.065);continue;}
      let distanceBudget=Math.min(.1,dt)*19;
      while(distanceBudget>0&&o._route.length){
        const target=o._route[0],dx=target.x-o.x,dy=target.y-o.y,distance=Math.hypot(dx,dy);
        if(distance<.05){o._route.shift();continue;}
        const step=Math.min(distance,distanceBudget),nx=o.x+dx/distance*step,ny=o.y+dy/distance*step;
        if(!safePoint(nx,ny)){
          o._route=[];o.npcActivity='rest';o.routineDescription='Aguardando passagem · '+next.label;
          if(o._npcTime>=o._retryAt){rebuildNavigation();o._route=route(o,next);o._retryAt=o._npcTime+12;}
          break;
        }
        o.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);o.x=nx;o.y=ny;o.anim+=step*Math.PI*2/24;o.moving=true;distanceBudget-=step;
        if(step>=distance-.001)o._route.shift();
      }
      const gaitTarget=o.moving?1:0;
      o.gaitBlend=(o.gaitBlend||0)+(gaitTarget-(o.gaitBlend||0))*(1-Math.exp(-dt/(gaitTarget ? .045 : .065)));
      o.region=o.y<42*TS?'mountain':o.y>=90*TS?'desert':'farm';
    }
  }
  function configureCommunity(point){
    if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return false;
    community={x:point.x,y:point.y};navigation=null;for(const o of actors)o._routineKey='';return true;
  }
  function reset(){if(!active)return;cinematicQueue.length=0;lastStory=null;lastSaga=null;window.FarmValleyPanels?.reset?.();FarmStoryUI.close();FarmStoryWorld.reset();for(const o of actors){Object.assign(o,homes[o.npcId],{dir:0,anim:0,moving:false,gaitBlend:0,gaitRunBlend:0,_npcTime:0,activityPhase:0,_routineKey:'',_route:[],npcActivity:'talk'});}refreshNarrative();}
  function restore(data){if(!active)return;cinematicQueue.length=0;lastStory=null;lastSaga=null;restoring=true;try{window.FarmValleyPanels?.close?.(false);FarmStoryUI.close();FarmStoryWorld.restore(data,read());if(window.FarmValleySaga)observeSaga(FarmValleySaga.snapshot());}finally{restoring=false;}for(const o of actors){Object.assign(o,homes[o.npcId],{moving:false,anim:0,gaitBlend:0,gaitRunBlend:0,_routineKey:'',_route:[],activityPhase:0});}refreshNarrative();}
  function isOpen(){return !!window.FarmStoryUI?.isOpen()||!!window.FarmStoryCinematics?.isOpen?.()||!!window.FarmValleyPanels?.isOpen?.();}
  window.FarmStoryIntegration={init,update,visualUpdate,notifyNewGame,initializeCinematics,reset,restore,read,configureCommunity,
    cinematicQueue:()=>cinematicQueue.slice(),
    navigationState(){return actors.map(o=>({npcId:o.npcId,x:o.x,y:o.y,moving:o.moving,anim:o.anim,activity:o.npcActivity,routeLength:o._route.length,routine:o.routineDescription,region:o.region}));},
    record,isOpen,queueScene,refresh:refreshNarrative};
})();
