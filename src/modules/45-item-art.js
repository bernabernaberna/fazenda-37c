/* Objetos de bolso originais: silhuetas em uma grade de 24 pixels.
   Somente desenho, sem estado do inventário, DOM, rede ou dependências.
   Os recortes inteiros conservam a nitidez em 24 e 48 px. */
(function(){
  'use strict';
  const P=Object.freeze({
    ink:'#263c36',dark:'#4e493c',wood:'#886548',woodLight:'#b99161',
    cream:'#eee2b8',linen:'#c9bc91',gold:'#e3b86b',goldDark:'#a77b42',
    green:'#66805a',sage:'#a8b97a',greenDark:'#3c6250',
    blue:'#699d9c',blueDark:'#366669',ice:'#b4d6ce',
    clay:'#ad6650',clayLight:'#d39368',red:'#a75e55',redDark:'#74483f',
    berry:'#956476',purple:'#624d5c',white:'#f0f3df'
  });
  const r=(x,y,w,h,c)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+P[c]+'"/>';
  const p=(points,c)=>'<polygon points="'+points+'" fill="'+P[c]+'"/>';
  const svg=body=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" shape-rendering="crispEdges">'+body+'</svg>';
  const steam=()=>r(8,2,2,3,'linen')+r(9,1,2,1,'linen')+r(13,3,2,3,'cream')+r(14,2,2,1,'cream');
  function bottle(liquid){
    return r(9,2,6,3,'ink')+r(10,2,4,2,'woodLight')+
      p('9,5 15,5 15,7 17,7 17,9 18,9 18,20 16,20 16,22 8,22 8,20 6,20 6,9 7,9 7,7 9,7','ink')+
      p('10,5 14,5 14,8 16,8 16,10 17,10 17,19 15,19 15,21 9,21 9,19 7,19 7,10 8,10 8,8 10,8','blue')+
      r(8,12,8,7,liquid)+r(9,19,6,1,liquid)+r(8,9,2,8,'ice')+r(10,6,1,3,'ice');
  }
  function jar(liquid){
    return r(7,3,10,3,'ink')+r(8,3,8,2,'goldDark')+r(8,3,6,1,'gold')+
      p('7,6 17,6 17,8 18,8 18,20 16,20 16,22 8,22 8,20 6,20 6,8 7,8','ink')+
      r(7,9,10,10,liquid)+r(8,7,8,2,'linen')+r(8,19,8,2,liquid)+r(7,9,2,8,'cream');
  }
  const seeds=Object.freeze(['tomato','corn','carrot','forage','lettuce','sweetpotato','pumpkin']);
  const emblems=Object.freeze({
    tomato:()=>p('10,10 14,10 14,11 16,11 16,15 14,15 14,16 10,16 10,15 8,15 8,11 10,11','redDark')+r(9,11,6,3,'red')+r(10,11,2,1,'clayLight')+r(11,9,2,2,'greenDark')+r(9,10,6,1,'green'),
    corn:()=>r(10,9,4,8,'goldDark')+r(11,9,2,7,'gold')+r(10,11,4,1,'cream')+r(10,14,4,1,'cream')+p('8,12 10,14 10,17 14,17 14,14 16,12 16,16 14,18 10,18 8,16','greenDark'),
    carrot:()=>p('9,11 15,11 15,14 13,14 13,17 11,17 11,15 9,15','clay')+r(9,11,2,3,'clayLight')+r(10,13,3,1,'wood')+r(12,9,2,2,'green')+r(10,8,2,2,'sage')+r(14,8,2,2,'greenDark'),
    forage:()=>p('8,11 10,11 10,14 11,14 11,9 13,9 13,14 14,14 14,10 16,10 16,14 14,14 14,17 10,17 10,15 8,15','greenDark')+r(11,10,1,6,'sage')+r(14,10,1,4,'green')+r(9,12,1,3,'green'),
    lettuce:()=>p('10,9 14,9 14,10 16,10 16,12 17,12 17,15 15,15 15,17 9,17 9,15 7,15 7,12 8,12 8,10 10,10','greenDark')+r(9,11,6,4,'green')+r(10,10,3,2,'sage')+r(8,12,2,2,'sage')+r(12,12,1,4,'linen'),
    sweetpotato:()=>p('13,9 16,9 16,12 15,12 15,14 13,14 13,16 10,16 10,17 8,17 8,14 9,14 9,12 11,12 11,10 13,10','purple')+p('13,10 15,10 15,12 13,12 13,14 11,14 11,16 9,16 9,14 10,14 10,12 12,12 12,11 13,11','berry')+r(11,12,2,1,'clayLight'),
    pumpkin:()=>p('9,10 15,10 15,11 17,11 17,15 15,15 15,17 9,17 9,15 7,15 7,11 9,11','wood')+r(8,12,8,3,'clay')+r(10,11,4,5,'clayLight')+r(12,11,1,5,'clay')+r(11,8,2,3,'greenDark')
  });
  function seedPouch(kind){
    return p('7,2 17,2 17,4 16,4 16,6 18,6 18,8 19,8 19,20 17,20 17,22 7,22 7,20 5,20 5,8 6,8 6,6 8,6 8,4 7,4','ink')+
      r(8,3,8,2,'woodLight')+r(9,5,6,2,'wood')+
      p('8,7 16,7 16,9 18,9 18,19 16,19 16,21 8,21 8,19 6,19 6,9 8,9','goldDark')+
      p('8,8 16,8 16,10 17,10 17,19 7,19 7,10 8,10','linen')+
      r(7,10,1,8,'cream')+r(9,6,6,1,'ink')+r(8,19,8,1,'woodLight')+emblems[kind]();
  }
  const painters=Object.freeze({
    water:()=>r(9,1,6,3,'ink')+r(10,2,4,1,'woodLight')+r(8,4,8,2,'ink')+
      p('7,6 17,6 17,8 19,8 19,18 17,18 17,21 7,21 7,18 5,18 5,8 7,8','ink')+
      p('8,6 16,6 16,9 18,9 18,17 16,17 16,20 8,20 8,17 6,17 6,9 8,9','blueDark')+
      r(8,7,8,12,'blue')+r(8,7,2,8,'ice')+r(7,10,10,2,'wood')+r(10,10,4,2,'gold')+r(10,17,5,2,'blueDark'),
    watercan:()=>p('3,8 8,8 8,10 6,10 6,15 3,15 3,13 4,13 4,10 3,10','ink')+
      p('9,5 15,5 15,7 17,7 17,10 19,10 19,7 22,7 22,10 20,10 20,14 17,14 17,20 7,20 7,18 6,18 6,9 8,9 8,7 9,7','ink')+
      r(8,10,8,9,'blueDark')+r(8,11,6,6,'blue')+r(8,10,2,5,'ice')+r(9,6,5,2,'woodLight')+r(9,8,5,2,'ink')+
      p('16,11 19,11 19,8 21,8 21,9 19,13 16,13','blue')+r(20,6,3,2,'gold')+r(8,18,8,1,'blue'),
    hay:()=>p('5,5 18,5 18,6 20,6 20,18 18,18 18,20 5,20 5,18 3,18 3,7 5,7','ink')+
      r(5,6,13,13,'goldDark')+r(4,8,15,9,'gold')+r(5,7,12,1,'cream')+r(5,10,12,1,'linen')+r(5,15,13,1,'goldDark')+
      r(8,6,2,13,'wood')+r(14,6,2,13,'wood')+r(8,7,1,10,'woodLight')+r(14,7,1,10,'woodLight'),
    towel:()=>p('5,4 17,4 17,5 20,5 20,8 21,8 21,18 19,18 19,20 4,20 4,18 3,18 3,7 5,7','ink')+
      r(5,5,12,13,'blue')+r(4,8,14,9,'ice')+r(5,5,2,12,'white')+r(5,14,13,2,'blueDark')+
      r(16,6,3,12,'blueDark')+r(17,7,2,10,'blue')+r(5,18,13,1,'blue')+r(6,19,1,2,'linen')+r(9,19,1,2,'linen')+r(12,19,1,2,'linen'),
    coat:()=>p('7,3 10,3 10,4 14,4 14,3 17,3 17,5 19,5 19,8 21,8 21,13 18,13 18,11 17,11 17,21 7,21 7,11 6,11 6,13 3,13 3,8 5,8 5,5 7,5','ink')+
      p('7,5 10,5 10,6 14,6 14,5 17,5 17,7 19,7 19,12 18,12 18,9 16,9 16,20 8,20 8,9 6,9 6,12 4,12 4,9 6,9 6,7 7,7','blueDark')+
      r(8,7,4,12,'blue')+r(8,6,2,6,'ice')+r(10,4,4,2,'linen')+r(11,6,2,14,'wood')+r(12,8,1,1,'gold')+r(12,12,1,1,'gold')+r(12,16,1,1,'gold')+r(9,16,2,2,'blueDark')+r(14,16,2,2,'ink'),
    veg:()=>p('3,12 6,12 6,11 10,11 10,13 12,13 12,17 10,17 10,20 5,20 5,18 3,18','ink')+
      r(5,13,5,5,'red')+r(5,13,2,2,'clayLight')+r(6,10,2,3,'greenDark')+
      p('15,8 20,8 20,13 18,13 18,17 16,17 16,20 14,20 14,16 13,16 13,11 15,11','ink')+
      r(15,10,4,4,'clayLight')+r(14,12,4,3,'clay')+r(15,15,2,3,'clay')+r(15,12,3,1,'wood')+
      r(15,5,2,4,'green')+r(13,4,2,3,'sage')+r(18,4,2,5,'greenDark'),
    wool:()=>p('8,3 15,3 15,5 19,5 19,8 21,8 21,15 19,15 19,19 15,19 15,21 7,21 7,19 3,19 3,14 2,14 2,9 5,9 5,5 8,5','ink')+
      p('8,4 14,4 14,6 18,6 18,9 20,9 20,14 18,14 18,18 14,18 14,20 8,20 8,18 4,18 4,13 3,13 3,10 6,10 6,6 8,6','linen')+
      r(8,5,6,5,'cream')+r(6,7,5,6,'white')+r(4,11,7,5,'cream')+r(11,9,7,6,'cream')+r(8,14,7,5,'cream')+r(10,10,2,3,'linen')+r(6,15,3,1,'linen'),
    wood:()=>p('4,11 14,3 18,3 21,6 21,10 11,18 7,18 4,15','ink')+
      p('5,11 15,4 18,4 20,7 20,9 10,17 7,17 5,15','wood')+p('6,11 16,4 18,5 8,13','woodLight')+
      p('3,16 13,8 17,8 20,11 20,15 10,22 6,22 3,19','ink')+
      p('4,16 14,9 17,9 19,12 19,14 9,21 6,21 4,19','wood')+p('5,16 15,9 17,10 7,18','woodLight')+
      r(5,17,4,3,'gold')+r(6,18,2,1,'wood')+r(6,12,3,3,'gold')+r(7,13,1,1,'wood'),
    isotonic:()=>bottle('greenDark')+r(7,12,10,5,'cream')+r(10,13,4,3,'green')+r(11,12,2,5,'sage'),
    warmDrink:()=>steam()+r(16,9,6,9,'ink')+r(17,11,3,5,'clayLight')+r(17,12,2,3,'ink')+
      p('4,8 17,8 17,19 15,19 15,21 6,21 6,19 4,19','ink')+r(5,9,11,9,'red')+r(6,18,9,2,'redDark')+r(6,10,2,7,'clayLight')+r(5,9,11,2,'wood')+r(7,9,7,1,'gold'),
    soup:()=>steam()+p('2,9 22,9 22,15 20,15 20,18 17,18 17,21 7,21 7,18 4,18 4,15 2,15','ink')+
      r(3,10,18,4,'wood')+r(4,10,16,2,'gold')+r(6,11,2,1,'greenDark')+r(14,11,3,1,'clay')+
      p('4,14 20,14 20,16 17,16 17,19 7,19 7,16 4,16','clay')+r(5,14,14,1,'clayLight')+r(7,17,3,1,'clayLight')+r(8,20,8,1,'wood'),
    blanket:()=>p('4,4 18,4 18,6 21,6 21,19 19,19 19,21 4,21 4,19 2,19 2,7 4,7','ink')+
      r(4,5,14,14,'redDark')+r(3,8,17,10,'red')+r(5,5,2,14,'clayLight')+r(4,9,15,2,'clayLight')+r(4,15,15,2,'clayLight')+
      r(11,5,2,14,'gold')+r(17,7,2,12,'redDark')+r(5,19,13,1,'linen')+r(5,20,1,2,'gold')+r(9,20,1,2,'gold')+r(13,20,1,2,'gold'),
    gloves:()=>p('4,3 8,3 8,8 10,8 10,6 12,6 12,14 10,14 10,18 3,18 3,16 2,16 2,7 4,7','ink')+
      r(4,4,3,11,'green')+r(3,8,6,7,'green')+r(5,5,1,6,'sage')+r(9,8,2,5,'greenDark')+r(3,15,7,2,'goldDark')+
      p('15,5 19,5 19,9 21,9 21,18 19,18 19,21 12,21 12,16 10,16 10,10 12,10 12,12 14,12 14,7 15,7','ink')+
      r(15,6,3,11,'green')+r(13,13,7,5,'green')+r(15,7,1,6,'sage')+r(11,12,2,3,'greenDark')+r(13,18,6,2,'goldDark'),
    scarf:()=>p('6,3 18,3 18,4 20,4 20,10 16,10 16,21 10,21 10,16 5,16 5,7 4,7 4,4 6,4','ink')+
      r(6,4,12,5,'red')+r(5,5,14,2,'clayLight')+r(6,9,5,6,'redDark')+r(11,9,4,11,'red')+r(11,10,1,8,'clayLight')+
      r(11,17,4,1,'gold')+r(6,13,4,1,'gold')+r(11,20,1,2,'gold')+r(14,20,1,2,'gold')+r(6,15,1,2,'gold'),
    boots:()=>p('3,3 10,3 10,13 13,13 13,15 15,15 15,20 2,20 2,16 3,16','ink')+
      r(4,4,5,11,'wood')+r(4,4,2,10,'woodLight')+r(3,15,9,3,'wood')+r(3,18,11,1,'dark')+r(4,5,5,2,'goldDark')+
      p('12,5 19,5 19,15 22,15 22,17 23,17 23,22 11,22 11,18 12,18','ink')+
      r(13,6,5,11,'wood')+r(13,6,2,9,'woodLight')+r(12,17,9,3,'wood')+r(12,20,10,1,'dark')+r(13,7,5,2,'goldDark'),
    ice:()=>p('8,3 17,3 17,5 21,5 21,18 18,18 18,21 5,21 5,18 3,18 3,7 6,7 6,5 8,5','ink')+
      p('8,4 16,4 16,6 20,6 20,17 17,17 17,20 6,20 6,17 4,17 4,8 7,8 7,6 8,6','blue')+
      p('8,5 16,5 16,7 18,7 18,9 14,9 14,11 5,11 5,8 8,8','ice')+r(6,11,8,8,'blue')+r(6,11,2,7,'ice')+
      r(14,10,5,7,'blueDark')+r(8,6,7,1,'white')+r(9,13,3,1,'ice'),
    oasisWater:()=>bottle('blueDark')+r(9,13,6,2,'blue')+r(9,18,6,1,'ice')+p('11,8 13,8 13,10 15,10 15,12 9,12 9,10 11,10','sage')+r(11,10,2,2,'greenDark'),
    fertilizer:()=>p('7,3 17,3 17,5 16,5 16,7 18,7 18,9 20,9 20,20 18,20 18,22 6,22 6,20 4,20 4,9 6,9 6,7 8,7 8,5 7,5','ink')+
      r(8,4,8,2,'greenDark')+r(8,7,8,2,'wood')+r(6,9,12,11,'wood')+r(5,11,14,8,'wood')+r(6,10,2,9,'woodLight')+
      r(8,11,8,7,'gold')+r(11,12,2,5,'greenDark')+r(9,12,2,2,'green')+r(13,13,2,2,'green')+r(9,6,6,1,'ink'),
    hat:()=>p('8,3 16,3 16,5 18,5 18,11 21,11 21,13 23,13 23,17 20,17 20,19 4,19 4,17 1,17 1,13 3,13 3,11 6,11 6,5 8,5','ink')+
      r(8,4,8,9,'goldDark')+r(7,6,10,7,'gold')+r(8,5,3,6,'cream')+r(7,10,10,3,'wood')+
      r(4,12,16,5,'goldDark')+r(2,14,20,2,'gold')+r(5,17,14,1,'woodLight')+r(4,12,3,1,'cream'),
    light:()=>p('7,3 10,3 10,5 14,5 14,3 17,3 17,5 19,5 19,7 21,7 21,12 18,12 18,10 17,10 17,21 7,21 7,10 6,10 6,12 3,12 3,7 5,7 5,5 7,5','ink')+
      p('7,5 9,5 9,6 15,6 15,5 17,5 17,7 19,7 19,11 18,11 18,9 16,9 16,20 8,20 8,9 6,9 6,11 4,11 4,8 6,8 6,6 7,6','linen')+
      r(8,7,7,12,'cream')+r(8,7,2,8,'white')+r(10,5,4,2,'greenDark')+r(11,6,2,1,'sage')+r(14,9,2,3,'sage')+r(8,19,8,1,'greenDark'),
    mel:()=>jar('goldDark')+r(9,9,7,10,'gold')+r(10,12,5,5,'cream')+r(10,13,5,1,'dark')+r(10,15,5,1,'dark')+r(11,11,2,2,'ice'),
    fruta:()=>p('7,6 11,6 11,7 13,7 13,6 17,6 17,8 20,8 20,16 18,16 18,20 14,20 14,21 10,21 10,20 6,20 6,17 4,17 4,9 7,9','ink')+
      p('7,7 10,7 10,8 14,8 14,7 17,7 17,9 19,9 19,16 17,16 17,19 13,19 13,20 10,20 10,19 7,19 7,16 5,16 5,10 7,10','red')+
      r(7,9,3,6,'clayLight')+r(9,8,2,2,'cream')+r(12,3,2,5,'wood')+r(14,3,4,2,'green')+r(16,2,3,1,'sage')+r(13,18,4,1,'redDark'),
    leite:()=>r(9,1,6,4,'ink')+r(10,2,4,2,'red')+
      p('9,5 15,5 15,7 17,7 17,9 18,9 18,20 16,20 16,22 8,22 8,20 6,20 6,9 7,9 7,7 9,7','ink')+
      p('10,5 14,5 14,8 16,8 16,10 17,10 17,19 15,19 15,21 9,21 9,19 7,19 7,10 8,10 8,8 10,8','linen')+
      r(8,10,8,9,'cream')+r(8,10,2,8,'white')+r(10,13,5,4,'blueDark')+r(11,14,3,2,'blue'),
    ovos:()=>p('6,4 10,4 10,6 12,6 12,14 10,14 10,17 4,17 4,15 2,15 2,9 4,9 4,6 6,6','ink')+
      p('6,5 9,5 9,7 11,7 11,13 9,13 9,16 5,16 5,14 3,14 3,10 5,10 5,7 6,7','linen')+r(6,7,3,6,'cream')+r(5,9,2,3,'white')+
      p('15,6 19,6 19,8 21,8 21,11 23,11 23,18 21,18 21,21 14,21 14,19 12,19 12,11 14,11 14,8 15,8','ink')+
      p('15,7 18,7 18,9 20,9 20,12 22,12 22,17 20,17 20,20 15,20 15,18 13,18 13,12 15,12','goldDark')+r(15,10,5,8,'gold')+r(15,10,2,5,'cream'),
    compota:()=>jar('redDark')+r(9,10,7,9,'red')+r(10,13,5,4,'cream')+r(11,14,3,2,'redDark')+
      r(6,3,12,3,'greenDark')+r(7,3,10,2,'sage')+r(9,3,1,3,'cream')+r(13,3,1,3,'cream')+r(6,6,2,2,'green')+r(16,6,2,2,'green')
  });
  const keys=Object.freeze(['water','seed',...Object.keys(painters).filter(key=>key!=='water')]);
  const cache=new Map(),limit=keys.length+seeds.length-1;
  const fallback=svg(p('6,6 18,6 18,18 6,18','ink')+r(7,7,10,10,'wood')+r(8,8,8,2,'woodLight')+r(11,10,2,5,'linen'));
  function icon(key,seed){
    // Entradas externas nunca entram na marcação, nem criam chaves de cache.
    if(typeof key!=='string') return fallback;
    if(key.startsWith('seed_')){seed=key.slice(5);key='seed';}
    let cacheKey=key,paint;
    if(key==='seed'){
      const kind=typeof seed==='string'&&seeds.includes(seed)?seed:'tomato';
      cacheKey='seed:'+kind;paint=()=>seedPouch(kind);
    }else{
      if(!Object.prototype.hasOwnProperty.call(painters,key))return fallback;
      paint=painters[key];
    }
    if(!cache.has(cacheKey))cache.set(cacheKey,svg(paint()));
    return cache.get(cacheKey);
  }
  window.FarmItemArt=Object.freeze({
    icon,
    info:()=>({version:1,keys:keys.slice(),seedVariants:seeds.slice(),cacheSize:cache.size,cacheLimit:limit})
  });
})();
