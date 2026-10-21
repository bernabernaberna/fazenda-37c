/* Contratos dos materiais estáticos. A estética e o desempenho do quadro
   continuam sendo verificados nas capturas e no navegador integrado. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=path.join(root,'src/modules/51-biome-art.js'),checks=[];
const check=(name,run)=>{const evidence=run();checks.push({name,pass:true,evidence});};
const T={GRASS:0,GRASS2:1,PATH:2,FIELD:3,FENCE:4,WATER:5,FLOWER:6,STONE:7,WOOD:8,HAY:9,RIVER:10,GLASSFLOOR:11,RUG:12,COBBLE:13,SNOW:14,ICE:15,SNOWROCK:16,SAND:17,DUNE:18,CRACKED:19,OASIS:20};
const map=Array.from({length:124},()=>Array(144).fill(T.GRASS)),objects=[{type:'tree',x:200,y:900,shadeR:28}],API={T,TS:16,rawScene:'main',scenes:{main:{map,objects}}};
const untouched=JSON.stringify(API),context={window:{__farmBiomes:[]},Math,Number,Map,Set,Object,now:0,motionOk:()=>true};
vm.createContext(context);vm.runInContext(fs.readFileSync(source,'utf8'),context,{filename:source});context.window.__farmBiomes.shift()(API);
const art=context.window.FarmBiomeArt,copy=x=>JSON.parse(JSON.stringify(x)),RGB=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
const sites={farm:[25,60],mountain:[25,15],desert:[25,105],forest:[78,55],wetland:[78,105],highlands:[121,30],meadow:[121,65],coast:[121,105]};
check('Oito habitats têm identidade explícita e pesos normalizados',()=>{
 const colors={};for(const [id,[x,y]]of Object.entries(sites)){
  const p=art.profileAt(x*16,y*16);assert.equal(p.id,id);assert.equal(p.dominant,id);assert.equal(p.weights[id],1);assert.ok(Math.abs(Object.values(p.weights).reduce((s,n)=>s+n,0)-1)<1e-12);
  colors[id]=art.colorAt('grass',false,x*16,y*16,'#000000');assert.match(colors[id],/^#[0-9a-f]{6}$/);
 }assert.equal(new Set(Object.values(colors)).size,8);return colors;
});
check('Leitura nativa recebe coordenadas fracionárias e prevalece sobre o fallback',()=>{
 let args;context.regionWeights=(y,x)=>{args=[y,x];return[['forest',2],['coast',2],['missing',9],['farm',-1],['wetland',NaN]];};
 const p=art.profileAt(17.5*16,44.25*16);assert.deepEqual(args,[44.25,17.5]);assert.equal(p.weights.forest,.5);assert.equal(p.weights.coast,.5);assert.equal(p.weights.farm,0);assert.equal(p.id,'forest');return copy(p);
});
check('Fontes de região inválidas não geram cores nem pesos inválidos',()=>{
 context.regionWeights=()=>[['unknown',1],['farm',NaN]];const p=art.profileAt(200,300);assert.equal(p.id,'farm');assert.equal(p.weights.farm,1);
 assert.equal(art.colorAt('unknown',false,0,0,'#123456'),'#123456');assert.equal(art.colorAt('grass',false,NaN,0,'#123456'),'#123456');
 delete context.regionWeights;return{fallback:'farm',invalidMaterialPreservesBase:true};
});
check('Transições norte/sul e leste/oeste são contínuas em amostras de quatro pixels',()=>{
 let max=0,pairs=0;const inspect=(x0,y0,dx,dy,n)=>{let previous;for(let i=0;i<=n;i++){
  const color=RGB(art.colorAt('grass',false,x0+dx*i,y0+dy*i,'#000000'));
  if(previous){for(let c=0;c<3;c++)max=Math.max(max,Math.abs(color[c]-previous[c]));pairs++;}previous=color;
 }};
 inspect(25*16,30*16,0,4,64);inspect(25*16,79*16,0,4,64);inspect(57*16,60*16,4,0,64);inspect(93*16,60*16,4,0,64);inspect(121*16,42*16,0,4,64);inspect(121*16,80*16,0,4,64);
 assert.ok(max<=7,'Um único passo não pode revelar um degrau de paleta: '+max);return{pairs,maxChannelStep:max};
});
check('Cache é invalidado quando muda a função ou a composição de regiões',()=>{
 context.regionWeights=()=>[['farm',1]];const a=art.colorAt('grass',false,1100,1000,'#000000');assert.ok(art.info().profileEntries>0);
 context.regionWeights=()=>[['coast',1]];const b=art.colorAt('grass',false,1100,1000,'#000000');assert.notEqual(a,b);
 context.window.FarmExpeditionWorld={};assert.equal(art.info().profileEntries,0);delete context.regionWeights;return{before:a,after:b};
});
check('Cache espacial possui teto e mantém o resultado depois de descarte',()=>{
 const first=art.colorAt('snow',false,480,240,'#000000');
 for(let n=0;n<5000;n++)art.colorAt('sand',false,n*64,12000+(n%31)*64,'#000000');
 const info=art.info();assert.ok(info.profileEntries<=info.maxProfiles);assert.equal(info.maxProfiles,4096);assert.equal(first,art.colorAt('snow',false,480,240,'#000000'));return info;
});
check('Materiais, estação fria e oásis mantêm resultados determinísticos',()=>{
 const kinds=['grass','sand','snow','ice','water','oasis','rock','snowrock','cracked','path','field'],samples=[];
 for(const [id,[x,y]]of Object.entries(sites))for(const cold of [false,true])for(const kind of kinds){const a=art.colorAt(kind,cold,x*16,y*16,'#ff00ff');const b=art.colorAt(kind,cold,x*16,y*16,'#ff00ff');assert.equal(a,b);assert.match(a,/^#[0-9a-f]{6}$/);samples.push([id,kind,cold,a]);}
 assert.notEqual(art.colorAt('grass',false,400,960),art.colorAt('grass',true,400,960));assert.notEqual(art.colorAt('water',false,400,1680),art.colorAt('oasis',false,400,1680));return{samples:samples.length};
});
const g={fillStyle:'',ops:[],fillRect(...args){this.ops.push([this.fillStyle,...args]);}};
check('Detalhes são estáticos, orgânicos, em pixels inteiros e dentro do tile',()=>{
 let total=0;const signatures={};for(const [id,[tx,ty]]of Object.entries(sites)){
  const start=g.ops.length;for(let y=ty-5;y<=ty+5;y++)for(let x=tx-5;x<=tx+5;x++)for(const t of [T.GRASS,T.GRASS2,T.SNOW,T.SAND,T.STONE,T.ICE]){
   const before=g.ops.length;art.drawGroundDetails(g,x*16,y*16,x,y,t,false);
   for(const op of g.ops.slice(before)){assert.ok(op.slice(1).every(Number.isInteger));assert.ok(op[1]>=x*16&&op[2]>=y*16&&op[1]+op[3]<=(x+1)*16&&op[2]+op[4]<=(y+1)*16);}
  }const ops=g.ops.slice(start);assert.ok(ops.length>0,id+' tem detalhes visíveis');total+=ops.length;signatures[id]=crypto.createHash('sha1').update(JSON.stringify(ops)).digest('hex');
 }assert.equal(new Set(Object.values(signatures)).size,8);
 const draw=()=>{g.ops=[];for(let y=45;y<55;y++)for(let x=115;x<125;x++)art.drawGroundDetails(g,x*16,y*16,x,y,T.GRASS,false);return JSON.stringify(g.ops);};
 const before=draw();context.now=900000;context.motionOk=()=>false;assert.equal(before,draw());return{operations:total,signatures};
});
check('Água, caminhos, cercas e interiores não recebem objetos nem detalhes sobrepostos',()=>{
 g.ops=[];for(const t of [T.WATER,T.RIVER,T.OASIS,T.PATH,T.FIELD,T.WOOD,T.FENCE])art.drawGroundDetails(g,1600,1600,100,100,t,false);assert.equal(g.ops.length,0);
 API.rawScene='house';for(let n=0;n<100;n++)art.drawGroundDetails(g,1600,1600,100,n,T.GRASS,false);assert.equal(g.ops.length,0);API.rawScene='main';
 assert.equal(JSON.stringify(API),untouched);return{simulationUnchanged:true};
});
check('Cores do minimapa seguem cada material e preservam pisos e pontes',()=>{
 for(const [id,[x,y]]of Object.entries(sites))assert.equal(art.mapColor(T.GRASS,false,x,y,'#000000'),art.colorAt('grass',false,x*16+8,y*16+8,'#000000'));
 for(const tile of [T.PATH,T.FIELD,T.WOOD,T.COBBLE,T.FENCE])assert.equal(art.mapColor(tile,false,100,100,'#123456'),'#123456');return{biomes:8};
});
const report={pass:true,method:'VM dos materiais fonte; não substitui inspeção visual e navegador',sourceSHA256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),checks};
const out=path.join(root,'analise/biome-art-v613');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'vm.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
