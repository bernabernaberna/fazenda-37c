/* Catálogo finito e SVGs locais: não requer DOM, rede ou instalação. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'src/modules/45-item-art.js'),'utf8'),sandbox);
const art=sandbox.window.FarmItemArt;
assert.ok(art&&typeof art.icon==='function'&&typeof art.info==='function');
const keys=Array.from(art.info().keys),seeds=Array.from(art.info().seedVariants);
assert.equal(keys.length,26);assert.equal(new Set(keys).size,keys.length);assert.equal(seeds.length,7);
const icons=keys.filter(key=>key!=='seed').map(key=>[key,art.icon(key)]);
for(const seed of seeds)icons.push(['seed_'+seed,art.icon('seed',seed)]);
for(const [key,icon] of icons){
  assert.match(icon,/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 24 24"/);
  assert.match(icon,/aria-hidden="true" focusable="false" shape-rendering="crispEdges"/);
  assert.match(icon,/<\/svg>$/);
  assert.equal((icon.match(/<svg /g)||[]).length,1,key);
  assert.equal((icon.match(/<\/svg>/g)||[]).length,1,key);
  assert.doesNotMatch(icon,/<(?:script|style|text|path|image|use|foreignObject|filter|linearGradient)|(?:href|onload|onerror)=|undefined|NaN|url\(/i,key);
  const body=icon.replace(/^<svg[^>]+>/,'').replace(/<\/svg>$/,'');
  assert.equal(body.replace(/<(?:rect|polygon) [^>]+\/>/g,''),'',key);
  for(const rect of body.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" fill="#[0-9a-f]{6}"\/>/g)){
    const [x,y,w,h]=rect.slice(1).map(Number);
    assert.ok(w>0&&h>0&&x>=0&&y>=0&&x+w<=24&&y+h<=24,key+' retângulo fora da grade');
  }
  for(const polygon of body.matchAll(/<polygon points="([\d, ]+)" fill="#[0-9a-f]{6}"\/>/g)){
    assert.ok(polygon[1].split(' ').length>=3,key);
    for(const point of polygon[1].split(' ')){
      const [x,y]=point.split(',').map(Number);assert.ok(x>=0&&y>=0&&x<=24&&y<=24,key+' polígono fora da grade');
    }
  }
}
assert.equal(new Set(icons.map(([,icon])=>icon)).size,icons.length,'Cada item e semente tem arte distinta');
for(const seed of seeds)assert.equal(art.icon('seed_'+seed),art.icon('seed',seed));
const info=art.info();assert.equal(info.cacheSize,32);assert.equal(info.cacheLimit,32);
const fallback=art.icon(null);
for(const key of [undefined,null,1,NaN,Symbol('item'),{},[],true,'','__proto__','constructor','toString','<img onerror="alert(1)">'])assert.equal(art.icon(key),fallback);
for(let n=0;n<10000;n++){assert.equal(art.icon('missing_'+n),fallback);assert.equal(art.icon('seed','missing_'+n),art.icon('seed','tomato'));}
assert.equal(art.icon('seed',null),art.icon('seed','tomato'));
assert.equal(art.icon('seed',{}),art.icon('seed','tomato'));
assert.equal(art.info().cacheSize,32,'Entradas desconhecidas não aumentam o cache');
const exposed=art.info();exposed.keys.push('injected');exposed.seedVariants.push('injected');
assert.equal(art.info().keys.length,26);assert.equal(art.info().seedVariants.length,7);
console.log(JSON.stringify({ok:true,items:keys.length,variants:seeds.length,uniqueIcons:icons.length,cache:art.info().cacheSize,malformedInputs:10014},null,2));
