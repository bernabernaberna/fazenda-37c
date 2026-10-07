/* Direção de arte original: campo de sálvia, madeira/cerâmica e luz âmbar.
   Sprites e pequenos tiles são feitos uma vez em canvases locais; o mapa
   continua usando seu cache existente. Nenhuma imagem, fonte ou biblioteca
   externa. O módulo registra somente desenho: não muda mapa, colisão,
   interação, portas, recursos, cultivo ou propriedades dos objetos. */
(function(){
  (window.__farmBiomes=window.__farmBiomes||[]).push(function(API){
    const T=API.T, TS=API.TS;
    const P=Object.freeze({
      ink:'#183b36',teal:'#28554a',leafDark:'#3c6250',leaf:'#66805a',
      sage:'#839967',leafLight:'#a8b97a',cream:'#eee2b8',amber:'#e3b86b',
      woodDark:'#57453c',wood:'#886548',woodLight:'#b99161',clay:'#ad6650',
      clayDark:'#79473e',clayLight:'#d39368',soil:'#695140',soilLight:'#9b7955',
      path:'#b79d70',pathLight:'#d0b98c',stone:'#74817a',stoneDark:'#4f625d',
      snow:'#d2e3de',snowLight:'#f0f3df',snowShade:'#a0bebc',ice:'#86bdb9',
      water:'#367b78',waterLight:'#69aaa0',waterDeep:'#285c60',
      sand:'#cfb37c',sandLight:'#e3cc97',sandShade:'#b18b60',berry:'#b66467'
    });
    const tiles=new Map(),sprites=new Map();
    let cachePixels=0,drawn=0,culled=0;
    const atmosphere={count:0,cellStride:1,wind:0,reducedMotion:false,anchors:[]};
    const rect=(g,c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
    function hash(x,y,s=0){
      let h=Math.imul((x|0)^0x45d9f3b,0x45d9f3b)^Math.imul((y|0)+s*101,0x27d4eb2d);
      h^=h>>>16;return h>>>0;
    }
    function cached(store,key,w,h,paint){
      let c=store.get(key);if(c) return c;
      c=document.createElement('canvas');c.width=w;c.height=h;
      const g=c.getContext('2d');g.imageSmoothingEnabled=false;paint(g);
      store.set(key,c);cachePixels+=w*h;return c;
    }
    function offscreen(ctx,x,y,w,h){
      // Inclui dimensões reais do sprite e sua sombra; não depende do player
      // (a abertura usa uma câmera independente). Funciona também com SSAA.
      if(!ctx.canvas||typeof ctx.getTransform!=='function') return false;
      const m=ctx.getTransform();if(m.b||m.c||m.a<=0||m.d<=0) return false;
      const left=-m.e/m.a,top=-m.f/m.d;
      const reject=x+w<left||y+h<top||x>left+ctx.canvas.width/m.a||y>top+ctx.canvas.height/m.d;
      if(reject) culled++;return reject;
    }
    function blit(ctx,key,x,y,w,h,paint){
      if(offscreen(ctx,x,y,w,h)) return;
      ctx.drawImage(cached(sprites,key,w,h,paint),Math.round(x),Math.round(y));drawn++;
    }
    function winter(){return !!API.isFrio();}
    function night(){return typeof windowsLit==='function'&&windowsLit();}
    function still(){return typeof motionOk==='function'&&!motionOk();}

    /* ---------- Materiais do terreno: 16px, sem ruído por frame ---------- */
    // Materiais naturais usam manchas maiores que um tile. O recorte em16px
    // é só transporte para o cache do mundo, sem padrões reiniciados na borda.
    const PATCH=128;
    function naturalKind(t){
      if(t===T.GRASS||t===T.GRASS2||t===T.FLOWER)return 'grass';
      if(t===T.SAND||t===T.DUNE)return 'sand';
      if(t===T.SNOW)return 'snow';if(t===T.ICE)return 'ice';
      if(t===T.WATER||t===T.RIVER)return 'water';if(t===T.OASIS)return 'oasis';
      if(t===T.STONE)return 'rock';if(t===T.SNOWROCK)return 'snowrock';
      if(t===T.CRACKED)return 'cracked';return '';
    }
    function noise(x,y,size,salt){
      const ix=Math.floor(x/size),iy=Math.floor(y/size),fx=x/size-ix,fy=y/size-iy;
      const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),n=(a,b)=>(hash(a,b,salt)%65536)/65535;
      return (n(ix,iy)*(1-sx)+n(ix+1,iy)*sx)*(1-sy)+(n(ix,iy+1)*(1-sx)+n(ix+1,iy+1)*sx)*sy;
    }
    function pixelLine(g,c,x0,y0,x1,y1,width=1){
      const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1);
      for(let i=0;i<=n;i++)rect(g,c,Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),width,width);
    }
    function pixelPoly(g,c,points){
      const lo=Math.max(0,Math.floor(Math.min(...points.map(p=>p[1])))),hi=Math.min(PATCH,Math.ceil(Math.max(...points.map(p=>p[1]))));
      for(let y=lo;y<hi;y++){const crossings=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))crossings.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}crossings.sort((a,b)=>a-b);for(let i=0;i+1<crossings.length;i+=2)rect(g,c,Math.round(crossings[i]),y,Math.round(crossings[i+1])-Math.round(crossings[i]),1);}
    }
    const naturalPalettes={
        grass:['#647c58','#667e59','#68815b','#6b835d','#6d855f','#708861'],
        frostGrass:['#9eb5aa','#a2b9ad','#a6bdaf','#aac1b3','#aec5b8','#b2c9bc'],
        snow:['#c0d4d0','#c5d8d3','#c9dcd6','#cedfd8','#d2e2da','#d6e5dc'],
        sand:['#c5a870','#c9ac74','#ccb078','#cfb47b','#d3b77e','#d6bc82'],
        ice:['#76a9a7','#7cafa9','#82b5ae','#88bab3','#8ebeb7','#94c4bb'],
        water:['#2d696b','#306f70','#327575','#357a78','#387e7b','#3c837f'],
        oasis:['#337c75','#37817a','#3b877e','#3f8b82','#438f84','#479389'],
        rock:['#657770','#6a7d75','#708179','#76887e','#7c8c82','#819187'],
        snowrock:['#647872','#6b8079','#71867e','#788d84','#7e9389','#84998e'],
        cracked:['#b59669','#b99b6e','#bd9f72','#c1a477','#c5a87a','#c9ad7f']
      };
    function materialColor(kind,cold,x,y){
      const pal=naturalPalettes[kind==='grass'&&cold?'frostGrass':kind];
      // A mesma amostra do patch4px: a margem não cria uma segunda grade.
      x=Math.floor(x/4)*4;y=Math.floor(y/4)*4;
      const value=noise(x,y,170,71)*.72+noise(x,y,54,93)*.28;
      return pal[Math.min(5,Math.floor(value*6))];
    }
    function paintNaturalPatch(g,kind,cold,wx,wy){
      const pal=naturalPalettes[kind==='grass'&&cold?'frostGrass':kind];
      // Variação ampla e de baixo contraste; a grade4px não coincide com
      // mudanças fortes e atravessa todos os recortes do cache.
      for(let y=0;y<PATCH;y+=4)for(let x=0;x<PATCH;x+=4){
        rect(g,materialColor(kind,cold,wx+x,wy+y),x,y,4,4);
      }
      if(kind==='sand'||kind==='snow'||kind==='ice'||kind==='water'||kind==='oasis'){
        const snow=kind==='snow',ice=kind==='ice',water=kind==='water'||kind==='oasis',period=snow?104:ice?116:water?27:88;
        for(let band=Math.floor(wy/period)-1;band<=Math.floor((wy+PATCH)/period)+1;band++){
          for(let x=0;x<PATCH;x++){
            const gx=wx+x,y=Math.round(band*period+Math.sin(gx/89+band*.67)*(snow?12:18)+Math.sin(gx/173-band*.8)*9)-wy;
            // Contornos largos, com uma vertente sombreada e crista estreita.
            if(y<-14||y>PATCH+4)continue;
            if(water){
              const part=hash(Math.floor((gx+band*13)/34),band,44);if(part%4===0)rect(g,'#69a79c',x,y,1,1);else if(part%7===0)rect(g,'#2d686a',x,y,1,1);
            }else{
              rect(g,snow?'#bed3ce':ice?'#75aaa8':'#bea16e',x,y+2,1,snow?4:ice?3:7);
              rect(g,snow?'#d8e7dd':ice?'#afd4c6':'#dec58d',x,y,1,2);
              if(!ice&&hash(Math.floor(gx/43),band,12)%5!==0)rect(g,snow?'#dfe9df':'#e5cd95',x,y,1,1);
            }
          }
        }
      }
      if(kind==='rock'||kind==='snowrock'){
        // Faces assimétricas substituem a argamassa repetida. As fraturas
        // são traçadas no mundo, incluindo as células vizinhas ao recorte.
        for(let gy=Math.floor(wy/34)-1;gy<=Math.floor((wy+PATCH)/34)+1;gy++)for(let gx=Math.floor(wx/42)-1;gx<=Math.floor((wx+PATCH)/42)+1;gx++){
          const h=hash(gx,gy,104),cx=gx*42+(gy%2)*19+(h%27)-12-wx,cy=gy*34+((h>>>8)%21)-10-wy;
          const a=[cx-18-h%9,cy-8+(h>>>4)%11],b=[cx-8+(h>>>8)%11,cy-17-(h>>>7)%7],c=[cx+13+(h>>>12)%9,cy-9+(h>>>15)%8],d=[cx+16+(h>>>3)%10,cy+5+(h>>>19)%11],e=[cx-2+(h>>>6)%17,cy+13+(h>>>10)%7],f=[cx-20+(h>>>14)%8,cy+6+(h>>>17)%7];
          pixelPoly(g,pal[2+h%4],[a,b,c,d,e,f]);if(h%3!==0)pixelPoly(g,pal[1+h%3],[d,e,f,[cx-3,cy+1]]);
          if(h%2){pixelLine(g,'#5c726b',b[0]+2,b[1]+5,cx+1,cy-2);pixelLine(g,'#5c726b',cx+1,cy-2,d[0]-5,d[1]-2);}
          if((cold||kind==='snowrock')&&h%3!==0){
            // Neve presa em fendas e placas baixas, sem repetir picos de telhado.
            const sx=cx-10+(h>>>20)%9,sy=cy-8+(h>>>23)%7;
            pixelPoly(g,'#bdcfc5',[[sx-7,sy],[sx+2,sy-4],[sx+13,sy-3],[sx+18,sy+2],[sx+8,sy+5],[sx-4,sy+4]]);
            pixelLine(g,'#d6e2d5',sx-4,sy,sx+2,sy-3);pixelLine(g,'#d6e2d5',sx+2,sy-3,sx+11,sy-2);
          }
        }
      }else if(kind==='cracked'){
        const vertex=(gx,gy)=>{const h=hash(gx,gy,82);return[gx*37+(gy%2)*13+h%15-wx,gy*33+(h>>>8)%13-wy];};
        for(let gy=Math.floor(wy/33)-1;gy<=Math.floor((wy+PATCH)/33)+1;gy++)for(let gx=Math.floor(wx/37)-1;gx<=Math.floor((wx+PATCH)/37)+1;gx++){
          const a=vertex(gx,gy),b=vertex(gx+1,gy),c=vertex(gx,gy+1),h=hash(gx,gy,81);
          for(const end of h%3?[b,c]:[c]){const mx=Math.round((a[0]+end[0])/2)+(h%7)-3,my=Math.round((a[1]+end[1])/2)+((h>>>6)%7)-3;
            pixelLine(g,'#aa895f',a[0],a[1],mx,my);pixelLine(g,'#aa895f',mx,my,end[0],end[1]);
            if(h%2)pixelLine(g,'#d0b281',a[0]+1,a[1]-1,mx+1,my-1);
          }
        }
      }
      // Detalhes pequenos ocupam uma minoria dos tiles, em posições únicas
      // calculadas no mundo. Mantém áreas de descanso entre vegetação/relevo.
      for(let ty=Math.floor(wy/TS);ty<Math.ceil((wy+PATCH)/TS);ty++)for(let tx=Math.floor(wx/TS);tx<Math.ceil((wx+PATCH)/TS);tx++){
        const h=hash(tx,ty,51),x=tx*TS+3+h%8-wx,y=ty*TS+3+(h>>>8)%8-wy;
        // Textura rente ao solo; os tufos altos pertencem a drawAtmosphere.
        if(kind==='grass'&&h%5===0){rect(g,cold?'#96afa0':'#5f7952',x,y,3,1);rect(g,cold?'#bbcebd':'#788e5f',x+1,y-1,2,1);}
        else if(kind==='grass'&&!cold&&h%37===0){rect(g,P.cream,x,y,3,1);rect(g,P.cream,x+1,y-1,1,3);rect(g,P.amber,x+1,y,1,1);}
        else if(kind==='snow'&&h%17===0){rect(g,'#a5c1bb',x,y,2,1);rect(g,'#dce7dc',x-1,y-1,3,1);}
        else if(kind==='sand'&&h%13===0){rect(g,'#b99b68',x,y,2,1);rect(g,'#e1c994',x,y-1,1,1);}
        else if(kind==='ice'&&h%19===0){pixelLine(g,'#609b9a',x-3,y-2,x,y+3);pixelLine(g,'#609b9a',x,y+3,x+5,y+5);}
      }
    }
    function paintTile(g,t,v,cold){
      const seed=hash(v,t,37),ox=seed%7,oy=(seed>>>4)%7;
      if(t===T.PATH){
        rect(g,cold?'#b8b4a0':P.path,0,0,TS,TS);
        rect(g,cold?'#cecbb5':P.pathLight,ox,oy+2,5,1);
        rect(g,cold?'#959d8e':P.soilLight,8+v%4,9,3,1);
        rect(g,P.pathLight,2,13-v%3,2,1);rect(g,P.soilLight,13,3+v%5,1,1);
      }else if(t===T.FIELD){
        rect(g,P.soil,0,0,TS,TS);
        for(let y=2;y<TS;y+=4){rect(g,P.woodDark,0,y,TS,1);rect(g,P.soilLight,0,y-1,TS,1);}
        rect(g,P.soilLight,ox+2,oy+2,2,1);rect(g,P.woodDark,12,12,2,1);
        if(cold){rect(g,P.snow,1,0,5,1);rect(g,P.snow,10,15,4,1);}
      }else if(t===T.COBBLE){
        rect(g,P.stoneDark,0,0,TS,TS);
        for(let row=0;row<3;row++)for(let col=0;col<3;col++){
          const x=col*6-(row%2)*3,y=row*6;
          rect(g,(row+col+v)%3?P.stone:'#89978a',x,y,5,5);
          rect(g,P.snowShade,x,y,4,1);rect(g,P.stoneDark,x+4,y+3,1,2);
        }
        if(cold){rect(g,P.snow,0,0,TS,2);rect(g,P.snowLight,2,1,9,1);}
      }else if(t===T.FENCE){
        rect(g,cold?P.snow:P.leaf,0,0,TS,TS);
        rect(g,P.woodDark,0,6,TS,2);rect(g,P.woodLight,0,5,TS,1);
        rect(g,P.wood,0,11,TS,2);rect(g,P.woodLight,0,10,TS,1);
        for(const x of [2,12]){rect(g,P.woodDark,x,3,3,12);rect(g,P.woodLight,x,3,1,11);rect(g,P.cream,x,3,3,1);}
      }
    }
    const green=t=>t===T.GRASS||t===T.GRASS2||t===T.FLOWER;
    const watery=t=>t===T.RIVER||t===T.WATER||t===T.OASIS||t===T.ICE;
    function edgeRect(g,c,px,py,side,start,length,depth,thick){
      g.fillStyle=c;
      if(side===0)g.fillRect(px+start,py+depth,length,thick);
      else if(side===1)g.fillRect(px+TS-depth-thick,py+start,thick,length);
      else if(side===2)g.fillRect(px+start,py+TS-depth-thick,length,thick);
      else g.fillRect(px+depth,py+start,thick,length);
    }
    const corners=[[0,3,-1,-1,false,false],[0,1,1,-1,true,false],[2,1,1,1,true,true],[2,3,-1,1,false,true]];
    function shorePalette(n,t,cold){
      if(n===T.SNOW||n===T.SNOWROCK||t===T.ICE)return {kind:'snow',wet:'#a1c0b9',line:'#c6ded0'};
      if(n===T.SAND||n===T.DUNE||n===T.CRACKED)return {kind:'sand',wet:'#a88e67',line:'#619b8d'};
      if(n===T.PATH)return {body:cold?'#b8b4a0':P.path,wet:'#82745a',line:'#5b9386'};
      if(n===T.STONE||n===T.COBBLE)return {kind:'rock',wet:'#67796c',line:'#669a8e'};
      return {kind:'grass',wet:cold?'#839f91':'#7c7558',line:cold?'#a2c5b5':'#5a9488'};
    }
    function shoreBody(p,cold,x,y){return p.body||materialColor(p.kind,cold,x,y);}
    function shoreEdge(g,px,py,x,y,side,p,cold){
      const wx=x*TS,wy=y*TS;
      const boundary=side%2?wx+(side===1?TS:0):wy+(side===2?TS:0);
      for(let start=0;start<TS;start+=2){
        const along=(side%2?wy:wx)+start;
        // O ruído acompanha a margem inteira, inclusive ao atravessar tiles.
        const d=2+Math.floor(noise(along,boundary,25,137+side%2)*4);
        const sx=side%2?boundary:along,sy=side%2?along:boundary;
        edgeRect(g,shoreBody(p,cold,sx,sy),px,py,side,start,2,0,d-1);
        edgeRect(g,p.wet,px,py,side,start,2,d-1,1);
        if(hash(Math.floor(along/8),boundary,133)%3===0)edgeRect(g,p.line,px,py,side,start,2,d,1);
      }
    }
    function shoreCorner(g,px,py,x,y,right,bottom,p,cold,outer=false){
      // Fecha ilhas diagonais e arredonda a quina onde duas margens se unem.
      const radius=outer?5:4+hash(x+(right?1:0),y+(bottom?1:0),149)%2;
      for(let row=0;row<radius;row++){
        const width=Math.ceil(Math.sqrt(radius*radius-row*row));
        const yy=bottom?TS-1-row:row,xx=right?TS-width:0;
        rect(g,p.wet,px+xx,py+yy,width,1);
        if(width>1){
          const bx=right?xx+1:xx;
          rect(g,shoreBody(p,cold,x*TS+bx,y*TS+yy),px+bx,py+yy,width-1,1);
        }
      }
    }
    function snowGrassEdge(g,px,py,x,y,t,neighbors,cold){
      if(t!==T.SNOW&&!green(t))return;
      const snow=t===T.SNOW,opposite=n=>snow?green(n):n===T.SNOW;
      const diagonal=corners.map(([, ,dx,dy])=>API.tileAt(x+dx,y+dy));
      if(!neighbors.some(opposite)&&!diagonal.some(opposite))return;
      const kind=snow?'grass':'snow',wx=x*TS,wy=y*TS;
      const value=(tx,ty)=>{const n=API.tileAt(tx,ty);return n===T.SNOW?1:green(n)?0:snow?1:0;};
      // Um único campo contínuo dos centros vizinhos substitui faixas que
      // colidiam nas quinas. O mesmo pixel de mundo decide a mesma borda,
      // venha ele do cache da neve ou do gramado; caminhos ficam intactos.
      for(let oy=0;oy<TS;oy++)for(let ox=0;ox<TS;ox++){
        const gx=x+(ox+.5)/TS-.5,gy=y+(oy+.5)/TS-.5;
        const ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy;
        const coverage=(value(ix,iy)*(1-fx)+value(ix+1,iy)*fx)*(1-fy)
          +(value(ix,iy+1)*(1-fx)+value(ix+1,iy+1)*fx)*fy;
        const threshold=.5+(noise(wx+ox,wy+oy,27,151)-.5)*.24;
        if((coverage>=threshold)===snow)continue;
        rect(g,materialColor(kind,cold,wx+ox,wy+oy),px+ox,py+oy,1,1);
      }
    }
    function terrainEdge(g,px,py,x,y,t,cold){
      const neighbors=[API.tileAt(x,y-1),API.tileAt(x+1,y),API.tileAt(x,y+1),API.tileAt(x-1,y)];
      snowGrassEdge(g,px,py,x,y,t,neighbors,cold);
      for(let side=0;side<4;side++){
        const n=neighbors[side];
        if((t===T.PATH||t===T.FIELD)&&green(n)){
          for(let start=0;start<TS;start+=4){
            const d=1+hash(x,y,side+start)%2;
            edgeRect(g,cold?P.snowShade:P.leafDark,px,py,side,start,4,d,1);
            edgeRect(g,cold?P.snow:P.leaf,px,py,side,start,4,0,d);
            edgeRect(g,cold?P.snowLight:P.sage,px,py,side,start+1,2,0,1);
          }
        }else if(watery(t)&&n!==undefined&&!watery(n)){
          // Cor da margem pertence ao terreno vizinho; a faixa fica DENTRO
          // do tile de água. Nunca encobre uma célula caminhável ou lavoura.
          shoreEdge(g,px,py,x,y,side,shorePalette(n,t,cold),cold);
        }else if(n!==undefined&&((t===T.SNOWROCK&&n===T.SNOW)||(t===T.STONE&&(green(n)||n===T.SNOW))||(t===T.CRACKED&&(n===T.SAND||n===T.DUNE)))){
          // A mancha de rocha/solo seco entra no chão em contorno irregular,
          // em vez de revelar o retângulo de tiles pintado no mapa físico.
          const rim=n===T.SNOW?'#cedfd8':green(n)?(cold?'#a6bdaf':'#68815b'):'#cfb47b';
          for(let start=0;start<TS;start+=2){
            const along=(side%2?y:x)*TS+start,d=2+Math.floor(noise(along,(side%2?x:y)*TS,19,114)*5);
            edgeRect(g,rim,px,py,side,start,2,0,d);
          }
        }
      }
      if(watery(t))for(const [a,b,dx,dy,right,bottom]of corners){
        const diagonal=API.tileAt(x+dx,y+dy);
        if(watery(neighbors[a])&&watery(neighbors[b])&&diagonal!==undefined&&!watery(diagonal))
          shoreCorner(g,px,py,x,y,right,bottom,shorePalette(diagonal,t,cold),cold);
        else if(neighbors[a]!==undefined&&neighbors[b]!==undefined&&!watery(neighbors[a])&&!watery(neighbors[b]))
          shoreCorner(g,px,py,x,y,right,bottom,shorePalette(neighbors[a],t,cold),cold,true);
      }
    }
    const tileTypes=[T.GRASS,T.GRASS2,T.FLOWER,T.PATH,T.FIELD,T.WATER,T.RIVER,T.OASIS,
      T.SNOW,T.ICE,T.SAND,T.DUNE,T.CRACKED,T.STONE,T.SNOWROCK,T.COBBLE,T.FENCE];
    for(const t of tileTypes) API.registerTileDrawer(t,(g,px,py,x,y,cold)=>{
      if(API.rawScene&&API.rawScene!=='main'){
        // As salas continuam usando o piso próprio e as dimensões originais.
        API.drawBaseTile(g,px,py,x,y,t,cold);return;
      }
      const kind=naturalKind(t);
      if(kind){
        const wx=x*TS,wy=y*TS,qx=Math.floor(wx/PATCH),qy=Math.floor(wy/PATCH);
        const mat=cached(tiles,'patch:'+kind+':'+!!cold+':'+qx+':'+qy,PATCH,PATCH,c=>paintNaturalPatch(c,kind,cold,qx*PATCH,qy*PATCH));
        g.drawImage(mat,wx-qx*PATCH,wy-qy*PATCH,TS,TS,px,py,TS,TS);
      }else{
        const v=(hash(x,y,t)%4+hash(x>>2,y>>2,t)%3*4)%12;
        g.drawImage(cached(tiles,t+':'+!!cold+':'+v,TS,TS,c=>paintTile(c,t,v,cold)),px,py);
      }
      terrainEdge(g,px,py,x,y,t,cold);
    });

    /* ---------- Vegetação: massas recortadas, folhas em agrupamentos ---------- */
    function leaves(g,x,y,r,seed,cold,lit){
      const dark=cold?'#577c74':P.teal,mid=cold?'#84a297':P.leaf;
      const light=cold?P.snow:P.sage,high=cold?P.snowLight:P.leafLight;
      const shape=[[-r+3,-r,r*2-6,2],[-r+1,-r+2,r*2-2,3],[-r,-r+5,r*2,5],[-r+1,-r+10,r*2-2,4],[-r+4,-r+14,r*2-8,2]];
      for(const [dx,dy,w,h] of shape)if(w>0)rect(g,dark,x+dx,y+dy,w,h);
      rect(g,mid,x-r+2,y-r+2,r*2-6,8);rect(g,mid,x-r+4,y-r+10,r*2-9,3);
      const bias=lit?4:-3;
      rect(g,light,x-r+4+bias,y-r+3,r-2,3);rect(g,light,x-r+6+bias,y-r+6,r-3,2);
      for(let i=0;i<7;i++){
        const h=hash(seed,i,71),dx=(h%(r*2-6))-r+3,dy=((h>>>5)%10)-r+3;
        rect(g,i%3?mid:high,x+dx,y+dy,2+(h&1),1);
      }
      if(cold){rect(g,high,x-r+4,y-r,r*2-9,2);rect(g,light,x-r+1,y-r+2,r*2-3,2);}
    }
    function trunk(g){
      rect(g,P.woodDark,7,0,6,20);rect(g,P.wood,7,1,4,18);
      rect(g,P.woodLight,7,2,1,12);rect(g,P.woodDark,9,4,1,5);
      rect(g,P.woodDark,6,18,9,3);rect(g,P.wood,3,20,15,2);
      rect(g,P.woodDark,2,21,4,2);rect(g,P.woodDark,14,21,5,2);
      rect(g,P.wood,4,6,5,3);rect(g,P.wood,12,3,5,3);
    }
    function treeCanopy(g,v,cold,lit,fruit){
      const clusters=[[27,34,12],[13,29,11],[41,29,11],[20,20,11],[34,17,12],[27,10,10],[12,20,8],[44,20,8]];
      for(let i=0;i<clusters.length;i++){
        const [x,y,r]=clusters[i];leaves(g,x+(v===1&&i%2?1:0),y,r,hash(v,i),cold,lit);
      }
      if(!cold&&fruit!==3){
        const color=fruit===0?P.berry:fruit===1?P.clay:P.amber;
        for(const [x,y] of [[13,24],[34,13],[40,29],[25,34],[20,21]]){
          rect(g,P.woodDark,x,y-1,1,2);rect(g,color,x-1,y,3,3);rect(g,P.cream,x-1,y,1,1);
        }
      }
    }
    function drawTreeArt(o,g,fruitOverride){
      if(offscreen(g,o.x-70,o.y-55,140,95))return;
      const cold=winter(),v=hash(o.x,o.y)%3;
      // Só contato das raízes. A projeção da copa, inclusive a elipse
      // térmica exata, é desenhada por FarmWorldDepth antes dos objetos.
      rect(g,'rgba(24,59,54,.2)',o.x-8,o.y+10,17,3);
      blit(g,'trunk',o.x-10,o.y-10,20,24,trunk);
      const lit=typeof sunLitDir==='function'&&sunLitDir()>0.05;
      const fruit=fruitOverride===undefined?((o.x>>4)+(o.y>>4)*3)&3:fruitOverride;
      const sway=still()?0:Math.round(Math.sin(performance.now()/800+v+o.x*.013));
      const large=o.shadeR>26?1:0;
      const img=cached(sprites,'canopy:'+v+':'+cold+':'+lit+':'+fruit,56,50,c=>treeCanopy(c,v,cold,lit,fruit));
      g.drawImage(img,Math.round(o.x-28+sway-large),Math.round(o.y-46-large),56+large*2,50+large*2);drawn++;
    }
    API.registerObjectDrawer('tree',(o,g)=>drawTreeArt(o,g));
    API.registerObjectDrawer('fx_fruittree',(o,g)=>drawTreeArt(o,g,o.kind?2:1));
    function bushPaint(g,cold,ripe){
      rect(g,'rgba(24,59,54,.2)',3,19,22,3);
      leaves(g,10,14,8,61,cold,false);leaves(g,20,13,8,71,cold,false);leaves(g,15,9,7,83,cold,false);
      if(ripe&&!cold)for(const [x,y]of [[6,13],[13,9],[19,14],[11,17],[22,10]]){
        rect(g,P.berry,x,y,2,2);rect(g,P.clayLight,x,y,1,1);
      }
    }
    for(const type of ['bush','fx_berry']) API.registerObjectDrawer(type,(o,g)=>{
      const cold=winter(),ripe=type==='fx_berry'?!(o._pickT&&performance.now()-o._pickT<25000):hash(o.x,o.y)%2===0;
      blit(g,'bush:'+cold+':'+ripe,o.x-15,o.y-17,30,24,c=>bushPaint(c,cold,ripe));
    });
    API.registerObjectDrawer('flower',(o,g)=>{
      const cold=winter(),v=(o.seed||0)%3;
      blit(g,'flower:'+cold+':'+v,o.x-7,o.y-11,15,17,c=>{
        for(const [x,y]of [[3,9],[10,6],[7,12]]){
          rect(c,cold?P.woodLight:P.leafDark,x,y,1,5);rect(c,P.sage,x-1,y+3,3,1);
          if(cold){rect(c,P.snowLight,x-1,y,3,1);continue;}
          const pal=[P.berry,P.amber,P.cream];rect(c,pal[v],x-2,y-2,5,1);
          rect(c,pal[v],x-1,y-3,3,3);rect(c,P.cream,x,y-2,1,1);
        }
      });
    });

    /* ---------- Arquitetura: volume, cerâmica, pedra e madeira ---------- */
    function windowPane(g,x,y,w,h,on){
      rect(g,P.woodDark,x-2,y-2,w+4,h+4);rect(g,P.woodLight,x-1,y-1,w+2,h+2);
      rect(g,on?P.amber:P.teal,x,y,w,h);rect(g,on?P.cream:P.waterLight,x+1,y+1,w-3,2);
      rect(g,P.woodDark,x+Math.floor(w/2),y,1,h);rect(g,P.woodDark,x,y+Math.floor(h/2),w,1);
      rect(g,P.cream,x-2,y+h+2,w+4,2);
    }
    function roof(g,x,y,w,h,cold,wooden){
      for(let row=0;row<h;row+=2){
        const inset=Math.max(0,Math.floor((h-row)*.42));
        rect(g,wooden?P.woodDark:P.clayDark,x+inset,y+row,w-inset*2,2);
        for(let col=inset+1;col<w-inset-2;col+=6){
          const shift=(Math.floor(row/4)%2)*2;
          const cw=Math.min(5,w-inset-col-shift);
          if(cw>0)rect(g,wooden?P.wood:P.clay,x+col+shift,y+row,cw,1);
          if(row%4===0&&cw>1)rect(g,wooden?P.woodLight:P.clayLight,x+col+shift,y+row,1,1);
        }
      }
      rect(g,P.woodDark,x,y+h,w,3);rect(g,wooden?P.woodLight:P.clayLight,x,y+h,w,1);
      rect(g,wooden?P.woodLight:P.clayLight,x+Math.floor(h*.42),y,w-Math.floor(h*.84),2);
      if(cold){
        rect(g,P.snow,x+Math.floor(h*.42),y-1,w-Math.floor(h*.84),3);
        rect(g,P.snowLight,x+Math.floor(h*.42)+2,y-1,w-Math.floor(h*.84)-4,1);
        for(let col=2;col<w-6;col+=13)rect(g,P.snow,x+col,y+h-1,9,2);
      }
    }
    function building(g,w,h,barn,cold,on){
      const x=10,y=14,bottom=y+h-6,wall=y+43;
      rect(g,'rgba(24,59,54,.22)',x-5,bottom+9,w+10,5);
      rect(g,P.stoneDark,x-3,bottom-3,w+6,10);
      for(let r=0;r<2;r++)for(let col=0;col<w;col+=10){
        rect(g,P.stone,x-2+col+(r%2)*3,bottom+r*3,8,2);
      }
      rect(g,barn?P.clayDark:P.pathLight,x,wall,w,bottom-wall);
      if(barn){
        for(let col=0;col<w;col+=7){rect(g,P.clay,x+col,wall,5,bottom-wall);rect(g,P.clayLight,x+col,wall,1,bottom-wall);}
      }else{
        for(let row=wall+5;row<bottom;row+=6){rect(g,P.path,x,row,w,1);rect(g,P.cream,x,row-1,w,1);}
      }
      rect(g,P.woodDark,x,wall,w,6);rect(g,P.woodDark,x+w-5,wall,5,bottom-wall);
      rect(g,P.woodLight,x,wall,4,bottom-wall);rect(g,P.cream,x+1,wall,1,bottom-wall);
      // O vão continua no centro da fachada, diante do mesmo objeto porta.
      const dw=barn?36:22,dh=barn?bottom-wall-9:31,dx=x+Math.floor((w-dw)/2),dy=bottom-dh;
      rect(g,P.woodDark,dx-3,dy-3,dw+6,dh+3);rect(g,barn?P.wood:P.teal,dx,dy,dw,dh);
      for(let col=2;col<dw;col+=5)rect(g,barn?P.woodDark:P.leafDark,dx+col,dy+1,1,dh-2);
      rect(g,P.woodLight,dx,dy,dw,2);rect(g,P.woodLight,dx,dy,2,dh);
      if(barn){
        rect(g,P.cream,dx+dw/2-1,dy,2,dh);
        for(let i=0;i<dh-2;i+=2){
          const p=Math.floor(i*(dw/2-3)/dh);rect(g,P.pathLight,dx+2+p,dy+2+i,3,2);rect(g,P.pathLight,dx+dw-5-p,dy+2+i,3,2);
        }
      }else{
        rect(g,P.amber,dx+dw-4,dy+17,2,2);windowPane(g,dx+6,dy+5,10,8,on);
        windowPane(g,x+17,wall+17,17,19,on);windowPane(g,x+w-34,wall+17,17,19,on);
        // Canteiros em madeira com folhas e flores, presos à fachada.
        for(const wx of [x+17,x+w-34]){
          rect(g,P.woodDark,wx-3,wall+40,23,5);rect(g,P.woodLight,wx-3,wall+40,23,1);
          for(let i=0;i<19;i+=4){rect(g,P.teal,wx+i,wall+36,3,4);rect(g,cold?P.snow:P.sage,wx+i,wall+35,3,2);}
          if(!cold){rect(g,P.berry,wx+4,wall+35,2,2);rect(g,P.cream,wx+13,wall+34,2,2);}
        }
      }
      roof(g,x-7,y,w+14,41,cold,barn);
      rect(g,P.woodDark,x+5,y+44,w-10,2);
      // Telha cumeeira, chaminé e exaustor com materiais diferentes.
      if(barn){
        rect(g,P.woodDark,x+w/2-8,y-11,16,13);rect(g,P.pathLight,x+w/2-6,y-9,12,9);
        for(let col=0;col<10;col+=3)rect(g,P.teal,x+w/2-4+col,y-6,1,4);
        roof(g,x+w/2-11,y-15,22,4,cold,false);
      }else{
        rect(g,P.stoneDark,x+w-27,y-7,9,22);rect(g,P.stone,x+w-26,y-6,6,20);
        for(let row=0;row<18;row+=4)rect(g,P.snowShade,x+w-26,y-5+row,6,1);
        rect(g,P.stoneDark,x+w-29,y-8,13,3);
      }
      rect(g,P.stoneDark,dx-4,bottom+5,dw+8,4);rect(g,P.stone,dx-4,bottom+5,dw+8,1);
    }
    for(const type of ['house','barn']) API.registerObjectDrawer(type,(o,g)=>{
      const w=o.w||112,h=o.h||96,cold=winter(),on=night();
      blit(g,'building:'+type+':'+w+':'+h+':'+cold+':'+on,o.x-10,o.y-14,w+20,h+32,c=>building(c,w,h,type==='barn',cold,on));
    });
    API.registerObjectDrawer('well',(o,g)=>{
      const cold=winter();blit(g,'well:'+cold,o.x-20,o.y-41,40,49,c=>{
        rect(c,'rgba(24,59,54,.2)',5,40,31,4);
        rect(c,P.stoneDark,7,31,26,11);rect(c,P.stone,8,33,23,7);
        for(let i=0;i<3;i++){rect(c,P.snowShade,9+i*8,34,6,2);rect(c,P.stoneDark,12+i*8,38,1,3);}
        rect(c,P.waterDeep,10,29,20,4);rect(c,P.waterLight,14,30,9,1);
        for(const x of [7,30]){rect(c,P.woodDark,x,13,3,24);rect(c,P.woodLight,x,13,1,23);}
        roof(c,2,5,36,12,cold,false);rect(c,P.woodLight,8,25,24,2);
        rect(c,P.cream,19,25,1,9);rect(c,P.wood,16,32,8,6);rect(c,P.woodDark,16,34,8,1);
        rect(c,P.woodLight,16,32,2,6);rect(c,P.stoneDark,34,25,3,7);rect(c,P.stone,34,25,3,1);
      });
    });
    API.registerObjectDrawer('sellbox',(o,g)=>{
      blit(g,'sellbox:'+winter(),o.x-22,o.y-38,44,54,c=>{
        rect(c,'rgba(24,59,54,.22)',3,46,39,4);
        for(const x of [4,37]){rect(c,P.woodDark,x,11,3,36);rect(c,P.woodLight,x,11,1,35);}
        rect(c,P.woodDark,3,3,39,2);rect(c,P.woodLight,4,3,37,1);
        for(let x=4;x<40;x+=6){rect(c,((x-4)/6)%2?P.cream:P.teal,x,5,6,9);rect(c,((x-4)/6)%2?P.pathLight:P.leafDark,x,14,6,3);}
        rect(c,P.woodDark,3,35,39,11);rect(c,P.wood,4,37,37,8);
        for(let x=7;x<40;x+=6)rect(c,P.woodLight,x,38,1,6);
        rect(c,P.woodLight,2,33,41,3);rect(c,P.cream,2,33,41,1);
        rect(c,P.woodDark,12,18,20,8);rect(c,P.woodLight,13,19,18,6);
        // Símbolo local de troca: caixa e moeda, reconhecível sem fonte.
        rect(c,P.woodDark,16,21,6,3);rect(c,P.amber,25,21,3,3);rect(c,P.cream,25,21,1,1);
        rect(c,P.woodDark,7,28,12,5);rect(c,P.woodLight,8,28,10,1);
        for(const x of [8,12,16]){rect(c,P.clay,x,28,3,3);rect(c,P.leafDark,x+1,27,1,1);rect(c,P.clayLight,x,28,1,1);}
        for(const x of [23,27,31]){rect(c,P.amber,x,28,2,5);rect(c,P.sage,x,27,3,1);}
        if(winter())rect(c,P.snow,4,2,37,2);
      });
    });

    // Equipamentos do ciclo plantar/colher/vender e lã/tear/casaco também
    // compartilham materiais; seus pontos de interação não são deslocados.
    API.registerObjectDrawer('woodpile',(o,g)=>{
      blit(g,'woodpile',o.x-16,o.y-25,32,37,c=>{
        rect(c,'rgba(24,59,54,.22)',2,31,28,4);
        rect(c,P.woodDark,5,18,23,14);rect(c,P.wood,6,19,21,11);
        for(let x=7;x<27;x+=4){rect(c,P.woodDark,x,21,1,8);rect(c,P.woodLight,x+1,23,1,5);}
        rect(c,P.woodDark,5,17,23,3);rect(c,P.woodLight,7,15,19,4);
        rect(c,P.pathLight,9,16,15,1);rect(c,P.wood,13,17,7,1);
        // Anéis do corte do cepo, recortados em passos inteiros.
        rect(c,P.wood,9,17,2,2);rect(c,P.wood,22,17,2,2);rect(c,P.wood,11,18,11,1);
        for(let i=0;i<9;i++)rect(c,P.wood,17+i,18-i,2,2);
        rect(c,P.stoneDark,25,5,5,7);rect(c,P.snowShade,26,4,4,5);rect(c,P.cream,29,4,1,5);
        rect(c,P.sage,3,29,2,2);rect(c,P.sage,27,30,2,1);
      });
    });
    function fireplace(g,lit,phase){
      rect(g,'rgba(24,59,54,.23)',2,30,38,5);rect(g,P.woodDark,9,26,25,7);
      const stones=[[4,27],[10,24],[20,23],[29,25],[34,29],[29,32],[19,33],[9,32]];
      for(const [x,y]of stones){
        rect(g,P.stoneDark,x,y,7,5);rect(g,P.stone,x,y,6,3);rect(g,P.snowShade,x+1,y,4,1);
      }
      rect(g,P.woodDark,12,28,19,4);rect(g,P.wood,13,29,17,2);
      rect(g,P.woodLight,13,28,4,1);rect(g,P.woodLight,26,30,4,1);
      if(lit){
        rect(g,P.clayDark,13,20,18,9);rect(g,P.clayLight,15,16-phase,14,12+phase);
        rect(g,P.clayLight,18,10+phase,5,9);rect(g,P.amber,18,18,9,10);
        rect(g,P.cream,20,23,5,5);rect(g,P.amber,27,13-phase,2,5);
      }
    }
    for(const type of ['fireplace','mtn_fire']) API.registerObjectDrawer(type,(o,g)=>{
      const phase=still()?0:Math.floor(performance.now()/180)%3;
      blit(g,'fire:'+!!o.lit+':'+phase,o.x-21,o.y-25,43,40,c=>fireplace(c,!!o.lit,phase));
    });
    API.registerObjectDrawer('loom',(o,g)=>{
      blit(g,'loom',o.x-15,o.y-24,30,40,c=>{
        rect(c,'rgba(24,59,54,.2)',2,35,26,3);
        for(const x of [3,24]){rect(c,P.woodDark,x,5,3,32);rect(c,P.woodLight,x,5,1,30);}
        rect(c,P.woodDark,3,4,24,4);rect(c,P.woodLight,3,4,24,1);
        rect(c,P.woodDark,3,34,24,3);rect(c,P.wood,4,34,22,1);
        for(let x=8;x<24;x+=2)rect(c,P.cream,x,8,1,21);
        rect(c,P.teal,8,22,16,9);rect(c,P.waterLight,8,23,16,1);rect(c,P.amber,8,27,16,2);
        for(let x=9;x<23;x+=3)rect(c,P.cream,x,30,1,3);
        rect(c,P.wood,2,18,26,2);rect(c,P.woodLight,2,18,26,1);
      });
    });
    API.registerObjectDrawer('bench',(o,g)=>{
      blit(g,'bench:'+winter(),o.x-16,o.y-15,32,26,c=>{
        rect(c,'rgba(24,59,54,.2)',3,22,26,3);
        rect(c,P.woodDark,4,4,2,19);rect(c,P.woodDark,26,4,2,19);
        rect(c,P.wood,2,5,28,3);rect(c,P.woodLight,2,5,28,1);
        rect(c,P.wood,2,10,28,3);rect(c,P.woodLight,2,10,28,1);
        rect(c,P.woodDark,1,15,30,4);rect(c,P.woodLight,1,15,30,1);
        if(winter())rect(c,P.snow,2,4,28,2);
      });
    });
    API.registerObjectDrawer('bridge',(o,g)=>{
      const w=o.w||48;blit(g,'bridge:'+w+':'+winter(),o.x,o.y-8,w,20,c=>{
        rect(c,P.woodDark,0,5,w,11);rect(c,P.wood,0,6,w,8);
        for(let x=0;x<w;x+=6){rect(c,P.woodLight,x,6,5,1);rect(c,P.woodDark,x+5,6,1,8);rect(c,P.woodLight,x+1,11,3,1);}
        rect(c,P.woodDark,0,2,w,2);rect(c,P.woodLight,0,2,w,1);
        rect(c,P.woodDark,0,15,w,2);rect(c,P.woodLight,0,15,w,1);
        for(const x of [0,w-3]){rect(c,P.woodDark,x,0,3,8);rect(c,P.woodLight,x,0,1,7);rect(c,P.woodDark,x,14,3,6);}
        if(winter())rect(c,P.snow,1,1,w-2,1);
      });
    });

    function animalPaint(g,kind,shorn,closed,step,sleeping){
      const rise=sleeping?3:0;
      if(kind==='cow'){
        for(const x of [8,23]){
          rect(g,P.woodDark,x,21,3,7-step);rect(g,P.ink,x-1,26-step,4,2);
          rect(g,P.pathLight,x+1,22,1,3);
        }
        rect(g,P.ink,5,9+rise,23,13-rise);rect(g,P.path,6,10+rise,21,11-rise);
        rect(g,P.cream,6,10+rise,21,8-rise);rect(g,P.snowLight,8,9+rise,15,2);
        // Manchas próprias em degraus, sem gradiente ou borda lisa.
        rect(g,P.teal,7,11+rise,6,4);rect(g,P.ink,7,14+rise,3,3);
        rect(g,P.teal,18,13+rise,6,5);rect(g,P.ink,21,17+rise,4,3);
        rect(g,P.berry,15,21,5,2);rect(g,P.clayLight,16,22,1,2);
        rect(g,P.ink,25,10+rise,9,12);rect(g,P.cream,25,11+rise,8,6);
        rect(g,P.pathLight,26,17+rise,8,4);rect(g,P.berry,27,18+rise,6,2);
        rect(g,P.ink,28,19+rise,1,1);rect(g,P.ink,32,19+rise,1,1);
        rect(g,P.woodLight,23,12+rise,3,3);rect(g,P.woodLight,33,11+rise,2,3);
        rect(g,P.cream,26,8+rise,2,3);rect(g,P.cream,31,8+rise,2,3);
        rect(g,P.woodDark,3,13+rise,2,9);rect(g,P.ink,2+step,21,3,3);
        if(closed)rect(g,P.ink,29,13+rise,3,1);
        else{rect(g,P.ink,29,12+rise,3,3);rect(g,P.snowLight,29,12+rise,1,1);}
      }else if(kind==='sheep'){
        for(const x of [8,20]){rect(g,P.woodDark,x,20,3,7-step);rect(g,P.ink,x-1,25-step,4,2);}
        rect(g,P.woodDark,4,10+rise,22,12-rise);
        rect(g,shorn?P.woodLight:P.pathLight,5,10+rise,20,11-rise);
        if(shorn){
          rect(g,P.pathLight,5,11+rise,20,7-rise);
          for(let x=7;x<24;x+=4){rect(g,P.soilLight,x,13+rise,1,1);rect(g,P.woodLight,x+1,17,1,1);}
        }else{
          rect(g,P.cream,5,8+rise,20,11-rise);
          for(const[x,y]of[[5,8],[10,6],[16,6],[22,8],[3,13],[8,16],[16,16],[23,14]]){
            rect(g,P.pathLight,x,y+rise,5,4);rect(g,P.cream,x,y+rise,4,3);rect(g,P.snowLight,x+1,y+rise,2,1);
          }
        }
        rect(g,P.ink,24,13+rise,7,9);rect(g,P.teal,24,13+rise,6,6);
        rect(g,P.woodDark,22,14+rise,2,4);rect(g,P.woodDark,30,14+rise,2,4);
        rect(g,P.ink,27,19+rise,4,2);rect(g,P.stone,25,13+rise,4,1);
        if(closed)rect(g,P.ink,27,15+rise,3,1);
        else{rect(g,P.cream,27,15+rise,2,2);rect(g,P.ink,28,16+rise,1,1);}
        rect(g,shorn?P.woodLight:P.cream,2,18,3,2);
      }else{
        for(const x of [7,13]){rect(g,P.woodLight,x,15,1,5-step);rect(g,P.woodDark,x-1,19-step,3,1);}
        rect(g,P.woodDark,4,8+rise,12,8-rise);rect(g,P.cream,5,7+rise,10,7-rise);
        rect(g,P.woodLight,6,9+rise,6,5);rect(g,P.pathLight,7,9+rise,4,2);
        rect(g,P.woodDark,6,12+rise,5,1);rect(g,P.cream,7,10+rise,1,1);
        rect(g,P.cream,14,5+rise,4,7);rect(g,P.clay,14,3+rise,4,2);
        rect(g,P.clayLight,15,2+rise,2,2);rect(g,P.amber,18,8+rise,3,2);
        rect(g,P.clay,16,12+rise,2,2);rect(g,P.woodDark,2,6+rise,2,7);
        rect(g,P.woodLight,3,7+rise,2,4);rect(g,P.cream,2,6+rise,2,1);
        rect(g,P.ink,16,7+rise,1,closed?1:2);
        if(!closed)rect(g,P.snowLight,16,7+rise,1,1);
      }
    }
    API.registerObjectDrawer('animal',(o,g)=>{
      if(offscreen(g,o.x-26,o.y-34,52,50))return;
      const kind=o.kind==='cow'?'cow':o.kind==='sheep'?'sheep':'chicken';
      const sleeping=!!(o.sleeping||o.asleep||o.dormindo);
      const closed=sleeping||(!still()&&Math.floor(performance.now()/1800+o.x*.1)%9===0);
      const step=o.moving&&!still()&&!sleeping?Math.floor((o.animT||0)*2)%2:0;
      // O chão e os pés usam os mesmos anchors do desenho anterior.
      const dim=kind==='cow'?[10,2.8]:kind==='sheep'?[9,2.6]:[5,1.8];
      g.fillStyle='rgba(24,59,54,.25)';g.beginPath();g.ellipse(o.x,o.y+(kind==='chicken'?4:6),dim[0],dim[1],0,0,Math.PI*2);g.fill();
      if(o.well!==undefined&&o.well<.3){
        rect(g,P.woodDark,o.x-4,o.y-29,9,10);rect(g,P.amber,o.x-3,o.y-28,7,8);
        rect(g,P.ink,o.x,o.y-27,1,4);rect(g,P.ink,o.x,o.y-22,1,1);
      }
      g.save();
      if((o.facing||1)<0){g.translate(o.x*2,0);g.scale(-1,1);}
      const w=kind==='cow'?36:kind==='sheep'?34:22,h=kind==='chicken'?22:30;
      const oy=kind==='chicken'?15:kind==='sheep'?18:22;
      blit(g,'animal:'+kind+':'+!!o.shorn+':'+closed+':'+step+':'+sleeping,
        o.x-Math.floor(w/2),o.y-oy,w,h,c=>animalPaint(c,kind,!!o.shorn,closed,step,sleeping));
      g.restore();
    });

    /* ---------- Montanha: agulhas, neve recortada e cabana de toras ---------- */
    API.registerObjectDrawer('mtn_pine',(o,g)=>{
      const wide=o.s>1.1?1:0;
      blit(g,'pine:'+wide,o.x-25-wide*2,o.y-66,50+wide*4,73,c=>{
        const cx=25+wide*2;rect(c,'rgba(24,59,54,.18)',cx-5,66,10,3);
        rect(c,P.woodDark,cx-3,53,6,14);rect(c,P.woodLight,cx-3,55,2,12);
        for(let tier=0;tier<5;tier++){
          const yy=55-tier*10,r=21-tier*3+wide;
          for(let row=0;row<12;row+=2){
            const half=Math.max(2,Math.floor(r*(row+3)/14));
            rect(c,P.ink,cx-half,yy-12+row,half*2,2);
            rect(c,tier%2?P.teal:P.leafDark,cx-half+2,yy-12+row,Math.max(1,half*2-5),1);
          }
          for(let b=-r+3;b<r-2;b+=5){rect(c,P.snowShade,cx+b,yy-5,5,2);rect(c,P.snow,cx+b,yy-6,4,2);}
          rect(c,P.snowLight,cx-2,yy-12,5,2);rect(c,P.sage,cx-7,yy-2,3,1);
        }
      });
    });
    function rock(g,w,h,snow,desert){
      const a=desert?P.clayDark:P.stoneDark,b=desert?P.clay:P.stone,l=desert?P.clayLight:P.snowShade;
      rect(g,'rgba(24,59,54,.19)',2,h-4,w-4,4);rect(g,a,2,7,w-4,h-11);
      rect(g,b,5,3,w-10,h-10);rect(g,l,7,3,w-14,4);
      rect(g,a,w-10,9,2,h-15);rect(g,a,5,h-10,w-10,2);
      rect(g,l,5,9,6,2);rect(g,b,1,12,4,h-19);
      if(desert)for(let y=12;y<h-7;y+=5)rect(g,P.woodLight,4,y,w-8,1);
      if(snow){rect(g,P.snow,4,2,w-8,4);rect(g,P.snowLight,7,2,w-14,1);rect(g,P.snow,2,6,6,3);}
    }
    API.registerObjectDrawer('mtn_rock',(o,g)=>blit(g,'snow-rock',o.x-17,o.y-22,34,28,c=>rock(c,34,28,true,false)));
    API.registerObjectDrawer('des_mesa',(o,g)=>blit(g,'mesa',o.x-21,o.y-30,42,36,c=>rock(c,42,36,false,true)));
    API.registerObjectDrawer('mtn_cabin',(o,g)=>{
      blit(g,'cabin',o.x-29,o.y-55,58,63,c=>{
        rect(c,'rgba(24,59,54,.22)',3,56,52,5);rect(c,P.stoneDark,7,51,44,7);
        rect(c,P.wood,7,23,44,30);
        for(let yy=24;yy<52;yy+=5){rect(c,P.woodDark,7,yy+3,44,2);rect(c,P.woodLight,7,yy,44,1);rect(c,P.woodDark,8,yy,3,3);rect(c,P.woodDark,47,yy,3,3);}
        rect(c,P.woodDark,23,38,13,16);rect(c,P.teal,25,39,9,15);rect(c,P.amber,32,46,1,1);
        windowPane(c,12,32,9,9,true);windowPane(c,39,32,8,9,true);
        roof(c,2,7,54,17,true,true);rect(c,P.stoneDark,42,2,6,14);rect(c,P.stone,42,2,4,11);
        rect(c,P.snowLight,41,1,8,2);rect(c,P.stone,22,55,16,3);
      });
    });

    /* ---------- Deserto: nervuras, frondes e estratos quentes ---------- */
    API.registerObjectDrawer('des_cactus',(o,g)=>{
      const kind=o.kind||'pear';blit(g,'cactus:'+kind,o.x-18,o.y-40,36,46,c=>{
        rect(c,'rgba(24,59,54,.16)',5,40,28,3);
        function stem(x,y,w,h){
          rect(c,P.ink,x,y,w,h);rect(c,P.teal,x+1,y+1,w-2,h-2);rect(c,P.sage,x+2,y+1,2,h-2);
          for(let i=3;i<h-2;i+=5){rect(c,P.cream,x+w-2,y+i,1,1);rect(c,P.leafLight,x+2,y+i+2,1,1);}
        }
        if(kind==='saguaro'){
          stem(14,6,9,34);stem(4,15,6,15);stem(26,13,6,20);
          rect(c,P.teal,8,26,9,5);rect(c,P.teal,20,28,9,5);rect(c,P.sage,9,26,7,1);
          rect(c,P.berry,15,4,6,3);rect(c,P.cream,17,3,2,2);
        }else if(kind==='barrel'){
          stem(7,23,22,17);rect(c,P.teal,10,20,16,4);
          for(let x=10;x<28;x+=4)rect(c,P.ink,x,25,1,13);
          rect(c,P.amber,14,18,7,3);rect(c,P.cream,16,17,3,2);
        }else{
          stem(14,27,8,13);stem(5,18,12,14);stem(21,12,10,17);
          rect(c,P.berry,9,15,4,3);rect(c,P.clayLight,24,10,4,3);
        }
      });
    });
    API.registerObjectDrawer('des_palm',(o,g)=>{
      blit(g,'palm',o.x-29,o.y-62,58,68,c=>{
        rect(c,'rgba(24,59,54,.2)',28,61,8,3);
        for(let y=18;y<62;y+=3){const xx=27+Math.floor((y-18)/14);rect(c,P.woodDark,xx,y,5,3);rect(c,P.woodLight,xx,y,2,2);}
        rect(c,P.wood,25,18,8,8);
        // Cada fronde tem uma nervura escalonada e folíolos em pares.
        for(const [dir,rise,len]of [[-1,-1,21],[1,-1,21],[-1,1,25],[1,1,25],[-1,0,25],[1,0,25]]){
          for(let step=0;step<len;step+=2){
            const xx=29+dir*step,yy=18+Math.floor(rise*step/3)+Math.floor(step*step/180);
            rect(c,P.teal,xx,yy,3,3);rect(c,P.sage,xx,yy,2,1);
            if(step>5){rect(c,P.leafDark,xx-dir,yy+2,3,4);rect(c,P.sage,xx-dir,yy+2,1,2);}
          }
        }
        rect(c,P.woodDark,25,21,4,4);rect(c,P.wood,31,22,4,4);rect(c,P.amber,25,21,1,1);
      });
    });

    /* Ambiente leve: somente células visíveis, sem procurar objetos ou
       varrer os 7 440 tiles. Chamar depois do chão e antes dos objetos,
       com a mesma câmera já aplicada ao contexto. */
    function drawAtmosphere(g,opts={}){
      atmosphere.count=0;atmosphere.anchors.length=0;
      atmosphere.reducedMotion=!!opts.reducedMotion;
      atmosphere.wind=0;atmosphere.cellStride=1;
      if(opts.indoor||(API.rawScene&&API.rawScene!=='main'))return;
      const {camX=0,camY=0,visW=0,visH=0,reducedMotion=false}=opts;
      if(visW<=0||visH<=0)return;
      const cold=!!opts.winter,phase=reducedMotion?0:performance.now()/760;
      const climate=Number.isFinite(opts.windStrength)?opts.windStrength:typeof windStrength==='number'?windStrength:1;
      const wind=Math.max(0,Math.min(2,Number.isFinite(climate)?climate:1));
      atmosphere.wind=wind;
      // Células fixas de mundo. A densidade só depende do tamanho da vista,
      // nunca da origem da câmera: não existe uma seleção dos "40 primeiros".
      // O stride dobra preservando um subconjunto das mesmas âncoras.
      const cell=64;let stride=1;
      while((Math.ceil(visW/(cell*stride))+1)*(Math.ceil(visH/(cell*stride))+1)>40)stride*=2;
      atmosphere.cellStride=stride;
      const cx0=Math.floor(camX/cell),cy0=Math.floor(camY/cell);
      for(let cy=cy0;cy<=Math.floor((camY+visH)/cell);cy++){
        if(((cy%stride)+stride)%stride!==0)continue;
        for(let cx=cx0;cx<=Math.floor((camX+visW)/cell);cx++){
          if(((cx%stride)+stride)%stride!==0)continue;
          const seed=hash(cx,cy,27);if(seed%5===0)continue;
          const x=cx*cell+10+seed%40,y=cy*cell+10+(seed>>>8)%40;
          if(x<camX||y<camY||x+5>camX+visW||y+4>camY+visH)continue;
          if(!green(API.tileAt(Math.floor(x/TS),Math.floor(y/TS))))continue;
          const sway=reducedMotion?0:Math.round(Math.sin(phase+seed%97)*Math.min(1.4,wind*.8));
          const dark=cold?P.snowShade:P.leafDark,light=cold?P.snow:P.sage;
          // Base plantada; só as pontas cedem ao vento, sem deslizar o tufo.
          rect(g,dark,x,y+3,5,1);rect(g,dark,x+1,y+1,1,3);rect(g,dark,x+3,y+2,1,2);
          rect(g,dark,x+1+sway,y,1,2);rect(g,light,x+1+sway,y,1,1);
          rect(g,light,x+3+sway,y+1,1,1);
          atmosphere.anchors.push({x,y,sway});atmosphere.count++;
        }
      }
    }
    window.FarmWorldArt=Object.freeze({
      version:1,palette:P,drawAtmosphere,
      state:()=>({tileSprites:tiles.size,objectSprites:sprites.size,cacheBytes:cachePixels*4,drawn,culled,
        atmosphere:{...atmosphere,anchors:atmosphere.anchors.map(a=>({...a}))}})
    });
  });
})();
