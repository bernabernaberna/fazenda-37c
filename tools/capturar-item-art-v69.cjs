/* Prancha de inspeção dos SVGs carregados pelo jogo gerado, sem alterar a UI. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'analise','itens-v69');
fs.mkdirSync(output,{recursive:true});
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const gameHash=sha256(fs.readFileSync(path.join(root,'jogo.html')));
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:780},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    const response=await page.goto((process.env.FARM37_BASE||'http://127.0.0.1:8766')+'/jogo.html?v='+gameHash.slice(0,12),{waitUntil:'load'});
    if(!response||sha256(await response.body())!==gameHash)throw Error('Servidor não entregou o jogo atual.');
    await page.waitForFunction(()=>!!window.FarmItemArt);
    const info=await page.evaluate(()=>{
      const info=FarmItemArt.info(),items=info.keys.filter(key=>key!=='seed').map(key=>({key,svg:FarmItemArt.icon(key)}));
      for(const seed of info.seedVariants)items.push({key:'seed_'+seed,svg:FarmItemArt.icon('seed',seed)});
      const panel=document.createElement('section');panel.id='item-art-qa';
      panel.style.cssText='position:fixed;left:0;top:0;z-index:2147483647;width:1216px;padding:24px;box-sizing:border-box;background:#263c36;color:#eee2b8;font:14px monospace;';
      panel.innerHTML='<h1 style="font:20px monospace;margin:0 0 16px">Fazenda 37 °C · objetos originais · 24 / 48 px</h1><div style="display:grid;grid-template-columns:repeat(8,1fr);gap:10px">'+items.map(item=>'<div style="border:1px solid #66805a;padding:10px;min-height:116px;box-sizing:border-box"><div style="display:flex;align-items:center;justify-content:center;gap:12px;height:66px"><span style="display:block;width:24px;height:24px">'+item.svg+'</span><span style="display:block;width:48px;height:48px;background:#c9bc91">'+item.svg.replace('width="24" height="24"','width="48" height="48"')+'</span></div><div style="font-size:12px;text-align:center;margin-top:8px;overflow-wrap:anywhere">'+item.key+'</div></div>').join('')+'</div>';
      document.body.appendChild(panel);
      for(const svg of panel.querySelectorAll('svg')){
        const documentSVG=new DOMParser().parseFromString(svg.outerHTML,'image/svg+xml');
        if(documentSVG.querySelector('parsererror'))throw Error('SVG inválido no catálogo');
      }
      return FarmItemArt.info();
    });
    await page.locator('#item-art-qa').screenshot({path:path.join(output,'catalogo-24-48.png')});
    if(errors.length)throw Error(errors.join('\n'));
    const result={ok:true,gameSha256:gameHash,itemArtSha256:sha256(fs.readFileSync(path.join(root,'src/modules/45-item-art.js'))),info,capture:path.join(output,'catalogo-24-48.png'),browser:'Microsoft Edge headless'};
    fs.writeFileSync(path.join(output,'arte.json'),JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify(result,null,2));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
