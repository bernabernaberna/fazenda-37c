/* Pequenos filmes do Vale: palco original, sem mover o mundo nem dar recompensas.
   init({readState,beforeOpen,afterClose,onChange,drawWorld}); update(dt) é chamado
   pela barreira de leitura do jogo. As cenas aguardam avanço do jogador. */
(function(){
  'use strict';
  const names={rosa:'Rosa',lia:'Lia',tomas:'Tomás',ines:'Inês',caio:'Caio',nico:'Nico',player:'Você'};
  const shot=(speaker,line,expression='warm',gesture='explain',focus=0)=>({speaker,line,expression,gesture,focus});
  const films=[
    {id:'carta',title:'Uma cadeira guardada',chapter:0,region:'farm',scene:'main',focusX:264,focusY:920,
      description:'Rosa abre o embrulho da semente e faz um convite.',cast:['rosa','player'],prop:'seed',
      shots:[shot('rosa','Guardei esta semente no papel dos três ventos. Pensei que você gostaria de abrir o embrulho comigo.','warm','invite',-1),
        shot('player','Eu lembrava dos riscos. Não lembrava que a semente ainda estava aqui.','thoughtful','nod',1),
        shot('rosa','A ventania levou a placa, mas fomos nós que deixamos a mesa vazia. Lia, Tomás e Nico têm um começo para contar.','thoughtful','explain',-1),
        shot('rosa','Não precisamos fazer tudo hoje. Guardei uma cadeira. Vamos começar pela conversa?','warm','invite',0)]},
    {id:'horta',title:'Antes da placa',chapter:1,region:'farm',scene:'main',focusX:376,focusY:968,
      description:'Nico troca seus sete desenhos por uma primeira experiência.',cast:['nico','rosa','player'],prop:'sign',
      shots:[shot('nico','Fiz sete desenhos para a placa. Este vento parece um macarrão, mas a palavra ficou boa: entre!','joyful','explain',-1),
        shot('rosa','E o que quem entrar vai encontrar, Nico?','warm','nod',1),
        shot('nico','Uma horta. Três plantas para começar, água na hora certa e tempo para observar. Desta vez eu não puxo a semente!','joyful','explain',-1),
        shot('player','Então a placa espera. Primeiro fazemos uma coisa que vale mostrar.','warm','invite',0)]},
    {id:'rio',title:'O rio também faz pausa',chapter:2,region:'farm',scene:'main',focusX:744,focusY:884,
      description:'Lia liga a observação do vale ao cuidado com quem trabalha nele.',cast:['lia','player'],prop:'notebook',
      shots:[shot('lia','Olhe a margem: o rio continua correndo e este pedaço fica tranquilo. O mesmo lugar pode ter ritmos diferentes.','thoughtful','explain',-1),
        shot('player','Eu estava olhando só para a horta. Esqueci de reparar em quem cuidava dela.','thoughtful','nod',1),
        shot('lia','Eu também esqueço às vezes. Na Visão da Pele, observe; no mundo, considere o esforço, o abrigo e as reservas. Depois procure uma explicação.','thoughtful','explain',-1),
        shot('lia','Deixei espaço no caderno para uma pergunta sua. E espaço na sombra para uma pausa nossa.','warm','invite',0)]},
    {id:'abrigo',title:'A curva e o próximo apoio',chapter:3,region:'mountain',scene:'main',focusX:520,focusY:252,
      description:'Inês e Tomás combinam uma rota com apoio, sem apressar a travessia.',cast:['ines','tomas','player'],prop:'ribbon',
      shots:[shot('ines','A fita da curva se perdeu na ventania. A trilha continuou aqui, mas chegar deixou de parecer simples.','concerned','explain',-1),
        shot('tomas','Trouxe uma marca nova. Primeiro você me mostra onde ela ajuda; depois eu aperto o nó.','thoughtful','nod',1),
        shot('ines','Curva, abrigo, volta. Lã e casaco fazem parte do preparo. Nosso próximo ponto de apoio não precisa ser o ponto mais longe.','thoughtful','explain',-1),
        shot('player','Vou conferir o equipamento e seguir no meu ritmo. A rota também inclui saber voltar.','warm','nod',0)]},
    {id:'oasis',title:'Mais que uma entrega',chapter:4,region:'desert',scene:'main',focusX:632,focusY:1816,
      description:'Caio e Nico descobrem o que uma caixa pode levar além de uma carga.',cast:['caio','nico','player'],prop:'vessel',
      shots:[shot('caio','Este recipiente tem três marcas: a minha, a de Rosa e a de Inês. Nenhuma reserva chegou sozinha.','thoughtful','explain',-1),
        shot('nico','Posso desenhar as marcas na placa? Assim quem chega entende de onde vem a água.','joyful','explain',1),
        shot('caio','Pode. O ponto de coleta fica na margem sul. Vamos combinar as reservas e deixar tempo para conversar no caminho.','warm','invite',-1),
        shot('player','A próxima viagem pode levar uma história junto das caixas. Quero ouvir a sua também.','warm','nod',0)]},
    {id:'reabertura',title:'A mesa dos três ventos',chapter:6,region:'farm',scene:'main',focusX:608,focusY:1212,
      description:'Os seis moradores voltam à mesa. O fim da história abre o próximo dia.',cast:['rosa','lia','tomas','ines','caio','nico'],prop:'table',
      shots:[shot('tomas','A mesa tem três madeiras. Deixei as emendas à vista: uma peça de cada lugar.','warm','explain',-1),
        shot('ines','Ouvi o sino da curva. Desta vez, sabia que havia uma cadeira esperando.','warm','nod',1),
        shot('caio','Trouxe uma caixa menor e tempo sem encomenda. Foi o trecho que mais precisei aprender.','warm','explain',1),
        shot('lia','Meu caderno tem novas perguntas. A casa aberta nos dá um lugar para observá-las juntos.','thoughtful','explain',-1),
        shot('nico','Pendurei a placa! Está um pouco torta. E deixei uma página vazia para amanhã.','joyful','invite',1),
        shot('rosa','Então entrem. Hoje celebramos; amanhã plantamos de novo. O vale continua, e ninguém precisa conhecer sozinho a história inteira.','joyful','invite',0)]}
  ];
  const byId=new Map(films.map(f=>[f.id,f]));
  let adapter={},seen=new Set(),unlockedChapter=0,active=null,root=null,stage=null,portrait=null,textEl=null,fullTextEl=null,heading=null,subheading=null,counter=null,nextButton=null,stageContext=null;
  let previousFocus=null,previousOverflow='',initialized=false,reduced=false;
  const ease=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
  const safely=(fn,...args)=>{if(typeof fn!=='function')return undefined;try{return fn(...args);}catch(err){console.warn('Cena do vale:',err);return undefined;}};
  const read=()=>safely(adapter.readState||adapter.read)||{};
  function registerScenes(definitions){
    if(!Array.isArray(definitions))return 0;let count=0;
    for(const def of definitions.slice(0,16)){
      if(!def||!/^saga-[a-z0-9-]+$/.test(def.id)||byId.has(def.id)||!Array.isArray(def.shots)||!def.shots.length)continue;
      if(!def.shots.every(s=>s&&names[s.speaker]&&typeof s.line==='string'&&s.line.length<1800))continue;
      const film={...def,shots:def.shots.map(s=>({...s,focus:Number(s.focus)||0})),cast:Array.isArray(def.cast)?def.cast.filter(id=>names[id]):['player'],sagaEpisode:def.id.slice(5)};
      films.push(film);byId.set(film.id,film);count++;
    }
    return count;
  }
  function available(film){
    if(seen.has(film.id))return true;
    if(!film.sagaEpisode)return film.chapter<=chapterIndex();
    const saga=read().saga;
    return !!saga?.episodes?.some(e=>e.id===film.sagaEpisode&&(e.completed||e.status==='completed'));
  }
  const isReduced=()=>!!read().reducedMotion||!!read().reduceMotion||!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function install(){
    if(root)return;
    const css=document.createElement('style');css.id='vale-cinema-style';css.textContent=`
      #valeCinema{position:fixed;inset:0;z-index:24000;display:none;background:rgba(9,18,22,.97);color:#f7eed8;font-family:inherit;box-sizing:border-box;overscroll-behavior:contain;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))}
      #valeCinema[aria-hidden="false"]{display:flex;align-items:center;justify-content:center}#valeCinema *{box-sizing:border-box}#valeCinema [hidden]{display:none!important}#valeCinema .vc-film{width:min(1040px,100%);max-height:100%;display:flex;flex-direction:column;gap:12px}
      #valeCinema .vc-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}#valeCinema h2{font-size:clamp(18px,3vw,27px);margin:3px 0;font-weight:750;letter-spacing:.01em}#valeCinema .vc-eyebrow{color:#c5b489;font-size:11px;letter-spacing:.2em;text-transform:uppercase}#valeCinema .vc-subtitle{font-size:12px;color:#b2c8bc;margin:4px 0 0}
      #valeCinema button{min-height:44px;border:1px solid #768f83;border-radius:9px;background:#1b332d;color:#f7eed8;font:inherit;padding:9px 16px;cursor:pointer;touch-action:manipulation}#valeCinema button:hover{background:#2c5142}#valeCinema button:focus-visible{outline:3px solid #f4cb77;outline-offset:3px}#valeCinema .vc-skip{background:transparent;font-size:13px;flex-shrink:0}
      #valeCinema .vc-stage{width:100%;height:auto;aspect-ratio:2/1;max-height:50vh;object-fit:contain;background:#183329;border:1px solid #536b59;border-radius:12px;image-rendering:pixelated;flex-shrink:1;min-height:0}#valeCinema .vc-dialogue{display:grid;grid-template-columns:92px 1fr;gap:16px;border:1px solid #627765;border-radius:12px;padding:15px 19px;background:linear-gradient(110deg,#1a302a,#162923);min-height:140px;box-shadow:0 12px 32px #0004}#valeCinema .vc-portrait{width:88px;height:88px;image-rendering:pixelated;border:1px solid #ab9470;border-radius:5px;align-self:start}#valeCinema .vc-speaker{font-weight:750;color:#f2cd7b;display:block;margin:0 0 7px}#valeCinema .vc-line{font-size:clamp(15px,2vw,18px);line-height:1.5;margin:0;min-height:2.5em}#valeCinema .vc-controls{display:flex;align-items:center;justify-content:space-between;gap:16px;color:#b7c7bd;font-size:12px}#valeCinema .vc-next{background:#d5b76a;border-color:#d5b76a;color:#162620;font-weight:750;min-width:160px}#valeCinema .vc-next:hover{background:#ebcf85}#valeCinema .vc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
      #valeCinema .vc-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;overflow:auto;padding:5px;max-height:70vh}#valeCinema .vc-card{text-align:left;padding:16px;display:flex;flex-direction:column;gap:6px;min-height:118px}#valeCinema .vc-card strong{font-size:17px;color:#f0d99b}#valeCinema .vc-card span{font-size:13px;line-height:1.4;color:#cad8cd}#valeCinema .vc-card:disabled{opacity:.5;cursor:default;background:#17231f}#valeCinema .vc-card small{font-size:11px;color:#c3b27e}
      @media(max-width:600px){#valeCinema{padding:12px 10px}#valeCinema .vc-film{gap:10px}#valeCinema .vc-stage{aspect-ratio:1.7/1;max-height:36vh}#valeCinema .vc-dialogue{grid-template-columns:58px 1fr;gap:10px;padding:12px;min-height:172px;overflow:auto}#valeCinema .vc-portrait{width:56px;height:56px}#valeCinema .vc-line{font-size:15px}#valeCinema .vc-next{min-width:124px;padding:9px 12px}#valeCinema .vc-controls{font-size:11px;gap:10px}#valeCinema .vc-subtitle{font-size:11px}#valeCinema .vc-gallery{grid-template-columns:1fr}#valeCinema h2{font-size:20px}}
      @media(max-height:580px) and (min-width:601px){#valeCinema .vc-stage{max-height:39vh}#valeCinema .vc-dialogue{min-height:108px;padding:10px 16px}#valeCinema .vc-portrait{width:68px;height:68px}#valeCinema .vc-line{font-size:15px}#valeCinema .vc-film{gap:8px}}
      @media(prefers-reduced-motion:reduce){#valeCinema *{scroll-behavior:auto}}
    `;document.head.appendChild(css);
    root=document.createElement('section');root.id='valeCinema';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-hidden','true');root.setAttribute('aria-labelledby','valeCinemaTitle');
    root.innerHTML='<div class="vc-film"><div class="vc-top"><div><div class="vc-eyebrow">Vale dos Três Ventos</div><h2 id="valeCinemaTitle"></h2><p class="vc-subtitle"></p></div><button type="button" class="vc-skip">Pular cena</button></div><canvas class="vc-stage" width="960" height="480" aria-hidden="true"></canvas><div class="vc-dialogue"><canvas class="vc-portrait" width="96" height="96" aria-hidden="true"></canvas><div><strong class="vc-speaker"></strong><p class="vc-line" aria-hidden="true"></p><span class="vc-sr" aria-live="polite" aria-atomic="true"></span></div></div><div class="vc-controls"><span class="vc-hint">Espaço ou Enter · continuar</span><span class="vc-counter"></span><button type="button" class="vc-next">Continuar</button></div><div class="vc-gallery" hidden></div></div>';
    document.body.appendChild(root);stage=root.querySelector('.vc-stage');stageContext=stage.getContext('2d');portrait=root.querySelector('.vc-portrait');textEl=root.querySelector('.vc-line');fullTextEl=root.querySelector('.vc-sr');heading=root.querySelector('h2');subheading=root.querySelector('.vc-subtitle');counter=root.querySelector('.vc-counter');nextButton=root.querySelector('.vc-next');
    nextButton.addEventListener('click',advance);root.querySelector('.vc-skip').addEventListener('click',()=>close({skipped:true}));
    document.addEventListener('keydown',onKey,true);
  }
  function showOverlay(){
    install();safely(adapter.beforeOpen);previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';root.setAttribute('aria-hidden','false');reduced=isReduced();
  }
  function play(id,opts={}){
    const film=byId.get(id);if(!film||active||seen.has(id)&&!opts.replay||film.sagaEpisode&&!available(film))return false;
    showOverlay();const state=read();active={kind:'film',film,index:0,elapsed:0,speech:0,reveal:0,replay:!!opts.replay,player:{name:typeof state.name==='string'?state.name.slice(0,40):'Você',gender:state.gender==='f'?'f':'m'},backdrop:null};
    root.querySelector('.vc-gallery').hidden=true;stage.hidden=false;root.querySelector('.vc-dialogue').hidden=false;root.querySelector('.vc-controls').hidden=false;root.querySelector('.vc-skip').textContent='Pular cena';
    heading.textContent=film.title;subheading.textContent='Uma lembrança do vale · avance no seu ritmo';enterShot();nextButton.focus({preventScroll:true});return true;
  }
  function enterShot(){
    const s=active.film.shots[active.index];active.elapsed=0;active.speech=0;active.reveal=reduced?s.line.length:0;
    root.querySelector('.vc-speaker').textContent=s.speaker==='player'?active.player.name:names[s.speaker];fullTextEl.textContent=(s.speaker==='player'?active.player.name:names[s.speaker])+': '+s.line;
    counter.textContent=(active.index+1)+' / '+active.film.shots.length;nextButton.textContent=reduced?(active.index===active.film.shots.length-1?'Voltar ao vale':'Continuar'):'Mostrar fala';
    textEl.textContent=reduced?s.line:'';safely(window.synthSfx?.dialogue?.bind(window.synthSfx),s.speaker,'greet');prepareBackdrop();render();
  }
  function prepareBackdrop(){
    const c=document.createElement('canvas');c.width=960;c.height=480;const g=c.getContext('2d'),film=active.film,s=film.shots[active.index];g.imageSmoothingEnabled=false;
    const drawn=safely(adapter.drawWorld,g,{width:960,height:480,focusX:film.focusX+s.focus*24,focusY:film.focusY,zoom:3,region:film.region,scene:film.scene});
    if(drawn!==true){g.setTransform(2,0,0,2,0,0);background(g,film,0,s.focus);}
    active.backdrop=c;
  }
  function advance(){
    if(active?.kind!=='film')return;
    const s=active.film.shots[active.index];if(active.reveal<s.line.length){active.reveal=s.line.length;active.speech=0;textEl.textContent=s.line;nextButton.textContent=active.index===active.film.shots.length-1?'Voltar ao vale':'Continuar';render();return;}
    if(active.index===active.film.shots.length-1){close();return;}
    active.index++;safely(window.synthSfx?.pageTurn?.bind(window.synthSfx));enterShot();
  }
  function dismiss(mark,notify=true){
    if(!active)return false;const ending=active;active=null;root?.setAttribute('aria-hidden','true');document.body.style.overflow=previousOverflow;
    if(mark&&ending.kind==='film'&&!seen.has(ending.film.id)){seen.add(ending.film.id);safely(adapter.onChange);}
    const focus=previousFocus;previousFocus=null;if(focus?.isConnected)safely(focus.focus.bind(focus),{preventScroll:true});if(notify)safely(adapter.afterClose||adapter.onClose,{id:ending.film?.id||null,skipped:!!ending.skipped,replay:!!ending.replay});return true;
  }
  function close(opts={}){if(active)active.skipped=!!opts.skipped;return dismiss(true);}
  function onKey(e){
    if(!active)return;
    if(e.key.toLowerCase()==='m'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)safely(adapter.toggleSound||window.toggleSound);return;}
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close({skipped:true});return;}
    if(active.kind==='film'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)advance();return;}
    if(e.key==='Tab'){
      const buttons=[...root.querySelectorAll('button')].filter(b=>!b.disabled&&!b.hidden&&b.getClientRects().length);if(!buttons.length)return;
      const current=buttons.indexOf(document.activeElement);if(e.shiftKey&&(current<=0)){e.preventDefault();buttons.at(-1).focus();}else if(!e.shiftKey&&(current===buttons.length-1||current<0)){e.preventDefault();buttons[0].focus();}e.stopImmediatePropagation();
    }else if(['e','j','r','i','g','h','q','f','c','z','v','b','1','2','3','4','5','6','arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','shift'].includes(e.key.toLowerCase())){e.preventDefault();e.stopImmediatePropagation();}
  }
  function openGallery(){
    if(active)return false;showOverlay();active={kind:'gallery'};heading.textContent='Lembranças em movimento';subheading.textContent='Reveja as cenas que já encontrou na jornada';stage.hidden=true;root.querySelector('.vc-dialogue').hidden=true;root.querySelector('.vc-controls').hidden=true;root.querySelector('.vc-skip').textContent='Voltar ao vale';
    const gallery=root.querySelector('.vc-gallery');gallery.hidden=false;gallery.replaceChildren();
    for(const film of films){const button=document.createElement('button');button.type='button';button.className='vc-card';button.disabled=!available(film);const title=document.createElement('strong'),description=document.createElement('span'),status=document.createElement('small');title.textContent=film.title;description.textContent=film.description;status.textContent=seen.has(film.id)?'Rever cena':button.disabled?'Encontre esta lembrança na jornada':'Ver cena';button.append(title,description,status);button.addEventListener('click',()=>{const replay=seen.has(film.id);dismiss(false,false);play(film.id,{replay});});gallery.appendChild(button);}
    (gallery.querySelector('button:not(:disabled)')||root.querySelector('.vc-skip')).focus({preventScroll:true});return true;
  }
  function update(dt){
    if(active?.kind!=='film')return;dt=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;active.elapsed+=dt;active.speech+=dt;const s=active.film.shots[active.index];
    const count=reduced?s.line.length:Math.min(s.line.length,Math.floor(active.elapsed*43));if(count>active.reveal){active.reveal=count;textEl.textContent=s.line.slice(0,count);if(count===s.line.length)nextButton.textContent=active.index===active.film.shots.length-1?'Voltar ao vale':'Continuar';}render();
  }
  const rect=(g,c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  function polygon(g,color,points){g.fillStyle=color;g.beginPath();g.moveTo(...points[0]);for(let i=1;i<points.length;i++)g.lineTo(...points[i]);g.closePath();g.fill();}
  function tree(g,x,y,scale=1,palm=false){
    g.save();g.translate(x,y);g.scale(scale,scale);rect(g,'#745843',-4,-6,8,44);rect(g,'#a97d52',-2,-5,3,42);
    if(palm){for(const p of [[-45,4,-4,-20,17,3],[-32,-17,0,-32,34,-16],[5,-18,48,-5,20,8],[-4,-25,26,-41,31,-16]])polygon(g,'#3d785f',[[p[0],p[1]],[p[2],p[3]],[p[4],p[5]]]);rect(g,'#75a777',-17,-19,24,5);}
    else{rect(g,'#244b3c',-29,-43,58,34);rect(g,'#3f7255',-34,-29,65,24);rect(g,'#5f8d61',-22,-44,37,16);rect(g,'#8ead73',-15,-40,18,5);rect(g,'#244b3c',-20,-7,45,8);}g.restore();
  }
  function house(g,x,y,w=145,open=false){
    rect(g,'#263d31',x-6,y+67,w+12,8);rect(g,'#b7a081',x,y,w,73);rect(g,'#d8c8a0',x+4,y+4,w-8,61);
    for(let a=0;a<w;a+=21)rect(g,'#a88e72',x+a,y+7,2,59);polygon(g,'#553e39',[[x-11,y],[x+w/2,y-54],[x+w+11,y]]);polygon(g,'#956556',[[x-8,y-2],[x+w/2,y-49],[x+w+5,y-2]]);
    for(let a=0;a<4;a++)rect(g,'#c08a6c',x+16+a*21,y-10-a*6,w-33-a*36,2);
    rect(g,'#796150',x+w/2-18,y+22,36,51);rect(g,open?'#203b30':'#93775a',x+w/2-14,y+26,28,46);if(!open)rect(g,'#eed184',x+w/2+7,y+50,3,3);
    for(const wx of [x+15,x+w-39]){rect(g,'#725447',wx,y+17,25,24);rect(g,'#c6e0d0',wx+3,y+20,19,18);rect(g,'#748c77',wx+12,y+20,2,18);rect(g,'#748c77',wx+3,y+29,19,2);}rect(g,'#e8d6a1',x+w/2-25,y+7,50,11);rect(g,'#617c5b',x+w/2-19,y+11,38,2);
  }
  function background(g,film,t,focus){
    const w=480,h=240;rect(g,film.region==='desert'?'#e7b98a':film.region==='mountain'?'#b6d0d0':'#b9c9ac',0,0,w,h);
    const drift=reduced?0:Math.sin(t*.16)*3;
    polygon(g,film.region==='desert'?'#bc8764':'#6f967e',[[0,109],[52,72],[91,90],[162,43],[214,74],[280,34],[359,82],[415,58],[480,95],[480,175],[0,175]]);
    polygon(g,film.region==='desert'?'#d49c70':film.region==='mountain'?'#e5ece0':'#8aa483',[[0,129],[82,96],[143,113],[209,73],[274,111],[347,81],[417,111],[480,91],[480,180],[0,180]]);
    rect(g,film.region==='desert'?'#d8b47a':film.region==='mountain'?'#dce4d3':'#7c9c68',0,143,480,97);
    for(let i=0;i<60;i++){const x=(i*79+17)%480,y=147+(i*23)%94;rect(g,film.region==='desert'?'#b89460':film.region==='mountain'?'#c5d4c6':'#688958',x,y,i%3+1,2);}
    g.save();g.translate(-focus*6+drift,0);
    if(film.id==='carta'||film.id==='reabertura'){
      rect(g,'#b9a174',0,213,490,27);rect(g,'#c6af83',7,210,486,4);tree(g,40,135,1.6);tree(g,429,126,1.7);house(g,158,102,164,film.id==='reabertura');
      rect(g,'#6e523e',134,177,29,36);rect(g,'#b3905d',136,178,25,29);for(let i=0;i<3;i++)rect(g,'#dbc49a',139+i*7,178,2,29);rect(g,'#d8ba7a',344,181,28,21);rect(g,'#71523c',344,181,28,3);
      if(film.id==='reabertura'){for(let i=0;i<11;i++){const x=117+i*24;rect(g,'#916d47',x,60,24,1);polygon(g,i%2?'#dfa066':'#d9c079',[[x+5,60],[x+15,60],[x+10,71]]);}rect(g,'#694b36',195,216,90,9);rect(g,'#bf9160',193,212,94,9);rect(g,'#e1c38e',204,211,12,3);rect(g,'#547547',261,207,9,7);}
    }else if(film.id==='horta'){
      tree(g,48,131,1.45);house(g,292,93,130);rect(g,'#a68a60',115,142,158,11);
      for(let row=0;row<3;row++){rect(g,'#6f5339',81,165+row*22,204,15);rect(g,'#9c7250',87,168+row*22,192,2);for(let i=0;i<7;i++){const x=93+i*27,y=172+row*22;rect(g,'#384f32',x,y,8,4);rect(g,'#6d9950',x+2,y-7,3,9);rect(g,'#8eb166',x-2,y-5,5,3);rect(g,'#79a35c',x+4,y-8,5,4);}}rect(g,'#795642',363,181,4,44);rect(g,'#d1b687',338,167,55,21);rect(g,'#786948',346,176,37,3);
    }else if(film.id==='rio'){
      tree(g,47,111,1.6);tree(g,349,127,1.5);tree(g,439,133,1.15);polygon(g,'#527f7c',[[89,151],[186,150],[229,188],[270,203],[290,240],[150,240],[174,216],[135,201]]);polygon(g,'#88b2a5',[[110,153],[172,155],[215,190],[250,208],[267,239],[186,240],[197,218],[151,194]]);
      for(let i=0;i<11;i++){const x=142+(i*19)%87,y=163+i*7;rect(g,'#b8d1b8',x+(reduced?0:Math.sin(t+i)*2),y,14,1);}rect(g,'#977955',141,186,107,14);for(let i=0;i<8;i++)rect(g,'#d0ac79',145+i*13,187,10,11);rect(g,'#70543d',139,184,111,3);rect(g,'#70543d',143,196,111,3);
    }else if(film.id==='abrigo'){
      house(g,276,98,150,true);for(const x of [40,105,449]){polygon(g,'#315a49',[[x-28,169],[x,66],[x+28,169]]);polygon(g,'#f1eee0',[[x-19,117],[x,64],[x+19,117]]);rect(g,'#6d6252',x-4,164,8,26);}rect(g,'#a19079',0,211,490,29);rect(g,'#c6c8af',0,205,490,6);
      rect(g,'#797961',139,197,43,9);rect(g,'#b1aa8b',144,193,10,8);rect(g,'#b1aa8b',166,193,10,8);polygon(g,'#cd6f39',[[148,195],[151,176],[158,188],[165,174],[173,195]]);polygon(g,'#efbb64',[[154,195],[159,182],[166,193]]);rect(g,'#885f49',214,153,5,62);rect(g,'#bfa984',205,153,23,17);rect(g,'#a95648',216,139,15,5);
    }else if(film.id==='oasis'){
      polygon(g,'#b98d61',[[0,175],[50,151],[132,172],[151,185],[0,211]]);polygon(g,'#ba895f',[[328,174],[400,135],[480,152],[480,220],[319,199]]);polygon(g,'#537f79',[[130,181],[170,167],[279,170],[333,190],[291,225],[191,229],[132,211]]);polygon(g,'#78ac91',[[148,184],[181,175],[276,178],[312,192],[283,215],[195,219],[148,205]]);tree(g,96,162,1.5,true);tree(g,330,151,1.8,true);tree(g,394,180,1.2,true);
      for(let i=0;i<8;i++)rect(g,'#b1c6a3',174+(i*33)%122+(reduced?0:Math.sin(t+i)*2),184+(i*11)%25,17,1);rect(g,'#8d5f3c',55,204,27,19);rect(g,'#cb995e',58,199,21,6);rect(g,'#e2c890',61,201,15,2);
    }g.restore();
    if(!reduced){for(let i=0;i<10;i++){const x=(i*73+t*(film.region==='desert'?3:5))%480,y=70+(i*29)%132+Math.sin(t*.7+i)*4;rect(g,film.region==='mountain'?'#f5f4e8':'#d9d29b',x,y,film.region==='mountain'?2:1,2);}}
    // Vinheta em degraus: preserva contraste dos sprites, sem borrar a arte.
    rect(g,'#172f2822',0,0,w,12);rect(g,'#14241e33',0,h-8,w,8);
  }
  function drawProp(g,film,x,y){
    if(film.prop==='seed'){rect(g,'#e4d6ad',x-12,y-7,24,15);for(let i=0;i<3;i++)rect(g,'#8d7551',x-7+i*5,y-5,1,6);rect(g,'#9e753e',x-2,y-1,4,3);}
    else if(film.prop==='notebook'){rect(g,'#596f53',x-10,y-9,22,17);rect(g,'#e6d7b3',x-8,y-7,18,13);rect(g,'#b29672',x,y-7,1,13);for(let i=0;i<3;i++)rect(g,'#8b8d6b',x-6,y-5+i*4,5,1);}
    else if(film.prop==='sign'){rect(g,'#73503a',x-2,y+7,4,15);rect(g,'#dbbd86',x-23,y-8,46,16);g.fillStyle='#405b3f';g.font='bold 9px sans-serif';g.textAlign='center';g.fillText('ENTRE',x,y+3);}
    else if(film.prop==='vessel'){rect(g,'#a7744b',x-9,y-10,18,20);rect(g,'#dbb474',x-11,y-10,22,4);rect(g,'#e6ce9a',x-6,y-6,3,14);for(let i=0;i<3;i++)rect(g,'#684d3a',x-4+i*4,y+3,2,3);}
    else if(film.prop==='crate'){rect(g,'#735139',x-19,y-11,38,27);rect(g,'#b48957',x-17,y-9,34,23);for(let i=0;i<3;i++)rect(g,'#81623e',x-17,y-7+i*8,34,2);rect(g,'#d9c293',x-13,y-4,12,9);rect(g,'#b5d6b4',x+3,y-4,11,9);rect(g,'#74644b',x-10,y-1,6,1);rect(g,'#557c60',x+5,y-1,6,1);}
  }
  function render(){
    if(active?.kind!=='film'||!stageContext)return;const {film,index,elapsed,speech}=active,s=film.shots[index],g=stageContext;const blend=reduced?1:ease(elapsed/3),focus=s.focus*blend;
    g.save();g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,960,480);g.imageSmoothingEnabled=false;
    const zoom=reduced?1:1.025+blend*.025,pan=reduced?0:focus*6;g.drawImage(active.backdrop,-(960*(zoom-1)/2)-pan,-480*(zoom-1)/2,960*zoom,480*zoom);g.scale(2,2);
    const art=window.FarmCharacterArt,cast=film.cast,meeting=film.id==='reabertura'||film.prop==='table';
    const group=cast.map((_,i)=>[110+264*i/Math.max(1,cast.length-1),i===0||i===cast.length-1?204:185]);
    const positions=meeting?(cast.length===6?[[110,204],[164,185],[219,183],[269,183],[322,185],[374,204]]:group):cast.length>3?group:film.id==='rio'?[[151,210],[330,215]]:cast.length===3?[[172,209],[306,205],[249,223]]:[[178,210],[304,215]];
    if(meeting){rect(g,'#634f36',201,208,78,7);rect(g,'#b89965',199,204,82,6);rect(g,'#d4bd83',199,204,82,2);rect(g,'#634f36',205,214,5,14);rect(g,'#634f36',269,214,5,14);rect(g,'#e4d7ad',232,200,16,5);rect(g,'#72865b',240,201,2,3);}
    for(let i=0;i<cast.length;i++){
      const id=cast[i],[x0,y]=positions[i],x=x0-focus*4,actor={npcId:id,gender:active.player.gender,dir:0,x:0,y:0,moving:false,running:false,equipment:{},temp:37,gaitBlend:0};const speaking=id===s.speaker&&(active.reveal<s.line.length||elapsed<1.4),opts={x:0,y:0,speaking,speechTime:speech,expression:id===s.speaker?s.expression:'warm',gesture:id===s.speaker?s.gesture:'listen',reducedMotion:reduced,time:elapsed*1000};
      g.save();g.translate(x,y);g.scale(meeting?1.3:1.6,meeting?1.3:1.6);if(art){if(id==='player')art.drawPlayer(g,actor,opts);else art.drawNPC(g,actor,opts);}else{rect(g,id==='player'?'#b99654':'#6c8a69',-7,-21,14,24);rect(g,'#dbb08a',-5,-31,10,11);}g.restore();
      if(id===s.speaker){g.fillStyle='#f8de9b';g.textAlign='center';g.font='bold 9px sans-serif';g.fillText(id==='player'?active.player.name:names[id],x,y-(meeting?48:59));rect(g,'#f8de9b',x-1,y-(meeting?44:55),2,2);}
    }
    if(film.prop!=='table')drawProp(g,film,240,film.id==='rio'?210:204);
    g.restore();if(art?.drawPortrait)art.drawPortrait(portrait,s.speaker,{name:s.speaker==='player'?active.player.name:names[s.speaker],gender:active.player.gender,speaking:active.reveal<s.line.length,speechTime:speech,expression:s.expression,gesture:s.gesture,reducedMotion:reduced,time:elapsed*1000});
  }
  function chapterIndex(){const state=read(),value=state?.story?.chapter?.index??state?.story?.chaptersCompleted??state?.story?.chapterIndex??state?.chapterIndex;return Number.isFinite(value)?Math.max(unlockedChapter,Math.max(0,Math.min(6,Math.floor(value)))):unlockedChapter;}
  const catalogue=()=>films.map(f=>({id:f.id,title:f.title,chapter:f.chapter,description:f.description,seen:seen.has(f.id),unlocked:available(f),available:available(f)}));
  function restore(data,opts={}){dismiss(false,false);seen=new Set();unlockedChapter=Number.isFinite(opts.chapterIndex)?Math.max(0,Math.min(6,Math.floor(opts.chapterIndex))):0;if(data&&typeof data==='object'&&Array.isArray(data.seenScenes))for(const id of data.seenScenes.slice(0,films.length*2))if(byId.has(id))seen.add(id);}
  window.FarmStoryCinematics=Object.freeze({
    init(value={}){adapter=value&&typeof value==='object'?value:{};initialized=true;return catalogue();},registerScenes,play,update,isOpen:()=>!!active,close,
    reset(){dismiss(false,false);seen.clear();unlockedChapter=0;},restore,serialize:()=>({version:1,seenScenes:films.filter(f=>seen.has(f.id)).map(f=>f.id)}),catalogue,openGallery,
    info:()=>({initialized,open:!!active,kind:active?.kind||null,id:active?.film?.id||null,shot:active?.index??null,replay:!!active?.replay,reducedMotion:reduced})
  });
})();
