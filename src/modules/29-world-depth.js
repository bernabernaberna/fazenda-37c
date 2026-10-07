/* Volumes do vale. As fachadas conservam portas e coordenadas do jogo.
   A ordenação usa o contato no chão; o telhado nunca vira área caminhável.
   Arte original gerada/cacheada no próprio navegador, sem assets externos. */
(function(){
 (window.__farmBiomes=window.__farmBiomes||[]).push(function(API){
  const T=API.T,S=API.TS,P=window.FarmWorldArt.palette,cache=new Map();
  const R=(g,c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const poly=(g,c,p)=>{g.fillStyle=c;g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();};
  const line=(g,c,x,y,xx,yy,w=1)=>{g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.stroke();};
  const lit=()=>typeof timeOfDay==='number'&&(timeOfDay<7||timeOfDay>=18);
  function sprite(g,key,x,y,w,h,paint){
   let c=cache.get(key);if(!c){c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'));cache.set(key,c);}
   g.drawImage(c,Math.round(x),Math.round(y));
  }
  function pane(g,x,y,w,h,on){
   R(g,P.woodDark,x-2,y-2,w+4,h+5);R(g,P.woodLight,x-1,y-1,w+2,h+2);
   R(g,on?'#d9a657':'#477b79',x,y,w,h);R(g,on?'#f2d593':'#8db4a6',x+1,y+1,w-2,3);
   R(g,P.woodDark,x+Math.floor(w/2),y,1,h);R(g,P.woodDark,x,y+Math.floor(h/2),w,1);
   R(g,P.pathLight,x-3,y+h+1,w+6,2);
  }
  function planks(g,x,y,w,h,base,light,dark,vertical=false){
   R(g,base,x,y,w,h);
   for(let k=0;k<(vertical?w:h);k+=6){
    if(vertical){R(g,dark,x+k,y,1,h);R(g,light,x+k+1,y,1,h);if(k%12===0)R(g,dark,x+k+3,y+Math.floor(h*.65),2,1);}
    else{R(g,dark,x,y+k,w,1);R(g,light,x,y+k+1,w,1);}
   }
  }
  // Leitura em três planos: água dianteira do telhado, empena lateral e parede frontal.
  function house(g,w,h,kind,cold,on,stage=3,improvements=0){
   const x=24,y=30,side=16,front=w-side,base=y+h-4,eave=y+42,ridge=y+1;
   const barn=kind==='barn',cabin=kind==='cabin',seed=kind==='seed';
   const wall= barn?'#9f5948':cabin?'#92704f':'#d9c899';
   const trim=barn?'#e3c496':P.woodDark;
   // Só contato fica no sprite. A projeção do sol vem antes das entidades.
   R(g,'rgba(25,40,34,.24)',x-3,base,w+10,7);
   poly(g,P.stoneDark,[[x+front,base-1],[x+w,base-12],[x+w,base-5],[x+front,base+6]]);
   R(g,P.stoneDark,x,base-2,front,8);R(g,P.stone,x,base-2,front,3);
   for(let i=2;i<front;i+=12)R(g,P.snowShade,x+i,base-1,8,1);
   poly(g,barn?'#724739':cabin?'#624e3e':'#a59c76',[[x+front,eave],[x+w,eave-13],[x+w,base-12],[x+front,base]]);
   for(let yy=eave+6;yy<base-8;yy+=6)line(g,'rgba(44,51,37,.27)',x+front,yy,x+w,yy-12);
   planks(g,x,eave,front,base-eave,wall,barn?'#b87659':cabin?'#b08b60':'#efe0b3',barn?'#784b40':cabin?'#68513f':'#bbab83',barn);
   R(g,P.woodDark,x,eave,front,5);R(g,'rgba(38,43,32,.2)',x,eave+5,front,4);
   for(const xx of [x,x+front-4]){R(g,trim,xx,eave,4,base-eave);R(g,P.woodLight,xx,eave,1,base-eave);}
   // A porta central coincide com door_house / door_barn existentes.
   const dw=barn?34:20,dh=Math.min(barn?36:30,base-eave-6),dx=x+w/2-dw/2,dy=base-dh;
   R(g,P.woodDark,dx-3,dy-3,dw+6,dh+3);R(g,seed&&stage===3?'#324c40':barn?P.wood:P.teal,dx,dy,dw,dh);
   for(let k=3;k<dw;k+=5)R(g,barn?P.woodDark:'#203f35',dx+k,dy+1,1,dh-1);
   if(barn){line(g,P.pathLight,dx+2,dy+2,dx+dw/2-2,base-3,2);line(g,P.pathLight,dx+dw-2,dy+2,dx+dw/2+2,base-3,2);R(g,P.cream,dx+dw/2-1,dy,2,dh);}
   else{R(g,P.amber,dx+dw-4,dy+dh*.6,2,2);if(!(seed&&stage===3))pane(g,dx+5,dy+4,10,8,on);}
   if(seed&&stage===0){line(g,P.woodLight,dx-1,dy+8,dx+dw+1,dy+19,3);R(g,P.woodDark,dx+dw-4,dy+18,2,2);}
   if(front>75){pane(g,x+12,eave+14,15,17,on);if(!barn)pane(g,x+front-25,eave+14,15,17,on);}
   // Empena sombreada: o mesmo cume desce até as duas águas.
   poly(g,P.woodDark,[[x+front-3,eave+1],[x+front-13,ridge],[x+w+5,eave-14],[x+w+5,eave-9]]);
   poly(g,barn?'#9c6c4c':'#c3b181',[[x+front,eave-3],[x+front-11,ridge+8],[x+w-1,eave-14]]);
   for(let yy=ridge+20;yy<eave-12;yy+=5)R(g,P.woodDark,x+front-5,yy,5,1);
   // Telhas em linhas inclinadas com espessura visível no beiral.
   const roofColor=barn?'#965c48':cabin?'#685b4e':'#ad654e';
   poly(g,P.woodDark,[[x-8,eave-1],[x+front+4,eave-1],[x+front-11,ridge-3],[x+6,ridge-3]]);
   poly(g,roofColor,[[x-6,eave-4],[x+front+1,eave-4],[x+front-12,ridge],[x+7,ridge]]);
   for(let row=0;row<7;row++){
    const ry=ridge+3+row*5,ratio=(ry-ridge)/(eave-ridge),left=x+7-ratio*13,right=x+front-12+ratio*13;
    R(g,barn?'#ba805d':'#d18e61',left,ry,right-left,1);R(g,barn?'#754b3c':'#854d40',left,ry+4,right-left,1);
    for(let xx=Math.ceil(left)+((row%2)*5);xx<right-3;xx+=10){R(g,'#854d40',xx,ry+1,1,3);R(g,'#c7845d',xx+2,ry+2,5,1);}
   }
   R(g,P.woodDark,x-8,eave-4,front+13,5);R(g,P.clayLight,x-8,eave-4,front+13,1);
   line(g,P.woodDark,x+front+4,eave-2,x+w+7,eave-15,3);
   line(g,P.clayLight,x+6,ridge-2,x+front-12,ridge-2,3);
   if(cold){poly(g,P.snow,[[x+7,ridge-2],[x+front-11,ridge-2],[x+front-8,ridge+8],[x+4,ridge+9]]);R(g,P.snowLight,x-6,eave-5,front+8,2);for(let k=8;k<front;k+=19)R(g,P.snow,x+k,eave-3,2,4+k%3);}
   // Alvenaria da chaminé e chapéu; galpão usa lanternim.
   if(barn){const xx=x+front*.52;R(g,P.woodDark,xx,ridge-15,17,16);R(g,P.pathLight,xx+2,ridge-13,13,12);for(let i=3;i<14;i+=3)R(g,P.teal,xx+i,ridge-10,1,5);poly(g,P.clayDark,[[xx-4,ridge-14],[xx+8,ridge-23],[xx+21,ridge-14]]);}
   else{const xx=x+front-23;R(g,P.stoneDark,xx,ridge-13,10,24);R(g,P.stone,xx,ridge-12,6,22);for(let yy=ridge-10;yy<ridge+10;yy+=5)R(g,P.snowShade,xx,yy,6,1);R(g,P.stoneDark,xx-2,ridge-15,14,3);R(g,P.snowShade,xx-2,ridge-15,12,1);}
   // Degraus projetados, soleira e floreiras/vasos do alpendre.
   R(g,P.stoneDark,dx-5,base+3,dw+10,5);R(g,P.pathLight,dx-5,base+3,dw+10,2);R(g,P.stone,dx-7,base+8,dw+14,3);
   if(!barn&&front>75){for(const xx of [x+8,x+front-14]){R(g,P.clayDark,xx,base-8,9,8);R(g,P.clayLight,xx,base-8,8,2);R(g,P.teal,xx-2,base-13,13,5);R(g,cold?P.snow:P.sage,xx,base-16,8,5);if(!cold)R(g,P.berry,xx+2,base-16,3,2);}}
   if(seed){
    // Cada etapa da história deixa trabalho visível no espaço comunitário.
    const signY=eave+2;R(g,P.woodDark,x+front/2-27,signY,54,9);R(g,P.pathLight,x+front/2-26,signY+1,52,7);
    g.fillStyle=P.woodDark;g.textAlign='center';g.font='bold 5px monospace';g.fillText('CASA DAS SEMENTES',x+front/2,signY+6);
    // Quadro preso à parede, entre janela e porta, em todas as etapas da Casa.
    // A interação fica nos pés da fachada; a arte compartilha sua profundidade.
    const qx=x+30,qy=base-19;R(g,'rgba(36,42,31,.25)',qx+1,qy+1,14,14);
    R(g,P.woodDark,qx,qy,14,14);R(g,P.wood,qx+1,qy+1,12,12);R(g,P.woodLight,qx+1,qy+1,12,1);
    for(let k=0;k<2;k++){R(g,P.cream,qx+2+k*6,qy+4,4,7);R(g,P.woodDark,qx+2+k*6,qy+7,3,1);R(g,P.clayDark,qx+3+k*6,qy+3,1,1);}
    if(stage>=1){R(g,P.woodDark,x-13,base-3,17,4);R(g,P.woodLight,x-13,base-4,17,2);R(g,P.woodDark,x-11,base,2,8);R(g,P.woodDark,x+1,base,2,8);R(g,P.stone,x-9,base-7,6,3);}
    if(stage>=2){for(let k=0;k<2;k++){const xx=x+w+2+k*10;R(g,P.woodDark,xx,base-9-k*3,10,10);R(g,P.woodLight,xx+1,base-8-k*3,8,7);R(g,P.wood,xx+1,base-5-k*3,8,1);R(g,P.sage,xx+2,base-11-k*3,5,3);}}
    if(stage===3){line(g,P.woodDark,x-6,eave+6,x+w+5,eave-6);for(let i=0;i<8;i++){const xx=x+i*14,yy=eave+6-i;poly(g,[P.teal,P.amber,P.berry][i%3],[[xx,yy],[xx+8,yy-1],[xx+4,yy+7]]);}R(g,P.amber,dx+3,dy+2,dw-6,3);}
    if(improvements&1){
     // Lia: estação de água à sombra, junto à entrada.
     const xx=x-19,yy=base-16;R(g,P.woodDark,xx,yy-9,2,27);R(g,P.woodDark,xx+21,yy-9,2,27);
     poly(g,P.teal,[[xx-3,yy-16],[xx+16,yy-19],[xx+25,yy-7],[xx-6,yy-5]]);line(g,P.sage,xx-3,yy-16,xx+16,yy-19,2);
     R(g,P.stoneDark,xx+4,yy+5,12,10);R(g,P.water,xx+5,yy+2,10,12);R(g,P.waterLight,xx+6,yy+3,3,9);R(g,P.cream,xx+7,yy,6,2);
    }
    if(improvements&2){const xx=x+w+4;R(g,P.woodDark,xx,base+1,14,8);R(g,P.woodLight,xx+1,base+2,12,5);for(let i=0;i<3;i++){R(g,P.pathLight,xx+i*4,base-2,5,5);R(g,P.cream,xx+i*4+1,base-3,3,4);}}
    if(improvements&4){const xx=x+w+22;R(g,P.woodDark,xx,base-20,2,30);poly(g,P.amber,[[xx-8,base-21],[xx+8,base-21],[xx+13,base-17],[xx+8,base-13],[xx-8,base-13]]);R(g,P.woodDark,xx-4,base-18,10,1);R(g,P.teal,xx+4,base+2,9,7);R(g,P.amber,xx+5,base+2,7,2);}
   }
  }
  function drawBuilding(g,o,kind,stage=3,improvements=0){
   const w=o.w,h=o.h,cold=kind==='cabin'||API.isFrio(),on=lit();
   sprite(g,[kind,w,h,cold,on,stage,improvements].join(':'),o.x-24,o.y-30,w+82,h+62,c=>house(c,w,h,kind,cold,on,stage,improvements));
  }
  API.registerObjectDrawer('house',(o,g)=>drawBuilding(g,o,'house'));
  API.registerObjectDrawer('barn',(o,g)=>drawBuilding(g,o,'barn'));
  API.registerObjectDrawer('mtn_cabin',(o,g)=>drawBuilding(g,{x:o.x-32,y:o.y-66,w:64,h:68},'cabin'));
  function drawSeedHouse(g,o,level){const state=window.FarmStoryWorld?.worldState()?.seedHouse||{};drawBuilding(g,o,'seed',level??state.level??0,(state.shadeAndWater?1:0)|(state.woolAndMountainRoute?2:0)|(state.oasisRoute?4:0));}
  API.registerObjectDrawer('story_seed_house',(o,g)=>drawSeedHouse(g,o));
  API.registerObjectDrawer('story_seed_door',()=>{});
  API.registerInteraction('story_seed_door',()=>{window.FarmStoryUI?.open();return true;});
  API.addObjectToMain({type:'story_seed_house',x:552,y:1168,w:112,h:88,_world:true});
  API.addObjectToMain({type:'story_seed_door',x:608,y:1266,_world:true,interactionHint:'visitar a Casa das Sementes'});
  API.paintRect(API.scenes.main.map,37,79,2,3,T.PATH);
  API.paintRect(API.scenes.main.map,25,80,14,2,T.PATH);

  // Patamares periféricos: rocha contínua, corte de estratos e luz no topo.
  // Os corredores centrais e pontos de missão permanecem livres.
  const ridges=[
   {x:64,y:110,w:160,h:38,rise:50,biome:'mountain'},
   {x:730,y:245,w:150,h:43,rise:66,biome:'mountain'},
   {x:80,y:430,w:125,h:28,rise:37,biome:'mountain'},
   {x:85,y:1575,w:148,h:40,rise:55,biome:'desert'},
   {x:763,y:1764,w:142,h:48,rise:71,biome:'desert'},
   {x:115,y:1910,w:119,h:26,rise:34,biome:'desert'}
  ];
  for(const r of ridges)API.addObjectToMain({type:'world_ridge',...r,_world:true});
  function ridge(o,g){
   sprite(g,'ridge:'+o.biome+o.w+o.rise,o.x-10,o.y-o.rise-12,o.w+45,o.h+o.rise+40,c=>{
    const x=10,y=o.rise+12,w=o.w,h=o.h,z=o.rise,d=o.biome==='desert';
    const top=d?'#d6b37b':'#b6cdcb',face=d?'#ad7653':'#718988',shade=d?'#795746':'#4b686b';
    R(c,'rgba(33,50,42,.19)',x+2,y+h-1,w-4,4);
    poly(c,shade,[[x+w-12,y-z+5],[x+w,y-z+16],[x+w,y+h-12],[x+w-12,y+h]]);
    const pts=[[x,y-z+18],[x+12,y-z+4],[x+w*.35,y-z],[x+w*.53,y-z+9],[x+w*.82,y-z+3],[x+w-12,y-z+7],[x+w-12,y+h],[x+15,y+h-3],[x,y+h-13]];
    poly(c,face,pts);
    // Planos de erosão e fendas interrompidas, sem a grade regular de tábuas.
    poly(c,d?'#b9845b':'#849b99',[[x+2,y-z+25],[x+w*.41,y-z+27],[x+w*.28,y+h-8],[x+14,y+h-4]]);
    poly(c,d?'#956749':'#627d80',[[x+w*.56,y-z+25],[x+w-13,y-z+19],[x+w-13,y+h],[x+w*.72,y+h-4]]);
    for(let j=0;j<z+h-26;j+=11){
     const yy=y-z+29+j,offset=(j*7)%19;
     line(c,d?'#cc986a':'#a1b6b3',x+5+offset,yy,x+w*.43,yy-2,1);
     line(c,d?'#956e50':'#5d797a',x+w*.48,yy+3,x+w-17-offset/3,yy+7,2);
    }
    for(const [p,start,length,lean]of [[.19,4,.4,8],[.45,15,.55,-9],[.76,0,.36,6]]){
     const xx=x+w*p,yy=y-z+24+start,end=Math.min(y+h-5,yy+(z+h)*length);
     line(c,shade,xx,yy,xx+lean,yy+(end-yy)*.47,2);
     line(c,shade,xx+lean,yy+(end-yy)*.47,xx+lean-4,end,1);
    }
    poly(c,top,[[x,y-z+18],[x+12,y-z+4],[x+w*.35,y-z],[x+w*.53,y-z+9],[x+w*.82,y-z+3],[x+w-12,y-z+7],[x+w-16,y-z+25],[x+w*.51,y-z+28],[x+15,y-z+22]]);
    line(c,d?'#eed09a':P.snowLight,x+11,y-z+5,x+w*.35,y-z+1,2);
    if(!d){poly(c,P.snow,[[x+4,y-z+14],[x+12,y-z+3],[x+w*.35,y-z-1],[x+w*.54,y-z+9],[x+w-13,y-z+5],[x+w-18,y-z+18],[x+w*.55,y-z+22],[x+17,y-z+17]]);for(let j=15;j<w-22;j+=25)R(c,P.snow,x+j,y-z+18,5,7);}
    else{for(let j=18;j<w-24;j+=23)R(c,'#efd29b',x+j,y-z+13+j%7,11,1);}
    for(const [p,ww,hh]of [[.06,13,5],[.29,8,3],[.68,15,7],[.88,8,4]]){const xx=x+w*p;poly(c,shade,[[xx,y+h],[xx+2,y+h-hh],[xx+ww-3,y+h-hh-2],[xx+ww,y+h+2]]);R(c,d?'#d29b67':'#a4b9b4',xx+3,y+h-hh,ww-5,1);}
   });
  }
  API.registerObjectDrawer('world_ridge',ridge);

  function footprint(o){
   switch(o.type){
    case 'farm_life_project':case 'farm_life_clue':case 'farm_life_station':return window.FarmLife?.footprint(o)||null;
    case 'house':case 'barn':case 'story_seed_house':return{x:o.x-3,y:o.y+4,w:o.w+6,h:o.h-7};
    case 'mtn_cabin':return{x:o.x-33,y:o.y-35,w:64,h:38};
    case 'tree':case 'fx_fruittree':return{x:o.x-5,y:o.y-3,w:10,h:12};
    case 'mtn_pine':return{x:o.x-4,y:o.y-7,w:8,h:10};
    case 'des_palm':return{x:o.x-3,y:o.y-7,w:8,h:11};
    case 'mtn_rock':return{x:o.x-13,y:o.y-10,w:26,h:13};
    case 'des_mesa':return{x:o.x-18,y:o.y-14,w:36,h:18};
    case 'des_cactus':return{x:o.x-6,y:o.y-7,w:12,h:10};
    case 'world_ridge':return{x:o.x,y:o.y-o.rise+8,w:o.w,h:o.rise+o.h-8};
    default:return null;
   }
  }
  const contains=(b,x,y)=>x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h;
  function isBlocked(x,y,from){
   const m=API.scenes.main;if(!m||x<8||y<8||x>m.MW*S-8||y>m.MH*S-8)return true;
   if([undefined,T.WATER,T.RIVER,T.OASIS].includes(m.map[Math.floor(y/S)]?.[Math.floor(x/S)]))return true;
   for(const o of (window.FarmObjectQueries?FarmObjectQueries.of(m.objects,['house','barn','story_seed_house','mtn_cabin','tree','fx_fruittree','mtn_pine','des_palm','mtn_rock','des_mesa','des_cactus','world_ridge','pen','farm_life_project','farm_life_clue','farm_life_station']):m.objects)){const b=footprint(o);if(b&&contains(b,x,y+7)){
     // Saves anteriores podem começar dentro de um novo tronco/volume.
     // Permite somente sair em direção à borda, nunca atravessar o obstáculo.
     if(from&&contains(b,from.x,from.y+7)){
      const penetration=(px,py)=>Math.min(px-b.x,b.x+b.w-px,py-b.y,b.y+b.h-py);
      if(penetration(x,y+7)<penetration(from.x,from.y+7))continue;
     }return true;
    }
    if(o.type==='pen'){
     const fy=y+7,left=o.x,right=o.x+o.w,top=o.y,bottom=o.y+o.h;
     const gate=Math.abs(x-(left+o.w/2))<18;
     if((x>left-3&&x<right+3&&Math.abs(fy-top)<3)||(x>left-3&&x<right+3&&Math.abs(fy-bottom)<3&&!gate)||(fy>top&&fy<bottom&&(Math.abs(x-left)<3||Math.abs(x-right)<3)))return true;
    }
   }return false;
  }
  function depth(o){
   if(o.type==='player'||o.type==='story_npc')return o.y+10;
   if(o.type==='world_pen_rail')return o.y;
   if(o.type==='mtn_cabin')return o.y+3;
   if(o.type==='animal')return o.y+(['chick','chicken'].includes(o.kind)?4:6);
   if(o.type==='tree'||o.type==='fx_fruittree')return o.y+9;
   return o.y+(o.h||0);
  }
  function rail(g,x,y,w){
   R(g,'rgba(29,49,38,.18)',x,y,w,3);
   for(const yy of [y-15,y-8]){R(g,P.woodDark,x,yy,w,3);R(g,P.woodLight,x,yy,w,1);}
   for(let k=0;k<w;k+=16){R(g,P.woodDark,x+k,y-21,3,23);R(g,P.pathLight,x+k,y-21,2,21);R(g,P.cream,x+k-1,y-22,5,2);}
  }
  function drawPenBase(g,o){
   R(g,'#9d9266',o.x,o.y,o.w,o.h);R(g,'#aaa171',o.x+3,o.y+3,o.w-6,o.h-6);
   for(let yy=6;yy<o.h;yy+=13)for(let xx=8;xx<o.w;xx+=19){R(g,'#c0b27b',o.x+xx+(yy%3),o.y+yy,6,1);R(g,'#8a865d',o.x+xx-2,o.y+yy+4,3,1);}
   rail(g,o.x,o.y,o.w+1);
  }
  function penParts(o){
   const a=[{type:'world_pen_rail',x:o.x,y:o.y+o.h,w:o.w/2-18},{type:'world_pen_rail',x:o.x+o.w/2+18,y:o.y+o.h,w:o.w/2-18}];
   for(let yy=o.y+8;yy<=o.y+o.h;yy+=8)for(const xx of [o.x,o.x+o.w])a.push({type:'world_pen_side',x:xx,y:yy});return a;
  }
  API.registerObjectDrawer('world_pen_rail',(o,g)=>rail(g,o.x,o.y,o.w));
  API.registerObjectDrawer('world_pen_side',(o,g)=>{R(g,P.woodDark,o.x,o.y-21,3,10);R(g,P.woodLight,o.x,o.y-21,1,10);R(g,P.wood,o.x,o.y-12,3,9);});

  function drawGround(g){
   if(API.rawScene!=='main')return;
   // Caminho de acesso e praça: antes de entidades, portanto nunca cobre pés.
   R(g,API.isFrio()?'#b3c6be':'#b6a377',592,1257,32,10);
   // Pequenos contrafortes de terra sob as bordas dos canteiros existentes.
   for(const f of fields){R(g,'rgba(36,50,31,.2)',f.x*S,(f.y+f.h)*S,f.w*S,3);R(g,'#9a7954',f.x*S,(f.y+f.h)*S,f.w*S,1);}
  }
  // Silhuetas pequenas e imutáveis: não há cache novo por objeto, câmera ou hora.
  // A transformação achata a altura sobre o chão e acompanha o MESMO eixo do sol.
  const pineShadow=[[-3,0],[3,0],[3,-13],[21,-13],[12,-27],[17,-27],[8,-39],[12,-39],[4,-51],[7,-51],[0,-64],[-7,-51],[-4,-51],[-12,-39],[-8,-39],[-17,-27],[-12,-27],[-21,-13],[-3,-13]];
  const palmShadow=[[-2,0],[3,0],[0,-40],[8,-35],[21,-25],[13,-38],[26,-42],[10,-46],[22,-54],[8,-51],[0,-44],[-8,-51],[-22,-54],[-10,-46],[-26,-42],[-13,-38],[-21,-25],[-8,-35],[-3,-40]];
  function foliageProjection(g,shape,x,y,dx){
   g.beginPath();
   for(let i=0;i<shape.length;i++){
    const [xx,yy]=shape[i],px=x+xx-yy*dx*.58,py=y-yy*(.12+Math.abs(dx)*.05);
    if(i)g.lineTo(px,py);else g.moveTo(px,py);
   }
   g.closePath();g.fill();
  }
  function volumeProjection(g,x,base,w,height,dx,ridge){
   const ox=dx*Math.min(34,height*.42),reach=5+Math.abs(dx)*7,side=ridge?3:8;
   // Mesmo apoio da fachada; o vetor desloca somente a ponta da projeção.
   g.beginPath();g.moveTo(x-2,base);g.lineTo(x+w+2,base-side);
   g.lineTo(x+w+2+ox,base+reach-side);g.lineTo(x+ox,base+reach+2);
   g.closePath();g.fill();
  }
  function drawGroundShadows(g,visible,sol){
   if(API.rawScene!=='main'||!g||!visible)return 0;
   const sun=sol===undefined?(typeof sunShadowVec==='function'?sunShadowVec():null):sol;
   const projected=!!sun&&Number.isFinite(sun.dx)&&Number.isFinite(sun.a)&&sun.a>0;
   const dx=projected?Math.max(-1.6,Math.min(1.6,sun.dx)):0,cold=!!API.isFrio();
   const alpha=projected?Math.min(.19,sun.a*.78):0;
   let count=0;g.save();
   try{
    for(const o of visible){
     if(o.type==='tree'){
      // Contrato didático: a área visível continua EXATAMENTE a de inShade().
      // Sem sol/reduzir movimento mantém a elipse central, inclusive no frio.
      const sh=treeShadowEllipse(o,sun);
      g.fillStyle=cold?'rgba(24,59,54,.17)':'rgba(24,59,54,.27)';
      g.beginPath();g.ellipse(sh.cx,sh.cy,sh.rx,sh.ry,0,0,Math.PI*2);g.fill();count++;
      continue;
     }
     if(!projected)continue;
     g.fillStyle='rgba(24,47,40,'+alpha+')';
     switch(o.type){
      case 'mtn_pine':foliageProjection(g,pineShadow,o.x,o.y+1,dx);break;
      case 'des_palm':foliageProjection(g,palmShadow,o.x+2,o.y+1,dx);break;
      case 'fx_fruittree':
       g.beginPath();g.ellipse(o.x+dx*14,o.y+9,21+Math.abs(dx)*5,8,0,0,Math.PI*2);g.fill();break;
      case 'house':case 'barn':case 'story_seed_house':
       volumeProjection(g,o.x,o.y+o.h-2,o.w,o.h,dx,false);break;
      case 'mtn_cabin':volumeProjection(g,o.x-32,o.y,64,68,dx,false);break;
      case 'world_ridge':volumeProjection(g,o.x,o.y+o.h,o.w,o.rise,dx,true);break;
      default:continue;
     }
     count++;
    }
   }finally{g.restore();}
   return count;
  }
  function windowLights(o){
   if(o.type==='mtn_cabin')return[{x:o.x,y:o.y-10,r:17}];
   if(!['house','barn','story_seed_house'].includes(o.type))return null;
   const points=[{x:o.x+19,y:o.y+64,r:25}];
   if(o.type!=='barn')points.push({x:o.x+o.w-34,y:o.y+64,r:25},{x:o.x+o.w/2,y:o.y+o.h-26,r:16});
   return points;
  }
  window.FarmWorldDepth=Object.freeze({version:2,get navigationVersion(){return 1+(window.FarmLife?.navigationVersion?.()||0);},footprint,isBlocked,depth,drawSeedHouse,drawGround,drawGroundShadows,drawPenBase,penParts,windowLights,cacheInfo:()=>({sprites:cache.size})});
 });
})();
