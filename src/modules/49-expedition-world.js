/* A leste do vale: três paisagens contíguas, sem mover o mundo já salvo.
   Somente expand escreve tiles; pintura e animação nunca alteram a navegação. */
(function(){
 (window.__farmBiomes=window.__farmBiomes||[]).push(function(API){
  'use strict';
  const T=API.T,S=API.TS,ORIGINAL_WIDTH=96,WIDTH=144,HEIGHT=124;
  const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const hash=(x,y)=>(Math.imul(x^4831,73856093)^Math.imul(y^9277,19349663))>>>0;
  const pixel=(x,y)=>({tileX:x,tileY:y,x:x*S+8,y:y*S+8});
  const regions=Object.freeze({
   highlands:Object.freeze({id:'highlands',name:'Serra dos Ecos',mapLabel:'SERRA DOS ECOS',label:'serra',tempDelta:-.035,hydDelta:-.06,sweatBoost:0,thermalCause:'vento frio e altitude da serra',mapX:119,mapY:12}),
   meadow:Object.freeze({id:'meadow',name:'Campos do Vento',mapLabel:'CAMPOS DO VENTO',label:'campos',tempDelta:.006,hydDelta:-.08,sweatBoost:.1,thermalCause:'brisa dos campos abertos',mapX:120,mapY:54}),
   coast:Object.freeze({id:'coast',name:'Costa das Conchas',mapLabel:'COSTA DAS CONCHAS',label:'costa',tempDelta:.018,hydDelta:-.20,sweatBoost:.55,thermalCause:'maresia e umidade da costa',mapX:118,mapY:119})
  });
  const landmarks=Object.freeze([
   {id:'exp_observatory',...pixel(112,24),title:'Observatório dos Ventos',region:'highlands',description:'Um telescópio antigo ainda aponta para as marcas deixadas nas pedras.'},
   {id:'exp_echo_stones',...pixel(130,34),title:'Pedras do Eco',region:'highlands',description:'Três pedras guardam inscrições sobre o caminho da água.'},
   {id:'exp_high_camp',...pixel(111,43),title:'Acampamento da Serra',region:'highlands',description:'O caderno de um abrigo de caminhada conserva relatos da antiga expedição.'},
   {id:'exp_windmill',...pixel(111,58),title:'Moinho do Vento',region:'meadow',description:'As pás gastas giram sobre o mecanismo que movia o antigo canal.'},
   {id:'exp_seed_orchard',...pixel(130,69),title:'Pomar das Sementes',region:'meadow',description:'Etiquetas de um pomar comunitário ligam as famílias do vale à expedição.'},
   {id:'exp_post_shelter',...pixel(124,80),title:'Abrigo das Cartas',region:'meadow',description:'A caixa postal do caminho conserva mensagens que nunca chegaram à fazenda.'},
   {id:'exp_channel_lock',...pixel(111,96),title:'Comporta Antiga',region:'coast',description:'A régua da comporta liga o canal da serra às marcas da maré.'},
   {id:'exp_post_pier',...pixel(130,104),title:'Cais das Correspondências',region:'coast',description:'Uma mesa de navegação e um sino aguardam notícias do outro lado da baía.'},
   {id:'exp_tide_stones',...pixel(119,116),title:'Pedras da Maré',region:'coast',description:'Conchas, marcas de água e sinais gravados completam a rota do antigo mapa.'}
  ].map(Object.freeze));
  const routes=Object.freeze([
   [[95,60],[103,60],[111,58],[129,60],[136,70],[130,80],[124,80],[105,83],[103,60]],
   [[103,60],[102,44],[111,43],[112,24],[128,20],[137,28],[130,34],[124,44],[111,43]],
   [[112,24],[121,27],[130,34]],[[129,60],[130,69],[130,80]],
   [[105,83],[105,96],[111,96],[119,98],[130,104],[134,114],[119,116],[106,115],[105,96]],
   [[124,80],[126,89],[119,98]],[[111,96],[112,106],[119,116]]
  ].map(route=>Object.freeze(route.map(p=>Object.freeze(p)))));
  const sprites=new Map(),woodTiles=new Map();let bridgeSections=0,trailTiles=0,mainWorld=null;
  const isWater=t=>t===T.WATER||t===T.RIVER||t===T.OASIS;
  function localWeights(y){const high=1-smooth((y-45)/6),shore=smooth((y-83)/6);return[['highlands',high],['meadow',(1-high)*(1-shore)],['coast',(1-high)*shore]].filter(([,w])=>w>1e-9);}
  function blendWeights(x,y,base){
   if(!Number.isFinite(x)||!Number.isFinite(y)||x<ORIGINAL_WIDTH||x>=WIDTH||y<0||y>=HEIGHT)return base;
   const east=smooth((x-ORIGINAL_WIDTH)/6);if(east<=0)return base;
   return base.map(([id,w])=>[id,w*(1-east)]).filter(([,w])=>w>1e-9).concat(localWeights(y).map(([id,w])=>[id,w*east]));
  }
  function regionAt(x,y){if(!Number.isFinite(x)||!Number.isFinite(y)||x<ORIGINAL_WIDTH||x>=WIDTH||y<0||y>=HEIGHT)return null;return y<48?'highlands':y<86?'meadow':'coast';}
  function prepareWood(map){
   woodTiles.clear();bridgeSections=0;const seen=new Set();
   for(let y=0;y<HEIGHT;y++)for(let x=ORIGINAL_WIDTH;x<WIDTH;x++){
    const key=y*WIDTH+x;if(map[y][x]!==T.WOOD||seen.has(key))continue;
    const pending=[[x,y]],tiles=[];let l=x,r=x,t=y,b=y;seen.add(key);
    for(let i=0;i<pending.length;i++){
     const [xx,yy]=pending[i];tiles.push([xx,yy]);l=Math.min(l,xx);r=Math.max(r,xx);t=Math.min(t,yy);b=Math.max(b,yy);
     for(const [dx,dy]of [[0,1],[1,0],[0,-1],[-1,0]]){const nx=xx+dx,ny=yy+dy,nk=ny*WIDTH+nx;if(nx>=ORIGINAL_WIDTH&&nx<WIDTH&&ny>=0&&ny<HEIGHT&&map[ny][nx]===T.WOOD&&!seen.has(nk)){seen.add(nk);pending.push([nx,ny]);}}
    }
    for(const [xx,yy]of tiles)woodTiles.set(yy*WIDTH+xx,r-l>=b-t);bridgeSections++;
   }
  }
  function expand(main){
   if(main?._expeditionV612){mainWorld=main;prepareWood(main.map);return main.MW;}
   if(!main||main.MW!==ORIGINAL_WIDTH||main.MH!==HEIGHT)throw Error('A expedição espera o mundo de96×124.');
   const map=main.map.map((row,y)=>{
    const next=row.slice();
    for(let x=ORIGINAL_WIDTH;x<WIDTH;x++){
     const n=(Math.sin(x*.24+y*.13)+Math.cos(x*.13-y*.20)+2)/4,edge=smooth((x-96)/6),base=row[95];
     let t;
     const choose=hash(x*3,y*5)%1024/1024,weights=localWeights(y);let terrain=weights[weights.length-1][0],sum=0;
     for(const [id,w]of weights){sum+=w;if(choose<=sum){terrain=id;break;}}
     if(terrain==='highlands'){
      // Bancadas baixas, neve nas cotas altas e corredores de relva nas baixas.
      const snow=1-smooth((y-20)/19);t=n<snow?T.SNOW:n>.70?T.STONE:n>.48?T.GRASS2:T.GRASS;
      if(y<4)t=T.SNOWROCK;
     }else if(terrain==='meadow'){t=n<.22?T.PATH:n>.74?T.GRASS2:T.GRASS;}
     else{
      const coastLine=134+Math.sin(y*.17)*2.5+Math.cos(y*.31)*1.2;
      t=x>coastLine?T.WATER:x>coastLine-2?T.SAND:n>.87?T.STONE:n<.32?T.GRASS2:T.SAND;
     }
     // Seis colunas de transição determinística; o tile96 prolonga a margem
     // antiga, sem escrever em95 nem introduzir um paredão no encontro.
     if(x<102&&hash(x,y)%1024>edge*1024)t=base;
     next.push(t);
    }return next;
   });
   const paint=(x,y,t)=>{if(x>=ORIGINAL_WIDTH&&x<WIDTH&&y>=0&&y<HEIGHT)map[y][x]=t;};
   const pool=(cx,cy,rx,ry,type)=>{for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2<1+.06*Math.sin(x+y*.7))paint(x,y,type);};
   pool(126,12,5,3,T.ICE);pool(135,42,4,2.8,T.WATER);
   pool(124,106,5.6,5.2,T.WATER);
   // Canal acompanha o relevo. A trilha, pintada depois, faz a passagem.
   for(let y=29;y<114;y++){
    const x=Math.round(118+Math.sin(y/12)*2+Math.cos(y/21));paint(x,y,T.RIVER);
    if(y>88)paint(x+1,y,T.RIVER);
   }
   // O ramal passa sob a comporta, em vez de deixar o mecanismo isolado
   // sobre terra seca. As trilhas seguintes fazem decks no cruzamento,
   // enquanto a água permanece visível a montante e na saída do canal.
   for(let y=90;y<=102;y++){paint(111,y,T.RIVER);paint(112,y,T.RIVER);}
   for(let x=111;x<=121;x++){paint(x,101,T.RIVER);paint(x,102,T.RIVER);}
   for(let x=124;x<139;x++){const y=110+Math.round(Math.sin(x*.3));paint(x,y,T.WATER);paint(x,y+1,T.WATER);}
   const wet=map.map(row=>row.map(isWater)),trail=new Set();
   const putTrail=(x,y)=>{if(x<ORIGINAL_WIDTH||x>=WIDTH||y<0||y>=HEIGHT)return;paint(x,y,wet[y][x]?T.WOOD:T.PATH);trail.add(x+','+y);};
   for(const points of routes)for(let p=1;p<points.length;p++){
    const a=points[p-1],b=points[p],steps=Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]));
    for(let i=0;i<=steps;i++){
     const x=Math.round(a[0]+(b[0]-a[0])*i/steps),y=Math.round(a[1]+(b[1]-a[1])*i/steps);
     for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)putTrail(x+dx,y+dy);
    }
   }
   for(const p of landmarks)for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)putTrail(p.tileX+dx,p.tileY+dy);
   // Uma passarela é um conjunto contínuo apoiado em terra, sem lascas de
   // madeira isoladas nas diagonais ou tábuas que escondem água bloqueada.
   const crossings=[...trail].map(k=>k.split(',').map(Number)).filter(([x,y])=>wet[y][x]);
   for(const [x,y]of crossings)for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(trail.has((x+dx)+','+(y+dy)))paint(x+dx,y+dy,T.WOOD);
   // O cais ocupa terraços de madeira fisicamente caminháveis junto à baía.
   for(let y=102;y<=106;y++)for(let x=127;x<=133;x++){paint(x,y,T.WOOD);trail.add(x+','+y);}
   main.map=map;main.MW=WIDTH;mainWorld=main;prepareWood(map);trailTiles=trail.size;
   const added=[],add=o=>{o._world=true;o._expedition=true;o.id=o.id||'exp_'+o.type+'_'+Math.floor(o.x/S)+'_'+Math.floor(o.y/S);added.push(o);main.objects.push(o);};
   const clear=p=>landmarks.every(l=>Math.hypot(l.tileX-p[0],l.tileY-p[1])>4);
   const room=(x,y,r=1)=>{
    if(x<99||x>141||y<7||y>120||!clear([x,y]))return false;
    for(let yy=y-r;yy<=y+r;yy++)for(let xx=x-r;xx<=x+r;xx++)if(trail.has(xx+','+yy)||isWater(map[yy]?.[xx])||map[yy]?.[xx]===T.WOOD)return false;
    return true;
   };
   // Pinheiros e contrafortes em grupos assimétricos, com amplas clareiras.
   for(const [x,y]of [[105,12],[108,14],[115,9],[117,10],[135,13],[138,15],[106,28],[104,31],[136,36],[139,38],[128,43],[101,18]])if(room(x,y))add({type:'mtn_pine',x:x*S+8,y:y*S+12});
   for(const [x,y,w]of [[103,19,44],[135,20,54],[123,39,48],[109,36,30],[138,47,34]])if(room(x,y))add({type:'expedition_scenery',kind:'terrace',x:x*S+8,y:y*S+8,w,h:9,variant:hash(x,y)%3});
   for(const [x,y]of [[105,52],[126,52],[135,56],[102,72],[107,74],[137,78]])if(room(x,y))add({type:'tree',x:x*S+8,y:y*S+12,s:1,shadeR:27});
   for(const [x,y]of [[126,65],[134,65],[126,73],[134,73]])if(room(x,y,0))add({type:'fx_fruittree',x:x*S+8,y:y*S+12,kind:(x+y)%2,_pickT:0});
   for(const [x,y]of [[115,52],[136,81],[110,87]])if(room(x,y,0))add({type:'fx_berry',x:x*S+8,y:y*S+12,_pickT:0});
   for(const [x,y,kind]of [[102,88,'driftwood'],[135,94,'shore_rocks'],[106,107,'shore_rocks'],[128,118,'driftwood'],[139,88,'shore_rocks'],[113,112,'shells'],[132,98,'shells']])if(room(x,y,0))add({type:'expedition_scenery',kind,x:x*S+8,y:y*S+10,variant:hash(x,y)%3});
   // O centro de interação é estável; o volume de cada ponto fica ao norte.
   for(const l of landmarks)add({type:'expedition_landmark',landmarkId:l.id,x:l.x,y:l.y,interactionHint:l.title});
   main._expeditionV612={width:WIDTH,originalWidth:ORIGINAL_WIDTH,addedObjects:added.length};return main.MW;
  }
  const R=(g,c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  function sprite(key,w,h,paint){let c=sprites.get(key);if(!c){c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;paint(g);sprites.set(key,c);}return c;}
  const P={ink:'#364d48',stone:'#748982',stoneHi:'#acb5a1',stoneDark:'#50655f',wood:'#927052',woodHi:'#c1a277',woodDark:'#5e5143',cream:'#e6d3a1',roof:'#776653',teal:'#638f82',rust:'#aa7258',leaf:'#7b8c57'};
  function contact(g,x,y,w){R(g,'rgba(31,50,42,.19)',x-w/2,y,w,3);}
  function boards(g,x,y,w,h){R(g,P.woodDark,x,y,w,h);for(let yy=0;yy<h;yy+=4){R(g,P.wood,x+1,y+yy,w-2,3);R(g,P.woodHi,x+2,y+yy,w-4,1);}for(let xx=x+4;xx<x+w;xx+=10)R(g,P.ink,xx,y+2,1,1);}
  function stone(g,x,y,w,h){R(g,P.stoneDark,x,y+2,w,h-2);R(g,P.stone,x+2,y,w-4,h-2);R(g,P.stoneHi,x+3,y,w-7,2);R(g,'#85958a',x+w-5,y+4,3,h-5);}
  function book(g,x,y){R(g,P.woodDark,x,y,10,6);R(g,P.cream,x+1,y,8,4);R(g,'#a98d60',x+5,y,1,4);R(g,P.teal,x+2,y+1,2,1);}
  function landmarkArt(g,id,cold){
   const x=56,y=88;contact(g,x,y+3,60);
   if(id==='exp_observatory'){
    // Pedra em semicírculo e telescópio baixo; vista aberta para a chegada.
    for(const [dx,dy]of [[-28,-9],[-23,-18],[-13,-24],[0,-26],[14,-24],[24,-18],[28,-9]])stone(g,x+dx-5,y+dy,10,12);
    R(g,P.woodDark,x-2,y-32,4,33);R(g,P.woodHi,x-1,y-31,1,29);
    R(g,P.woodDark,x-13,y-1,27,3);R(g,P.woodDark,x-12,y-1,3,7);R(g,P.woodDark,x+10,y-1,3,7);
    R(g,P.ink,x-10,y-39,26,9);R(g,P.teal,x-8,y-38,22,6);R(g,'#a4b5a4',x-7,y-38,18,2);R(g,P.ink,x+13,y-42,5,15);R(g,P.stoneHi,x+15,y-40,2,10);
    book(g,x-26,y-5);
   }else if(id==='exp_echo_stones'){
    for(const [dx,dy,h]of [[-22,-4,30],[0,-15,42],[23,-3,26]]){
     stone(g,x+dx-6,y+dy-h,13,h);for(let yy=8;yy<h-5;yy+=7){R(g,'#466c63',x+dx-3,y+dy-h+yy,5,1);R(g,'#91b0a1',x+dx-2,y+dy-h+yy+1,2,1);}
    }
    R(g,'#a3a681',x-29,y+1,8,2);R(g,'#a3a681',x+20,y+2,10,2);
   }else if(id==='exp_high_camp'){
    boards(g,x-26,y-9,52,12);R(g,P.woodDark,x-23,y-34,3,30);R(g,P.woodDark,x+21,y-34,3,30);
    R(g,'#6a8071',x-28,y-33,57,5);R(g,'#94a18b',x-25,y-37,51,4);R(g,'#bcc4a0',x-16,y-40,33,3);
    R(g,P.cream,x-19,y-28,11,17);R(g,P.teal,x-17,y-26,7,3);R(g,P.rust,x+8,y-15,10,8);book(g,x-5,y-14);
   }else if(id==='exp_windmill'){
    stone(g,x-19,y-14,38,18);R(g,P.woodDark,x-14,y-48,28,35);R(g,P.wood,x-12,y-46,24,32);
    for(let yy=y-44;yy<y-15;yy+=6)R(g,P.woodHi,x-11,yy,22,1);
    R(g,P.roof,x-18,y-52,36,5);R(g,P.roof,x-13,y-57,26,5);R(g,P.woodHi,x-8,y-60,16,3);
    R(g,P.ink,x-5,y-18,10,17);R(g,P.cream,x+6,y-39,5,8);R(g,P.teal,x+7,y-38,3,5);book(g,x-29,y-3);
   }else if(id==='exp_seed_orchard'){
    boards(g,x-24,y-3,48,7);R(g,P.woodDark,x-21,y-1,3,8);R(g,P.woodDark,x+18,y-1,3,8);
    for(const [dx,dy,c]of [[-18,-14,P.teal],[-5,-12,P.rust],[8,-15,P.stoneHi]]){R(g,P.woodDark,x+dx,y+dy,10,12);R(g,c,x+dx+1,y+dy+1,8,8);R(g,P.cream,x+dx+3,y+dy+3,4,3);}
    R(g,P.woodDark,x+24,y-22,3,28);R(g,P.woodHi,x+20,y-25,16,10);R(g,P.leaf,x+22,y-23,4,3);R(g,P.cream,x+27,y-23,6,1);
   }else if(id==='exp_post_shelter'){
    R(g,P.woodDark,x-24,y-34,4,39);R(g,P.woodDark,x+21,y-34,4,39);boards(g,x-25,y-13,50,8);
    R(g,P.roof,x-29,y-37,59,5);R(g,P.woodHi,x-23,y-41,47,4);R(g,P.wood,x-16,y-44,33,3);
    R(g,P.teal,x-17,y-28,17,14);R(g,'#9bb3a0',x-16,y-28,15,3);R(g,P.ink,x-14,y-23,10,2);R(g,P.cream,x+6,y-24,12,8);R(g,P.rust,x+8,y-21,7,1);book(g,x-9,y-12);
   }else if(id==='exp_channel_lock'){
    stone(g,x-29,y-22,10,28);stone(g,x+20,y-22,10,28);boards(g,x-21,y-14,43,10);
    R(g,P.ink,x-2,y-39,4,28);R(g,P.woodHi,x-2,y-35,4,2);R(g,P.woodDark,x-13,y-32,26,3);R(g,P.woodDark,x-10,y-39,3,17);R(g,P.woodDark,x+8,y-39,3,17);
    R(g,P.cream,x+26,y-31,2,29);for(let yy=0;yy<25;yy+=5)R(g,P.ink,x+26,y-30+yy,4,1);
   }else if(id==='exp_post_pier'){
    // O piso pertence aos tiles WOOD; apenas mesa, amarração e sino são props.
    boards(g,x-22,y-10,43,8);R(g,P.woodDark,x-20,y-2,3,10);R(g,P.woodDark,x+16,y-2,3,10);book(g,x-17,y-13);
    R(g,P.cream,x-3,y-14,16,7);R(g,P.teal,x+1,y-12,7,1);R(g,P.woodDark,x+28,y-40,4,47);R(g,P.woodHi,x+25,y-40,10,3);R(g,'#c3a164',x+26,y-33,8,8);R(g,P.woodDark,x+25,y-25,10,2);
    R(g,P.woodHi,x-30,y-2,6,8);R(g,P.cream,x-31,y,8,2);
   }else{
    for(const [dx,dy,w,h]of [[-22,-5,18,18],[0,-12,19,27],[24,-2,14,16]]){stone(g,x+dx-w/2,y+dy-h,w,h);for(let yy=7;yy<h;yy+=7)R(g,P.teal,x+dx-w/2+3,y+dy-h+yy,w-6,1);}
    for(const [dx,dy]of [[-28,2],[-9,4],[12,2],[30,3]]){R(g,P.cream,x+dx,y+dy,4,2);R(g,'#b59b7d',x+dx+1,y+dy+2,2,1);}
   }
   if(cold){R(g,'#b7cec1',x-20,y+1,8,1);R(g,'#d0ded0',x+12,y+2,7,1);}
  }
  function pixelQuad(g,color,points){
   // Rasterização em linhas inteiras: girar retângulos no Canvas suavizava
   // as pás, deixando uma mancha enquanto o restante do jogo é pixel art.
   const top=Math.min(...points.map(p=>p[1])),bottom=Math.max(...points.map(p=>p[1]));g.fillStyle=color;
   for(let y=top;y<bottom;y++){
    const hits=[],scan=y+.5;
    for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a[1]<=scan&&b[1]>scan)||(b[1]<=scan&&a[1]>scan))hits.push(a[0]+(scan-a[1])*(b[0]-a[0])/(b[1]-a[1]));}
    if(hits.length<2)continue;const left=Math.ceil(Math.min(...hits)),right=Math.floor(Math.max(...hits));if(right>=left)g.fillRect(left,y,right-left+1,1);
   }
  }
  function drawRotor(g,x,y,angle){
   for(let i=0;i<4;i++){
    const a=angle+i*Math.PI/2,c=Math.cos(a),s=Math.sin(a),turn=(u,v)=>[Math.round(x+u*c-v*s),Math.round(y+u*s+v*c)];
    const quad=(color,l,t,r,b)=>pixelQuad(g,color,[turn(l,t),turn(r,t),turn(r,b),turn(l,b)]);
    quad(P.woodDark,0,-2,28,1);quad(P.woodHi,12,-9,26,-1);quad(P.cream,13,-8,25,-7);
    for(let k=16;k<27;k+=4)quad(P.woodDark,k,-8,k+1,-1);
   }
  }
  function drawLandmark(o,g){
   const cold=!!API.isFrio(),c=sprite(o.landmarkId+':'+cold,112,104,q=>landmarkArt(q,o.landmarkId,cold));g.drawImage(c,Math.round(o.x-56),Math.round(o.y-88));
   if(o.landmarkId==='exp_windmill'){
    // Giro lento, quatro pás com eixo fixo. Reduzir movimento congela o rotor.
    const move=typeof motionOk!=='function'||motionOk(),now=move?performance.now():0,angle=Math.floor(now/170)*Math.PI/96;
    drawRotor(g,Math.round(o.x),Math.round(o.y-43),angle);R(g,P.ink,o.x-3,o.y-46,6,6);R(g,P.woodHi,o.x-1,o.y-44,2,2);
   }
  }
  function sceneryArt(g,o){
   const x=40,y=34;contact(g,x,y+4,50);
   if(o.kind==='terrace'){
    const w=o.w||44;stone(g,x-w/2,y-12,w,17);R(g,'#788c70',x-w/2+3,y-14,w-6,2);R(g,P.stoneDark,x-w/2+6,y-6,w-12,1);R(g,P.stoneHi,x-w/2+4,y-10,Math.floor(w*.5),1);
   }else if(o.kind==='shore_rocks'){
    stone(g,x-23,y-7,23,12);stone(g,x-4,y-14,24,19);stone(g,x+14,y-3,13,9);R(g,P.teal,x-19,y+3,13,2);R(g,P.teal,x+2,y+2,17,2);
   }else if(o.kind==='driftwood'){
    R(g,P.woodDark,x-24,y-1,48,5);R(g,'#a99a7a',x-22,y-3,43,5);R(g,'#c3b58d',x-18,y-3,32,1);R(g,P.woodDark,x+7,y-8,3,8);R(g,P.woodHi,x+8,y-10,2,7);R(g,'#77816a',x-11,y+2,15,1);
   }else for(const [dx,dy]of [[-14,-3],[5,-5],[15,0],[-2,4]]){R(g,P.cream,x+dx,y+dy,5,2);R(g,'#ba9c80',x+dx+1,y+dy+2,3,1);}
  }
  API.registerObjectDrawer('expedition_landmark',drawLandmark);
  API.registerObjectDrawer('expedition_scenery',(o,g)=>g.drawImage(sprite(o.kind+':'+(o.w||0)+':'+(o.variant||0),80,44,q=>sceneryArt(q,o)),Math.round(o.x-40),Math.round(o.y-34)));
  function footprint(o){
   if(o.type==='expedition_landmark'){
    if(o.landmarkId==='exp_echo_stones'||o.landmarkId==='exp_tide_stones')return{x:o.x-9,y:o.y-21,w:18,h:15};
    return{x:o.x-20,y:o.y-12,w:40,h:15};
   }
   if(o.type==='expedition_scenery'&&['terrace','shore_rocks','driftwood'].includes(o.kind))return{x:o.x-(o.kind==='terrace'?(o.w||44)/2:23),y:o.y-6,w:o.kind==='terrace'?(o.w||44):46,h:11};
   return null;
  }
  function depth(o){if(o.type==='expedition_landmark')return o.y+5;if(o.type==='expedition_scenery')return o.y+5;return null;}
  function drawGroundShadows(g,visible,sun){
   if(API.rawScene!=='main'||!sun||!Number.isFinite(sun.dx)||!Number.isFinite(sun.a)||sun.a<=0)return 0;
   let count=0;const dx=Math.max(-1.6,Math.min(1.6,sun.dx));g.save();g.fillStyle='rgba(25,46,40,'+Math.min(.18,sun.a*.7)+')';
   for(const o of visible){
    if(o.type!=='expedition_landmark'&&o.type!=='expedition_scenery')continue;
    const b=footprint(o);if(!b)continue;
    const h=o.landmarkId==='exp_windmill'?54:o.type==='expedition_landmark'?29:12,reach=dx*Math.min(27,h*.45),base=o.y+3;
    g.beginPath();g.moveTo(b.x,base);g.lineTo(b.x+b.w,base);g.lineTo(b.x+b.w+reach,base+5+Math.abs(dx)*5);g.lineTo(b.x+reach,base+8+Math.abs(dx)*5);g.closePath();g.fill();count++;
   }g.restore();return count;
  }
  function drawTerrainDetails(g,px,py,x,y,t,cold){
   if(API.rawScene!=='main'||x<ORIGINAL_WIDTH||x>=WIDTH||y<0||y>=HEIGHT||isWater(t)||t===T.WOOD)return;
   const edge=smooth((x-96)/6);if(edge<=0)return;
   const seed=hash(x,y),detail=hash(x*7,y*13),rx=px+2+(detail%10),ry=py+2+((detail>>>9)%10),area=regionAt(x,y);
   g.save();g.globalAlpha*=edge;
   if(area==='highlands'){
    if([T.STONE,T.SNOWROCK,T.GRASS2].includes(t)&&seed%5===0){R(g,cold?'#a4bbb0':'#7d8e80',px+1,py+6,12,2);R(g,'rgba(56,78,68,.35)',px+3,py+8,10,1);R(g,'#b4bda2',px+2,py+5,7,1);}
    if(t===T.SNOW&&seed%9===0){R(g,'#b2c6bd',rx,ry,5,1);R(g,'#91afa8',rx+2,ry+1,4,1);}
   }else if(area==='meadow'&&[T.GRASS,T.GRASS2].includes(t)){
    // Touceiras de palha baixas, flores e folhas em posições mundiais fixas.
    if(seed%4===0){R(g,cold?'#9aaa8b':'#9c9d69',rx,ry,4,1);R(g,cold?'#b4bd9d':'#b6ac75',rx+1,ry-2,1,2);R(g,'#7e8d60',rx+3,ry-1,1,2);}
    if(seed%29===0){R(g,'#8e9a69',rx+1,ry+1,1,3);R(g,detail&1?'#d9c08a':'#b49b9e',rx,ry,3,2);R(g,'#ede0b2',rx+1,ry,1,1);}
   }else if(area==='coast'){
    if(t===T.SAND){
     const wet=[API.tileAt(x-1,y),API.tileAt(x+1,y),API.tileAt(x,y-1),API.tileAt(x,y+1)].some(isWater);
     if(wet){R(g,'rgba(87,118,105,.24)',px+2,py+4,12,3);R(g,'rgba(154,160,126,.3)',px+3,py+7,9,2);}
     if(seed%17===0){R(g,P.cream,rx,ry,3,1);R(g,'#aa9578',rx+1,ry+1,2,1);}
    }else if(t===T.GRASS2&&seed%4===0){R(g,'#8f9872',rx,ry,4,1);R(g,'#b0aa7f',rx+2,ry-2,1,2);}
   }
   g.restore();
  }
  function drawWoodTile(g,px,py,x,y){
   if(API.rawScene!=='main'||x<ORIGINAL_WIDTH||x>=WIDTH)return false;
   const horizontal=woodTiles.get(y*WIDTH+x)??true,seed=hash(x,y);R(g,'#8b8069',px,py,S,S);
   for(let n=0;n<S;n+=4){if(horizontal){R(g,'#655e4f',px+n+3,py,1,S);R(g,'#ae9b78',px+n,py,1,S);}else{R(g,'#655e4f',px,py+n+3,S,1);R(g,'#ae9b78',px,py+n,S,1);}}
   const map=mainWorld?.map,west=map?.[y]?.[x-1]!==T.WOOD,east=map?.[y]?.[x+1]!==T.WOOD,north=map?.[y-1]?.[x]!==T.WOOD,south=map?.[y+1]?.[x]!==T.WOOD;
   if(west)R(g,P.woodDark,px,py,2,S);if(east)R(g,P.woodDark,px+S-2,py,2,S);if(north)R(g,'#b5a17b',px,py,S,2);if(south)R(g,P.woodDark,px,py+S-2,S,2);
   if((north||south)&&horizontal){R(g,P.ink,px+5,py+(north?2:S-4),1,1);R(g,P.ink,px+13,py+(north?2:S-4),1,1);}
   if(seed%4===0)R(g,'#777d61',px+5,py+8,3,1);return true;
  }
  window.FarmExpeditionWorld=Object.freeze({expand,blendWeights,regionAt,regions,landmarks,routes,footprint,depth,drawGroundShadows,drawTerrainDetails,drawWoodTile,
   artInfo:()=>({sprites:sprites.size,maxSprites:40,bridgeSections,bridgeTiles:woodTiles.size,trailTiles}),
   dimensions:Object.freeze({originalWidth:ORIGINAL_WIDTH,width:WIDTH,height:HEIGHT})});
 });
})();
