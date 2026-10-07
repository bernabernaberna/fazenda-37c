/* Interiores: marcenaria, tecidos e vidro originais, desenhados localmente.
   Camada visual: não move móveis, não altera mapas, interações nem saves. */
(function(){
 (window.__farmBiomes=window.__farmBiomes||[]).push(function(API){
  const P={ink:'#33483e',edge:'#493e34',dark:'#67503e',wood:'#997553',light:'#bf9d6e',cream:'#eadbbb',linen:'#c8c6a3',sage:'#819477',green:'#546f59',rust:'#a96350',stone:'#8a9284',teal:'#628e8a',gold:'#dfb363'};
  const R=(g,c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const line=(g,c,x,y,xx,yy)=>{g.strokeStyle=c;g.lineWidth=1;g.beginPath();g.moveTo(Math.round(x)+.5,Math.round(y)+.5);g.lineTo(Math.round(xx)+.5,Math.round(yy)+.5);g.stroke();};
  const cache=new Map();
  function shadow(g,x,y,w,h=4){R(g,'rgba(41,44,31,.18)',x+2,y,w,h);R(g,'rgba(41,44,31,.1)',x+4,y+h,w-2,2);}
  function panel(g,x,y,w,h,c=P.wood){R(g,P.edge,x,y,w,h);R(g,c,x+1,y+1,w-2,h-2);R(g,P.light,x+1,y+1,w-2,1);R(g,P.dark,x+w-3,y+2,2,h-3);}
  function plank(g,x,y,w,h,c=P.wood){R(g,P.dark,x,y,w,h);R(g,c,x,y,w,h-1);R(g,P.light,x,y,w,1);}
  function stone(g,x,y,w,h){R(g,P.edge,x,y,w,h);for(let yy=1;yy<h-1;yy+=6)for(let xx=1;xx<w-1;xx+=8){const ww=Math.min(7,w-xx-1),hh=Math.min(5,h-yy-1);R(g,(xx+yy)%3?P.stone:'#9da190',x+xx,y+yy,ww,hh);R(g,'#b9baa2',x+xx,y+yy,ww,1);}}
  function stoneFloor(g,x,y,w,h){
   // Lajes desencontradas; juntas finas conservam a leitura do chão sob os
   // móveis, sem a grade de alto contraste da antiga área do fogão.
   R(g,'#7f8475',x,y,w,h);
   for(let row=0,yy=0;yy<h;row++,yy+=13){
    const offset=row%2?10:0;
    for(let col=-1,xx=-offset;xx<w;col++,xx+=21){
     const left=Math.max(0,xx),right=Math.min(w,xx+20),hh=Math.min(12,h-yy);
     if(right<=left)continue;
     R(g,['#9d9f89','#979b86','#a4a58f'][(row+col+6)%3],x+left,y+yy,right-left,hh);
     R(g,'#b0b09a',x+left+1,y+yy,Math.max(0,right-left-2),1);
     if((row+col)%3===0&&right-left>10)R(g,'#929783',x+left+5,y+yy+5,5,1);
    }
   }
   R(g,'rgba(47,54,39,.13)',x,y+h-1,w,1);
  }
  function rug(g,x,y,w,h){R(g,'#796755',x,y,w,h);R(g,'#a96854',x+1,y+1,w-2,h-2);R(g,'#d1a171',x+3,y+3,w-6,h-6);R(g,'#866f57',x+4,y+4,w-8,h-8);R(g,'#9f7659',x+6,y+6,w-12,h-12);
   for(let yy=9;yy<h-6;yy+=12)for(let xx=10;xx<w-8;xx+=14){R(g,'#c2aa79',x+xx,y+yy,4,1);R(g,'#c2aa79',x+xx+1,y+yy-1,2,3);}for(let xx=2;xx<w-2;xx+=3){R(g,P.linen,x+xx,y-1,1,2);R(g,P.linen,x+xx,y+h-1,1,2);}}
  function lamp(g,x,y){R(g,P.edge,x,y,3,5);R(g,P.gold,x+1,y+1,1,3);R(g,P.light,x-1,y-1,5,2);}
  function roomSurface(scene){
   if(cache.has(scene))return cache.get(scene);
   const room=scenes[scene],w=room.MW*TS,h=room.MH*TS,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
   if(scene==='greenhouse'){
    // A estufa é um recinto de vidro dentro de uma cena ao ar livre.
    for(let y=4;y<16;y++)for(let x=5;x<26;x++){
     const t=room.map[y][x];if(t===T.FIELD)continue;
     const path=t===T.STONE,left=x*TS+(x===5?4:0),width=x===5?12:TS;
     R(g,path?'#879382':'#a7b196',left,y*TS,width,TS);
     // Só algumas juntas recebem luz; não transforma o vidro em xadrez.
     if(path){R(g,'#9ba690',left+1,y*TS+1,width-2,1);R(g,'#7e8b7b',left,y*TS+TS-1,width,1);}
     else if((x+y)%4===0)R(g,'#b5bfa4',left+2,y*TS+5,Math.min(7,width-3),1);
     if((x+y)%5===0)R(g,path?'#7b8b76':'#9eaa90',left+3,y*TS+11,Math.min(5,width-4),1);
    }
    // Montantes existentes projetados sobre o piso, presos ao recinto.
    // Esta camada nasce uma vez no cache e fica atrás de plantas e pessoas.
    g.save();g.beginPath();g.rect(84,68,328,184);g.clip();
    for(let x=112;x<412;x+=64){g.fillStyle='rgba(231,237,190,.08)';g.beginPath();g.moveTo(x,68);g.lineTo(x+15,68);g.lineTo(x-12,252);g.lineTo(x-27,252);g.fill();
     g.fillStyle='rgba(46,66,49,.075)';g.beginPath();g.moveTo(x-4,68);g.lineTo(x-1,68);g.lineTo(x-28,252);g.lineTo(x-31,252);g.fill();}
    R(g,'rgba(37,59,41,.12)',84,68,328,4);R(g,'rgba(37,59,41,.10)',84,68,3,184);R(g,'rgba(37,59,41,.08)',408,68,4,184);g.restore();
   }else{
    const barn=scene==='barn';R(g,barn?'#8c795b':'#ad926f',0,0,w,h);
    for(let y=16;y<h;y+=8)for(let x=-((y/8%2)*20);x<w;x+=40){const v=(Math.floor((x+80)/40)+y/8)%3;
     R(g,barn?['#8d7959','#937e5d','#887654'][v]:['#b19773','#b69b76','#ae936e'][v],x,y,39,7);R(g,barn?'#a28d66':'#c3aa82',x,y,39,1);R(g,'rgba(60,46,30,.12)',x+1,y+6,37,1);
     if((x+y)%3===0){R(g,barn?'#7c6a4e':'#a38a66',x+6,y+3,12,1);R(g,barn?'#ad9570':'#c2aa81',x+12,y+4,9,1);}}
    if(!barn){rug(g,16,17,64,76);rug(g,32,110,160,35);stoneFloor(g,144,17,64,78);}
    else{R(g,'#b4a06a',16,17,64,79);for(let i=0;i<85;i++){const x=18+(i*31)%60,y=19+(i*17)%73;R(g,i%3?'#c4b47c':'#95875d',x,y,3+i%4,1);}stoneFloor(g,176,17,64,79);}
    // Parede alta ao norte, rodapé e duas laterais com faces diferentes.
    R(g,barn?'#6f5b45':'#b7b7a0',0,0,w,16);R(g,barn?'#897456':'#d0cbb2',4,2,w-8,10);R(g,barn?'#a38b64':'#ddd4b8',4,2,w-8,2);
    if(barn)for(let x=6;x<w;x+=16){R(g,P.dark,x,1,2,12);R(g,P.light,x+2,1,1,12);}
    else for(let x=13;x<w;x+=24)R(g,'rgba(116,111,86,.13)',x,7,9,1);
    plank(g,0,13,w,5,barn?P.dark:P.wood);R(g,'rgba(41,44,31,.16)',4,18,w-8,5);
    R(g,P.edge,0,0,4,h);R(g,P.wood,3,17,3,h-20);R(g,P.light,3,17,1,h-20);R(g,'rgba(39,40,30,.12)',6,18,3,h-21);
    R(g,P.edge,w-4,0,4,h);R(g,P.dark,w-7,17,4,h-20);R(g,'rgba(39,40,30,.13)',w-11,18,4,h-21);
    plank(g,0,h-4,w,4,P.dark);
    if(!barn){ // Prateleira de cerâmica e relógio na parede, sem ocupar o corredor.
     R(g,P.edge,80,4,8,7);R(g,P.cream,81,5,6,5);line(g,P.dark,84,6,84,8);line(g,P.dark,84,8,86,8);
     plank(g,190,10,23,3);for(let i=0;i<3;i++){R(g,[P.rust,P.sage,P.cream][i],192+i*7,6,4,4);R(g,P.dark,193+i*7,5,2,1);}
    }else{plank(g,78,6,77,3);for(let i=0;i<4;i++){R(g,P.dark,87+i*16,8,1,8);R(g,i%2?P.stone:P.light,84+i*16,13,7,3);}lamp(g,163,6);}
   }
   cache.set(scene,c);return c;
  }
  function drawGround(g){
   if(!['house','barn','greenhouse'].includes(currentScene))return;
   g.drawImage(roomSurface(currentScene),0,0);
   if(currentScene==='house'){
    const night=typeof windowsLit==='function'&&windowsLit();
    if(!night){
     g.fillStyle='rgba(239,228,168,.10)';g.beginPath();g.moveTo(99,17);g.lineTo(141,17);g.lineTo(154,88);g.lineTo(90,88);g.fill();
     // Sombra da divisão da janela acompanha o feixe, sem cobrir móveis.
     g.fillStyle='rgba(82,83,56,.07)';g.beginPath();g.moveTo(119,17);g.lineTo(121,17);g.lineTo(123,88);g.lineTo(120,88);g.fill();
    }
   }
  }
  function bed(o,g,cot=false){const{x,y,w=48,h=32}=o;shadow(g,x,y+h-2,w,4);R(g,P.edge,x,y+2,w,h-1);R(g,P.dark,x+2,y+h-5,w-4,7);
   panel(g,x,y,w,7,cot?P.wood:P.rust);R(g,P.cream,x+3,y+6,w-6,h-11);R(g,'#b9b49c',x+4,y+11,w-8,3);
   R(g,'#e9ddbe',x+5,y+7,w-10,6);R(g,'#f1e6ca',x+6,y+7,w-12,4);
   const c=cot?P.sage:'#819494';R(g,c,x+3,y+14,w-6,h-17);R(g,cot?'#a3ad83':'#a2b4aa',x+3,y+14,w-6,2);
   for(let xx=8;xx<w-6;xx+=8){R(g,cot?'#bac1a0':'#bbccc0',x+xx,y+16,1,h-19);R(g,'rgba(46,73,63,.2)',x+xx+2,y+18,2,h-22);}
   plank(g,x,y+h-5,w,5,cot?P.wood:P.rust);R(g,P.edge,x+1,y+h-1,3,3);R(g,P.edge,x+w-4,y+h-1,3,3);}
  function cupboard(o,g,shelves=false){const{x,y,w=32,h=32}=o;shadow(g,x,y+h-1,w,4);R(g,P.edge,x,y,w,h);R(g,P.dark,x+3,y+3,w-6,h-6);plank(g,x-1,y-2,w+2,4,P.light);R(g,P.light,x+1,y+2,2,h-4);R(g,P.wood,x+w-5,y+2,4,h-4);
   if(shelves){for(let yy=7;yy<h-5;yy+=13){for(let i=0;i<5;i++){const xx=x+5+i*4,hh=6+(i+yy)%4;R(g,[P.rust,P.sage,P.teal,P.gold,P.linen][(i+yy)%5],xx,y+yy+5-hh,3,hh);R(g,'#d9c59c',xx,y+yy+2,3,1);}plank(g,x+3,y+yy+5,w-8,3);}}
   else{panel(g,x+4,y+4,(w-10)/2,h-9);panel(g,x+w/2,y+4,(w-10)/2,h-9);R(g,P.gold,x+w/2-3,y+h/2,1,3);R(g,P.gold,x+w/2+2,y+h/2,1,3);}
   plank(g,x-1,y+h-4,w+1,4,P.wood);R(g,P.edge,x+2,y+h,3,2);R(g,P.edge,x+w-5,y+h,3,2);}
  function desk(o,g){const{x,y,w=48,h=32}=o;shadow(g,x+1,y+h-2,w-2,3);R(g,P.edge,x+2,y+h-15,4,16);R(g,P.edge,x+w-6,y+h-15,4,16);
   R(g,P.wood,x+3,y+h-14,2,13);R(g,P.wood,x+w-5,y+h-14,2,13);panel(g,x-1,y-1,w+2,h-12,P.light);
   for(let yy=5;yy<h-14;yy+=6)R(g,'#a08358',x+1,y+yy,w-2,1);plank(g,x,y+h-14,w,6);R(g,P.gold,x+w-13,y+h-12,4,1);
   R(g,P.dark,x+6,y+5,18,11);R(g,P.linen,x+6,y+4,18,10);R(g,'#f1e5c9',x+7,y+5,7,8);R(g,'#dcd5b6',x+15,y+5,8,8);for(let yy=7;yy<12;yy+=2){R(g,P.sage,x+8,y+yy,5,1);R(g,P.sage,x+16,y+yy,5,1);}
   R(g,P.rust,x+w-10,y+5,5,5);R(g,P.cream,x+w-9,y+5,3,1);R(g,P.rust,x+w-5,y+6,2,3);R(g,P.dark,x+w-17,y+9,3,3);line(g,P.ink,x+w-15,y+9,x+w-12,y+3);}
  function chair(o,g){const{x,y}=o;shadow(g,x-1,y+12,12,3);panel(g,x-2,y-7,12,11);R(g,P.light,x,y-5,2,6);R(g,P.light,x+5,y-5,2,6);panel(g,x-2,y+3,12,7,P.sage);R(g,P.dark,x-1,y+10,2,6);R(g,P.dark,x+7,y+10,2,6);}
  function fireplace(o,g,stove=false){const{x,y}=o;if(stove){shadow(g,x-8,y+9,18,4);R(g,P.edge,x-7,y-11,14,22);R(g,'#5f6960',x-5,y-10,10,19);R(g,P.stone,x-8,y-12,16,4);R(g,P.edge,x-2,y-25,4,14);R(g,P.stone,x-2,y-25,1,14);panel(g,x-4,y-5,8,10,P.edge);}
   else{shadow(g,x-14,y+12,29,4);stone(g,x-14,y-15,28,30);plank(g,x-17,y-16,34,4,P.dark);R(g,P.edge,x-9,y-7,18,18);R(g,'#3f4032',x-7,y-8,14,20);stone(g,x-15,y+10,30,5);}
   const lit=o.lit!==false;if(lit){const still=!!A11Y.reduceMotion,t=still?0:Math.floor(performance.now()/180)%3;R(g,'#d07740',x-5,y+1,10,7);R(g,'#e9b35f',x-3,y-2+t,6,10-t);R(g,'#f7d98c',x-1,y+t,2,7-t);R(g,P.dark,x-7,y+7,14,2);}else R(g,P.dark,x-5,y+6,10,3);}
  function plant(o,g,hanging=false){const{x,y}=o;shadow(g,x-7,y+8,14,3);if(hanging){line(g,P.dark,x,y-20,x,y-5);line(g,P.light,x,y-8,x-6,y);line(g,P.light,x,y-8,x+6,y);}
   R(g,P.edge,x-6,y+1,12,9);R(g,P.rust,x-5,y+2,10,7);R(g,'#c0835d',x-5,y+2,3,6);R(g,P.light,x-7,y,14,3);R(g,P.dark,x-5,y,10,1);
   line(g,P.green,x,y,x,y-12);for(const [dx,dy]of [[-6,-9],[2,-13],[-4,-5],[3,-7]]){R(g,P.green,x+dx,y+dy,5,3);R(g,P.sage,x+dx,y+dy,4,1);}if(hanging){R(g,P.green,x-8,y+3,2,7);R(g,P.sage,x-9,y+9,3,2);R(g,P.green,x+7,y+4,2,5);}}
  function windowArt(o,g){const{x,y,w=48}=o;panel(g,x-1,y,w+2,17,P.wood);const night=typeof windowsLit==='function'&&windowsLit();R(g,night?'#4b686d':'#a0c5bd',x+3,y+2,w-6,12);R(g,night?'#68887d':'#c9d5bb',x+3,y+10,w-6,4);R(g,'rgba(244,237,196,.35)',x+6,y+3,2,8);
   R(g,P.light,x+w/2-1,y+1,2,14);R(g,P.light,x+2,y+7,w-4,2);for(const xx of [x-3,x+w-3]){R(g,P.linen,xx,y+1,6,15);R(g,P.cream,xx,y+1,2,13);R(g,P.sage,xx,y+11,6,2);}plank(g,x-4,y+15,w+8,3,P.light);}
  function door(o,g){const x=o.x,y=o.y;R(g,P.edge,x-13,y-3,26,12);R(g,P.wood,x-11,y-1,22,9);R(g,P.light,x-10,y,20,1);R(g,P.dark,x-10,y+5,20,1);R(g,P.linen,x-7,y-4,14,3);}
  function hay(o,g){const{x,y}=o;shadow(g,x-9,y+9,20,3);R(g,'#83754f',x-10,y-8,20,18);R(g,'#baa267',x-9,y-7,18,14);R(g,'#d8c387',x-8,y-8,16,5);for(let i=0;i<5;i++){R(g,'#d0b679',x-7+i*3,y-2+i%2,2,7);R(g,'#a18c59',x-7+i*3,y-6,2,2);}R(g,P.dark,x-5,y-8,2,18);R(g,P.dark,x+4,y-8,2,18);R(g,P.light,x-5,y-7,1,3);}
  function sack(o,g){const{x,y}=o;shadow(g,x-6,y+9,14,3);R(g,P.edge,x-6,y-4,12,15);R(g,'#bdad80',x-5,y-4,10,14);R(g,'#d4c69b',x-4,y-3,3,11);R(g,P.dark,x-4,y-6,8,3);R(g,P.linen,x-3,y+2,7,4);R(g,P.green,x-1,y+3,3,1);}
  function chest(o,g){const{x,y}=o;shadow(g,x-10,y+11,22,3);panel(g,x-10,y-4,20,16);panel(g,x-10,y-7,20,7,P.light);R(g,P.dark,x-7,y-7,2,20);R(g,P.dark,x+5,y-7,2,20);R(g,P.gold,x-1,y+1,3,4);R(g,P.edge,x,y+2,1,1);}
  function trough(o,g){const{x,y,w=80}=o;shadow(g,x,y+12,w,4);panel(g,x,y-3,w,18,P.wood);R(g,P.dark,x+3,y,w-6,6);R(g,'#8b8153',x+5,y+1,w-10,3);if((o.fillLevel||0)>0)for(let i=5;i<w-8;i+=5)R(g,P.gold,x+i,y+1,4,2);plank(g,x-1,y+6,w+2,5,P.light);for(let i=7;i<w-3;i+=18)R(g,P.dark,x+i,y+11,3,6);}
  function toolrack(o,g){const{x,y,w=48}=o;panel(g,x,y,w,25,P.dark);for(let i=0;i<4;i++){const xx=x+6+i*11;line(g,P.light,xx,y+4,xx,y+20);R(g,P.stone,xx-3,y+3,7,i%2?3:5);R(g,P.light,xx-2,y+3,5,1);}plank(g,x-1,y+24,w+2,3);}
  function barrel(o,g){const{x,y}=o;shadow(g,x-8,y+12,18,3);R(g,P.edge,x-9,y-9,18,22);R(g,P.wood,x-8,y-7,16,19);R(g,P.light,x-6,y-6,3,17);R(g,P.dark,x+4,y-6,3,17);R(g,P.edge,x-7,y-11,14,5);R(g,'#4f8885',x-6,y-10,12,3);R(g,'#9ac1ac',x-4,y-10,6,1);R(g,P.stone,x-9,y-3,18,2);R(g,P.stone,x-9,y+8,18,2);}
  function planter(o,g){const{x,y,w,h}=o;shadow(g,x-1,y+h,w+2,4);plank(g,x-2,y-3,w+4,4,P.light);R(g,P.dark,x-2,y,3,h);R(g,P.wood,x+w-1,y,3,h);plank(g,x-2,y+h-2,w+4,7);for(let i=5;i<w;i+=18){R(g,P.dark,x+i,y+h-1,1,5);R(g,P.cream,x+i+2,y+h,1,1);}}
  function greenhouseBack(o,g){const{x,y,w}=o;
   // Vidro só nas paredes. O antigo quadriculado cobria canteiros e pessoas.
   R(g,'#718d82',x,y,w,20);R(g,'#a7c8b5',x+4,y+3,w-8,13);R(g,'#cbdcc1',x+4,y+3,w-8,2);
   for(let xx=32;xx<w-8;xx+=32){R(g,P.dark,x+xx,y,2,20);R(g,P.light,x+xx+2,y,1,20);line(g,'#d7e4cb',x+xx-17,y+4,x+xx-24,y+12);}
   plank(g,x-3,y-3,w+6,5,P.light);plank(g,x,y+18,w,4);
  }
  function greenhouse(o,g){const{x,y,w,h}=o;
   R(g,P.dark,x,y+20,4,h-20);R(g,P.light,x,y+20,1,h-20);R(g,P.dark,x+w-4,y+20,4,h-20);R(g,P.wood,x+w-3,y+20,2,h-20);
   // Soleiras separadas deixam a abertura central livre.
   const left=15*TS-6,right=17*TS+6;plank(g,x-2,y+h-4,left-x+2,6);plank(g,right,y+h-4,x+w+2-right,6);
   for(const xx of [x,x+w-4]){R(g,'#789a89',xx-1,y+20,6,h-24);R(g,'#c1d2b7',xx,y+20,1,h-24);for(let yy=50;yy<h;yy+=40)R(g,P.wood,xx-2,y+yy,8,3);}
  }
  API.registerObjectDrawer('i_bed',(o,g)=>bed(o,g));API.registerObjectDrawer('b_cot',(o,g)=>bed(o,g,true));
  API.registerObjectDrawer('i_wardrobe',(o,g)=>cupboard(o,g));API.registerObjectDrawer('i_bookshelf',(o,g)=>cupboard(o,g,true));
  API.registerObjectDrawer('i_table',desk);API.registerObjectDrawer('i_chair',chair);API.registerObjectDrawer('i_window',windowArt);API.registerObjectDrawer('i_door',door);
  API.registerObjectDrawer('i_fireplace',(o,g)=>fireplace(o,g));API.registerObjectDrawer('b_stove',(o,g)=>fireplace(o,g,true));
  API.registerObjectDrawer('i_plant',(o,g)=>plant(o,g));API.registerObjectDrawer('gh_hanging',(o,g)=>plant(o,g,true));
  API.registerObjectDrawer('b_haybale',hay);API.registerObjectDrawer('b_sack',sack);API.registerObjectDrawer('b_chest',chest);API.registerObjectDrawer('b_trough',trough);API.registerObjectDrawer('b_toolrack',toolrack);
  API.registerObjectDrawer('gh_barrel',barrel);API.registerObjectDrawer('gh_planter',planter);API.registerObjectDrawer('gh_frame',greenhouse);
  API.registerObjectDrawer('interior_gh_back',greenhouseBack);
  API.registerObjectDrawer('gh_pipe',(o,g)=>{R(g,P.dark,o.x,o.y,o.w,3);R(g,P.teal,o.x,o.y,o.w,1);for(let x=5;x<o.w;x+=16){R(g,P.stone,o.x+x,o.y,2,5);R(g,'#9ebdaf',o.x+x,o.y+4,2,1);}});
  API.registerObjectDrawer('gh_arch',(o,g)=>{for(const x of [o.x,o.x+o.w-3]){R(g,P.dark,x,o.y-5,3,18);R(g,P.light,x,o.y-5,1,17);}plank(g,o.x-1,o.y-6,o.w+2,4,P.light);});
  window.FarmInteriorArt={drawGround,
   // A parede norte tem profundidade própria; não é pintada sobre quem está
   // no corredor interno só porque a soleira sul fica mais abaixo na tela.
   parts(o){return o.type==='gh_frame'?[{type:'interior_gh_back',x:o.x,y:o.y,w:o.w,h:6}]:[];},
   state:()=>({rooms:[...cache.keys()],pixels:[...cache.values()].reduce((n,c)=>n+c.width*c.height,0)})};
 });
})();
