/* Regressão dos materiais e marcos. VM verifica contratos físicos e de desenho;
   as capturas do jogo completo são verificadas separadamente no navegador. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),backup=path.resolve(root,'../backups/antes-graficos-v613-20261020'),checks=[];
const check=(name,condition,evidence)=>{checks.push({name,pass:!!condition,...(evidence===undefined?{}:{evidence})});assert.ok(condition,name);};
const T={GRASS:0,GRASS2:1,PATH:2,FIELD:3,FENCE:4,WATER:5,FLOWER:6,STONE:7,WOOD:8,COBBLE:9,RIVER:10,SNOW:14,ICE:15,SNOWROCK:16,SAND:17,DUNE:18,CRACKED:19,OASIS:20};
function load(source){
 let now=0,reduced=false,cold=false,depth=0,created=0;const drawers={},tiles={},canvases=[];
 function context(canvas){return{canvas,ops:[],globalAlpha:1,fillStyle:'#000',imageSmoothingEnabled:false,
  save(){depth++;},restore(){assert.ok(depth>0,'restore sem save');depth--;},fillRect(...a){this.ops.push(['rect',this.fillStyle,...a]);},
  drawImage(c,...a){this.ops.push(['image',c.width,c.height,...a]);},beginPath(){this.ops.push(['begin']);},moveTo(...a){this.ops.push(['move',...a]);},lineTo(...a){this.ops.push(['line',...a]);},closePath(){},fill(){},stroke(){},ellipse(){}};}
 function canvas(){created++;const c={width:0,height:0};c.getContext=()=>c.g||(c.g=context(c));canvases.push(c);return c;}
 const main={MW:60,MH:124,map:Array.from({length:124},(_,y)=>Array.from({length:60},(_,x)=>y<28?T.SNOW:y>91?T.SAND:x===50?T.PATH:T.GRASS)),objects:[{type:'house',id:'old_house',x:256,y:912,w:80,h:64},{type:'fx_berry',stateId:'old_berry',x:492,y:1036,_pickT:120}]};
 const API={T,TS:16,rawScene:'main',scenes:{main},tileAt:(x,y)=>main.map[y]?.[x],isFrio:()=>cold,registerObjectDrawer:(id,fn)=>drawers[id]=fn,registerTileDrawer:(id,fn)=>tiles[id]=fn,drawBaseTile(){}};
 const sandbox={window:{__farmBiomes:[]},document:{createElement:canvas},performance:{now:()=>now},motionOk:()=>!reduced};vm.createContext(sandbox);
 vm.runInContext('Math.random=()=>{throw Error("Arte não determinística");};',sandbox);
 for(const name of ['43-open-world.js','49-expedition-world.js']){vm.runInContext(fs.readFileSync(path.join(source,'src/modules',name),'utf8'),sandbox,{filename:name});sandbox.window.__farmBiomes.shift()(API);}
 const forest=sandbox.window.FarmOpenWorld,world=sandbox.window.FarmExpeditionWorld;forest.expand(main);world.expand(main);
 return{main,API,forest,world,drawers,tiles,canvases,canvas,control(t=0,r=false,c=false){now=t;reduced=r;cold=c;},stats:()=>({depth,created})};
}
// Baselines calculadas com os fontes V612 antes da rodada gráfica. O teste
// normal permanece portátil; apenas --visual usa o backup para a prancha antiga.
const current=load(root),state=w=>JSON.stringify({map:w.main.map,objects:w.main.objects,dimensions:w.world.dimensions,regions:w.world.regions,landmarks:w.world.landmarks,routes:w.world.routes});
const sha=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
check('Os 17.856 tiles, objetos, IDs e estados permanecem iguais à V612',sha(state(current))==='df548ada74b05e9394e3a1dda7cd7f623811dd03dfdfb91e9a2b34d214bb531e',{sha256:sha(state(current))});
check('Volumes e profundidade dos lugares permanecem iguais à V612',sha(current.main.objects.map(o=>[current.world.footprint(o),current.world.depth(o)]))==='1dda568e7ae1b0bf526bcf7c1bbf0f57c773a559d9f80103fa2d889b3c77b963');
const weights=[];for(let x=60;x<144;x+=.5)for(let y=0;y<124;y+=.5){const base=[['farm',1]];weights.push([current.forest.blendWeights(x,y,base),current.world.blendWeights(x,y,base)]);}
check('Transições térmicas e regiões preservam exatamente a V612',sha(weights)==='a110e154235943510a92799214bc73d74baeb2256cd80c631e2e520e879b5d5b');
const g=current.canvas().getContext('2d'),physical=state(current),artObjects=current.main.objects.filter(o=>current.drawers[o.type]);
for(const cold of [false,true]){current.control(0,false,cold);for(const o of artObjects)current.drawers[o.type](o,g);}
const warm=current.stats().created,spriteCount=current.world.artInfo().sprites;
for(let i=0;i<150;i++){current.control(i*4300,false,!!(i%2));for(const o of artObjects)current.drawers[o.type]({...o,x:o.x+i/9,y:o.y+i/13},g);}
check('Sprites ficam estáveis ao alterar câmera, estação e tempo',current.stats().created===warm&&current.world.artInfo().sprites===spriteCount&&spriteCount<=40,{sprites:spriteCount,max:40});
check('Pintura de sprites e detalhes mantém pixels inteiros',current.canvases.every(c=>c.g.ops.filter(o=>o[0]==='rect').every(o=>o.slice(2).every(Number.isInteger))));
const mill=artObjects.find(o=>o.landmarkId==='exp_windmill'),rotor=(time,reduce)=>{current.control(time,reduce);g.ops=[];current.drawers.expedition_landmark(mill,g);return JSON.stringify(g.ops);};
check('Rotor anima sem subpixel e congela ao reduzir movimento',rotor(0,false)!==rotor(20000,false)&&rotor(0,true)===rotor(999999,true));
function details(){g.ops=[];for(let y=0;y<124;y++)for(let x=60;x<144;x++){const t=current.main.map[y][x];current.forest.drawTerrainDetails(g,0,0,x,y,t,false);current.world.drawTerrainDetails(g,0,0,x,y,t,false);}return JSON.stringify(g.ops);}
const one=details();current.control(999999,false,true);check('Folhas, musgo, flores e estratos têm posições estáveis',one===details());
check('Detalhes ficam no próprio tile sem invadir água vizinha',g.ops.every(o=>o[0]!=='rect'||(o[2]>=0&&o[3]>=0&&o[2]+o[4]<=16&&o[3]+o[5]<=16)));
g.ops=[];for(const t of [T.WATER,T.RIVER,T.OASIS,T.WOOD])for(let y=86;y<124;y++)for(let x=102;x<144;x++)current.world.drawTerrainDetails(g,0,0,x,y,t,false);
check('Detalhes de costa não pintam dentro da água ou dos decks',g.ops.length===0);
g.ops=[];for(let y=86;y<124;y++)for(let x=102;x<144;x++)current.world.drawTerrainDetails(g,0,0,x,y,T.SAND,false);
check('Umidade costeira usa fragmentos direcionais e elimina blocos de12px',g.ops.length>0&&g.ops.every(o=>o[0]!=='rect'||((o[4]===1||o[5]===1)&&Math.max(o[4],o[5])<=5)));
const woodBefore=JSON.stringify(current.world.artInfo());for(let y=0;y<124;y++)for(let x=60;x<144;x++)if(current.main.map[y][x]===T.WOOD)current.tiles[T.WOOD](g,0,0,x,y);
check('Madeira conserva seis travessias da expedição e não cria cache por tile',current.world.artInfo().bridgeSections===6&&JSON.stringify(current.world.artInfo())===woodBefore,current.world.artInfo());
check('Canvas sempre retorna ao estado inicial',current.stats().depth===0);
check('Desenhar não altera a física ou os saves',state(current)===physical);
const report={pass:true,method:'VM dos fontes43/49 comparada às baselines físicas V612, sem substituir inspeção visual',checks};
const out=path.join(root,'analise/lugares-art-v613');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'vm.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--visual'))(async()=>{
 const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:1080},deviceScaleFactor:1});
  for(const [label,source]of [['antes',backup],['depois',root]]){
   await page.setContent('<!doctype html><html lang="pt-BR"><body style="margin:0"><canvas id="sheet" width="1260" height="1060"></canvas></body></html>');
   const sources=['43-open-world.js','49-expedition-world.js'].map(n=>fs.readFileSync(path.join(source,'src/modules',n),'utf8'));
   const data=await page.evaluate(({sources,T,label})=>{
    window.__farmBiomes=[];window.motionOk=()=>false;const drawers={};
    const API={T,TS:16,rawScene:'main',tileAt:()=>T.GRASS,isFrio:()=>false,registerObjectDrawer:(id,fn)=>drawers[id]=fn,registerTileDrawer(){},drawBaseTile(){}};
    for(const code of sources){(0,eval)(code);window.__farmBiomes.shift()(API);}
    const c=document.getElementById('sheet'),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#223a32';g.fillRect(0,0,1260,1060);
    const entries=window.FarmExpeditionWorld.landmarks;
    entries.forEach((l,i)=>{
     const col=i%3,row=Math.floor(i/3),xx=col*420,yy=40+row*340;g.fillStyle=['#82947c','#9b9c65','#dfcca2'][row];g.fillRect(xx+2,yy+2,416,336);
     const sprite=document.createElement('canvas');sprite.width=112;sprite.height=104;const q=sprite.getContext('2d');q.imageSmoothingEnabled=false;
     drawers.expedition_landmark({type:'expedition_landmark',landmarkId:l.id,x:56,y:88},q);g.drawImage(sprite,xx+42,yy+22,336,312);
     g.fillStyle='#263b32';g.font='16px sans-serif';g.fillText(l.title,xx+16,yy+24);
    });g.fillStyle='#f1e5c0';g.font='20px sans-serif';g.fillText('Fazenda 37 °C — materiais dos lugares / '+label,18,28);return c.toDataURL('image/png').split(',')[1];
   },{sources,T,label});
   fs.writeFileSync(path.join(out,'lugares-'+label+'.png'),Buffer.from(data,'base64'));
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
