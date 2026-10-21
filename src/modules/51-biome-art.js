/* Materiais originais dos oito habitats. A pintura pertence ao cache estático;
   não cria objetos, colisões, sorteios por quadro nem altera a temperatura. */
(function(){
 (window.__farmBiomes=window.__farmBiomes||[]).push(function(API){
  'use strict';
  const T=API.T,S=API.TS,IDS=Object.freeze(['farm','mountain','desert','forest','wetland','highlands','meadow','coast']);
  const LIMIT=4096,GRID=32,profiles=new Map();let readerRef=null,openRef=null,eastRef=null;
  const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const hash=(x,y,s=0)=>{let h=Math.imul((x|0)^0x45d9f3b,0x45d9f3b)^Math.imul((y|0)+s*101,0x27d4eb2d);h^=h>>>16;return h>>>0;};
  const hex=n=>'#'+Math.max(0,Math.min(0xffffff,n)).toString(16).padStart(6,'0');
  const rgb=c=>{const n=parseInt(c.slice(1),16);return Object.freeze([n>>>16,(n>>>8)&255,n&255]);};
  const specs={
   farm:{ground:'#6d8155',shade:'#586e4b',light:'#8e9b67',soil:'#71533e',stone:'#7b887b',water:'#387e7b',accent:'#d3bc83',sand:'#cdb580',snow:'#d4e1d7',ice:'#83b8b1',frost:'#aebfb0'},
   mountain:{ground:'#7d9992',shade:'#69867f',light:'#a5b6a7',soil:'#778a80',stone:'#7a9190',water:'#507e8a',accent:'#b6cfcb',sand:'#bfc0a2',snow:'#cbdfe2',ice:'#81b5c0',frost:'#afc7c6'},
   desert:{ground:'#a0935d',shade:'#877f4f',light:'#bcac77',soil:'#a17b55',stone:'#aa8a70',water:'#4b8a7a',accent:'#d8a478',sand:'#d6ab6d',snow:'#d8d9c5',ice:'#87b5ae',frost:'#bcc3a5'},
   forest:{ground:'#496b52',shade:'#365842',light:'#6d8960',soil:'#635c43',stone:'#718276',water:'#2f6e6a',accent:'#b1ac7d',sand:'#beb685',snow:'#c4d7ce',ice:'#75aaa3',frost:'#97b4a5'},
   wetland:{ground:'#78805a',shade:'#5d6b50',light:'#9b9b69',soil:'#78745a',stone:'#76847a',water:'#567e72',accent:'#b7ac79',sand:'#c9bc8b',snow:'#cedbc7',ice:'#8cb6a6',frost:'#b0bf9c'},
   highlands:{ground:'#7a8b77',shade:'#65796f',light:'#a6ad8d',soil:'#7f8270',stone:'#82959a',water:'#5f9095',accent:'#c1c59a',sand:'#c9c4a1',snow:'#c5d7d9',ice:'#8cb9bd',frost:'#b1c5b8'},
   meadow:{ground:'#9b9c65',shade:'#828850',light:'#b8b47b',soil:'#8b7952',stone:'#8d9480',water:'#4d8178',accent:'#d6b88b',sand:'#d6c18b',snow:'#d7dfca',ice:'#93bcae',frost:'#c1caaa'},
   coast:{ground:'#9d9f74',shade:'#7d8d70',light:'#bcc19a',soil:'#a3997a',stone:'#8b9e9a',water:'#448e94',accent:'#e0cba6',sand:'#dfcca2',snow:'#dae5da',ice:'#95c7c9',frost:'#bdcebd'}
  };
  const palette={},channels={};
  for(const id of IDS){
   const water=rgb(specs[id].water),light=water.map((v,i)=>Math.min(255,v+[48,46,31][i])),shade=water.map((v,i)=>Math.max(0,v-[20,18,14][i]));
   specs[id].waterLight=hex((light[0]<<16)|(light[1]<<8)|light[2]);specs[id].waterShade=hex((shade[0]<<16)|(shade[1]<<8)|shade[2]);
   palette[id]=Object.freeze(specs[id]);channels[id]={};for(const key of Object.keys(specs[id]))channels[id][key]=rgb(specs[id][key]);Object.freeze(channels[id]);
  }
  Object.freeze(palette);Object.freeze(channels);
  function fallback(x,y){
   let base;
   if(y<34)base=[['mountain',1]];
   else if(y<42){const a=clamp((y-34+.5)/8);base=[['mountain',1-a],['farm',a]];}
   else if(y<82)base=[['farm',1]];
   else if(y<90){const a=clamp((y-82+.5)/8);base=[['farm',1-a],['desert',a]];}
   else base=[['desert',1]];
   const oldX=Math.min(x,95.999);
   if(oldX>=60&&y>=28&&y<124){
    const east=smooth((oldX-60)/6)*smooth((y-28)/10),wet=smooth((y-78)/10);
    base=base.map(([id,w])=>[id,w*(1-east)]).concat([['forest',east*(1-wet)],['wetland',east*wet]]);
   }
   if(x>=96&&x<144&&y>=0&&y<124){
    const east=smooth((x-96)/6),high=1-smooth((y-45)/6),coast=smooth((y-83)/6);
    base=base.map(([id,w])=>[id,w*(1-east)]).concat([['highlands',high*east],['meadow',(1-high)*(1-coast)*east],['coast',(1-high)*coast*east]]);
   }
   return base;
  }
  function activeReader(){
   const reader=typeof regionWeights==='function'?regionWeights:null;
   if(reader!==readerRef||openRef!==window.FarmOpenWorld||eastRef!==window.FarmExpeditionWorld){
    profiles.clear();readerRef=reader;openRef=window.FarmOpenWorld;eastRef=window.FarmExpeditionWorld;
   }
   return reader;
  }
  function profileAt(wx,wy){
   const x=Number.isFinite(wx)?wx/S:0,y=Number.isFinite(wy)?wy/S:0,reader=activeReader();
   let values;try{values=reader?reader(y,x):fallback(x,y);}catch(_){values=fallback(x,y);}
   const weights={farm:0,mountain:0,desert:0,forest:0,wetland:0,highlands:0,meadow:0,coast:0};let sum=0;
   if(Array.isArray(values))for(const entry of values){if(!Array.isArray(entry))continue;const id=entry[0],v=entry[1];if(Object.prototype.hasOwnProperty.call(weights,id)&&Number.isFinite(v)&&v>0){weights[id]+=v;sum+=v;}}
   if(sum<=0){weights.farm=1;sum=1;}
   let id='farm',best=-1;for(const key of IDS){weights[key]/=sum;if(weights[key]>best){best=weights[key];id=key;}}
   return Object.freeze({id,dominant:id,weights:Object.freeze(weights)});
  }
  function gridProfile(x,y){
   const key=x+','+y;let result=profiles.get(key);if(result)return result;
   result=profileAt(x*GRID,y*GRID);
   if(profiles.size>=LIMIT)profiles.delete(profiles.keys().next().value);
   profiles.set(key,result);return result;
  }
  function noise(x,y,scale,salt){
   const gx=Math.floor(x/scale),gy=Math.floor(y/scale),fx=smooth(x/scale-gx),fy=smooth(y/scale-gy);
   const a=(hash(gx,gy,salt)&65535)/65535,b=(hash(gx+1,gy,salt)&65535)/65535;
   const c=(hash(gx,gy+1,salt)&65535)/65535,d=(hash(gx+1,gy+1,salt)&65535)/65535;
   return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;
  }
  const materialKeys=Object.freeze({grass:'ground',sand:'sand',snow:'snow',ice:'ice',water:'water',oasis:'water',rock:'stone',snowrock:'stone',cracked:'soil',path:'soil',field:'soil'});
  function colorAt(kind,cold,wx,wy,baseColor){
   if(!materialKeys[kind]||!Number.isFinite(wx)||!Number.isFinite(wy))return baseColor||'#6d8155';
   activeReader();wx=Math.floor(wx/4)*4;wy=Math.floor(wy/4)*4;
   const gx=Math.floor(wx/GRID),gy=Math.floor(wy/GRID),fx=wx/GRID-gx,fy=wy/GRID-gy;
   const a=gridProfile(gx,gy).weights,b=gridProfile(gx+1,gy).weights,c=gridProfile(gx,gy+1).weights,d=gridProfile(gx+1,gy+1).weights;
   const key=kind==='grass'&&cold?'frost':materialKeys[kind];let r=0,g=0,bl=0;
   for(const id of IDS){const w=(a[id]*(1-fx)+b[id]*fx)*(1-fy)+(c[id]*(1-fx)+d[id]*fx)*fy,clr=channels[id][key];r+=clr[0]*w;g+=clr[1]*w;bl+=clr[2]*w;}
   const variance=(noise(wx,wy,159,71)*.68+noise(wx,wy,43,93)*.32-.5)*(kind==='water'||kind==='oasis'?12:kind==='grass'?19:17);
   const oasis=kind==='oasis'?9:0;
   r=Math.round(Math.max(0,Math.min(255,r+variance-oasis*.45)));g=Math.round(Math.max(0,Math.min(255,g+variance+oasis)));bl=Math.round(Math.max(0,Math.min(255,bl+variance+oasis*.4)));
   return hex((r<<16)|(g<<8)|bl);
  }
  function blended(profile,key){let r=0,g=0,b=0;for(const id of IDS){const c=channels[id][key],w=profile.weights[id];r+=c[0]*w;g+=c[1]*w;b+=c[2]*w;}return hex((Math.round(r)<<16)|(Math.round(g)<<8)|Math.round(b));}
  function paletteAt(wx,wy,cold){
   const profile=profileAt(wx,wy);
   return Object.freeze({ground:blended(profile,cold?'frost':'ground'),shade:blended(profile,'shade'),light:blended(profile,'light'),soil:blended(profile,'soil'),stone:blended(profile,'stone'),water:blended(profile,'water'),waterLight:blended(profile,'waterLight'),waterShade:blended(profile,'waterShade'),accent:blended(profile,'accent'),profile});
  }
  const R=(g,c,x,y,w=1,h=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);};
  function drawGroundDetails(g,px,py,tx,ty,t,cold){
   if(API.rawScene&&API.rawScene!=='main')return;
   const grass=t===T.GRASS||t===T.GRASS2||t===T.FLOWER,sand=t===T.SAND||t===T.DUNE||t===T.CRACKED;
   const snow=t===T.SNOW,rock=t===T.STONE||t===T.SNOWROCK;
   if(!grass&&!sand&&!snow&&!rock&&t!==T.ICE)return;
   const wx=tx*S,wy=ty*S,h=hash(tx,ty,613),detail=hash(tx,ty,619),x=px+3+h%9,y=py+4+((h>>>8)%8);
   const profile=profileAt(wx+S/2,wy+S/2),id=profile.id,weight=profile.weights[id];
   // Lesões visuais nas transições seriam uma nova borda. Os pequenos
   // elementos surgem por cobertura determinística da região predominante.
   if((detail&255)/255>weight)return;
   if(grass){
    if(id==='forest'&&h%5<2){
     const dark=cold?'#8ba89c':'#3b5d47',leaf=cold?'#afc1a5':'#798263';
     R(g,dark,x,y,2);R(g,dark,x-1,y+1,4);R(g,dark,x,y+2,3);
     R(g,leaf,x+2,y-1,2);R(g,leaf,x+3,y,2);if(h&1)R(g,'#8e8665',x-1,y+3,2);
    }else if(id==='wetland'&&h%7<2){
     const mud=cold?'#99ad93':'#626b50';R(g,mud,x-1,y,3);R(g,mud,x-2,y+1,5);R(g,mud,x,y+2,3);
     R(g,cold?'#bdc6a6':'#a5a072',x+2,y-1,2);R(g,cold?'#aaba97':'#838a5b',x+3,y-2);
    }else if(id==='highlands'&&h%7===0){
     R(g,cold?'#9bb1a9':'#6c827d',x,y,4);R(g,cold?'#b4c5b9':'#a9b496',x-1,y-1,4);R(g,'#c3c6a2',x,y-2,2);R(g,'#8e9d83',x+3,y+1,2);
    }else if(id==='coast'&&h%11===0){
     R(g,cold?'#becdbb':'#bdc19a',x,y,3);R(g,cold?'#97b19f':'#7f937b',x+1,y+1,3);R(g,'#d8d6b0',x+2,y-1);
    }else if(id==='farm'&&h%13===0){
     R(g,cold?'#91ac93':'#5d764c',x,y,2);R(g,cold?'#b9c9ab':'#95a16b',x-1,y-1);R(g,cold?'#b9c9ab':'#95a16b',x+2,y-1);R(g,cold?'#a4bca0':'#778b59',x+1,y+1);
    }
    if(id==='meadow'){
     // Cintilações de palha seguem longas curvas no mundo. Não há um
     // carimbo quadrado nem uma linha reiniciada a cada tile.
     for(let band=Math.floor(wy/73)-1;band<=Math.floor((wy+S)/73)+1;band++)for(let i=0;i<S;i++){
      const xx=wx+i,yy=Math.round(band*73+Math.sin(xx/91+band*.7)*9+Math.sin(xx/43)*2)-wy;
      if(yy>=2&&yy<S-2&&(hash(Math.floor(xx/17),band,31)%5!==0)){
       R(g,cold?'#b4c29f':'#8b905a',px+i,py+yy);if((xx+band)%5<2)R(g,cold?'#d0d5b0':'#bcb77e',px+i,py+yy-1);
      }
     }
     if(h%47===0){R(g,'#8d9361',x+1,y+1);R(g,detail&1?'#cbb5a3':'#d3bf8f',x,y,3);R(g,'#e1d6ad',x+1,y-1);}
    }
   }else if(snow&&h%13===0){
    const shade=id==='highlands'?'#afc5ca':'#adc8d2';
    R(g,shade,x-2,y+1,5);R(g,shade,x+1,y+2,4);R(g,'#e1ecdf',x-3,y,4);R(g,'#d7e7df',x+1,y+1,3);
   }else if(rock&&h%7===0){
    const lichen=id==='highlands'||id==='mountain';
    R(g,lichen?'#afb795':'#9fa884',x-1,y,3);R(g,lichen?'#c5c7a5':'#b7b28d',x,y-1,3);R(g,lichen?'#81958b':'#7a8b79',x+2,y+1,2);
   }else if(sand&&id==='coast'&&h%19===0){
    // Conchas gastas e pequenas marcas de areia, sem novos coletáveis.
    R(g,'#a79e81',x,y+1,3);R(g,'#eee0bc',x-1,y,4);R(g,'#e2d3ae',x,y-1,2);R(g,'#c6b48f',x+1,y);
   }else if(sand&&h%23===0){
    const desert=id==='desert';R(g,desert?'#b38a5b':'#b7a882',x-1,y+1,4);R(g,desert?'#e5bf82':'#e4d5ad',x,y,3);R(g,desert?'#cca16c':'#d0bf99',x+2,y-1);
   }else if(t===T.ICE&&h%37===0){
    R(g,'#c2deda',x-2,y,3);R(g,'#b3d3d5',x+1,y+1,2);R(g,'#80b1bb',x+2,y+2,2);
   }
  }
  function mapColor(tile,cold,tx,ty,baseColor){
   const kind=tile===T.GRASS||tile===T.GRASS2||tile===T.FLOWER?'grass':tile===T.SNOW?'snow':tile===T.SAND||tile===T.DUNE?'sand':tile===T.ICE?'ice':tile===T.WATER||tile===T.RIVER?'water':tile===T.OASIS?'oasis':tile===T.STONE?'rock':tile===T.SNOWROCK?'snowrock':tile===T.CRACKED?'cracked':'';
   return kind?colorAt(kind,cold,tx*S+S/2,ty*S+S/2,baseColor):baseColor;
  }
  window.FarmBiomeArt=Object.freeze({version:1,profileAt,paletteAt,colorAt,drawGroundDetails,mapColor,palettes:palette,
   info(){activeReader();return{profileEntries:profiles.size,maxProfiles:LIMIT,grid:GRID,biomes:IDS.length,animated:false};}
  });
 });
})();
