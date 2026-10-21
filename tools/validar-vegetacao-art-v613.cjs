/* Arte da vegetação sem rede: VM e raster local dos mesmos fillRect dos
   sprites. O atlas exige inspeção humana; não substitui a captura do jogo. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise','vegetacao-art-v613');fs.mkdirSync(out,{recursive:true});
const file=path.join(root,'src/modules/27-world-art.js'),source=fs.readFileSync(file,'utf8'),checks=[];
const hash=value=>crypto.createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
function check(name,value,evidence){assert.ok(value,name);checks.push({nome:name,passou:true,evidencia:evidence});}
class Canvas{
 constructor(w=1000,h=1000){this.width=w;this.height=h;this.ops=[];this.ctx={canvas:this,imageSmoothingEnabled:false,fillStyle:'#000000',fillRect:(x,y,w,h)=>{assert.ok([x,y,w,h].every(Number.isFinite),'Coordenadas finitas');assert.ok(w>=0&&h>=0,'Dimensões não negativas');this.ops.push({fill:this.ctx.fillStyle,x,y,w,h});},drawImage:(c,x,y,w=c.width,h=c.height)=>this.ops.push({canvas:c,x,y,w,h})};}
 getContext(){return this.ctx;}
}
const ids=['farm','mountain','desert','forest','wetland','highlands','meadow','coast'];let id='farm',cold=false,reduced=true,lit=1,now=0;
const T=Object.fromEntries(['GRASS','GRASS2','FLOWER','PATH','FIELD','WATER','RIVER','OASIS','SNOW','ICE','SAND','DUNE','CRACKED','STONE','SNOWROCK','COBBLE','FENCE'].map((v,i)=>[v,i]));
const drawers={},tileDrawers={},sandbox={window:{FarmBiomeArt:{profileAt:()=>({id,dominant:id})}},document:{createElement:()=>new Canvas()},performance:{now:()=>now},motionOk:()=>!reduced,sunLitDir:()=>lit,windStrength:1};
vm.runInNewContext(source,sandbox,{filename:file});
const API={T,TS:16,rawScene:'main',isFrio:()=>cold,tileAt:()=>T.GRASS,registerObjectDrawer:(k,f)=>drawers[k]=f,registerTileDrawer:(k,f)=>tileDrawers[k]=f,drawBaseTile:()=>{}};
sandbox.window.__farmBiomes[0](API);const art=sandbox.window.FarmWorldArt;
function draw(type,props={}){const c=new Canvas(512,512),o={type,x:96,y:100,shadeR:28,s:1,seed:1,...props},before=JSON.stringify(o);drawers[type](o,c.ctx);assert.equal(JSON.stringify(o),before,'Desenho não altera objetos');return c;}
function spriteSignature(c){return hash(c.ops.map(o=>o.canvas?{w:o.canvas.width,h:o.canvas.height,ops:o.canvas.ops}:o));}
const signatures={};
for(id of ids){cold=false;signatures[id]=spriteSignature(draw('tree'));}
check('Oito biomas têm copas com paletas próprias',new Set(Object.values(signatures)).size===8,signatures);
for(id of ids){cold=false;for(const type of ['tree','fx_fruittree','bush','fx_berry','flower','mtn_pine','des_palm','des_cactus'])draw(type);}
check('Todos os desenhos preservam objetos e dimensões finitas',true,{tipos:8,biomas:8});
id='farm';cold=false;const summer=spriteSignature(draw('tree'));cold=true;const winter=spriteSignature(draw('tree'));
check('Neve conserva arte própria sem perder o volume',summer!==winter,{summer,winter});
cold=false;lit=-1;const left=spriteSignature(draw('tree'));lit=1;const right=spriteSignature(draw('tree'));
check('Luz solar muda o ombro iluminado da copa',left!==right,{left,right});
id='highlands';const dryPine=spriteSignature(draw('mtn_pine'));id='mountain';const snowPine=spriteSignature(draw('mtn_pine'));
check('Serra tem pinheiros com líquen distintos da montanha nevada',dryPine!==snowPine,{dryPine,snowPine});
const cactusKinds=['pear','saguaro','barrel'].map(kind=>spriteSignature(draw('des_cactus',{kind})));
check('Três espécies de cacto mantêm silhuetas diferentes',new Set(cactusKinds).size===3,cactusKinds);
id='coast';reduced=true;now=0;const palm0=spriteSignature(draw('des_palm'));now=3125;const palm1=spriteSignature(draw('des_palm'));
check('Redução de movimento congela as palmas',palm0===palm1,palm0);
reduced=false;const moving=new Set();for(now=0;now<2500;now+=180)moving.add(spriteSignature(draw('des_palm')));
check('Palmas usam três fases finitas de folhagem',moving.size===3,moving.size);
reduced=true;now=0;const tree0=spriteSignature(draw('tree'));now=9961;const tree1=spriteSignature(draw('tree'));
check('Redução de movimento congela as copas',tree0===tree1,tree0);
const snapshot=art.state();snapshot.atmosphere.anchors.push({x:999,y:999});check('Snapshot não expõe as âncoras internas',art.state().atmosphere.anchors.length===0);
id='farm';const farmTree=spriteSignature(draw('tree'));id='forest';API.rawScene='greenhouse';const greenhouseTree=spriteSignature(draw('tree'));API.rawScene='main';
check('Árvores da estufa usam o perfil da fazenda nas coordenadas locais',farmTree===greenhouseTree,{farmTree,greenhouseTree});
function atmosphere(camX,camY,w,h,reduce){const c=new Canvas();art.drawAtmosphere(c.ctx,{camX,camY,visW:w,visH:h,reducedMotion:reduce,windStrength:1});return{canvas:c,state:art.state().atmosphere};}
for(const [w,h]of [[640,400],[512,320],[195,422],[8000,8000]]){const a=atmosphere(0,0,w,h,true);check('Atmosfera tem no máximo 40 grupos em '+w+'×'+h,a.state.count<=40,{count:a.state.count,stride:a.state.cellStride});}
const a=atmosphere(0,0,640,400,true),b=atmosphere(5,3,640,400,true),keys=v=>v.state.anchors.map(p=>p.x+','+p.y),ka=new Set(keys(a)),kb=new Set(keys(b));
check('Mover a câmera preserva âncoras em sua região comum',a.state.anchors.filter(p=>p.x>=5&&p.y>=3&&p.x+5<=640&&p.y+4<=400).every(p=>kb.has(p.x+','+p.y))&&b.state.anchors.filter(p=>p.x+5<=640&&p.y+4<=400).every(p=>ka.has(p.x+','+p.y)),{before:keys(a),after:keys(b)});
now=10000;const frozen0=atmosphere(0,0,640,400,true);now=20000;const frozen1=atmosphere(0,0,640,400,true);
check('Atmosfera fica imóvel com redução de movimento',spriteSignature(frozen0.canvas)===spriteSignature(frozen1.canvas));
reduced=false;
function warm(){for(id of ids)for(cold of [false,true])for(lit of [-1,1])for(let n=0;n<72;n++){now=n*180;const p={x:120+n*3,y:150+(n%11)*5,kind:['pear','saguaro','barrel'][n%3],s:n%2?1:1.2};for(const type of ['tree','fx_fruittree','bush','flower','mtn_pine','des_palm','des_cactus'])draw(type,p);}}
warm();const cache1=art.state();warm();const cache2=art.state();
check('Revisitar os biomas não cresce o cache de sprites',cache1.objectSprites===cache2.objectSprites&&cache1.cacheBytes===cache2.cacheBytes,{first:cache1.objectSprites,second:cache2.objectSprites,bytes:cache2.cacheBytes});
check('Catálogo de vegetação é finito e abaixo de 800 sprites',cache2.objectSprites<800,cache2.objectSprites);
const shadowSource=fs.readFileSync(path.join(root,'src/modules/29-world-depth.js'),'utf8');
check('Sombras térmicas continuam no módulo de profundidade',shadowSource.includes('const sh=treeShadowEllipse(o,sun);')&&!source.includes('shadeR=')&&!source.includes('treeShadowEllipse('));
function color(s){if(s.startsWith('#')){const v=s.slice(1);return[v.length===3?parseInt(v[0]+v[0],16):parseInt(v.slice(0,2),16),v.length===3?parseInt(v[1]+v[1],16):parseInt(v.slice(2,4),16),v.length===3?parseInt(v[2]+v[2],16):parseInt(v.slice(4,6),16),255];}const v=s.match(/[\d.]+/g).map(Number);return[v[0],v[1],v[2],Math.round((v[3]??1)*255)];}
function raster(c){if(c.raster)return c.raster;const data=Buffer.alloc(c.width*c.height*4);for(const o of c.ops){const src=o.canvas?raster(o.canvas):null,rgba=src?null:color(o.fill);for(let y=Math.max(0,Math.floor(o.y));y<Math.min(c.height,Math.ceil(o.y+o.h));y++)for(let x=Math.max(0,Math.floor(o.x));x<Math.min(c.width,Math.ceil(o.x+o.w));x++){const i=(y*c.width+x)*4,s=src?((Math.floor((y-o.y)*o.canvas.height/o.h)*o.canvas.width+Math.floor((x-o.x)*o.canvas.width/o.w))*4):0,r=src?src.subarray(s,s+4):rgba,a=r[3]/255;if(a===0)continue;const da=data[i+3]/255,oa=a+da*(1-a);for(let k=0;k<3;k++)data[i+k]=Math.round((r[k]*a+data[i+k]*da*(1-a))/oa);data[i+3]=Math.round(oa*255);}}c.raster=data;return data;}
function png(c){const table=Array.from({length:256},(_,i)=>{for(let n=0;n<8;n++)i=i&1?0xedb88320^(i>>>1):i>>>1;return i>>>0;}),crc=b=>{let n=0xffffffff;for(const v of b)n=table[(n^v)&255]^(n>>>8);return(n^0xffffffff)>>>0;},chunk=(name,body)=>{const kind=Buffer.from(name),len=Buffer.alloc(4),sum=Buffer.alloc(4);len.writeUInt32BE(body.length);sum.writeUInt32BE(crc(Buffer.concat([kind,body])));return Buffer.concat([len,kind,body,sum]);},head=Buffer.alloc(13);head.writeUInt32BE(c.width);head.writeUInt32BE(c.height,4);head[8]=8;head[9]=6;const data=raster(c),rows=[];for(let y=0;y<c.height;y++)rows.push(Buffer.from([0]),data.subarray(y*c.width*4,(y+1)*c.width*4));return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',zlib.deflateSync(Buffer.concat(rows))),chunk('IEND',Buffer.alloc(0))]);}
const atlas=new Canvas(640,384),grounds=['#6d8155','#a5b6a7','#c9af78','#496b52','#78805a','#7a8b77','#9b9c65','#9d9f74'];cold=false;reduced=true;lit=-1;now=0;
for(let i=0;i<ids.length;i++){id=ids[i];const x=(i%4)*160,y=Math.floor(i/4)*192;atlas.ctx.fillStyle=grounds[i];atlas.ctx.fillRect(x,y,158,190);const objs=[['tree',{x:x+47,y:y+78}],['bush',{x:x+113,y:y+75}],['mtn_pine',{x:x+43,y:y+173}],['des_cactus',{x:x+100,y:y+172,kind:'saguaro'}],['des_palm',{x:x+130,y:y+173}]];for(const[type,o]of objs)drawers[type]({type,shadeR:28,s:1,seed:1,...o},atlas.ctx);}
fs.writeFileSync(path.join(out,'atlas.png'),png(atlas));
const report={geradoEm:new Date().toISOString(),sourceSHA256:hash(source),checagens:checks,atlas:{file:path.join(out,'atlas.png'),ordem:ids,nota:'Quatro cartões por linha; todos os tipos são exibidos para comparar paletas. A distribuição real de espécies continua a do mapa.'},cache:cache2};fs.writeFileSync(path.join(out,'vm.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({ok:true,checks:checks.length,sourceSHA256:report.sourceSHA256,sprites:cache2.objectSprites,atlas:report.atlas.file}));
