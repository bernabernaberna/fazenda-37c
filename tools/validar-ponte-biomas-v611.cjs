/* Contratos de desenho em VM. A inspeção de capturas e travessia por teclado
   pertencem à validação integrada; este teste não simula um navegador. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),checks=[];
const check=(name,condition,evidence)=>{checks.push({name,pass:!!condition,evidence});assert.ok(condition,name);};
const T=Object.fromEntries(['GRASS','GRASS2','FLOWER','PATH','FIELD','WATER','RIVER','OASIS','SNOW','ICE','SAND','DUNE','CRACKED','STONE','SNOWROCK','COBBLE','FENCE'].map((v,i)=>[v,i]));
const map=Array.from({length:124},()=>Array(96).fill(T.GRASS)),objects=[],drawers={},tiles={};
for(let y=0;y<124;y++)for(let x=45;x<=48;x++)map[y][x]=T.RIVER;
for(let y=58;y<=59;y++)for(let x=45;x<=47;x++)map[y][x]=T.PATH;
for(let y=101;y<109;y++)for(let x=29;x<39;x++)map[y][x]=T.OASIS;
let now=0,cold=false,reduced=false,created=0,detailCalls=0;
function context(canvas){return{canvas,ops:[],fillStyle:'#000',getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),
 fillRect(...a){this.ops.push(['rect',this.fillStyle,...a]);},drawImage(...a){this.ops.push(['image',...a]);},
 save(){},restore(){},beginPath(){},closePath(){},moveTo(){},lineTo(){},fill(){},stroke(){},ellipse(){},fillText(){}};}
function canvas(){created++;const c={width:0,height:0};c.getContext=()=>c.g||(c.g=context(c));return c;}
const API={T,TS:16,rawScene:'main',scenes:{main:{MW:96,MH:124,map,objects}},isFrio:()=>cold,
 tileAt:(x,y)=>map[y]?.[x],registerTileDrawer:(t,fn)=>tiles[t]=fn,registerObjectDrawer:(t,fn)=>drawers[t]=fn,
 registerInteraction(){},addObjectToMain:o=>objects.push(o),paintRect(){},drawBaseTile(){}};
const sandbox={window:{__farmBiomes:[]},document:{createElement:()=>canvas()},performance:{now:()=>now},motionOk:()=>!reduced,fields:[],timeOfDay:12};
vm.createContext(sandbox);
for(const name of ['27-world-art.js','29-world-depth.js','42-water-life.js']){
 vm.runInContext(fs.readFileSync(path.join(root,'src/modules',name),'utf8'),sandbox,{filename:name});
 sandbox.window.__farmBiomes.shift()(API);
}
const art=sandbox.window.FarmWorldArt,depth=sandbox.window.FarmWorldDepth,water=sandbox.window.FarmWaterLife;
sandbox.window.FarmOpenWorld={drawTerrainDetails:()=>detailCalls++};
const c=canvas();c.width=1536;c.height=1984;const g=c.getContext('2d');
const bridge={type:'bridge',x:720,y:936,w:48,h:16},physical=JSON.stringify({map,objects,bridge});
const geometry=art.bridgeGeometry(bridge),parts=depth.bridgeParts(bridge);
check('Deck cobre as duas linhas históricas da passagem',JSON.stringify(geometry)===JSON.stringify({x:720,y:928,w:48,h:32}),geometry);
check('Corrimãos somente nas bordas, sem objetos persistentes',parts.length===2&&parts[0].y===928&&parts[1].y===960&&parts.every(p=>p.type==='world_bridge_rail'&&!p.stateId),parts);
check('Profundidade permite pés entre corrimãos',depth.depth(parts[0])<depth.depth({type:'player',y:936})&&depth.depth(parts[1])>depth.depth({type:'player',y:936}));
check('Ponte e peças não acrescentam colisão',depth.footprint(bridge)===null&&parts.every(p=>depth.footprint(p)===null));
depth.drawBridgeBase(g,bridge);for(const p of parts)drawers[p.type](p,g);
check('Base e corrimãos são sprites em pixels inteiros',g.ops.length===3&&g.ops.every(o=>o[0]==='image'&&Number.isInteger(o[2])&&Number.isInteger(o[3])));
const deck=g.ops[0][1].g.ops;
check('Tábuas preenchem toda a profundidade caminhável',deck.some(o=>o[0]==='rect'&&o[4]===5&&o[5]===32));
for(cold of [false,true]){depth.drawBridgeBase(g,bridge);for(const p of parts)drawers[p.type](p,g);}
const cacheCount=art.state().objectSprites,canvases=created;
for(let n=0;n<80;n++){now=n*10000;cold=!!(n%2);depth.drawBridgeBase(g,bridge);for(const p of parts)drawers[p.type](p,g);}
check('Ponte não cria cache por hora ou câmera',art.state().objectSprites===cacheCount&&created===canvases,{sprites:cacheCount});
for(const type of [T.GRASS,T.GRASS2,T.PATH])tiles[type](g,0,0,66,80,false);
check('Detalhe da expansão só entra nos dois gramados',detailCalls===2,{calls:detailCalls});
const surface=(time,reduce=false,isCold=false)=>{now=time;reduced=reduce;cold=isCold;g.ops=[];water.drawSurface(g,0,0,1536,1984);return g.ops.map(o=>o.slice());};
const first=surface(0),second=surface(2200);
check('Corrente e reflexos têm animação',JSON.stringify(first)!==JSON.stringify(second)&&first.length>0);
check('Efeitos têm teto de96grupos em vista do mundo inteiro',water.info().groups<=96&&water.info().maxGroups===96,water.info());
check('Água desenha só dentro da máscara e em pixels inteiros',[...first,...second].every(o=>o[0]==='rect'&&o.slice(2).every(Number.isInteger)&&water.surfaceAt(o[2],o[3])));
check('Redução de movimento interrompe efeitos dinâmicos',surface(0,true).length===0&&surface(99999,true).length===0);
surface(8000,false,true);g.ops=[];water.drawSurface(g,420,1600,240,160);const frozen=g.ops;
check('No frio a água do rio não anima como líquido',frozen.length>0&&frozen.every(o=>map[Math.floor(o[3]/16)]?.[Math.floor(o[2]/16)]===T.OASIS));
for(let n=0;n<12;n++)surface(n*1700);
const maskCount=water.info().tileMasks;
for(let n=0;n<80;n++)surface(n*1700);
check('Cache de máscaras estabiliza sem chaves de tempo',water.info().tileMasks===maskCount&&water.info().tileMasks<=96*124,{tileMasks:maskCount});
check('Desenhos preservam mapa, objetos e coordenadas',physical===JSON.stringify({map,objects,bridge}));
const report={pass:true,method:'VM dos módulos fonte; não substitui validação visual/integrada',checks};
const out=path.join(root,'analise/ponte-biomas-v611');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'vm.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
