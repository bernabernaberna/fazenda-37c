/* Água viva em pixels inteiros. Só desenha: a margem de oito vizinhos,
   o mapa físico, os objetos de interação e os saves continuam intactos. */
(function(){
  (window.__farmBiomes=window.__farmBiomes||[]).push(function(API){
    'use strict';
    const T=API.T,TS=API.TS,masks=new Map(),anchors=new Map();
    let sourceMap=null,groups=0;
    const wet=t=>t===T.WATER||t===T.RIVER||t===T.OASIS||t===T.ICE;
    const liquid=t=>t===T.OASIS||((t===T.WATER||t===T.RIVER)&&!API.isFrio());
    const reduced=()=>typeof motionOk==='function'&&!motionOk();
    const hash=(x,y)=>(Math.imul(x^7919,73856093)^Math.imul(y^104729,19349663))>>>0;
    const rect=(g,c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
    function sync(){
      const next=API.scenes[API.rawScene]?.map;
      if(next!==sourceMap){sourceMap=next;masks.clear();anchors.clear();}
    }
    function mask(tx,ty){
      sync();
      const t=API.tileAt(tx,ty);if(!wet(t))return null;
      const key=ty*65536+tx;let rows=masks.get(key);if(rows)return rows;
      rows=new Uint16Array(TS);
      // A margem estática ocupa até seis pixels, incluindo a linha úmida.
      // Reservar essa faixa e as quatro quinas evita pintar sobre qualquer
      // recorte da arte, sem ler pixels do canvas ou recalcular seu cache.
      const n=!wet(API.tileAt(tx,ty-1)),e=!wet(API.tileAt(tx+1,ty)),
        s=!wet(API.tileAt(tx,ty+1)),w=!wet(API.tileAt(tx-1,ty));
      const nw=!wet(API.tileAt(tx-1,ty-1)),ne=!wet(API.tileAt(tx+1,ty-1)),
        sw=!wet(API.tileAt(tx-1,ty+1)),se=!wet(API.tileAt(tx+1,ty+1));
      for(let y=0;y<TS;y++)for(let x=0;x<TS;x++){
        const right=TS-1-x,bottom=TS-1-y;
        if((n&&y<6)||(s&&bottom<6)||(w&&x<6)||(e&&right<6))continue;
        if((nw&&x<6&&y<6)||(ne&&right<6&&y<6)||(sw&&x<6&&bottom<6)||(se&&right<6&&bottom<6))continue;
        rows[y]|=1<<x;
      }
      masks.set(key,rows);return rows;
    }
    function surfaceAt(x,y){
      x=Math.floor(x);y=Math.floor(y);
      const tx=Math.floor(x/TS),ty=Math.floor(y/TS),rows=mask(tx,ty);
      return !!(rows&&(rows[y-ty*TS]&(1<<(x-tx*TS))));
    }
    function waterRect(g,c,x,y,w=1,h=1){
      g.fillStyle=c;
      for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(surfaceAt(x+i,y+j))g.fillRect(x+i,y+j,1,1);
    }
    function anchor(o,kind){
      sync();const old=anchors.get(o);
      if(old&&old.kind===kind&&old.ox===o.x&&old.oy===o.y)return old.point;
      let point=null,score=Infinity;
      const ox=Math.floor(o.x/TS),oy=Math.floor(o.y/TS),fish=kind==='fish';
      const lilies=(API.scenes[API.rawScene]?.objects||[]).filter(item=>item.type==='river_lily');
      const previous=fish?lilies:lilies.slice(0,Math.max(0,lilies.indexOf(o)));
      const reserved=previous.map(item=>anchor(item,'lily')).filter(Boolean);
      const clear=(x,y)=>reserved.every(p=>Math.abs(p.x-x)>=15||Math.abs(p.y-y)>=8);
      if(!fish){
        // A mesma ordem do mundo resolve o grupo inteiro, mesmo quando a
        // câmera só enxerga sua última folha. Evita fundir lírios na margem.
        for(let dy=-32;dy<=32;dy+=2)for(let dx=-32;dx<=32;dx+=2){
          const x=Math.round(o.x)+dx,y=Math.round(o.y)+dy,d=dx*dx+dy*dy;
          if(d>=score||!clear(x,y))continue;
          if(![-7,0,7].every(a=>[-4,0,4].every(b=>surfaceAt(x+a,y+b))))continue;
          score=d;point=Object.freeze({x,y});
        }
      }
      if(fish)for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){
        const tx=ox+dx,ty=oy+dy,t=API.tileAt(tx,ty);
        if(t!==T.RIVER&&t!==T.WATER&&t!==T.OASIS)continue;
        const x=tx*TS+TS/2,y=ty*TS+TS/2,d=Math.hypot(x-o.x,y-o.y);
        if(d>48||!surfaceAt(x,y)||!clear(x,y))continue;
        let edge=0;
        for(const [a,b]of [[-6,-3],[6,-3],[-6,3],[6,3]])if(!surfaceAt(x+a,y+b))edge++;
        const cost=(fish?Math.abs(d-24):d)+edge*12;
        if(cost<score){score=cost;point=Object.freeze({x,y});}
      }
      if(anchors.size>=64)anchors.delete(anchors.keys().next().value);
      anchors.set(o,{kind,ox:o.x,oy:o.y,point});return point;
    }
    function fishingTarget(o){return o&&Number.isFinite(o.x)&&Number.isFinite(o.y)?anchor(o,'fish'):null;}
    function ripple(g,x,y,phase,color){
      const r=3+phase,ry=1+Math.floor(phase/2);
      waterRect(g,color,x-r+2,y-ry,r*2-3);
      waterRect(g,color,x-r+1,y-ry+1,1);
      waterRect(g,color,x+r-1,y-ry+1,1);
      if(ry>1){waterRect(g,color,x-r,y,1);waterRect(g,color,x+r,y,1);}
      waterRect(g,color,x-r+2,y+ry,r*2-3);
    }
    function drawSurface(g,camX,camY,visW,visH){
      groups=0;if(API.rawScene!=='main'||reduced())return;
      const time=performance.now()/1000;
      // Uma crista a cada célula de 32px; distribuição fixa no mundo.
      // A cor vem da água, sem estrelas brancas nem uma grade piscando.
      for(let cy=Math.floor(camY/32);cy<=Math.floor((camY+visH)/32);cy++)
        for(let cx=Math.floor(camX/32);cx<=Math.floor((camX+visW)/32);cx++){
          const seed=hash(cx,cy);if(seed%5===0)continue;
          const x=cx*32+7+seed%18,y=cy*32+7+(seed>>>8)%18;
          const tile=API.tileAt(Math.floor(x/TS),Math.floor(y/TS));
          if(!liquid(tile)||!surfaceAt(x,y))continue;
          const phase=Math.floor(time*.9+seed%17)%4,dy=phase===3?1:0;
          const color=phase===0?'#508e87':phase===3?'#4b8983':'#629d93';
          waterRect(g,color,x,y+dy,3+(seed>>>16)%4);
          if(phase===1)waterRect(g,'#538f87',x+2,y-1,2);
          groups++;
        }
    }
    function drawLily(o,g){
      const p=anchor(o,'lily');if(!p)return;
      const cold=API.isFrio(),sway=reduced()||cold?0:Math.round(Math.sin(performance.now()/1700+o.x)*.65);
      const x=p.x+sway,y=p.y;
      // Folha recortada e nervura curta; os pixels de contato têm cor da água.
      waterRect(g,'#36675c',x-4,y+3,9);
      waterRect(g,cold?'#5d8170':'#3e6651',x-4,y-3,8);
      waterRect(g,cold?'#6f927e':'#527752',x-6,y-2,12,4);
      waterRect(g,cold?'#789b83':'#6b8a5b',x-4,y-2,7,3);
      waterRect(g,cold?'#6f927e':'#527752',x-4,y+2,8);
      waterRect(g,'#3e6651',x+1,y,4);
      waterRect(g,'#367b78',x+4,y+1,2);
      const flower=o.kind==='pink';
      waterRect(g,flower?'#b97979':'#c9cda6',x-1,y-3,3,2);
      waterRect(g,flower?'#d6a0a0':'#e5dfbc',x,y-4,1,2);
      waterRect(g,'#d8b773',x,y-3,1);
      if(!cold)waterRect(g,'#5b9a90',x-6,y+4,4);
    }
    function drawCattail(o,g){
      const x=Math.round(o.x),y=Math.round(o.y),seed=hash(x,y),cold=API.isFrio();
      const sway=reduced()||cold?0:Math.round(Math.sin(performance.now()/1500+seed%31)*.75);
      waterRect(g,'#376b65',x,y+4,1,3);
      rect(g,cold?'#668777':'#476548',x,y-8,1,9);
      rect(g,cold?'#779383':'#68805a',x+sway,y-12,1,5);
      rect(g,'#57453c',x+sway-1,y-13,2,5);
      rect(g,'#886548',x+sway-1,y-12,1,3);
      rect(g,cold?'#779383':'#68805a',x+sway,y-15,1,2);
      rect(g,cold?'#668777':'#476548',x-2,y-2,1,5);
      rect(g,cold?'#779383':'#68805a',x-3,y-5,1,4);
      rect(g,cold?'#668777':'#476548',x+2,y-1,1,4);
      rect(g,cold?'#779383':'#68805a',x+3,y-4,1,4);
    }
    function drawFishing(o,g){
      const p=fishingTarget(o),still=reduced(),time=still?0:performance.now();
      if(p&&!API.isFrio()){
        const phase=Math.floor(time/420)%4;
        ripple(g,p.x,p.y,phase,phase===3?'#598d85':'#85b2a0');
        waterRect(g,'#395e57',p.x-1,p.y,3);
        if(phase===0)waterRect(g,'#acc5ad',p.x,p.y-1,1);
      }
      // Mesmo texto, distância e posição de interação. Apenas a oscilação
      // deixa de acontecer quando o jogador pede redução de movimento.
      if(API.player&&Math.hypot(API.player.x-o.x,API.player.y-o.y)<28){
        const pulse=still?1:(Math.sin(time/300)+1)/2;
        g.save();g.font='bold 8px Trebuchet MS, monospace';g.textAlign='center';
        g.fillStyle=`rgba(255,217,138,${.75+.25*pulse})`;g.fillText('[E] Pescar',o.x,o.y-8);g.restore();
      }
    }
    API.registerObjectDrawer('river_lily',drawLily);
    API.registerObjectDrawer('river_cattail',drawCattail);
    API.registerObjectDrawer('fishing_spot',drawFishing);
    window.FarmWaterLife=Object.freeze({drawSurface,fishingTarget,surfaceAt,
      info:()=>({tileMasks:masks.size,maskBytes:masks.size*TS*2,anchors:anchors.size,maxAnchors:64,groups})});
  });
})();
