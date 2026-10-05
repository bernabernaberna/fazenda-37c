/* Jornada do Vale: diálogos, retratos e diário local, sem dependências. */
(function(){
  'use strict';
  let adapter={}, panel=null, dialog=null, book=null, previousFocus=null;
  let bookOpen=false, lastChapter='', lastNpc='', ready=false,lastHud='';
  let speech=null,portraitClock=0;
  const cast=()=>window.FarmStoryWorld?.characters || [];
  const story=()=>window.FarmStoryWorld;
  const state=()=>adapter.read?.() || {};
  const reducedMotion=()=>!!adapter.reducedMotion?.()||document.body.classList.contains('access-reduce-motion');
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
  const button=(text,fn,cls='vale-button')=>{const n=el('button',cls,text);n.type='button';n.addEventListener('click',fn);return n;};
  function portrait(id,size=96){
    const c=el('canvas','vale-portrait');c.width=size;c.height=size;
    c.setAttribute('aria-label','Retrato de '+(cast().find(x=>x.id===id)?.name||'você'));
    window.FarmCharacterArt?.drawPortrait(c,id,{gender:state().gender,name:id==='player'?state().name:cast().find(x=>x.id===id)?.name});return c;
  }
  function delivery(d){
    const text=String(d.text||'').toLocaleLowerCase('pt-BR');
    const expression=d.expression||(/deu certo|conseguimos|portas abertas|obrigad|topa|!/.test(text)?'joyful':/ventania|fechou|esperando|sozinh|medo|perigo|frio/.test(text)?'concerned':/pergunt|observ|desen|lembr|história|caderno/.test(text)?'thoughtful':'warm');
    const gesture=d.gesture||(d.kind==='offer'||/venha|convide|convid|topa|comigo/.test(text)?'invite':d.kind==='lore'||d.npcId==='lia'?'explain':d.kind==='response'?'nod':'explain');
    return {expression,gesture};
  }
  function speechState(npcId){
    if(!speech||!dialog?.classList.contains('show')||(npcId&&npcId!==speech.npcId))return {speaking:false,speechTime:0,reducedMotion:reducedMotion()};
    const complete=speech.cursor>=speech.letters.length;
    return {speaking:!complete&&speech.hold<=0&&!reducedMotion(),speechTime:speech.elapsed,expression:speech.expression,gesture:complete?'listen':speech.gesture,reducedMotion:reducedMotion()};
  }
  function repaintSpeech(){
    if(!speech)return;
    const count=Math.min(speech.letters.length,Math.floor(speech.cursor));
    if(count!==speech.painted){
      speech.painted=count;speech.shown.textContent=speech.letters.slice(0,count).join('');speech.hidden.textContent=speech.letters.slice(count).join('');
      const revealFocused=document.activeElement===speech.revealButton;speech.revealButton.hidden=count===speech.letters.length;
      if(revealFocused&&speech.revealButton.hidden)dialog.querySelector('.vale-choices button')?.focus({preventScroll:true});
      speech.help.textContent=count===speech.letters.length?'Conversa pausada · Tab escolhe · Enter confirma · Esc volta ao mundo':'Conversa pausada · E mostra a fala inteira · Tab escolhe · Esc volta ao mundo';
    }
    const s=state();window.FarmCharacterArt?.drawPortrait(speech.canvas,speech.npcId,{gender:s.gender,name:cast().find(x=>x.id===speech.npcId)?.name,...speechState()});
  }
  function reveal(){
    if(!speech||speech.cursor>=speech.letters.length)return false;
    speech.cursor=speech.letters.length;speech.hold=0;repaintSpeech();return true;
  }
  function update(dt){
    if(!speech||!dialog?.classList.contains('show')||!Number.isFinite(dt)||dt<=0)return;
    dt=Math.min(dt,.1);speech.elapsed+=dt;portraitClock+=dt;
    if(reducedMotion())reveal();
    else if(speech.cursor<speech.letters.length){
      speech.hold=Math.max(0,speech.hold-dt);
      if(speech.hold===0){
        const before=Math.floor(speech.cursor);speech.cursor=Math.min(speech.letters.length,speech.cursor+dt*44);
        const crossed=speech.letters.slice(before,Math.floor(speech.cursor)).join('');
        if(/[.!?…]/.test(crossed))speech.hold=.14;
      }
    }
    if(portraitClock>=1/12){portraitClock%=1/12;repaintSpeech();}
  }
  function rememberFocus(){if(!previousFocus&&!dialog?.classList.contains('show')&&!bookOpen)previousFocus=document.activeElement;adapter.beforeOpen?.();}
  function returnFocus(){const f=previousFocus;previousFocus=null;if(f?.isConnected&&f!==document.body&&f!==document.documentElement&&f.getClientRects().length)f.focus({preventScroll:true});else adapter.focusGame?.();}
  function install(){
    if(ready)return;ready=true;
    const style=el('style');
    style.textContent=`
      :root{--vale-ink:#1c3431;--vale-paper:#f5edda;--vale-gold:#d9ad61;--vale-soft:#b7c6ac;}
      #startMenu,#characterSelect{box-sizing:border-box;}
      #startMenu .menuCard,#characterSelect .menuCard{box-sizing:border-box;max-width:100%;max-height:calc(100dvh - 36px);overflow:auto;min-width:0;}
      #startMenu .vale-menu-story{max-width:58ch;margin:12px auto 18px;font:17px/1.65 Georgia,serif;color:#e0d6ba;text-align:center}
      body.game-on .panel{background:linear-gradient(150deg,rgba(28,52,49,.96),rgba(19,37,35,.94))!important;border-color:rgba(224,190,119,.48)!important;box-shadow:0 3px 0 rgba(11,25,23,.65),inset 0 1px rgba(255,243,203,.12)!important;}
      body.game-on #tasks h3,body.game-on #tasks .logo{color:#f0d8a7!important;}
      body.game-on #thermalFeedback{border-color:rgba(216,182,114,.24)!important;color:#d5dfc4!important;}
      body.game-on #interactionHint{background:#f1e3c0!important;color:#263d35!important;border:2px solid #71583b!important;box-shadow:0 3px 0 #2b3128!important;}
      #valeHud{display:none;box-sizing:border-box;position:relative;padding:12px;width:100%;color:#ede5d0;border:1px solid #8d8b61;border-radius:10px;background:#203a34;box-shadow:0 3px 0 #12271f;cursor:pointer;text-align:left;font-family:Georgia,'Times New Roman',serif;}
      .game-on #valeHud{display:block}.cutscene-playing #valeHud{visibility:hidden}
      #valeHud .vale-kicker{display:block;color:#c5b78c;font:9px monospace;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:5px}
      #valeHud strong{display:block;font-size:15px;line-height:1.2;color:#f4daa1}
      #valeHud .vale-hud-objective{display:block;font:11px/1.4 Georgia,serif;margin-top:6px;color:#d6dec8}
      #valeHud .vale-hud-footer{display:flex;justify-content:space-between;gap:6px;font:9px monospace;color:#d4b675;margin-top:9px}
      #valeHud:hover{border-color:#f4d591;background:#294a3e}#valeHud:focus-visible{outline:3px solid #ffda7c;outline-offset:3px}
      .vale-overlay{display:none;position:fixed;inset:0;z-index:1700;box-sizing:border-box;background:linear-gradient(180deg,rgba(11,25,26,.2),rgba(11,25,26,.66));padding:22px;align-items:flex-end;justify-content:center}
      .vale-overlay.show{display:flex}.vale-overlay *, .vale-book-overlay *{box-sizing:border-box}
      .vale-dialog-card{position:relative;width:min(940px,100%);max-height:calc(100dvh - 44px);overflow:auto;display:grid;grid-template-columns:128px 1fr;gap:20px;background:var(--vale-paper);border:3px solid #574634;border-radius:5px;box-shadow:0 0 0 2px #d1af75,0 18px 70px #081712a8;padding:20px;color:var(--vale-ink)}
      .vale-dialog-card:before{content:'';position:absolute;left:0;right:0;top:0;height:6px;background:repeating-linear-gradient(90deg,#304b3a 0 22px,#a48c5b 22px 25px,#304b3a 25px 47px)}
      .vale-dialog-person{display:flex;flex-direction:column;align-items:center;gap:10px;align-self:start;padding-top:6px}
      .vale-portrait{image-rendering:pixelated;display:block;background:#c8d6bb;border:2px solid #80744e;box-shadow:3px 3px 0 #c7bb99;border-radius:4px;max-width:100%;width:128px;height:128px}
      .vale-dialog-person .vale-portrait{width:110px;height:110px}
      .vale-dialog-person .vale-role{font:11px/1.5 Georgia,serif;text-align:center;color:#657256}
      .vale-dialog-header{display:flex;gap:16px;align-items:start;justify-content:space-between;margin:0 0 12px}
      .vale-dialog-header h2{font:700 24px/1.12 Georgia,serif;margin:3px 0;color:#203e32}
      .vale-kicker{font:10px/1.5 monospace;letter-spacing:1.5px;text-transform:uppercase;color:#7a744b}
      .vale-dialog-text{font:17px/1.55 Georgia,'Times New Roman',serif;white-space:pre-wrap;margin:0 0 20px;max-width:64ch}
      .vale-dialog-content{min-width:0;display:flex;flex-direction:column;min-height:0}
      .vale-dialog-body{max-height:20dvh;overflow:auto;overscroll-behavior:contain;scrollbar-gutter:stable;padding:2px 14px 2px 0;margin-bottom:12px;min-height:64px}
      .vale-dialog-body:focus-visible{outline:2px solid #375d44;outline-offset:2px}
      .vale-dialog-body .vale-dialog-text{margin-bottom:8px}
      .vale-sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
      .vale-unrevealed{visibility:hidden}.vale-reveal{align-self:flex-start;font:11px/1.4 monospace;padding:5px 8px;min-height:29px;margin:0 0 10px;background:transparent;color:#506342;border:1px solid #b4b18c;border-radius:3px;cursor:pointer}.vale-reveal:focus-visible{outline:3px solid #375d44;outline-offset:2px}.vale-reveal[hidden]{display:none}
      .vale-dialog-card .vale-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));max-height:24dvh;overflow:auto;overscroll-behavior:contain;scrollbar-gutter:stable;padding:3px 7px 5px 3px}
      .vale-dialog-card .vale-button{overflow-wrap:anywhere;min-width:0;flex-shrink:0}
      .vale-dialog-person{position:sticky;top:6px}
      .vale-dialog-help{flex:0 0 auto}
      .vale-choices{display:flex;flex-direction:column;gap:8px;align-items:stretch}
      .vale-button{font:15px/1.4 Georgia,serif;min-height:43px;background:#e7ddc2;color:#203e32;border:1px solid #a99f7a;border-radius:4px;padding:10px 15px;text-align:left;cursor:pointer;transition:background .15s}
      .vale-button:hover{background:#d6d6b3;border-color:#5f7958}.vale-button:focus-visible{outline:3px solid #375d44;outline-offset:2px}
      .vale-button-primary{background:#315a42;color:#fff2ce;border-color:#244934}.vale-button-primary:hover{background:#426e51}
      .vale-close{flex:0 0 auto;background:transparent;border:1px solid #a99f7a;border-radius:3px;padding:8px 12px;font:12px Georgia,serif;cursor:pointer;color:#334b38;min-height:36px}
      .vale-close:focus-visible{outline:3px solid #375d44;outline-offset:2px}
      .vale-dialog-help{font:10px/1.5 monospace;color:#77775a;margin-top:13px;letter-spacing:.2px}
      .vale-book-overlay{display:none;position:fixed;inset:0;z-index:1690;align-items:center;justify-content:center;padding:20px;background:#081c1dcc}
      .vale-book-overlay.show{display:flex}.vale-book{width:min(980px,100%);max-height:calc(100dvh - 40px);overflow:auto;background:#f1e9d4;border:3px solid #665739;box-shadow:0 0 0 2px #c7aa72,0 22px 80px #061c15;border-radius:6px;padding:26px;color:#243c32}
      .vale-book h2{font:700 30px Georgia,serif;margin:5px 0}.vale-book p{font:15px/1.65 Georgia,serif;color:#4b5d47}
      .vale-book h3{font:700 19px Georgia,serif;margin:24px 0 12px}.vale-book-grid{display:grid;grid-template-columns:1fr 240px;gap:26px}.vale-map{width:100%;max-height:370px;object-fit:contain;background:#244b3c;border:2px solid #877a51;image-rendering:pixelated}
      .vale-quest{border-left:3px solid #a9b47c;padding:11px 14px;background:#e8e1cc;margin:8px 0}.vale-quest strong{font:700 16px Georgia,serif}.vale-quest p{margin:5px 0 0;font-size:13px}.vale-counter{display:block;font:11px monospace;color:#677a51;margin-top:7px}
      .vale-residents{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.vale-resident{display:flex;gap:10px;background:#e6dfcb;border:1px solid #c7c4a6;padding:10px;border-radius:4px;align-items:start}.vale-resident .vale-portrait{width:56px;height:56px;flex:0 0 56px}.vale-resident strong{font:700 16px Georgia,serif}.vale-resident small{display:block;font:11px/1.5 Georgia,serif;color:#627052;margin-top:3px}
      .vale-world-state{background:#dce1c8;border:1px solid #afbc96;border-radius:4px;padding:14px;margin:14px 0}.vale-world-state strong{font:700 17px Georgia,serif}.vale-world-state p{margin:5px 0 0;font-size:14px}.vale-offer-terms{font:12px/1.5 Georgia,serif;margin:0 0 16px;color:#677451;border-left:3px solid #b7bd94;padding:8px 12px;background:#e8e3cb}.vale-letter{white-space:pre-wrap;font:16px/1.75 Georgia,serif;padding:20px;background:#ede1c2;border:1px solid #c4ad81;margin-top:14px}
      .vale-memory{font:13px/1.6 Georgia,serif;margin:8px 0;padding-left:12px;border-left:2px solid #bca171}
      .vale-discoveries{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .vale-discovery{background:#e9dfc6;border:1px solid #b4ab86;border-radius:4px;padding:14px;min-width:0}
      .vale-discovery summary{cursor:pointer;color:#27432f;font:700 16px/1.45 Georgia,serif;min-height:34px}
      .vale-discovery .vale-kicker{display:block;margin:4px 0 8px;letter-spacing:.6px}
      .vale-discovery p{white-space:pre-wrap;margin:8px 0;font-size:14px;line-height:1.65}
      .vale-discovery .vale-decision{padding-top:10px;border-top:1px solid #bdb493;color:#294e35}
      body.access-contrast .vale-dialog-card,body.access-contrast .vale-book{background:#fff;color:#101b15;border-color:#172f1e}body.access-contrast .vale-dialog-text,body.access-contrast .vale-book p{color:#101b15}
      body.access-reduce-motion .vale-button{transition:none}
      @media(max-width:700px){.vale-overlay{padding:12px}.vale-dialog-card{padding:17px;gap:13px;grid-template-columns:80px 1fr;max-height:calc(100dvh - 24px)}.vale-dialog-person .vale-portrait{width:74px;height:74px}.vale-dialog-person .vale-role{font-size:10px}.vale-dialog-header h2{font-size:22px}.vale-dialog-text{font-size:16px;line-height:1.6}.vale-book-overlay{padding:12px}.vale-book{padding:17px;max-height:calc(100dvh - 24px)}.vale-book-grid{grid-template-columns:1fr}.vale-map{max-height:230px}.vale-residents{grid-template-columns:1fr 1fr}.vale-book h2{font-size:25px}}
      @media(max-width:460px){#valeHud{padding:8px}#valeHud strong{font-size:12px}#valeHud .vale-hud-objective{font-size:10px}#valeHud .vale-kicker{font-size:8px;letter-spacing:.4px}#valeHud .vale-hud-footer{font-size:8px}.vale-dialog-card{display:block;padding:16px}.vale-dialog-person{float:left;width:58px;padding:0;margin:0 12px 8px 0}.vale-dialog-person .vale-portrait{width:56px;height:56px}.vale-dialog-person .vale-role{display:none}.vale-dialog-header h2{font-size:20px}.vale-dialog-header{min-height:58px;gap:7px}.vale-kicker{font-size:9px;letter-spacing:.5px}.vale-dialog-text{clear:both;font-size:16px}.vale-choices{clear:both}.vale-residents{grid-template-columns:1fr}.vale-close{font-size:11px;padding:6px 8px}.vale-book h2{font-size:23px}}
      @media(max-width:700px){.vale-dialog-body{max-height:30dvh}.vale-dialog-card .vale-choices{max-height:31dvh;grid-template-columns:1fr}.vale-discoveries{grid-template-columns:1fr}}
      @media(max-height:520px){.vale-overlay{padding:8px}.vale-dialog-card{padding:13px;max-height:calc(100dvh - 16px);grid-template-columns:80px 1fr;gap:12px}.vale-dialog-person .vale-portrait{width:70px;height:70px}.vale-dialog-header{margin-bottom:6px}.vale-dialog-header h2{font-size:20px}.vale-dialog-body{max-height:23dvh;min-height:45px;margin-bottom:6px}.vale-dialog-text{font-size:15px;line-height:1.45}.vale-dialog-card .vale-choices{max-height:29dvh}.vale-dialog-help{margin-top:5px}}
      @media(max-width:460px){.vale-dialog-card{display:grid;grid-template-columns:58px minmax(0,1fr);gap:9px 12px}.vale-dialog-person{float:none;position:static;margin:0;width:58px;grid-column:1;grid-row:1}.vale-dialog-content{display:contents}.vale-dialog-header{grid-column:2;grid-row:1;margin-bottom:0;min-width:0}.vale-dialog-body,.vale-dialog-card .vale-choices,.vale-dialog-help,.vale-reveal{grid-column:1/-1}.vale-dialog-body{padding-right:8px}.vale-dialog-help{margin-top:0}}
      @media(max-width:520px){#characterSelect .csCard,#startMenu .menuCard{padding:16px;border-width:3px}#characterSelect .cs-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}#characterSelect .cs-option{padding:10px 4px;min-width:0}#characterSelect .cs-portrait{width:64px;height:86px}#characterSelect .cs-nameRow{flex-wrap:wrap}#characterSelect input{box-sizing:border-box;max-width:100%;min-width:0}#startMenu .menuGrid{grid-template-columns:1fr}#startMenu .vale-menu-story{font-size:15px;line-height:1.5}}
    `;
    document.head.append(style);
    panel=button('',()=>window.FarmValleyPanels?FarmValleyPanels.open('saga'):openBook(),'panel');panel.id='valeHud';panel.setAttribute('aria-label','Abrir o caderno, a história de Alex e a vida na fazenda');
    document.getElementById('topright')?.append(panel);
    dialog=el('div','vale-overlay');dialog.id='valeDialogue';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','valeSpeaker');dialog.setAttribute('aria-describedby','valeSpeechText');
    book=el('div','vale-book-overlay');book.id='valeBook';book.setAttribute('role','dialog');book.setAttribute('aria-modal','true');book.setAttribute('aria-labelledby','valeBookTitle');
    document.body.append(dialog,book);
    // Captura antes dos controles do mundo: nenhuma escolha vira movimento/ação.
    window.addEventListener('keydown',keyboard,true);
    const entry=button('Jornada das Sementes',()=>{adapter.beforeOpen?.();openBook();},'pause-secondary');
    entry.id='valePauseEntry';document.querySelector('#pauseMenu .pause-row')?.append(entry);
    refresh();
  }
  function refresh(){
    if(!ready)return;const s=story()?.snapshot();if(!s)return;
    const extended=window.FarmValleySaga?.snapshot?.(),c=extended?.act||s.chapter||{},completed=extended?.completed??s.completed,giver=cast().find(n=>n.id===(c.npcId||c.targetNpc))?.name||'Rosa',next=c.objectives?.find(o=>o.n<o.goal);
    const objective=c.status==='available'?'Converse com '+giver+' para combinar esta etapa.':c.status==='ready'?'Volte a '+giver+' para concluir a etapa.':next?next.text+' · '+next.n+'/'+next.goal:c.objective||c.description;
    const signature=JSON.stringify([c.title,objective,completed,c.index,!!extended]);
    if(signature!==lastHud){lastHud=signature;panel.replaceChildren();
      panel.append(el('span','vale-kicker',extended?.title||'O Vale dos Três Ventos'),el('strong','',c.title||'Uma carta de Rosa'),el('span','vale-hud-objective',objective||'Encontre Rosa perto da casa.'),el('span','vale-hud-footer',(completed?'Vida no vale':(extended?'Página ':'Capítulo ')+((c.index||0)+1)+' / '+(extended?.episodes?.length||6))+' · abrir caderno'));
    }
    if(bookOpen)renderBook();
  }
  function showDialogue(d){
    if(!ready)return;
    if(!d){const was=dialog.classList.contains('show');dialog.classList.remove('show');lastNpc='';speech=null;if(was)returnFocus();refresh();return;}
    const was=dialog.classList.contains('show');if(!was){rememberFocus();bookOpen=false;book.classList.remove('show');}
    const oldChoice=document.activeElement?.dataset?.valeChoice;
    dialog.replaceChildren();
    const card=el('section','vale-dialog-card'),person=el('div','vale-dialog-person'),content=el('div','vale-dialog-content');
    const portraitId=d.npcId==='letter'?'rosa':d.npcId,face=portrait(portraitId,128);
    person.append(face,el('span','vale-role',d.role||''));
    const head=el('div','vale-dialog-header'),label=el('div');label.append(el('span','vale-kicker',d.title||'Uma conversa no vale'));
    const speaker=el('h2','',d.speaker||'Carta de Rosa');speaker.id='valeSpeaker';label.append(speaker);
    const body=el('div','vale-dialog-body');body.tabIndex=0;body.setAttribute('aria-label','Fala de '+(d.speaker||'Rosa')+'; use as setas para ler');
    const paragraph=el('p','vale-dialog-text'),full=el('span','vale-sr-only',d.text||''),visual=el('span','vale-visual-text'),shown=el('span','vale-revealed'),hidden=el('span','vale-unrevealed');paragraph.id='valeSpeechText';visual.setAttribute('aria-hidden','true');visual.append(shown,hidden);paragraph.append(full,visual);body.append(paragraph);
    head.append(label,button('Fechar · Esc',closeDialogue,'vale-close'));content.append(head,body);
    if(d.kind==='offer')body.append(el('p','vale-offer-terms','Pedido da estação · 8 moedas na entrega. Conta apenas o que você fizer depois de aceitar. Expira quando a estação mudar.'));
    if(d.kind==='lore')body.append(el('p','vale-offer-terms','Uma lembrança do vale. Sua resposta muda a conversa; você pode pensar e voltar depois.'));
    const choices=el('div','vale-choices');
    (d.choices||[]).forEach((choice,i)=>{const b=button(choice.label,()=>story().choose(choice.id),i===0?'vale-button vale-button-primary':'vale-button');b.dataset.valeChoice=choice.id;choices.append(b);});
    if(d.canAdvance&&!(d.choices||[]).some(c=>c.id==='back'))choices.append(button('Continuar →',()=>story().advance(),'vale-button vale-button-primary'));
    if(!choices.children.length)choices.append(button('Até mais',closeDialogue));
    const revealButton=button('Mostrar fala inteira · E',reveal,'vale-reveal'),help=el('div','vale-dialog-help');
    content.append(revealButton,choices,help);
    card.append(person,content);dialog.append(card);dialog.classList.add('show');
    const letters=Array.from(String(d.text||''));speech={npcId:portraitId,canvas:face,letters,cursor:reducedMotion()?letters.length:Math.min(3,letters.length),elapsed:0,hold:0,painted:-1,shown,hidden,revealButton,help,...delivery(d)};portraitClock=0;repaintSpeech();
    const matching=oldChoice?Array.from(choices.children).find(b=>b.dataset.valeChoice===oldChoice):null;
    (matching||choices.querySelector('button'))?.focus({preventScroll:true});lastNpc=d.npcId;refresh();
  }
  function closeDialogue(){story()?.close();}
  function mapCanvas(){
    const c=el('canvas','vale-map');c.width=180;c.height=372;c.setAttribute('aria-label','Mapa do vale com sua posição e os seis moradores');
    const g=c.getContext('2d'),info=state();g.imageSmoothingEnabled=false;
    adapter.drawMap?.(g,c.width,c.height);
    const w=info.worldWidth||960,h=info.worldHeight||1984;
    const house=info.community;if(house){g.fillStyle='#ac6d42';g.fillRect(Math.round(house.x/w*c.width)-4,Math.round(house.y/h*c.height)-4,9,8);g.strokeStyle='#fff0bf';g.strokeRect(Math.round(house.x/w*c.width)-4,Math.round(house.y/h*c.height)-4,9,8);}
    for(const n of info.npcs||[]){const def=cast().find(x=>x.id===n.npcId);g.fillStyle=def?.region==='mountain'?'#eee2d4':def?.region==='desert'?'#e8b966':'#e4cb9b';g.fillRect(Math.round(n.x/w*c.width)-2,Math.round(n.y/h*c.height)-2,5,5);}
    g.fillStyle='#ffffff';g.fillRect(Math.round((info.x||0)/w*c.width)-2,Math.round((info.y||0)/h*c.height)-2,5,5);
    return c;
  }
  function questBlock(q){
    const n=el('div','vale-quest');n.append(el('strong','',q.title||q.text||'Pedido'),el('p','',q.objective||q.description||''));
    if(Array.isArray(q.objectives))for(const o of q.objectives)n.append(el('span','vale-counter',(o.n>=o.goal?'✓ ':'')+o.text+' · '+o.n+'/'+o.goal));
    if(q.status)n.append(el('span','vale-counter',({available:'Converse para aceitar',active:'Em andamento',ready:'Volte para entregar',completed:'Concluído',locked:'Ainda por descobrir'})[q.status]||q.status));
    return n;
  }
  function location(def,info){
    const n=(info.npcs||[]).find(x=>x.npcId===def.id);const names={farm:'Fazenda',mountain:'Montanha',desert:'Oásis'};
    if(!n)return names[def.region]||'Vale';
    const dx=n.x-(info.x||0),dy=n.y-(info.y||0),tiles=Math.round(Math.hypot(dx,dy)/16);
    const direction=Math.abs(dx)>Math.abs(dy)?(dx<0?'oeste':'leste'):(dy<0?'norte':'sul');
    return (names[n.region||def.region]||'Vale')+' · '+(tiles<=2?'perto de você':tiles+' passos ao '+direction);
  }
  function renderBook(){
    if(!bookOpen)return;const s=story()?.snapshot();if(!s)return;const info=state();book.replaceChildren();
    const card=el('article','vale-book'),head=el('div','vale-dialog-header'),titles=el('div');titles.append(el('span','vale-kicker','Cartas, encontros e memórias'));
    const h=el('h2','','O Vale dos Três Ventos');h.id='valeBookTitle';titles.append(h);head.append(titles,button('Voltar · Esc',closeBook,'vale-close'));card.append(head);
    if(window.FarmValleyPanels){const entries=el('div','vale-choices');entries.style.marginBottom='18px';entries.append(button('Alex e o mistério do vale',()=>{closeBook(false);FarmValleyPanels.open('saga');},'vale-button vale-button-primary'),button('Vida na fazenda · projetos, receitas e entregas',()=>{closeBook(false);FarmValleyPanels.openFarm();}));card.append(entries);}
    const grid=el('div','vale-book-grid'),main=el('div'),aside=el('aside');
    main.append(el('p','',s.completed?'A Casa das Sementes voltou a reunir o vale. A história continua nos pedidos, nas amizades e nas próximas estações.':'Rosa guardou sementes, histórias e um lugar para você. Cada encontro abre uma parte deste vale.'),questBlock(s.chapter));
    const house=s.world?.seedHouse;
    if(house){
      const detail={closed:['A casa espera por vocês','Caixas cobertas e uma bancada vazia. Converse com Rosa para começar.'],
        preparing:['Tomás abriu a oficina','A lona saiu da bancada. Agora falta a primeira colheita de Nico para encher as caixas.'],
        supplied:['A casa ganha vida','As primeiras caixas chegaram. Cada nova etapa deixa na casa algo trazido pelo vale.'],
        open:['Portas abertas para o vale','A placa, as caixas e as bandeirinhas estão prontas. Rosa pode chamar os moradores para um encontro.']}[house.stage];
      const place=el('div','vale-world-state');place.append(el('strong','',detail[0]),el('p','',detail[1]));
      if(s.world.gathering)place.append(el('p','','Encontro marcado na Casa das Sementes. O mapa mostra a posição atual dos moradores.'));
      main.append(place);
    }
    const active=(s.quests||[]).filter(q=>q.accepted&&!q.completed);
    if(active.length){main.append(el('h3','','Pedidos em andamento'));active.forEach(q=>main.append(questBlock(q)));}
    main.append(button('Ler a carta de Rosa',()=>{closeBook(false);story().interact('letter');}));
    aside.append(el('span','vale-kicker','Norte · montanha / Sul · oásis'),mapCanvas(),el('p','','O ponto branco é você. Aproxime-se dos moradores e pressione E para conversar.'));
    grid.append(main,aside);card.append(grid,el('h3','','Quem vive no vale'));
    const people=el('div','vale-residents');
    for(const def of cast()){
      const relation=s.relationships?.find(r=>r.npcId===def.id);
      const p=el('div','vale-resident'),label=el('div');label.append(el('strong','',def.name),el('small','',def.role),el('small','',location(def,info)),el('small','',(relation?.label||'Vínculo')+' · '+(s.friendships?.[def.id]||0)),el('small','',(relation?.discoveries||0)+' / '+(relation?.total||3)+' lembranças descobertas'));
      const actor=(info.npcs||[]).find(n=>n.npcId===def.id);if(actor?.routineDescription)label.append(el('small','',actor.routineDescription));
      p.append(portrait(def.id,96),label);people.append(p);
    }
    card.append(people);
    const scenes=window.FarmStoryCinematics?.catalogue?.()||[],seen=scenes.filter(s=>s.seen);
    card.append(el('h3','','Cenas da jornada · '+seen.length+' / '+scenes.length));
    if(scenes.some(s=>s.available||s.unlocked||s.seen))card.append(button(seen.length?'Rever cenas da jornada':'Ver cenas da jornada',()=>{closeBook(false);window.FarmStoryCinematics?.openGallery?.();}));
    else card.append(el('p','','Os encontros importantes ganham cenas próprias. Depois de assisti-las ou pulá-las, você poderá revê-las aqui.'));
    card.append(el('h3','','Vozes do vale · '+(s.discoveries?.length||0)+' / '+(s.discoveryTotal||18)),el('p','','Cada morador conhece uma parte do passado. Converse, volte após as etapas e escute as lembranças. As histórias de depois da reabertura continuam na vida do vale.'));
    if(s.discoveries?.length){
      const collection=el('div','vale-discoveries');
      for(const memory of s.discoveries){const item=el('details','vale-discovery');item.append(el('summary','',memory.title),el('span','vale-kicker',cast().find(n=>n.id===memory.npcId)?.name||''),el('p','',memory.text),el('p','vale-decision',memory.response||'Você pode voltar a este morador para responder à lembrança.'));collection.append(item);}
      card.append(collection);
    }
    if(s.memories?.length){card.append(el('h3','','Memórias da jornada'));s.memories.slice(-8).forEach(m=>card.append(el('p','vale-memory',m.text)));}
    if(s.letter?.text){card.append(el('h3','',s.letter.title||'A carta de Rosa'),el('div','vale-letter',s.letter.text));}
    book.append(card);
  }
  function openBook(){
    if(!ready||!adapter.canOpen?.())return;rememberFocus();story()?.close();bookOpen=true;renderBook();book.classList.add('show');book.querySelector('button')?.focus({preventScroll:true});window.synthSfx?.pageTurn?.();
  }
  function closeBook(focus=true){if(!bookOpen)return;bookOpen=false;book.classList.remove('show');if(focus)returnFocus();}
  function keyboard(e){
    const active=dialog?.classList.contains('show')?dialog:bookOpen?book:null;if(!active)return;
    const reader=document.activeElement;
    if(reader?.classList.contains('vale-dialog-body')&&['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key)){
      e.preventDefault();e.stopImmediatePropagation();
      const page=Math.max(40,reader.clientHeight*.85),step=e.key==='ArrowUp'?-40:e.key==='ArrowDown'?40:e.key==='PageUp'?-page:page;
      reader.scrollTop=e.key==='Home'?0:e.key==='End'?reader.scrollHeight:reader.scrollTop+(e.shiftKey&&e.key===' '?-page:step);return;
    }
    if(e.key==='Tab'){
      const list=Array.from(active.querySelectorAll('button,summary,[tabindex="0"]')).filter(n=>!n.disabled),first=list[0],last=list.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      e.stopImmediatePropagation();return;
    }
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(bookOpen)closeBook();else closeDialogue();return;}
    if(e.key.toLowerCase()==='e'&&dialog.classList.contains('show')){e.preventDefault();e.stopImmediatePropagation();reveal();return;}
    if(e.key==='Enter'||e.key===' '){
      e.preventDefault();e.stopImmediatePropagation();
      const a=document.activeElement;if((a?.tagName==='BUTTON'||a?.tagName==='SUMMARY')&&active.contains(a))a.click();
      else if(dialog.classList.contains('show')&&!reveal()&&story()?.currentDialogue()?.canAdvance)story().advance();return;
    }
    if(dialog.classList.contains('show')&&/^[1-9]$/.test(e.key)){
      e.preventDefault();e.stopImmediatePropagation();dialog.querySelectorAll('.vale-choices button')[Number(e.key)-1]?.click();return;
    }
    e.stopImmediatePropagation();if(['w','a','s','d','q','f','c','r','e','h','j','i'].includes(e.key.toLowerCase()))e.preventDefault();
  }
  window.FarmStoryUI={init(a){adapter=a||{};install();},refresh,showDialogue,update,reveal,speechState,open:openBook,close(){closeBook(false);closeDialogue();},isOpen(){return bookOpen||!!story()?.isOpen();},presentation(){return speech?{npcId:speech.npcId,visible:Math.floor(speech.cursor),total:speech.letters.length,elapsed:speech.elapsed,...speechState()}:null;}};
})();
