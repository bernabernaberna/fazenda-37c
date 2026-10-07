/* Personagens autorais do vale. Coordenadas continuam mecânicas: o ponto dos
   pés fica em (x,y+10), como no desenho anterior. Quadros e retratos são
   construídos uma vez; o caminho quente usa drawImage, sem leitura de pixels. */
(function(){
  'use strict';
  const P=Object.freeze({ink:'#183b36',edge:'#28554a',sage:'#66805a',leaf:'#a8b97a',
    amber:'#e3b86b',cream:'#f2dfb4',terra:'#ad6650',soil:'#705348',snow:'#d2e3de'});
  const keys=Object.freeze(['rosa','lia','tomas','ines','caio','nico']);
  const profiles={
    rosa:{name:'Rosa',role:'Guardiã das sementes',skin:'#d7a982',skinHi:'#efc7a1',skinSh:'#ab765e',
      hair:'#b8bcb0',hairHi:'#e1dfc9',hairSh:'#778a7b',shirt:'#ad6650',shirtHi:'#d78a65',shirtSh:'#794b43',
      pants:'#6a6650',pantsHi:'#8e8869',trim:'#e3b86b',style:'apron',hairStyle:'bun',expression:'kind'},
    lia:{name:'Lia',role:'Bióloga do vale',skin:'#88553f',skinHi:'#b17c57',skinSh:'#603d33',
      hair:'#263f38',hairHi:'#46624c',hairSh:'#182e2b',shirt:'#38766b',shirtHi:'#62998a',shirtSh:'#28554a',
      pants:'#665b46',pantsHi:'#99815c',trim:'#e3b86b',style:'vest',hairStyle:'curls',expression:'bright'},
    tomas:{name:'Tomás',role:'Marceneiro',skin:'#ce9670',skinHi:'#e9b78b',skinSh:'#9f6c52',
      hair:'#624339',hairHi:'#886047',hairSh:'#463a31',shirt:'#55788a',shirtHi:'#85a6ad',shirtSh:'#365765',
      pants:'#365765',pantsHi:'#55788a',trim:'#e3b86b',style:'overalls',hairStyle:'beanie',expression:'thoughtful'},
    ines:{name:'Inês',role:'Guia da montanha',skin:'#cfa280',skinHi:'#edc5a1',skinSh:'#a37661',
      hair:'#66413a',hairHi:'#916347',hairSh:'#48362f',shirt:'#824e5c',shirtHi:'#b16c77',shirtSh:'#583c4b',
      pants:'#4b615b',pantsHi:'#6e8070',trim:'#e4d7b9',style:'jacket',hairStyle:'braid',expression:'steady'},
    caio:{name:'Caio',role:'Agricultor do oásis',skin:'#ab7552',skinHi:'#d29b6a',skinSh:'#7c503d',
      hair:'#674332',hairHi:'#8e6340',hairSh:'#493b30',shirt:'#d8ccaa',shirtHi:'#f2dfb4',shirtSh:'#a89d7e',
      pants:'#847454',pantsHi:'#b09a6a',trim:'#d4a84d',style:'wrap',hairStyle:'headwrap',expression:'warm'},
    nico:{name:'Nico',role:'Aprendiz curioso',skin:'#e3b382',skinHi:'#f4cc99',skinSh:'#c9906b',
      hair:'#875734',hairHi:'#b88142',hairSh:'#5e4432',shirt:'#66805a',shirtHi:'#a8b97a',shirtSh:'#435f49',
      pants:'#6a715f',pantsHi:'#929b79',trim:'#e3b86b',style:'patch',hairStyle:'messy',expression:'curious'}
  };
  const heroM={name:'Você',role:'Explorador do vale',skin:'#d2a17b',skinHi:'#edc29b',skinSh:'#ac765b',
    hair:'#634839',hairHi:'#936745',hairSh:'#443b30',shirt:'#66805a',shirtHi:'#a8b97a',shirtSh:'#435f49',
    pants:'#456c70',pantsHi:'#73918a',trim:'#e3b86b',style:'field',hairStyle:'short',expression:'calm'};
  const heroF={...heroM,hair:'#875734',hairHi:'#b88142',hairSh:'#5e4432',
    shirt:'#ad6650',shirtHi:'#d78a65',shirtSh:'#794b43',hairStyle:'ponytail'};
  const definitions=Object.freeze(Object.fromEntries(keys.map(id=>[id,Object.freeze({id,...profiles[id]})])
    .concat([['player',Object.freeze({id:'player',name:'Você',role:'Explorador do vale'})]])));
  Object.values(profiles).forEach(Object.freeze);Object.freeze(profiles);Object.freeze(heroM);Object.freeze(heroF);
  // A margem é transparente: reserva o arco de passada e a ponta da ferramenta.
  // O contato com o chão continua em y+10, sem alterar colisão ou profundidade.
  const W=48,H=52,AX=24,AY=38,FEET_Y=10,MAX_SPRITES=768,MAX_PORTRAITS=256,MAX_SPEECH_BANKS=48;
  const SPEECH_POSES=4,SPEECH_FRAMES=SPEECH_POSES*8;
  const gestures=Object.freeze(['explain','invite','nod','listen','point','reflect','reassure','shrug']);
  const expressions=Object.freeze(['neutral','warm','thoughtful','concerned','joyful','resolved','surprised']);
  const armGestures=Object.freeze(['explain','invite','point','reflect','reassure','shrug']);
  const heldProps=Object.freeze(['seed','notebook','sign','ribbon','crate','vessel']);
  // Rosa acompanha a fala com calma; Nico começa rápido e logo espera. Os
  // tempos pertencem à identidade, sem sorteio ou estado persistente extra.
  const acting=Object.freeze({rosa:[4.9,1.12,.20],lia:[3.8,.95,.09],tomas:[5.3,1.22,.27],
    ines:[4.7,1.07,.16],caio:[4.5,1.04,.13],nico:[3.4,.83,.04],player:[4.4,1,.12]});
  const syllables=Object.freeze(['0121031200103200012010300','01321003001210300121000','01200132000130121000300']);
  const sprites=new Map(),portraits=new Map(),speechBanks=new Map();
  function canvas(w,h){
    if(typeof OffscreenCanvas!=='undefined') return new OffscreenCanvas(w,h);
    const c=document.createElement('canvas');c.width=w;c.height=h;return c;
  }
  function rect(g,c,x,y,w,h){g.fillStyle=c;g.fillRect(x,y,w,h);}
  function limb(g,c,x0,y0,x1,y1,w=3){
    // Segmentos em degraus inteiros evitam contorno borrado/antialias em membros.
    const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1);
    for(let i=0;i<=n;i++) rect(g,c,Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),w,w);
  }
  function clock(opts){return Number.isFinite(opts.time)?opts.time:performance.now();}
  function dirOf(value){return Number.isInteger(value)?((value%4)+4)%4:({left:1,right:2,up:3,esquerda:1,direita:2,cima:3}[value]||0);}
  function profile(id,gender){return id==='player'?(gender==='f'?heroF:heroM):(profiles[id]||profiles.nico);}
  function blend(value,fallback){return Math.round(Math.max(0,Math.min(1,Number.isFinite(value)?value:fallback))*8);}
  function position(actor,opts){return {x:Number.isFinite(opts.x)?opts.x:Math.round(Number(actor.x)||0),
    y:Number.isFinite(opts.y)?opts.y:Math.round(Number(actor.y)||0)};}
  function conversation(opts,allowed=true,id='player'){
    const conversing=allowed&&(!!opts.speaking||gestures.includes(opts.gesture));
    const expression=conversing&&expressions.includes(opts.expression)?opts.expression:'neutral';
    const gesture=conversing&&gestures.includes(opts.gesture)?opts.gesture:'';
    const t=Math.max(0,Number.isFinite(opts.speechTime)?opts.speechTime:clock(opts)/1000);
    const identity=id==='player'?6:Math.max(0,keys.indexOf(id)),[period,pace,delay]=acting[id]||acting.player;
    const animated=conversing&&!opts.reducedMotion,pattern=syllables[identity%syllables.length];
    const mouth=animated&&opts.speaking?Number(pattern[Math.floor(t/(.105*pace))%pattern.length]):0;
    // Preparação -> gesto -> acomodação -> silêncio. A escuta reage apenas
    // de vez em quando; não faz o mesmo aceno repetido de quem está falando.
    const listening=gesture==='listen',beat=Math.max(0,t-delay-(listening?1.35:0))%(period+(listening?2.1:0));
    const entered=t>=delay+(listening?1.35:0),duration=(listening?1.0:1.5)*pace;
    let speechPhase=0;
    if(animated&&gesture&&entered&&beat<duration){
      const progress=beat/duration;speechPhase=progress<.18?1:progress<.61?2:progress<.90?3:0;
    }
    const blinkPeriod=4.1+identity*.29,blinkAt=(t+1.2+identity*.21)%blinkPeriod;
    const speechBlink=animated&&blinkAt>blinkPeriod-.12;
    const gaze=conversing?Math.sign(Number(opts.gaze)||0):0;
    return{conversing,expression,gesture,mouth,speechPhase,speechBlink,gaze};
  }
  function state(actor,opts,hero){
    const rest=!!actor.resting||(!hero&&actor.npcActivity==='rest')||(Number.isFinite(opts.restBlend)&&opts.restBlend>0);
    const restMode=rest&&opts.restMode==='bed'?'bed':rest?'sit':'';
    const restElapsed=Math.max(0,Number.isFinite(opts.restElapsed)?opts.restElapsed:Number(hero?actor.restTimer:actor.activityPhase)||0);
    const restBlend=Number.isFinite(opts.restBlend)?Math.max(0,Math.min(1,opts.restBlend)):Math.min(1,restElapsed/.24);
    const restStage=rest?(opts.reducedMotion?2:Math.round(restBlend*2)):0;
    // Respiração de 4,8s mexe apenas no tórax/tecido. Cabeça, mãos e pés ficam
    // apoiados; os dois níveis ocupam uma família pequena no cache de sprites.
    const restBreath=rest&&!opts.reducedMotion&&restStage===2&&[0,0,0,1,1,1,0,0][Math.floor(restElapsed/.6)%8]?1:0;
    const restDoze=rest&&(opts.reducedMotion||restElapsed>(restMode==='bed'?.35:3.2));
    const speech=conversation(opts,!actor.dead&&!rest,hero?'player':actor.npcId||actor.id);
    const job=!hero&&!actor.moving&&!speech.conversing&&({sort:'sort',observe:'book',work:'work',route:'map',water:'water',plant:'plant'}[actor.npcActivity]||'');
    const activity=((Number(actor.activityPhase)||0)%6.4+6.4)%6.4;
    const npcAction=job&&activity<2.4;
    const action=(hero?actor.actionTimer>0:npcAction)&&!actor.dead&&!rest&&!opts.reducedMotion&&!speech.conversing;
    // A simulação conserva a fase ao parar. A amplitude recolhe a passada até
    // ambos os pés pousarem; valores discretos mantêm o cache de sprites finito.
    const gait=rest||actor.dead||opts.reducedMotion||action?0:blend(actor.gaitBlend,actor.moving?1:0);
    const moving=gait>0,runMix=moving?blend(actor.gaitRunBlend,actor.running?1:0):0;
    return {dir:dirOf(opts.facing??actor.dir),frame:moving?((Math.floor((Number(actor.anim)||0)/(Math.PI/8))%16)+16)%16:0,
      moving,gait,runMix,rest,restMode,restStage,restBreath,restDoze,...speech,
      heldProp:!rest&&!actor.dead&&heldProps.includes(opts.heldProp)?opts.heldProp:'',
      action:action?(hero?(['water','plant','harvest'].includes(actor.actionType)?actor.actionType:'work'):job):'',
      actionFrame:action?Math.min(7,Math.max(0,Math.floor((hero?(1-actor.actionTimer/.35):activity/2.4)*8))):0,
      blink:speech.conversing?speech.speechBlink:!!actor.dead||(!moving&&!action&&!opts.reducedMotion&&(clock(opts)%5200)>5050),
      hat:hero&&!!actor.hat,coat:hero&&!!actor.coatEquipped,scarf:hero&&!!actor.scarf,
      boots:hero&&!!actor.boots,gloves:hero&&!!actor.glovesEquipped,
      blanket:hero&&!!actor.blanketEquipped,towel:hero&&actor.towelTimer>0};
  }
  function paintAction(g,d,s,hand,behind){
    if(!s.action||(s.dir===3)!==behind)return;
    const f=s.actionFrame,side=s.dir===1||s.dir===2,back=s.dir===3;
    const reach=[0,-1,1,3,4,3,2,0][f],drop=[0,-1,0,2,3,2,1,0][f];
    // A mão direita alcança o chão na direção observada; de costas, ferramenta
    // e antebraço são desenhados antes do tronco para haver oclusão verdadeira.
    const hx=side?3+reach:back?7:1+Math.round(reach/2),hy=side?-10+drop:back?-17-drop:-8+drop;
    limb(g,s.coat?'#739598':d.shirtHi,side?0:back?5:5,back?-15:-13,hx-1,hy-1,3);
    rect(g,hand,hx,hy,3,2);g.save();g.translate(hx+2,hy+1);
    if(s.action==='water'){
      const pouring=f>=3&&f<=5;
      rect(g,P.edge,-2,-5,6,5);rect(g,'#82b6aa',-2,-5,5,4);rect(g,P.cream,-1,-5,3,1);
      rect(g,P.edge,-3,-6,4,1);rect(g,P.edge,-4,-5,1,3);
      if(back){rect(g,P.edge,2,-7,2,4);rect(g,'#82b6aa',3,-8,1,2);}
      else if(side){rect(g,P.edge,4,pouring?-2:-4,4,2);rect(g,'#82b6aa',6,pouring?-1:-5,2,2);}
      else{rect(g,P.edge,1,-1,2,4);rect(g,'#82b6aa',1,1,2,2);}
      if(pouring){
        const dx=side?8:back?3:1,dy=side?1:back?-11:4;
        rect(g,P.snow,dx,dy,1,2);rect(g,'#82b6aa',dx+(side?1:0),dy+(back?-3:3),1,2);
        if(f===4)rect(g,P.snow,dx+(side?2:-2),dy+(back?-5:5),2,1);
      }
    }else if(s.action==='harvest'){
      const picked=f>=4,yy=picked?-3:-1;
      rect(g,P.soil,-3,yy,7,4);rect(g,P.amber,-3,yy,7,1);rect(g,'#bd9450',-2,yy+2,5,1);
      rect(g,P.soil,-2,yy-2,1,2);rect(g,P.soil,2,yy-2,1,2);rect(g,P.amber,-1,yy-3,3,1);
      if(picked){rect(g,P.terra,-1,yy-2,3,2);rect(g,P.leaf,0,yy-4,2,2);rect(g,P.cream,-1,yy-2,1,1);}
    }else if(s.action==='book'||s.action==='map'){
      const map=s.action==='map';rect(g,map?P.soil:P.edge,-4,-5,10,7);rect(g,P.cream,-3,-5,8,6);
      rect(g,P.amber,0,-5,1,6);rect(g,map?P.sage:P.edge,-2,-3,2,1);rect(g,map?P.sage:P.edge,2,-2,2,1);
      if(f>=3&&f<=5){rect(g,P.snow,1,-6,3,2);rect(g,P.amber,0,-4,2,4);}
      rect(g,hand,-4,0,2,2);rect(g,hand,5,-1,2,2);
    }else if(s.action==='plant'||s.action==='sort'){
      rect(g,P.soil,-2,-3,5,5);rect(g,P.amber,-2,-3,5,1);rect(g,P.cream,-1,-1,2,2);
      if(f>=3&&f<=5){rect(g,P.amber,side?4:0,back?-7:s.action==='sort'?1:4,1,1);if(f===4)rect(g,P.amber,side?6:2,back?-9:s.action==='sort'?2:6,1,1);}
    }else{
      // Ferramenta curta acompanha o braço: coleta deixa de usar saco de sementes.
      const tip=back?-8:side?-2:4;
      limb(g,P.soil,0,0,side?5:0,tip,1);rect(g,P.cream,side?4:-2,tip,side?4:5,2);rect(g,'#82b6aa',side?4:-2,tip,side?4:5,1);
    }
    g.restore();
  }
  // Cabeça compartilhada: equipamentos e identidade continuam iguais em pé,
  // sentado e deitado. O descanso muda olhos/apoio, não troca o personagem.
  function headDip(s){
    if(!s.conversing||!s.speechPhase)return 0;
    if(s.gesture==='nod')return [0,-1,1,0][s.speechPhase];
    if(s.gesture==='listen'||s.gesture==='reflect')return s.speechPhase===2?1:0;
    if(s.gesture==='reassure')return s.speechPhase===3?1:0;
    return 0;
  }
  function speechArms(s){return !s.moving&&(!!s.heldProp||(s.conversing&&s.speechPhase>0&&armGestures.includes(s.gesture)));}
  function bothSpeechArms(s){return speechArms(s)&&(s.gesture==='shrug'||s.heldProp==='crate'||s.heldProp==='notebook'||s.heldProp==='vessel');}
  function paintHead(g,d,s){
    if(s.conversing){g.save();g.translate(0,headDip(s));}
    const side=s.dir===1||s.dir===2,back=s.dir===3;
    // Pescoço, cabeça e cabelo têm silhuetas distintas por membro do elenco.
    rect(g,d.skinSh,-2,-18,4,3);rect(g,d.skinHi,-2,-18,2,2);
    const hx=side?-4:-5,hw=side?9:10;
    rect(g,d.hair,side?-5:-6,-27,side?10:12,10);
    rect(g,d.skin,hx,-24,hw,7);rect(g,d.skinHi,hx,-23,2,5);rect(g,d.skinSh,hx+hw-2,-22,2,5);
    rect(g,d.skin,side?5:-6,-22,side?1:2,3);if(!side) rect(g,d.skinSh,5,-22,1,3);
    if(back){rect(g,d.hair,-6,-26,12,9);rect(g,d.hairHi,-5,-25,2,7);rect(g,d.hairSh,4,-25,2,8);}
    else{
      rect(g,d.hair,hx,-25,hw,2);rect(g,d.hairHi,hx,-25,3,1);
      rect(g,d.hair,hx,-23,2,2);rect(g,d.hairSh,hx+hw-1,-24,1,3);
      if(side){rect(g,P.ink,s.restDoze?2:3,-22,s.restDoze?2:1,s.restDoze||s.blink?1:2);rect(g,d.skinHi,5,-20,1,1);rect(g,d.skinSh,3,-18,2,1);}
      else{
        if(!s.restDoze){rect(g,P.cream,-3,-22,2,1);rect(g,P.cream,2,-22,2,1);}
        rect(g,P.ink,s.restDoze?-3:-2,-22,s.restDoze?2:1,s.restDoze||s.blink?1:2);rect(g,P.ink,2,-22,s.restDoze?2:1,s.restDoze||s.blink?1:2);
        rect(g,d.skinSh,0,-20,1,1);rect(g,d.skinSh,-1,-18,3,1);
        if(d.expression==='curious'){rect(g,'#a86748',-4,-20,1,1);rect(g,'#a86748',3,-20,1,1);}
        if(d.expression==='kind'){rect(g,P.edge,-4,-23,4,1);rect(g,P.edge,1,-23,4,1);rect(g,P.amber,-4,-21,1,1);}
      }
    }
    if(d.hairStyle==='curls'){
      for(const [x,y] of [[-7,-25],[-5,-28],[-1,-29],[3,-28],[5,-26],[-7,-21],[5,-21]]){
        rect(g,d.hair,x,y,3,3);rect(g,d.hairHi,x,y,1,1);
      }
    }else if(d.hairStyle==='bun'){
      rect(g,d.hair,side?-7:-3,-29,side?4:6,4);rect(g,d.hairHi,side?-7:-3,-29,3,1);
      rect(g,P.amber,side?-5:3,-26,2,1);
    }else if(d.hairStyle==='beanie'){
      rect(g,d.shirtSh,-6,-28,12,4);rect(g,d.shirt,-5,-29,10,3);rect(g,d.shirtHi,-5,-28,3,1);
      rect(g,d.shirtHi,-6,-25,12,2);rect(g,P.amber,side?3:3,-25,2,1);
    }else if(d.hairStyle==='headwrap'){
      rect(g,'#a07839',-6,-28,12,5);rect(g,d.trim,-5,-29,10,4);rect(g,P.amber,-5,-29,3,1);
      rect(g,P.cream,-6,-25,12,1);rect(g,d.trim,side?-6:5,-23,2,7);
      if(!back){rect(g,d.hair,side?2:-3,-19,side?3:7,2);rect(g,d.skin,side?3:-1,-19,side?1:3,1);}
    }else if(d.hairStyle==='braid'||d.hairStyle==='ponytail'){
      if(d.hairStyle==='braid'){
        for(let i=0;i<4;i++){rect(g,d.hair,side?-6:5,-23+i*2,3,2);rect(g,d.hairHi,side?-6:5,-23+i*2,1,1);}
        rect(g,d.trim,side?-6:5,-15,2,1);
      }else{rect(g,d.hair,side?-7:5,-24,3,8);rect(g,d.hairHi,side?-7:5,-24,1,6);rect(g,d.trim,side?-7:5,-24,2,1);}
    }else if(d.hairStyle==='messy'){
      rect(g,d.hair,-5,-28,3,2);rect(g,d.hair,0,-29,3,3);rect(g,d.hairHi,0,-28,1,1);
      rect(g,d.hair,4,-27,2,3);
    }
    if(s.hat){
      rect(g,'#9b793d',-7,-29,14,3);rect(g,P.amber,-6,-30,12,3);rect(g,P.cream,-6,-30,5,1);
      rect(g,P.edge,-7,-27,14,1);rect(g,'#bd9450',-9,-26,18,2);rect(g,P.amber,-9,-26,16,1);
      rect(g,P.cream,-8,-26,5,1);rect(g,'#9b793d',6,-25,3,1);
    }
    if(s.scarf){
      rect(g,P.terra,side?-4:-5,-17,side?8:10,2);rect(g,'#d78a65',side?-4:-5,-17,side?8:10,1);
      rect(g,P.terra,side?2:3,-15,2,5);rect(g,'#794b43',side?3:4,-14,1,4);
    }
    if(s.conversing&&!back){
      // O queixo continua no mesmo rosto, inclusive sob a barba do Caio.
      // Expressão e boca não atravessam os equipamentos ou o penteado.
      const mx=side?3:-1,my=-18;
      if(!side&&s.gaze&&!s.blink){
        // Só as pupilas mudam: não deslocamos olhos, óculos ou a silhueta.
        rect(g,d.skin,-3,-22,3,2);rect(g,d.skin,1,-22,3,2);
        rect(g,P.cream,-3,-22,3,1);rect(g,P.cream,1,-22,3,1);
        rect(g,P.ink,-2+s.gaze,-22,1,2);rect(g,P.ink,2+s.gaze,-22,1,2);
      }
      rect(g,d.skin,side?2:-2,-19,side?3:5,2);
      if(s.mouth===1){rect(g,d.skinSh,mx,my-1,side?2:3,2);rect(g,P.cream,mx,my-1,side?1:2,1);}
      else if(s.mouth===2){rect(g,P.ink,mx,my-1,side?2:3,2);rect(g,d.skinSh,mx,my+1,side?2:3,1);}
      else if(s.mouth===3){rect(g,d.skinSh,mx,my-1,2,2);rect(g,P.ink,mx+1,my-1,1,1);}
      else{rect(g,d.skinSh,mx,my,side?2:3,1);if(['warm','joyful'].includes(s.expression))rect(g,P.cream,mx,my,side?1:2,1);}
      if(s.expression==='concerned'){
        rect(g,d.hairSh,side?2:-3,-24,side?2:2,1);if(!side)rect(g,d.hairSh,2,-24,2,1);
        rect(g,d.hairSh,side?3:-2,-23,1,1);if(!side)rect(g,d.hairSh,2,-23,1,1);
      }else if(s.expression==='thoughtful'){
        rect(g,d.hairSh,side?2:-3,-24,side?2:3,1);if(!side)rect(g,d.hairSh,2,-23,2,1);
      }else if(s.expression==='joyful'){
        rect(g,d.skinSh,side?4:-4,-20,1,1);if(!side)rect(g,d.skinSh,3,-20,1,1);
        rect(g,P.cream,mx,my-1,side?1:2,1);
      }else if(s.expression==='resolved'){
        rect(g,d.hairSh,side?2:-3,-23,3,1);if(!side)rect(g,d.hairSh,1,-23,3,1);
        if(!s.mouth)rect(g,d.skinSh,mx,my,side?2:3,1);
      }else if(s.expression==='surprised'){
        rect(g,d.hairSh,side?2:-3,-25,3,1);if(!side)rect(g,d.hairSh,1,-25,3,1);
        if(!s.mouth)rect(g,P.ink,mx,my-1,2,2);
      }
    }
    if(s.towel){rect(g,P.cream,side?-3:-4,-15,2,6);rect(g,P.snow,side?-3:-4,-15,1,6);}
    if(s.conversing)g.restore();
  }
  function paintSpeechGesture(g,d,s,hand,behind){
    if(!speechArms(s)||(s.dir===3)!==behind)return;
    const side=s.dir===1||s.dir===2,back=s.dir===3,phase=s.speechPhase;
    const broad=d.expression==='curious'||d.expression==='bright',quiet=d.expression==='kind'||d.expression==='thoughtful';
    const emphasis=phase===2,settling=phase===3;
    let hx=side?3:7,hy=-9,w=2;
    if(phase){
      if(s.gesture==='explain'){hx+=(emphasis?3:1)+(broad?1:0);hy-=emphasis?(quiet?2:3):1;}
      if(s.gesture==='invite'){hx+=emphasis?4:settling?2:0;hy-=emphasis?2:1;w=emphasis?4:3;}
      if(s.gesture==='point'){hx+=emphasis?6:settling?3:1;hy-=emphasis?4:2;w=emphasis?3:2;}
      if(s.gesture==='reflect'){hx=side?2:1;hy=emphasis?-14:-11;w=3;}
      if(s.gesture==='reassure'){hx=side?1:0;hy=emphasis?-12:settling?-10:-9;w=3;}
      if(s.gesture==='shrug'){hx=side?6:9;hy=emphasis?-13:-10;w=3;}
    }
    // Papel/caixa pedem apoio contínuo das duas mãos. A interpretação segue
    // no rosto; não arremessa o objeto a cada gesto do personagem.
    if(s.heldProp==='crate'){hx=6;hy=-6;w=3;}
    if(s.heldProp==='notebook'){hx=side?4:5;hy=-10;w=3;}
    if(s.heldProp==='vessel'){hx=5;hy=-6;w=3;}
    if(s.heldProp==='sign'){hx=side?8:11;hy=-7;w=3;}
    if(s.heldProp==='seed'||s.heldProp==='ribbon')hy=Math.max(-11,hy);
    // A articulação em dois segmentos mantém as mãos abaixo do queixo.
    // Em três quartos/costas, o tronco cobre o braço distante de verdade.
    const sleeve=s.coat?'#739598':d.shirtHi;
    const shoulder=side?-1:5,elbow=side?1:6,elbowY=s.gesture==='reflect'||s.gesture==='reassure'?-8:-10;
    limb(g,sleeve,shoulder,-14,elbow,elbowY,3);limb(g,sleeve,elbow,elbowY,hx,hy,2);
    rect(g,hand,hx,hy,w,2);rect(g,d.skinHi,hx,hy,w-1,1);
    if(s.gesture==='point'&&emphasis&&!s.heldProp)rect(g,hand,hx+w,hy,2,1);
    if(s.gesture==='invite'&&emphasis&&!s.heldProp)rect(g,hand,hx+1,hy-1,1,1);
    if(bothSpeechArms(s)){
      const other=s.heldProp==='crate'?hx-12:['notebook','vessel'].includes(s.heldProp)?hx-9:side?-6:-11,otherY=hy+(side&&!s.heldProp?1:0);
      limb(g,s.coat?'#2e505b':d.shirtSh,side?-3:-7,-14,other+1,-10,3);
      limb(g,s.coat?'#2e505b':d.shirtSh,other+1,-10,other,otherY,2);
      rect(g,hand,other,otherY,3,2);rect(g,d.skinHi,other,otherY,2,1);
    }
    if(s.heldProp)paintHeldProp(g,d,s,hx,hy,hand);
  }
  function paintHeldProp(g,d,s,x,y,hand){
    if(s.heldProp==='seed'){
      rect(g,P.soil,x,y-4,4,5);rect(g,P.cream,x,y-4,3,4);rect(g,P.amber,x+1,y-3,2,2);rect(g,P.leaf,x+1,y-4,1,1);
    }else if(s.heldProp==='ribbon'){
      rect(g,P.amber,x,y-2,7,2);rect(g,P.cream,x+1,y-2,3,1);rect(g,P.terra,x+4,y,2,4);rect(g,P.cream,x+4,y,1,2);
    }else if(s.heldProp==='sign'){
      rect(g,P.soil,x,y-5,2,6);rect(g,'#8d6d4d',x-3,y-8,8,5);rect(g,P.amber,x-3,y-8,8,1);rect(g,P.cream,x-2,y-6,5,1);rect(g,P.edge,x-1,y-5,4,1);
    }else if(s.heldProp==='notebook'){
      rect(g,P.edge,x-8,y-6,10,7);rect(g,P.cream,x-7,y-6,8,6);rect(g,P.amber,x-3,y-6,1,6);
      rect(g,P.sage,x-6,y-4,2,1);rect(g,P.sage,x-1,y-3,2,1);rect(g,hand,x-9,y,3,2);
    }else if(s.heldProp==='crate'){
      rect(g,P.soil,x-11,y-5,12,7);rect(g,'#b99861',x-11,y-5,11,6);rect(g,P.amber,x-10,y-5,9,1);
      rect(g,P.soil,x-11,y-2,12,1);rect(g,P.soil,x-9,y-4,1,6);rect(g,P.soil,x-2,y-4,1,6);
      rect(g,P.leaf,x-8,y-7,3,2);rect(g,P.terra,x-5,y-6,3,1);rect(g,hand,x-12,y,3,2);
    }else if(s.heldProp==='vessel'){
      // Jarro de barro: boca estreita, bojo e três marcas de procedência.
      // Fica abaixo do queixo, abraçado pelas mãos, sem oscilar no discurso.
      rect(g,P.soil,x-7,y-9,8,3);rect(g,'#c68b5d',x-7,y-9,8,1);rect(g,P.soil,x-6,y-8,6,1);
      rect(g,P.soil,x-9,y-6,12,5);rect(g,P.soil,x-8,y-7,10,8);
      rect(g,P.terra,x-8,y-6,10,6);rect(g,'#c68b5d',x-7,y-7,8,2);
      rect(g,P.amber,x-7,y-5,1,4);rect(g,P.cream,x-5,y-3,1,2);rect(g,P.sage,x-3,y-3,1,2);rect(g,P.amber,x-1,y-3,1,2);
      rect(g,hand,x-9,y,3,2);
    }
    // Palma à frente do objeto, com o cabo/papel apoiado na mesma âncora.
    rect(g,hand,x,y,3,2);rect(g,d.skinHi,x,y,2,1);
  }
  function paintRest(g,d,s){
    // O primeiro estágio conserva a silhueta anterior ao agachar. A mesma
    // sequência ao contrário serve para levantar, sem reiniciar a passada.
    if(s.restStage===0){paintBody(g,d,{...s,rest:false,restDoze:false,gait:0,runMix:0,action:'',blink:false});return;}
    g.save();g.translate(AX,AY);
    const bed=s.restMode==='bed'&&s.restStage===2;
    if(!bed&&s.dir===1)g.scale(-1,1);
    const side=!bed&&(s.dir===1||s.dir===2),back=!bed&&s.dir===3;
    const shirt=s.coat?'#426d72':d.shirt,shirtHi=s.coat?'#739598':d.shirtHi,shirtSh=s.coat?'#2e505b':d.shirtSh;
    const hand=s.gloves?'#b79562':d.skin,boot=s.boots?'#40534a':P.soil;
    if(bed){
      // Âncora fornecida pela integração: pés = margem inferior do colchão-5.
      // A cabeça repousa no travesseiro, e a manta cobre as pernas sem sombra
      // projetada no piso. O chapéu equipado fica ao lado, sobre o colchão.
      rect(g,shirtSh,-6,-11,12,9);rect(g,shirt,-5,-11,10,7);rect(g,shirtHi,-5,-11-s.restBreath,4,5);
      rect(g,hand,-6,-8,3,3);rect(g,hand,3,-8,3,3);
      const quilt=s.blanket?P.sage:'#819494',quiltHi=s.blanket?P.leaf:'#a2b4aa';
      rect(g,P.edge,-8,-7,16,7);rect(g,quilt,-7,-7,14,6);rect(g,quiltHi,-7,-7-s.restBreath,14,2);
      for(let x=-5;x<=5;x+=5){rect(g,s.blanket?P.amber:'#bbccc0',x,-4,1,3);}
      rect(g,P.edge,-7,-1,14,1);
      g.save();g.translate(0,6);paintHead(g,d,{...s,dir:0,hat:false});g.restore();
      if(s.hat){rect(g,'#9b793d',9,-19,9,5);rect(g,P.amber,10,-20,7,4);rect(g,P.cream,10,-20,3,1);rect(g,P.edge,9,-16,9,1);}
    }else{
      const drop=s.restStage===1?3:5;
      // Apoio dobrado e compacto. Os pés permanecem no y=0 da mesma âncora de
      // colisão/profundidade; não deslizam com a respiração nem com o cochilo.
      if(side){
        limb(g,d.pants,-3,-9,4,-6,4);limb(g,d.pantsHi,0,-8,5,-5,3);
        limb(g,d.pantsHi,5,-5,4,-2,3);rect(g,boot,4,-2,5,2);rect(g,P.ink,4,-1,5,1);
        limb(g,d.pants,-3,-7,-4,-3,3);rect(g,boot,-5,-2,5,2);rect(g,P.ink,-5,-1,5,1);
      }else{
        rect(g,d.pants,-5,-9,10,6);limb(g,d.pants,-4,-6,-7,-3,4);limb(g,d.pantsHi,2,-6,5,-3,4);
        limb(g,d.pantsHi,-5,-3,2,-2,3);limb(g,d.pants,4,-3,-2,-2,3);
        rect(g,boot,-7,-2,4,2);rect(g,boot,4,-2,4,2);rect(g,P.ink,-7,-1,4,1);rect(g,P.ink,4,-1,4,1);
      }
      if(s.boots){rect(g,P.amber,side?5:-6,-2,2,1);if(!side)rect(g,P.amber,5,-2,2,1);}
      const top=-16+drop;
      rect(g,shirt,side?-4:-6,top-s.restBreath,side?8:12,9);rect(g,shirtHi,side?-4:-6,top-s.restBreath,2,7);rect(g,shirtSh,side?2:4,top,2,9);
      if(!back){
        if(d.style==='apron'||d.style==='vest'||d.style==='overalls'){rect(g,d.style==='overalls'?d.pants:P.cream,-2,top+2,4,5);rect(g,d.trim,1,top+3,1,1);}
        else{rect(g,P.cream,side?-1:-2,top,side?2:4,2);rect(g,shirtSh,0,top+3,1,3);}
        if(d.style==='wrap'){rect(g,d.trim,-4,top+1,8,2);rect(g,'#a07839',3,top+3,2,4);}
        if(d.style==='field'&&!s.coat){rect(g,P.soil,side?-4:-6,top+5,3,3);rect(g,P.amber,side?-4:-6,top+5,3,1);}
        if(d.style==='patch'){rect(g,d.trim,3,top+4,2,2);}
      }
      // Antebraços desenhados sobre as coxas: mãos soltas apoiadas no colo.
      if(side){limb(g,shirtHi,-1,top+2,1,top+6,3);limb(g,shirtHi,1,top+6,5,-5,2);rect(g,hand,5,-5,3,2);}
      else{limb(g,shirtSh,-7,top+2,-5,-6,3);limb(g,shirtHi,5,top+2,3,-6,3);rect(g,hand,-4,-5,3,2);rect(g,hand,1,-5,3,2);}
      if(s.blanket){rect(g,P.sage,side?-5:-7,-9,side?13:14,6);rect(g,P.leaf,side?-5:-7,-9-s.restBreath,side?13:14,2);for(let i=0;i<4;i++)rect(g,P.amber,-5+i*3,-6,1,2);}
      g.save();g.translate(side&&s.restDoze?1:0,drop);paintHead(g,d,s);g.restore();
    }
    g.restore();
  }
  // Pincel no espaço dos pés. Todas as arestas são passos inteiros da grade.
  function paintBody(g,d,s){
    if(s.rest){paintRest(g,d,s);return;}
    g.save();g.translate(AX,AY);if(s.dir===1) g.scale(-1,1);
    const side=s.dir===1||s.dir===2,back=s.dir===3;
    const strength=s.gait/8,run=s.runMix/8;
    const walkX=[4,3,1,0,-2,-3,-5,-6,-6,-5,-4,-2,0,2,3,4];
    const runX=[5,3,1,-1,-3,-5,-7,-7,-6,-5,-3,-1,1,3,4,5];
    const walkY=[0,0,0,0,0,0,0,0,-1,-2,-3,-3,-2,-1,-1,0];
    const runY=[0,0,0,0,0,0,-1,-2,-3,-3,-3,-3,-2,-2,-1,0];
    const gaitX=f=>walkX[f]+(runX[f]-walkX[f])*run;
    const gaitY=f=>(walkY[f]+(runY[f]-walkY[f])*run)*strength;
    const careful=['book','map','sort'].includes(s.action);
    const lift=s.rest?5:(s.action?(careful?[0,0,0,-1,-1,0,0,0]:[0,-1,0,2,3,2,1,0])[s.actionFrame]:Math.round(-strength*(run>.5?[0,0,0,0,0,0,1,1]:[0,0,1,1,1,1,0,0])[s.frame%8]));
    const boot=s.boots?'#40534a':P.soil,sole=P.ink;
    const shirt=s.coat?'#426d72':d.shirt,shirtHi=s.coat?'#739598':d.shirtHi,shirtSh=s.coat?'#2e505b':d.shirtSh;
    const hand=s.gloves?'#b79562':d.skin;
    if(s.rest){
      rect(g,d.pants,-7,-5,6,4);rect(g,d.pantsHi,-7,-5,6,1);
      rect(g,d.pants,1,-4,6,3);rect(g,d.pantsHi,1,-4,5,1);
      rect(g,boot,-8,-2,4,2);rect(g,boot,5,-2,4,2);
    }else if(side){
      // Contatos em 0 e π. Apoio de 12px com ciclo de 24px ao andar;
      // corrida de 32px encurta o apoio e flexiona o joelho na recuperação.
      // A perna tem dois segmentos de 4,5px: o joelho dobra, não estica.
      for(const rear of [true,false]){
        const f=(s.frame+(rear?8:0))%16,idle=rear?-1:-3;
        const fx=Math.round(idle+(gaitX(f)-idle)*strength),fy=Math.round(gaitY(f));
        const hip=-2,hy=-8+Math.min(0,lift),dy=-3+fy-hy,dx=fx-hip;
        const distance=Math.max(.01,Math.hypot(dx,dy)),bend=Math.sqrt(Math.max(0,20.25-distance*distance/4))*strength;
        const knee=Math.round((hip+fx)/2+dy/distance*bend),ky=Math.round((hy-3+fy)/2-dx/distance*bend);
        const color=rear?d.pants:d.pantsHi;
        limb(g,color,hip,hy,knee,ky,3);limb(g,color,knee,ky,fx,-3+fy,3);
        rect(g,boot,fx,-3+fy,4,3);rect(g,sole,fx,-1+fy,4,1);
        if(s.boots)rect(g,P.amber,fx+1,-3+fy,2,1);
      }
    }else{
      for(const left of [true,false]){
        const f=(s.frame+(left?0:8))%16,xx=left?-5:1;
        const depth=(gaitX(f)+1)*(back?-1:1)*.17*strength;
        const yy=Math.round(Math.min(0,depth+gaitY(f)*.6));
        const knee=xx+Math.round((left?-1:1)*run*strength*(gaitY(f)<-1?1:0));
        limb(g,d.pants,xx,-8+Math.min(0,lift),knee,-5+Math.round(yy/2),4);
        limb(g,d.pantsHi,knee,-5+Math.round(yy/2),xx,-3+yy,3);
        rect(g,boot,xx-Number(left),-3+yy,5,3);rect(g,sole,xx-Number(left),-1+yy,5,1);
        if(s.boots)rect(g,P.amber,xx,-3+yy,2,1);
      }
    }
    paintAction(g,d,s,hand,true);
    paintSpeechGesture(g,d,s,hand,true);
    // Na corrida o peito avança um pixel sobre o apoio; cabeça e roupa seguem
    // o mesmo volume, sem sacudir os pés ou deslocar a sombra.
    g.translate(side?Math.round(run*strength):0,lift);
    // Manga posterior e mãos alternam com a perna oposta.
    const swing=Math.round((gaitX(s.frame)+1)*.28*strength*(back?1:-1));
    if(side){
      const arm=(gaitX(s.frame)+1)*(.45+run*.1)*strength;
      const rearHand=Math.round(arm),frontHand=Math.round(-arm),handY=-7-Math.round(run*2);
      if(!(bothSpeechArms(s))){
        limb(g,shirtSh,-2,-15,Math.round(rearHand*.45)-2,-11,3);
        limb(g,shirtSh,Math.round(rearHand*.45)-2,-11,rearHand-1,handY-1,2);rect(g,hand,rearHand,handY,2,2);
      }
      rect(g,shirt,-4,-16,8,9);rect(g,shirtHi,-4,-15,2,7);rect(g,shirtSh,2,-15,2,9);
      if(!s.action&&!speechArms(s)){
        limb(g,shirtHi,-1,-14,Math.round(frontHand*.4)-1,-10,3);
        limb(g,shirtHi,Math.round(frontHand*.4)-1,-10,frontHand,handY-1,2);rect(g,hand,frontHand+1,handY,2,2);
      }
    }else{
      if(!(bothSpeechArms(s))){rect(g,shirtSh,-8,-14+swing,3,6);rect(g,hand,-8,-8+swing,2,2);}
      rect(g,shirt,-6,-16,12,9);rect(g,shirtHi,-6,-15,2,7);rect(g,shirtSh,4,-15,2,8);
      rect(g,shirt,-6,-7,12,1);rect(g,shirt,-6,-15,12,2);
      rect(g,shirt,-6,-15,12,2);
      if(!s.action&&!speechArms(s)){rect(g,shirtHi,5,-14-swing,3,6);rect(g,hand,6,-8-swing,2,2);}
    }
    if(d.style==='apron'&&!s.coat){
      rect(g,d.shirt,side?-5:-7,-8,side?10:14,4);rect(g,d.shirtSh,side?3:5,-8,2,4);
      if(!back){rect(g,P.cream,side?-2:-3,-14,side?4:6,8);rect(g,P.amber,side?-2:-3,-7,side?4:6,1);}
    }else if(d.style==='overalls'&&!s.coat){
      rect(g,P.cream,side?-4:-6,-15,side?7:12,3);
      if(!back){rect(g,d.pants,side?-1:-3,-14,side?4:6,8);rect(g,d.trim,side?0:-2,-13,1,1);rect(g,d.trim,2,-13,1,1);}
      rect(g,d.pantsHi,side?0:-2,-10,3,2);
    }else if(d.style==='vest'&&!s.coat){
      rect(g,P.cream,side?-1:-2,-15,side?2:4,7);rect(g,d.trim,side?2:3,-12,2,2);
      if(!back){rect(g,P.soil,-4,-15,1,8);rect(g,P.amber,-4,-8,3,3);rect(g,P.soil,-4,-8,3,1);}
    }else if(d.style==='wrap'&&!s.coat){
      rect(g,d.trim,side?-3:-5,-15,side?6:10,2);rect(g,'#a07839',side?2:3,-13,2,5);
      rect(g,P.cream,side?-3:-5,-7,side?7:10,1);
    }else{
      if(!back){rect(g,P.cream,side?-1:-2,-16,side?2:4,2);rect(g,shirtSh,0,-12,1,4);}
      if(d.style==='patch'){rect(g,d.trim,side?1:3,-11,2,2);rect(g,shirtHi,side?1:3,-10,1,1);}
      if(d.style==='field'&&!s.coat){
        // Bandoleira e bolsa de ferramentas, sem referência a traje de outro jogo.
        if(back){for(let i=0;i<6;i++) rect(g,P.soil,-3+i,-15+i,2,1);}
        else if(!side){for(let i=0;i<6;i++) rect(g,P.soil,3-i,-15+i,2,1);}
        rect(g,P.soil,side?-4:-6,-10,3,4);rect(g,P.amber,side?-4:-6,-10,3,1);
      }
    }
    if(s.coat){
      rect(g,shirt,side?-4:-6,-8,side?8:12,3);rect(g,shirtSh,side?-4:-6,-5,side?8:12,1);
      rect(g,P.cream,side?-4:-5,-17,side?8:10,2);
      if(!back){rect(g,P.ink,side?1:0,-14,1,8);rect(g,P.amber,side?1:0,-13,1,1);}
      if(!s.action)rect(g,P.cream,side?0:6,-9-swing,2,1);
    }
    if(s.blanket){
      rect(g,P.sage,side?-5:-7,-16,side?9:14,10);rect(g,P.leaf,side?-5:-7,-16,side?9:14,1);
      for(let i=0;i<4;i++) rect(g,P.amber,(side?-4:-6)+i*3,-9,1,2);
    }
    paintHead(g,d,s);
    paintAction(g,d,s,hand,false);
    paintSpeechGesture(g,d,s,hand,false);
    g.restore();
  }
  function sprite(id,gender,s){
    const key=id+'|'+gender+'|'+Object.values(s).join(',');let c=sprites.get(key);if(c) return c;
    const raw=canvas(W,H),rg=raw.getContext('2d');rg.imageSmoothingEnabled=false;paintBody(rg,profile(id,gender),s);
    c=canvas(W,H);const g=c.getContext('2d');g.imageSmoothingEnabled=false;
    g.drawImage(raw,-1,0);g.drawImage(raw,1,0);g.drawImage(raw,0,-1);g.drawImage(raw,0,1);
    g.globalCompositeOperation='source-in';rect(g,P.ink,0,0,W,H);g.globalCompositeOperation='source-over';g.drawImage(raw,0,0);
    if(sprites.size>=MAX_SPRITES) sprites.delete(sprites.keys().next().value);sprites.set(key,c);return c;
  }
  function speechFrame(s){return (s.speechPhase*2+Number(s.blink))*4+s.mouth;}
  function drawSprite(g,id,gender,s,x,y){
    if(!s.conversing){g.drawImage(sprite(id,gender,s),x,y);return;}
    // Cada banco contém a combinação inteira: 4 bocas × 2 olhos × 4 poses.
    // Abrir uma fala aquece um banco; avançar o texto só recorta drawImage.
    // A identidade, roupa e fase da passada continuam no mesmo desenho.
    const bankState={...s,mouth:0,blink:false,speechBlink:false,speechPhase:0};
    const key=id+'|'+(id==='player'?gender:'m')+'|'+Object.values(bankState).join(',');let bank=speechBanks.get(key);
    if(!bank){
      const raw=canvas(W*SPEECH_FRAMES,H),rg=raw.getContext('2d');rg.imageSmoothingEnabled=false;
      for(let phase=0;phase<SPEECH_POSES;phase++)for(let blink=0;blink<2;blink++)for(let mouth=0;mouth<4;mouth++){
        const frame=(phase*2+blink)*4+mouth;rg.save();rg.translate(frame*W,0);
        paintBody(rg,profile(id,gender),{...s,mouth,blink:!!blink,speechBlink:!!blink,speechPhase:phase});rg.restore();
      }
      bank=canvas(W*SPEECH_FRAMES,H);const bg=bank.getContext('2d');bg.imageSmoothingEnabled=false;
      bg.drawImage(raw,-1,0);bg.drawImage(raw,1,0);bg.drawImage(raw,0,-1);bg.drawImage(raw,0,1);
      bg.globalCompositeOperation='source-in';rect(bg,P.ink,0,0,W*SPEECH_FRAMES,H);bg.globalCompositeOperation='source-over';bg.drawImage(raw,0,0);
      if(speechBanks.size>=MAX_SPEECH_BANKS)speechBanks.delete(speechBanks.keys().next().value);speechBanks.set(key,bank);
    }
    g.drawImage(bank,speechFrame(s)*W,0,W,H,x,y,W,H);
  }
  function shadow(g,x,feet,rest){
    rect(g,'rgba(24,59,54,0.13)',x-(rest?10:8),feet-2,rest?20:16,4);
    rect(g,'rgba(24,59,54,0.22)',x-(rest?8:6),feet-1,rest?16:12,2);
    rect(g,'rgba(24,59,54,0.22)',x-4,feet,8,1);
  }
  function draw(g,actor,id,opts,hero){
    if(!g||!actor) return false;const p=position(actor,opts),s=state(actor,opts,hero);
    g.save();g.imageSmoothingEnabled=false;if(s.restMode!=='bed')shadow(g,p.x,p.y+FEET_Y,s.rest);
    if(actor.dead) g.globalAlpha*=0.65;
    drawSprite(g,id,actor.gender==='f'?'f':'m',s,p.x-AX,p.y+FEET_Y-AY);
    if(hero&&!opts.reducedMotion&&!actor.dead&&s.restMode!=='bed'){
      const phase=Math.floor(clock(opts)/180)%4;
      if(opts.winter&&actor.temp<36.2&&s.dir!==3){
        const side=s.dir===1?-1:1;rect(g,'rgba(210,227,222,0.60)',p.x+side*(7+phase),p.y-12-phase,2,1);
        if(phase>1) rect(g,'rgba(210,227,222,0.36)',p.x+side*(9+phase),p.y-14-phase,2,1);
      }
      if(actor.temp>38.1){rect(g,'#82b6aa',p.x-7,p.y-13+phase,1,2);rect(g,P.snow,p.x-7,p.y-13+phase,1,1);}
    }
    g.restore();return true;
  }
  // Retrato de 32×32 ampliado sem suavização: desenhado para a tela, não
  // um recorte do sprite. Traços, expressão e penteado pertencem ao elenco.
  function paintPortrait(g,d,id,gender,s=null){
    rect(g,P.ink,0,0,32,32);rect(g,P.amber,1,1,30,30);rect(g,P.edge,2,2,28,28);
    rect(g,P.sage,3,3,26,26);rect(g,'#7c946b',3,3,16,14);
    rect(g,'#91a676',4,4,9,10);rect(g,P.leaf,5,5,5,1);
    // Pequeno ramo bordado no fundo, coerente com o vale.
    for(let i=0;i<4;i++){rect(g,P.edge,25-i,18+i*2,1,2);rect(g,P.leaf,24-i,17+i*2,2,1);}
    if(s){g.save();g.translate(0,headDip(s));}
    rect(g,d.shirtSh,6,26,21,4);rect(g,d.shirt,8,24,17,6);rect(g,d.shirtHi,8,25,5,5);
    rect(g,d.shirtSh,23,26,3,4);rect(g,d.skinSh,13,21,7,5);rect(g,d.skin,14,21,4,4);
    rect(g,d.trim,11,25,3,2);rect(g,P.cream,13,25,3,3);rect(g,P.cream,18,25,3,2);
    rect(g,d.hairSh,9,7,15,15);rect(g,d.hair,9,6,14,14);rect(g,d.hairHi,10,7,4,9);
    rect(g,d.skinSh,10,11,14,9);rect(g,d.skin,11,9,12,12);rect(g,d.skin,12,21,10,2);
    rect(g,d.skinHi,11,10,3,9);rect(g,d.skinHi,14,10,5,4);rect(g,d.skinSh,21,13,2,7);
    rect(g,d.skin,9,14,2,4);rect(g,d.skinSh,23,14,2,4);rect(g,d.skinHi,9,15,1,2);
    rect(g,d.skinHi,12,18,3,2);rect(g,d.skinSh,17,15,1,4);rect(g,d.skinHi,16,17,1,1);
    // Olhos e sobrancelhas; posições diferentes tornam cada expressão legível.
    const bright=d.expression==='curious'||d.expression==='bright';
    rect(g,d.hairSh,12,13,4,1);rect(g,d.hairSh,19,13-(d.expression==='bright'?1:0),3,1);
    rect(g,P.cream,12,14,4,bright?2:1);rect(g,P.cream,19,14,3,bright?2:1);
    rect(g,P.ink,14,14,1,bright?2:1);rect(g,P.ink,20,14,1,bright?2:1);
    if(bright){rect(g,P.cream,14,14,1,1);rect(g,P.cream,20,14,1,1);}
    rect(g,d.skinSh,15,20,5,1);rect(g,d.skinHi,16,21,3,1);
    if(d.expression==='warm'||d.expression==='curious'||d.expression==='bright'){
      rect(g,P.cream,16,20,3,1);rect(g,d.skinSh,15,19,1,1);rect(g,d.skinSh,19,19,1,1);
    }
    if(d.expression==='steady'){rect(g,d.hairSh,12,12,2,1);rect(g,d.hairSh,21,12,1,1);rect(g,d.skinSh,16,20,4,1);}
    if(d.expression==='thoughtful'){rect(g,d.skinSh,18,19,3,1);rect(g,d.skinHi,12,19,3,1);}
    // Massa e mechas do cabelo recebem luz superior esquerda.
    rect(g,d.hair,10,7,13,4);rect(g,d.hair,10,10,3,3);rect(g,d.hairSh,22,10,2,3);
    rect(g,d.hairHi,11,7,5,1);rect(g,d.hairHi,11,8,2,2);
    if(d.hairStyle==='bun'){
      rect(g,d.hairSh,12,3,9,4);rect(g,d.hair,13,3,7,4);rect(g,d.hairHi,14,3,4,1);
      rect(g,d.hair,8,8,3,9);rect(g,d.hairHi,8,9,2,4);rect(g,d.hairHi,12,7,8,1);
      rect(g,P.amber,9,8,2,2);rect(g,P.cream,9,8,1,1);
      // Óculos dourados e linhas de sorriso da avó.
      rect(g,P.edge,11,13,6,4);rect(g,P.edge,18,13,5,4);
      rect(g,d.skin,12,14,4,2);rect(g,d.skin,19,14,3,2);rect(g,P.ink,14,14,1,1);rect(g,P.ink,20,14,1,1);
      rect(g,P.amber,11,13,6,1);rect(g,P.amber,18,13,5,1);rect(g,P.amber,17,14,1,1);
      rect(g,d.skinSh,11,18,2,1);rect(g,d.skinSh,21,18,1,1);rect(g,d.skinSh,13,22,2,1);
      rect(g,P.cream,13,27,8,3);rect(g,d.trim,14,28,6,1);
    }else if(d.hairStyle==='curls'){
      for(const [x,y,w] of [[8,8,4],[9,5,5],[12,4,5],[16,4,5],[20,6,5],[22,9,4],[8,12,3],[23,12,3],[8,16,3],[23,16,3]]){
        rect(g,d.hairSh,x,y,w,4);rect(g,d.hair,x,y,w-1,3);rect(g,d.hairHi,x,y,1,1);
      }
      rect(g,P.amber,10,18,1,2);rect(g,P.amber,24,18,1,2);
      rect(g,P.cream,15,26,4,4);rect(g,P.soil,11,26,2,4);rect(g,P.amber,22,27,2,2);
    }else if(d.hairStyle==='beanie'){
      rect(g,d.shirtSh,9,5,15,6);rect(g,d.shirt,10,4,13,5);rect(g,d.shirtHi,11,5,4,2);
      rect(g,d.shirtHi,9,9,15,2);rect(g,d.trim,21,9,2,2);rect(g,d.hair,11,11,4,1);
      rect(g,P.cream,10,25,4,5);rect(g,P.cream,20,25,3,5);rect(g,d.pants,13,26,8,4);
      rect(g,d.trim,13,27,1,1);rect(g,d.trim,20,27,1,1);rect(g,d.pantsHi,16,28,3,1);
    }else if(d.hairStyle==='braid'){
      rect(g,d.trim,10,7,13,1);rect(g,d.hairHi,10,9,2,3);
      for(let i=0;i<6;i++){rect(g,d.hairSh,23+(i%2),16+i*2,3,2);rect(g,d.hairHi,23+(i%2),16+i*2,1,1);}
      rect(g,P.amber,24,28,2,1);rect(g,P.cream,10,25,5,2);rect(g,P.cream,19,25,5,2);
      rect(g,P.edge,17,27,1,3);rect(g,P.amber,17,28,1,1);
    }else if(d.hairStyle==='headwrap'){
      rect(g,'#a07839',9,5,15,6);rect(g,d.trim,10,4,13,5);rect(g,P.amber,11,4,9,2);
      rect(g,P.cream,11,5,6,1);rect(g,'#bd9450',9,9,15,2);rect(g,P.cream,11,9,11,1);
      rect(g,d.trim,24,10,3,11);rect(g,'#a07839',26,12,1,9);rect(g,P.amber,24,12,1,6);
      rect(g,d.hairSh,12,19,10,2);rect(g,d.hair,13,20,8,3);rect(g,d.skin,16,19,3,1);
      rect(g,P.cream,16,20,3,1);rect(g,d.trim,10,25,14,2);rect(g,'#a07839',21,27,2,3);
    }else if(d.hairStyle==='messy'){
      rect(g,d.hair,9,5,5,4);rect(g,d.hair,15,3,5,5);rect(g,d.hair,21,5,3,4);
      rect(g,d.hairHi,16,4,3,1);rect(g,d.hairHi,10,6,3,1);rect(g,d.hair,12,10,3,2);
      for(const [x,y] of [[12,17],[14,18],[20,17],[22,18]]) rect(g,'#a86748',x,y,1,1);
      rect(g,P.amber,10,27,4,3);rect(g,d.shirtSh,11,28,1,1);rect(g,P.cream,16,20,1,1);
    }else if(id==='player'){
      if(gender==='f'){rect(g,d.hairSh,23,13,3,14);rect(g,d.hairHi,23,14,1,10);rect(g,P.amber,23,15,2,1);}
      rect(g,'#9b793d',9,5,16,4);rect(g,P.amber,10,4,14,4);rect(g,P.cream,11,4,6,1);
      rect(g,P.edge,9,8,16,1);rect(g,'#bd9450',6,9,22,3);rect(g,P.amber,6,9,20,1);rect(g,P.cream,7,9,6,1);
      rect(g,P.soil,21,26,2,4);rect(g,P.amber,22,27,2,1);rect(g,P.edge,16,28,1,2);
    }
    if(s){paintPortraitSpeech(g,d,s);g.restore();}
    // A borda em degraus enquadra a figura, preservando a grade de pixel.
    rect(g,P.ink,0,0,32,1);rect(g,P.ink,0,31,32,1);rect(g,P.ink,0,0,1,32);rect(g,P.ink,31,0,1,32);
    rect(g,P.cream,2,2,1,1);rect(g,P.cream,29,29,1,1);
  }
  function paintPortraitSpeech(g,d,s){
    const bright=d.expression==='curious'||d.expression==='bright';
    // Óculos e sardas ficam fora das duas janelas dos olhos. O fundo do rosto
    // é recomposto antes do piscar para não deixar a pupila antiga aparente.
    for(const [x,w]of [[12,4],[19,3]]){
      rect(g,d.skin,x,14,w,2);
      if(s.blink)rect(g,d.hairSh,x,15,w-1,1);
      else{
        const eyeHeight=bright||['joyful','surprised'].includes(s.expression)?2:1;
        rect(g,P.cream,x,14,w,eyeHeight);
        rect(g,P.ink,x+Math.max(0,Math.min(w-1,(x===12?2:1)+s.gaze)),14,1,eyeHeight);
      }
    }
    rect(g,d.skin,12,12,4,2);rect(g,d.skin,19,12,3,2);
    if(s.expression==='concerned'){
      rect(g,d.hairSh,12,13,2,1);rect(g,d.hairSh,14,12,2,1);rect(g,d.hairSh,19,12,2,1);rect(g,d.hairSh,21,13,1,1);
    }else if(s.expression==='thoughtful'){
      rect(g,d.hairSh,12,12,4,1);rect(g,d.hairSh,19,13,3,1);
    }else if(s.expression==='resolved'){
      rect(g,d.hairSh,12,13,4,1);rect(g,d.hairSh,19,13,3,1);rect(g,d.hairSh,15,14,1,1);
    }else{
      const lifted=['joyful','surprised'].includes(s.expression);
      rect(g,d.hairSh,12,13-Number(lifted),4,1);rect(g,d.hairSh,19,13-Number(lifted),3,1);
    }
    // A armação da Rosa continua dourada; sobrancelhas ficam logo acima dela.
    if(d.hairStyle==='bun'){rect(g,P.amber,11,13,6,1);rect(g,P.amber,18,13,5,1);}
    rect(g,d.skin,14,19,7,3);rect(g,d.skinHi,16,21,3,1);
    if(s.mouth===1){rect(g,d.skinSh,15,19,5,2);rect(g,P.cream,16,19,3,1);}
    else if(s.mouth===2){rect(g,P.ink,16,19,3,3);rect(g,d.skinSh,15,20,1,1);rect(g,d.skinSh,19,20,1,1);rect(g,P.cream,16,19,3,1);}
    else if(s.mouth===3){rect(g,d.skinSh,17,19,3,2);rect(g,P.ink,18,19,1,2);}
    else{
      rect(g,d.skinSh,15,20,5,1);
      if(['warm','joyful'].includes(s.expression)){rect(g,P.cream,16,20,3,1);rect(g,d.skinSh,15,19,1,1);rect(g,d.skinSh,19,19,1,1);}
      if(s.expression==='concerned'){rect(g,d.skinSh,16,19,3,1);rect(g,d.skin,16,20,3,1);}
      if(s.expression==='thoughtful'){rect(g,d.skinSh,18,19,3,1);}
      if(s.expression==='surprised'){rect(g,P.ink,17,19,2,3);rect(g,d.skinSh,16,20,1,1);}
      if(s.expression==='resolved'){rect(g,d.skinSh,15,20,6,1);rect(g,d.skinHi,15,21,5,1);}
    }
    if(s.expression==='joyful'){rect(g,d.skinSh,12,18,2,1);rect(g,d.skinSh,21,18,1,1);}
    if(armGestures.includes(s.gesture)&&s.speechPhase>0){
      const peak=s.speechPhase===2,folded=['reflect','reassure'].includes(s.gesture);
      const x=folded?18:s.gesture==='invite'?25:23,y=peak?(folded?25:24):28;
      rect(g,d.shirtHi,x-2,y+1,4,4);rect(g,d.skin,x,y,3,2);rect(g,d.skinHi,x,y,2,1);
      if(s.gesture==='point'&&peak)rect(g,d.skin,x+2,y-2,1,3);
      if(s.gesture==='invite'&&peak)rect(g,d.skin,x+2,y-1,1,2);
      if(s.gesture==='shrug'){
        rect(g,d.shirtSh,6,y+1,4,4);rect(g,d.skin,5,y,4,2);rect(g,d.skinHi,5,y,3,1);
      }
    }
  }
  function drawPortrait(target,id,opts={}){
    if(!target?.getContext) return false;id=profiles[id]?id:'player';const gender=opts.gender==='f'?'f':'m';
    const speech=conversation(opts,true,id),s={...speech,blink:speech.speechBlink};
    const key=s.conversing?'fala|'+id+'|'+(id==='player'?gender:'m')+'|'+s.expression+'|'+s.gesture+'|'+s.gaze:id+'|'+gender;let cached=portraits.get(key);
    if(!cached){
      cached=canvas(s.conversing?32*SPEECH_FRAMES:32,32);const cg=cached.getContext('2d');
      if(s.conversing){for(let phase=0;phase<SPEECH_POSES;phase++)for(let blink=0;blink<2;blink++)for(let mouth=0;mouth<4;mouth++){
        const frame=(phase*2+blink)*4+mouth;cg.save();cg.translate(frame*32,0);paintPortrait(cg,profile(id,gender),id,gender,{...s,mouth,blink:!!blink,speechPhase:phase});cg.restore();
      }}else paintPortrait(cg,profile(id,gender),id,gender);
      if(portraits.size>=MAX_PORTRAITS)portraits.delete(portraits.keys().next().value);portraits.set(key,cached);
    }
    if(!target.width) target.width=96;if(!target.height) target.height=96;
    const g=target.getContext('2d');g.save();g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,target.width,target.height);
    g.imageSmoothingEnabled=false;const size=Math.min(target.width,target.height),x=Math.floor((target.width-size)/2),y=Math.floor((target.height-size)/2);
    rect(g,P.ink,0,0,target.width,target.height);
    if(s.conversing)g.drawImage(cached,speechFrame(s)*32,0,32,32,x,y,size,size);else g.drawImage(cached,x,y,size,size);g.restore();
    target.setAttribute?.('role','img');target.setAttribute?.('aria-label','Retrato de '+(opts.name||profile(id,gender).name));return true;
  }
  window.FarmCharacterArt=Object.freeze({
    keys,definitions,palette:P,gestures,expressions,heldProps,anchor:Object.freeze({x:AX,y:AY,feetOffsetY:FEET_Y,width:W,height:H}),
    drawPlayer(g,p,opts={}){return draw(g,p,'player',opts,true);},
    drawNPC(g,o,opts={}){return draw(g,o,profiles[o?.npcId||o?.id]?o.npcId||o.id:'nico',opts,false);},
    drawPortrait,
    // Diagnóstico de baixo custo para integração; não revela nem altera saves.
    cacheInfo(){return {sprites:sprites.size,portraits:portraits.size,speechBanks:speechBanks.size,maxSprites:MAX_SPRITES,maxPortraits:MAX_PORTRAITS,maxSpeechBanks:MAX_SPEECH_BANKS};}
  });
})();
