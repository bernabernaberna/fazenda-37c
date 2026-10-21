/* Expansão contígua a leste. As primeiras60colunas ficam intactas:
   nenhum objeto, porta, coordenada, cultivo ou tile antigo é deslocado.
   expand roda depois dos carimbos originais e antes do snapshot da partida. */
(function(){
 (window.__farmBiomes=window.__farmBiomes||[]).push(function(API){
  'use strict';
  const T=API.T,S=API.TS,ORIGINAL_WIDTH=60,WIDTH=96,HEIGHT=124;
  const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const hash=(x,y)=>(Math.imul(x^8191,73856093)^Math.imul(y^131071,19349663))>>>0;
  // Metadados apenas de pintura, refeitos com o mundo. Cada passarela usa
  // tábuas perpendiculares à sua travessia, sem emendas que mudem por tile.
  const bridgeTiles=new Map();let bridgeSections=0;
  const pixel=(x,y)=>({x:x*S+8,y:y*S+8});
  const regions=Object.freeze({
   forest:Object.freeze({id:'forest',name:'Mata das Nascentes',mapLabel:'MATA DAS NASCENTES',label:'mata',tempDelta:-.012,hydDelta:-.04,sweatBoost:0,thermalCause:'ar fresco da mata',mapX:78,mapY:46}),
   wetland:Object.freeze({id:'wetland',name:'Veredas do Sul',mapLabel:'VEREDAS DO SUL',label:'veredas',tempDelta:.025,hydDelta:-.22,sweatBoost:.8,thermalCause:'calor úmido das veredas',mapX:78,mapY:109})
  });
  const landmarks=Object.freeze([
   Object.freeze({id:'open_spring',...pixel(78,35),title:'Marcas da nascente',region:'forest',description:'Compare as marcas d’água e acompanhe a nascente.'}),
   Object.freeze({id:'open_seed_memory',...pixel(78,58),title:'Banco de sementes da mata',region:'forest',description:'Revise os recipientes e registre o cuidado com as sementes.'}),
   Object.freeze({id:'open_water_gauge',...pixel(85,96),title:'Régua das veredas',region:'wetland',description:'Leia o nível da água e acompanhe o canal.'})
  ]);
  const npcSpawns=Object.freeze({helena:Object.freeze(pixel(77,36)),bia:Object.freeze(pixel(77,59)),davi:Object.freeze(pixel(84,97))});
  const routes=Object.freeze([
   [[60,58],[67,58],[71,51],[76,46],[76,36],[76,29],[83,25],[89,23]],
   [[76,36],[78,36],[78,35]],
   [[67,58],[78,59],[88,60],[90,74],[85,83],[84,97],[88,109],[92,116]],
   [[67,58],[66,74],[71,84],[72,98],[76,111],[88,109]],
   [[71,84],[85,83]],[[72,98],[84,97]],[[78,59],[78,58]],[[84,97],[85,96]]
  ]);
  function blendWeights(x,y,base){
   if(!Number.isFinite(x)||x<60||x>=WIDTH||y<28||y>=HEIGHT)return base;
   const east=smooth((x-60)/6),north=smooth((y-28)/10),south=smooth((y-78)/10),weight=east*north;
   if(weight<=0)return base;
   const combined=base.map(([id,w])=>[id,w*(1-weight)]).filter(([,w])=>w>1e-9);
   const forest=weight*(1-south),wetland=weight*south;
   if(forest>1e-9)combined.push(['forest',forest]);if(wetland>1e-9)combined.push(['wetland',wetland]);
   return combined;
  }
  function regionAt(x,y){
   if(x<60||x>=WIDTH||y<28||y>=HEIGHT)return null;
   return y<83?'forest':'wetland';
  }
  function prepareBridgeArt(map){
   bridgeTiles.clear();bridgeSections=0;
   const visited=new Set();
   for(let y=0;y<HEIGHT;y++)for(let x=ORIGINAL_WIDTH;x<WIDTH;x++){
    const key=y*WIDTH+x;if(map[y]?.[x]!==T.WOOD||visited.has(key))continue;
    const pending=[[x,y]],tiles=[];let left=x,right=x,top=y,bottom=y;visited.add(key);
    for(let i=0;i<pending.length;i++){
     const [tx,ty]=pending[i];tiles.push([tx,ty]);left=Math.min(left,tx);right=Math.max(right,tx);top=Math.min(top,ty);bottom=Math.max(bottom,ty);
     for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){
      const nx=tx+dx,ny=ty+dy,nk=ny*WIDTH+nx;
      if(nx>=ORIGINAL_WIDTH&&nx<WIDTH&&ny>=0&&ny<HEIGHT&&map[ny]?.[nx]===T.WOOD&&!visited.has(nk)){visited.add(nk);pending.push([nx,ny]);}
     }
    }
    const horizontal=right-left>=bottom-top;bridgeSections++;
    for(const [tx,ty]of tiles)bridgeTiles.set(ty*WIDTH+tx,horizontal);
   }
  }
  function expand(main){
   if(!main||main._openWorldV67)return main?.MW||ORIGINAL_WIDTH;
   if(main.MW!==ORIGINAL_WIDTH||main.MH!==HEIGHT)throw Error('A expansão espera o mundo original60×124.');
   const m=main.map.map((row,y)=>{
    const next=row.slice();
    for(let x=ORIGINAL_WIDTH;x<WIDTH;x++){
     const n=(Math.sin(x*.29+y*.14)+Math.cos(x*.17-y*.21)+2)/4;
     const east=smooth((x-60)/6),thaw=smooth((y-34)/8)*(1-east)+smooth((y-28)/10)*east;
     let t=y<42?(n<thaw?T.GRASS:T.SNOW):T.GRASS;
     // A areia do antigo extremo sul entra como línguas no campo úmido.
     if(y>=82&&x<67&&n>smooth((x-60)/7))t=y<90?T.CRACKED:T.SAND;
     else if(y>=80&&n>.76)t=T.SAND;
     else if(t===T.GRASS&&n<.37)t=T.GRASS2;
     if(y<3)t=T.SNOWROCK;
     next.push(t);
    }return next;
   });
   const paint=(x,y,t)=>{if(x>=ORIGINAL_WIDTH&&x<WIDTH&&y>=0&&y<HEIGHT)m[y][x]=t;};
   const pond=(cx,cy,rx,ry,t)=>{for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++){
    const edge=1+.07*Math.sin(x*1.4+y*.7);if(((x-cx)/rx)**2+((y-cy)/ry)**2<edge)paint(x,y,t);
   }};
   pond(86,34,5.5,4,T.WATER);pond(87,94,6,5,T.WATER);pond(73,107,6.5,4,T.WATER);
   for(let y=36;y<124;y++){
    const x=Math.round(83+Math.sin((y-36)/11)*4+Math.sin(y/23)*2);
    paint(x,y,T.RIVER);paint(x+1,y,T.RIVER);
    if(y>85&&y%11<5)paint(x-1,y,T.RIVER);
   }
   // Circuitos caminháveis com passagens em madeira nos cruzamentos d’água.
   // Largura de três tiles: duas pessoas podem conversar sem bloquear a rota.
   const wetBeforeTrails=m.map(row=>row.map(t=>t===T.WATER||t===T.RIVER||t===T.OASIS));
   const trail=new Set();
   for(const points of routes)for(let p=1;p<points.length;p++){
    const a=points[p-1],b=points[p],steps=Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]));
    for(let i=0;i<=steps;i++){
     const x=Math.round(a[0]+(b[0]-a[0])*i/steps),y=Math.round(a[1]+(b[1]-a[1])*i/steps);
     for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const xx=x+dx,yy=y+dy;if(xx<60||xx>=WIDTH||yy<0||yy>=HEIGHT)continue;
      const water=wetBeforeTrails[yy][xx];paint(xx,yy,water?T.WOOD:T.PATH);trail.add(xx+','+yy);
     }
    }
   }
   const clear=[...landmarks,...Object.values(npcSpawns)];
   for(const p of clear){const tx=Math.floor(p.x/S),ty=Math.floor(p.y/S);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){paint(tx+dx,ty+dy,wetBeforeTrails[ty+dy][tx+dx]?T.WOOD:T.PATH);trail.add((tx+dx)+','+(ty+dy));}}
   // As tábuas atravessam toda a largura da trilha e se apoiam em terra.
   // Dilatar somente sobre a trilha mantém uma passarela única, em vez de
   // pequenas lascas de madeira na borda diagonal de uma poça.
   const crossings=[...trail].map(k=>k.split(',').map(Number)).filter(([x,y])=>wetBeforeTrails[y][x]);
   for(const [x,y]of crossings)for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(trail.has((x+dx)+','+(y+dy)))paint(x+dx,y+dy,T.WOOD);
   main.map=m;main.MW=WIDTH;prepareBridgeArt(m);
   const added=[],add=o=>{o._world=true;o._openWorld=true;added.push(o);main.objects.push(o);};
   // Grupos pequenos deixam clareiras e linhas de visão; nenhum volume nas trilhas.
   const room=(tx,ty,r=2)=>{
    if(tx<62||tx>93||ty<6||ty>120)return false;
    for(let y=ty-r;y<=ty+r;y++)for(let x=tx-r;x<=tx+r;x++)if(trail.has(x+','+y)||[T.WATER,T.RIVER,T.WOOD].includes(m[y]?.[x]))return false;
    return clear.every(p=>Math.hypot(p.x/S-tx,p.y/S-ty)>4);
   };
   for(let y=10;y<80;y+=6)for(let x=64;x<95;x+=6){
    const seed=hash(x,y),tx=x+(seed%3)-1,ty=y+((seed>>>4)%3)-1;
    if(seed%5===0||!room(tx,ty))continue;
    add({type:ty<34?'mtn_pine':'tree',x:tx*S+8,y:ty*S+12,shadeR:26+(seed%3),s:1});
   }
   for(const [x,y]of [[65,88],[69,91],[92,88],[92,103],[83,115],[64,110],[79,119]])if(room(x,y))add({type:'des_palm',x:x*S+8,y:y*S+12});
   for(let y=83;y<120;y+=5)for(const x of [69,78,90]){
    if(trail.has(x+','+y)||!room(x,y,0)||[T.WATER,T.RIVER,T.WOOD].includes(m[y][x]))continue;
    add({type:'river_cattail',x:x*S+8,y:y*S+10});
   }
   for(const [x,y]of [[84,33],[86,94],[72,107]])if([T.WATER,T.RIVER].includes(m[y][x]))add({type:'river_lily',x:x*S+8,y:y*S+8,kind:y===94?'pink':'white'});
   // Recursos de forrageio usam a atividade renovável já existente.
   for(const [x,y]of [[65,54],[74,64],[88,79]])if(room(x,y,1))add({type:'fx_berry',x:x*S+8,y:y*S+12,_pickT:0});
   for(const landmark of landmarks)add({type:'open_world_landmark',landmarkId:landmark.id,x:landmark.x,y:landmark.y,interactionHint:landmark.title});
   main._openWorldV67={width:WIDTH,originalWidth:ORIGINAL_WIDTH,addedObjects:added.length};
   return main.MW;
  }
  const R=(g,c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
  function drawTerrainDetails(g,px,py,x,y,t,cold){
   if(API.rawScene!=='main'||x<ORIGINAL_WIDTH||x>=WIDTH||y<28||y>=HEIGHT||![T.GRASS,T.GRASS2].includes(t))return;
   // Folhiço e solo úmido distinguem os habitats usando o cache de terreno.
   // Não cria tufos novos, props, animação, colisão ou sorteios por câmera.
   const edge=smooth((x-60)/7)*smooth((y-28)/12);if(edge<=0)return;
   const wet=smooth((y-78)/12),seed=hash(x,y),detail=hash(x*13+7,y*17+5),straw=wet>.5;
   const px1=px+3+((detail>>>7)%8),py1=py+3+((detail>>>17)%8);
   g.save();g.globalAlpha*=edge*(cold?.55:1);
   if(detail%11===0){
    // Filetes irregulares de solo entre folhas. Não há sobreposição de
    // transparências nem carimbo repetido nos quatro tiles de um bloco.
    const flip=(detail>>>4)&1?1:-1;
    g.fillStyle=straw?'rgba(115,108,74,.10)':'rgba(43,78,58,.10)';
    g.fillRect(px1,py1,3,1);g.fillRect(px1-flip,py1+1,5,1);g.fillRect(px1+flip,py1+2,2,1);
   }
   if(seed%7===0){
    R(g,straw?'#7d805a':'#687650',px1,py1,4,1);
    R(g,straw?'#959067':'#7e8360',px1+1,py1-1,2,1);
    if((seed>>>9)%2===0)R(g,straw?'#727955':'#576a4d',px1+3,py1+2,2,1);
   }
   // Capilaridade na borda da água: poucos filetes escuros indicam chão
   // molhado. O contorno físico e o desenho de oito vizinhos ficam intactos.
   const water=v=>v===T.WATER||v===T.RIVER||v===T.OASIS;
   if(straw&&seed%3===0){
    const north=water(API.tileAt(x,y-1)),south=water(API.tileAt(x,y+1));
    const west=water(API.tileAt(x-1,y)),east=water(API.tileAt(x+1,y));
    g.fillStyle='rgba(66,85,65,.29)';
    if(north||south){const yy=py+(north?3:S-5);g.fillRect(px+3,yy,5,1);g.fillRect(px+4,yy+1,2,1);}
    if(west||east){const xx=px+(west?3:S-5);g.fillRect(xx,py+6,1,4);g.fillRect(xx+1,py+7,1,2);}
   }
   g.restore();
  }
  API.registerTileDrawer(T.WOOD,(g,px,py,x,y)=>{
   if(window.FarmExpeditionWorld?.drawWoodTile?.(g,px,py,x,y))return;
   if(API.rawScene!=='main'||x<ORIGINAL_WIDTH){API.drawBaseTile(g,px,py,x,y,T.WOOD);return;}
   // Tábuas contínuas e gastas no cache estático. A antiga textura de piso
   // interno formava tijolos laranja e repetia nós em cada quadrado de16px.
   const horizontal=bridgeTiles.get(y*WIDTH+x)??false,seed=hash(x,y),wet=y>=83;
   R(g,wet?'#82745e':'#8b7961',px,py,S,S);
   for(let i=0;i<S;i+=4){
    if(horizontal){R(g,'#625b4c',px+i+3,py,1,S);R(g,'#a08c6f',px+i,py,1,S);}
    else{R(g,'#625b4c',px,py+i+3,S,1);R(g,'#a08c6f',px,py+i,S,1);}
   }
   if(seed%3===0){
    if(horizontal){R(g,'#6e6351',px+5,py+3,1,7);R(g,'#a38e70',px+6,py+5,1,3);}
    else{R(g,'#6e6351',px+3,py+5,7,1);R(g,'#a38e70',px+5,py+6,3,1);}
   }
   const west=API.tileAt(x-1,y)!==T.WOOD,east=API.tileAt(x+1,y)!==T.WOOD;
   const north=API.tileAt(x,y-1)!==T.WOOD,south=API.tileAt(x,y+1)!==T.WOOD;
   if(west){R(g,'#514d41',px,py,2,S);R(g,'#b39a72',px+2,py,1,S);}
   if(east){R(g,'#514d41',px+S-2,py,2,S);R(g,'#a08b69',px+S-3,py,1,S);}
   if(north)R(g,'#b39a72',px,py,S,2);
   if(south){R(g,'#514d41',px,py+S-3,S,3);R(g,'#a08b69',px,py+S-4,S,1);}
   // Fixadores acompanham as vigas, não aparecem como confete no centro.
   if(horizontal&&(north||south)){const yy=py+(north?2:S-4);R(g,'#444b43',px+5,yy,1,1);R(g,'#444b43',px+13,yy,1,1);}
   if(!horizontal&&(west||east)){const xx=px+(west?2:S-4);R(g,'#444b43',xx,py+5,1,1);R(g,'#444b43',xx,py+13,1,1);}
   if(wet&&seed%4===0&&(west||east||south))R(g,'#657159',px+(west?1:east?S-3:4),py+(south?S-2:6),2,1);
  });
  API.registerObjectDrawer('open_world_landmark',(o,g)=>{
   const x=Math.round(o.x),y=Math.round(o.y),cold=API.isFrio();
   R(g,'rgba(24,59,54,.18)',x-8,y+3,16,2);
   if(o.landmarkId==='open_spring'){
    // Pedra de referência gravada: três marcas de água em tons gastos.
    R(g,'#4f625d',x-7,y-5,14,8);R(g,cold?'#a0bebc':'#74817a',x-5,y-8,10,10);
    R(g,'#a3b0a0',x-4,y-8,7,2);R(g,'#5b9386',x-3,y-4,6,1);R(g,'#669a8e',x-3,y-1,4,1);
   }else if(o.landmarkId==='open_seed_memory'){
    // Uma caixa baixa de latas, sem nova construção ou área de colisão.
    R(g,'#57453c',x-9,y-4,18,8);R(g,'#886548',x-8,y-3,16,5);R(g,'#b99161',x-9,y-5,18,2);
    R(g,'#74817a',x-6,y-10,5,7);R(g,'#a8b5a0',x-6,y-10,5,2);R(g,'#ad6650',x+1,y-8,5,5);
    R(g,'#eee2b8',x-5,y-6,3,2);R(g,'#d0b98c',x+2,y-8,3,1);
   }else{
    R(g,'#57453c',x-2,y-18,4,22);R(g,'#b99161',x-1,y-17,2,19);
    R(g,'#eee2b8',x-1,y-15,2,1);R(g,'#eee2b8',x-1,y-11,2,1);R(g,'#eee2b8',x-1,y-7,2,1);
    R(g,'#5b9386',x-2,y-3,4,2);R(g,'#74817a',x-4,y+3,8,2);
   }
  });
  window.FarmOpenWorld=Object.freeze({expand,blendWeights,regionAt,regions,landmarks,npcSpawns,routes,drawTerrainDetails,
   artInfo(){return{bridgeSections,bridgeTiles:bridgeTiles.size};},
   dimensions:Object.freeze({originalWidth:ORIGINAL_WIDTH,width:WIDTH,height:HEIGHT})});
 });
})();
