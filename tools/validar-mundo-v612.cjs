/* Contratos físicos da expansão, executados nos fontes. As capturas e o
   percurso no navegador pertencem à validação integrada da versão. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),checks=[];
function check(name,condition,evidence){checks.push({name,pass:!!condition,...(evidence===undefined?{}:{evidence})});assert.ok(condition,name);}
const T={GRASS:0,GRASS2:1,PATH:2,FIELD:3,FENCE:4,WATER:5,FLOWER:6,STONE:7,WOOD:8,COBBLE:9,RIVER:10,SNOW:14,ICE:15,SNOWROCK:16,SAND:17,DUNE:18,CRACKED:19,OASIS:20};
let now=0,reduced=false,cold=false,created=0;const drawers={},tileDrawers={};
function ctx(canvas){return{canvas,ops:[],globalAlpha:1,imageSmoothingEnabled:false,save(){},restore(){},rotate(a){this.ops.push(['rotate',a]);},translate(x,y){this.ops.push(['translate',x,y]);},fillRect(x,y,w,h){this.ops.push(['rect',this.fillStyle,x,y,w,h]);},drawImage(...args){this.ops.push(['image',args[0].width,args[0].height,...args.slice(1)]);},beginPath(){this.ops.push(['begin']);},moveTo(x,y){this.ops.push(['move',x,y]);},lineTo(x,y){this.ops.push(['line',x,y]);},closePath(){},fill(){},stroke(){},ellipse(){}};}
function canvas(){created++;const c={width:0,height:0};c.getContext=()=>c.g||(c.g=ctx(c));return c;}
const main={MW:60,MH:124,map:Array.from({length:124},(_,y)=>Array.from({length:60},(_,x)=>y<28?T.SNOW:y>91?T.SAND:x===50?T.PATH:T.GRASS)),objects:[{type:'house',id:'existing_house',x:256,y:912,w:80,h:64},{type:'fx_berry',stateId:'old_berry',x:492,y:1036,_pickT:120}]};
const API={T,TS:16,rawScene:'main',scenes:{main},tileAt:(x,y)=>main.map[y]?.[x],isFrio:()=>cold,registerObjectDrawer:(id,fn)=>drawers[id]=fn,registerTileDrawer:(id,fn)=>tileDrawers[id]=fn,drawBaseTile(){}};
const sandbox={window:{__farmBiomes:[]},document:{createElement:canvas},performance:{now:()=>now},motionOk:()=>!reduced};vm.createContext(sandbox);
vm.runInContext('Math.random=()=>{throw Error("Sorteio não determinístico no mundo");};',sandbox);
for(const name of ['43-open-world.js','49-expedition-world.js']){vm.runInContext(fs.readFileSync(path.join(root,'src/modules',name),'utf8'),sandbox,{filename:name});sandbox.window.__farmBiomes.shift()(API);}
sandbox.window.FarmOpenWorld.expand(main);const beforeTiles=main.map.map(row=>row.slice()),beforeObjects=JSON.stringify(main.objects),oldCount=main.objects.length;
const world=sandbox.window.FarmExpeditionWorld;check('Base da expansão permanece96×124',main.MW===96&&main.MH===124);
world.expand(main);const added=main.objects.slice(oldCount),worldState=JSON.stringify({map:main.map,objects:main.objects}),count=main.objects.length;
check('Mapa cresce somente a leste até144×124',main.MW===144&&main.MH===124&&main.map.length===124&&main.map.every(row=>row.length===144));
check('Todos os11.904tiles anteriores permanecem byte a byte',JSON.stringify(main.map.map(row=>row.slice(0,96)))===JSON.stringify(beforeTiles));
check('Objetos antigos preservam ordem,IDs,coordenadas e estado',JSON.stringify(main.objects.slice(0,oldCount))===beforeObjects);
check('Expansão é idempotente e não duplica objetos',world.expand(main)===144&&main.objects.length===count&&worldState===JSON.stringify({map:main.map,objects:main.objects}));
check('Objetos novos recebem identidade mundial estável',added.length>30&&added.every(o=>o._expedition===true&&o._world===true&&typeof o.id==='string')&&new Set(added.map(o=>o.id)).size===added.length,{added:added.length});
check('Nove marcos têm centros eIDs contratados',world.landmarks.length===9&&JSON.stringify(world.landmarks.map(l=>[l.id,l.tileX,l.tileY]))===JSON.stringify([['exp_observatory',112,24],['exp_echo_stones',130,34],['exp_high_camp',111,43],['exp_windmill',111,58],['exp_seed_orchard',130,69],['exp_post_shelter',124,80],['exp_channel_lock',111,96],['exp_post_pier',130,104],['exp_tide_stones',119,116]])&&world.landmarks.every(l=>l.x===l.tileX*16+8&&l.y===l.tileY*16+8));
const wet=t=>[T.WATER,T.RIVER,T.OASIS].includes(t),inside=(b,x,y)=>b&&x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h;
function obstacle(o){if(o._expedition&&['expedition_landmark','expedition_scenery'].includes(o.type))return world.footprint(o);if(['tree','fx_fruittree'].includes(o.type))return{x:o.x-5,y:o.y-3,w:10,h:12};if(o.type==='mtn_pine')return{x:o.x-4,y:o.y-7,w:8,h:10};if(o.type==='mtn_rock')return{x:o.x-13,y:o.y-10,w:26,h:13};return null;}
const volumes=added.map(obstacle).filter(Boolean);
function blocked(x,y){const tx=Math.floor(x/16),ty=Math.floor(y/16);return x<8||y<8||x>main.MW*16-8||y>main.MH*16-8||main.map[ty]?.[tx]===undefined||wet(main.map[ty][tx])||volumes.some(b=>inside(b,x,y+7));}
function passage(a,b){const n=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/2);for(let i=1;i<=n;i++)if(blocked(a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n))return false;return true;}
const visited=new Set(['95,60']),pending=[[95,60]];for(let i=0;i<pending.length;i++){const [x,y]=pending[i];for(const [dx,dy]of [[1,0],[0,1],[-1,0],[0,-1]]){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(nx<95||nx>=144||ny<0||ny>=124||visited.has(key))continue;if(!passage([x*16+8,y*16+8],[nx*16+8,ny*16+8]))continue;visited.add(key);pending.push([nx,ny]);}}
check('BFS físico alcança os nove marcos pela entrada antiga95,60',world.landmarks.every(l=>visited.has(l.tileX+','+l.tileY)),{reachable:visited.size});
check('Aproximação sul e clareiras de dois tiles permanecem livres',world.landmarks.every(l=>visited.has(l.tileX+','+(l.tileY+1))&&passage([l.x,l.y+24],[l.x,l.y+8])&&!added.some(o=>o.type!=='expedition_landmark'&&Math.hypot(o.x-l.x,o.y-l.y)<48)));
const routeCells=new Set();for(const points of world.routes)for(let p=1;p<points.length;p++){const a=points[p-1],b=points[p],n=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));for(let i=0;i<=n;i++){const x=Math.round(a[0]+(b[0]-a[0])*i/n),y=Math.round(a[1]+(b[1]-a[1])*i/n);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(x+dx>=96)routeCells.add((x+dx)+','+(y+dy));}}
check('Circuitos de três tiles têm piso integralmente caminhável',[...routeCells].every(k=>{const [x,y]=k.split(',').map(Number);return[T.PATH,T.WOOD].includes(main.map[y]?.[x]);}),{tiles:routeCells.size});
check('Há travessias de madeira e recursos renováveis existentes',world.artInfo().bridgeSections>=3&&added.filter(o=>o.type==='fx_berry').length>=2&&added.filter(o=>o.type==='fx_fruittree').length>=2,world.artInfo());
check('Comporta fica sobre ramal real com água visível e deck caminhável',main.map[90][111]===T.RIVER&&main.map[102][119]===T.RIVER&&main.map[96][111]===T.WOOD&&visited.has('111,96'));
const coastWater=main.map.slice(90).reduce((sum,row)=>sum+row.slice(96).filter(wet).length,0),landCounts={};for(const y of[12,58,112])landCounts[y]=new Set(main.map[y].slice(104)).size;
check('Serra,campos e costa possuem materiais e água próprios',coastWater>100&&main.map[12].slice(104).includes(T.SNOW)&&main.map[58].slice(104).some(t=>t===T.GRASS||t===T.GRASS2)&&main.map[112].slice(104).includes(T.SAND),{coastWater,landCounts});
let maxSumError=0,maxXJump=0,maxYJump=0;const coefficients={forest:-.012,wetland:.025,highlands:-.035,meadow:.006,coast:.018},temp=(x,y)=>world.blendWeights(x,y,[[y<83?'forest':'wetland',1]]).reduce((v,[id,w])=>v+coefficients[id]*w,0);
for(let y=0;y<124;y+=.5)for(let x=96;x<144;x+=.5){const w=world.blendWeights(x,y,[[y<83?'forest':'wetland',1]]);maxSumError=Math.max(maxSumError,Math.abs(w.reduce((s,p)=>s+p[1],0)-1));if(x<143.5)maxXJump=Math.max(maxXJump,Math.abs(temp(x+.5,y)-temp(x,y)));if(y<122)maxYJump=Math.max(maxYJump,Math.abs(temp(110,y+.5)-temp(110,y)));}
check('Misturas térmicas somam1 e transições têm seis tiles',maxSumError<1e-9&&maxXJump<.006&&maxYJump<.006&&world.blendWeights(96,60,[['forest',1]])[0][1]===1,{maxSumError,maxXJump,maxYJump});
check('Registro térmico distingue três biomas sem substituir os antigos',Object.keys(world.regions).join(',')==='highlands,meadow,coast'&&world.regionAt(95,60)===null&&world.regionAt(112,24)==='highlands'&&world.regionAt(111,58)==='meadow'&&world.regionAt(130,104)==='coast');
const c=canvas(),g=c.getContext('2d');for(cold of [false,true])for(const o of added)drawers[o.type]?.(o,g);const cacheCount=world.artInfo().sprites,canvasCount=created;
for(let i=0;i<150;i++){now=i*4300;cold=!!(i%2);for(const o of added)drawers[o.type]?.(o,g);}
check('Sprites têm cache limitado sem chave por câmera ou tempo',created===canvasCount&&world.artInfo().sprites===cacheCount&&cacheCount<=world.artInfo().maxSprites,{sprites:cacheCount,canvases:created});
const mill=added.find(o=>o.landmarkId==='exp_windmill');function rotor(time,reduce){now=time;reduced=reduce;g.ops=[];drawers.expedition_landmark(mill,g);return JSON.stringify(g.ops);}
check('Moinho anima com eixo fixo e congela ao reduzir movimento',rotor(0,false)!==rotor(10000,false)&&rotor(0,true)===rotor(999999,true));
g.ops=[];world.drawGroundShadows(g,added,{dx:-1,a:.15});const morning=JSON.stringify(g.ops);g.ops=[];world.drawGroundShadows(g,added,{dx:1,a:.15});
check('Projeções dos marcos acompanham a direção do sol',g.ops.length>0&&morning!==JSON.stringify(g.ops));
g.ops=[];for(let y=0;y<124;y+=3)for(let x=96;x<144;x+=3)world.drawTerrainDetails(g,0,0,x,y,main.map[y][x],false);const paintOne=JSON.stringify(g.ops);g.ops=[];for(let y=0;y<124;y+=3)for(let x=96;x<144;x+=3)world.drawTerrainDetails(g,0,0,x,y,main.map[y][x],false);
check('Detalhes de chão são determinísticos e ficam no cache estático',paintOne===JSON.stringify(g.ops));
check('Drawer de madeira preserva escopo das colunas antigas',world.drawWoodTile(g,0,0,95,60)===false&&world.drawWoodTile(g,0,0,130,104)===true);
check('Desenho não modifica tiles,identidades ou progresso dos objetos',worldState===JSON.stringify({map:main.map,objects:main.objects}));
const report={pass:true,method:'VM dos fontes43/49, fixture representativa96×124; validação visual e save real no navegador separados',checks};const out=path.join(root,'analise/mundo-v612');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'vm.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
