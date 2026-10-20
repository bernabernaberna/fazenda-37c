/* Mochila: inspecionar é gratuito; usar e organizar exigem uma ação explícita.
   Estoque da fazenda e inventário conservam suas origens e seus saves. */
(function(){
 'use strict';
 let model=null,root=null,ready=false,selected='water',category='all',query='',previousFocus=null;
 const categories={all:'Tudo',seeds:'Sementes',supplies:'Provisões',gear:'Equipamento',materials:'Materiais',stock:'Depósito'};
 const meta={
  water:['supplies','Água do cantil','Recupera até 25 de hidratação.','Encha o cantil no poço da fazenda.','Beber'],
  ice:['supplies','Gelo da montanha','Resfria até 0,5 °C, sem baixar de 37,2 °C.','Colete com E junto ao lago congelado. Capacidade: 3.','Usar gelo'],
  oasisWater:['supplies','Água do oásis','Recupera até 35 de hidratação e 5 de energia.','Colete com E na margem do oásis. Capacidade: 3.','Beber'],
  towel:['supplies','Toalha gelada','Refresca o corpo e mantém um efeito de 8 segundos.','Compre na loja da fazenda.','Usar toalha'],
  isotonic:['supplies','Isotônico','Recupera até 18 de hidratação e 18 de energia.','Compre na loja da fazenda.','Beber'],
  warmDrink:['supplies','Bebida quente','Aquece até 0,7 °C e recupera até 10 de energia.','Compre na loja ou prepare chá com mel na cozinha recuperada.','Beber'],
  soup:['supplies','Sopa da horta','Aquece até 0,9 °C, recupera até 12 de energia e 6 de hidratação.','Prepare com vegetais e lenha na cozinha, ou compre na loja.','Comer'],
  watercan:['gear','Regador','Ferramenta permanente. F rega o canteiro próximo.','Acompanha você desde o começo. Não gasta água do cantil.',''],
  coat:['gear','Casaco','Reduz a perda de calor quando equipado.','Faça um casaco no tear com 2 lãs.','Equipar'],
  blanket:['gear','Cobertor','Melhora o descanso no frio quando equipado.','Prepare na oficina recuperada com 2 lãs.','Equipar'],
  gloves:['gear','Luvas de trabalho','Reduzem a perda de calor nas tarefas.','Prepare na oficina recuperada com 1 lã.','Equipar'],
  scarf:['gear','Cachecol','Protege o pescoço e reduz a perda de calor.','Compre na loja da fazenda.','Equipar'],
  boots:['gear','Botas térmicas','Melhoram a locomoção no inverno.','Compre na loja da fazenda.','Equipar'],
  hat:['gear','Chapéu','Proteção permanente contra o sol.','Adquirido na loja; sua proteção fica sempre ativa.',''],
  light:['gear','Roupa leve','Ajuda o corpo a perder calor.','Adquirida na loja; sua proteção fica sempre ativa.',''],
  veg:['materials','Vegetais da horta','Servem para cozinhar, fazer ração, adubo e entregar encomendas.','Colha canteiros maduros com C. Também podem ser vendidos na caixa de venda.',''],
  hay:['materials','Feno','Alimenta os animais e participa de receitas e encomendas.','Cultive forragem ou prepare ração. Aproxime-se do animal e pressione E.',''],
  wool:['materials','Lã','Material para casaco, luvas, cobertor e encomendas.','Cuide das ovelhas e recolha a lã com E.',''],
  wood:['materials','Lenha','Serve para cozinhar, construir e manter a fogueira acesa.','Recolha troncos caídos com E. Use E junto à fogueira para abastecer.',''],
  fertilizer:['materials','Adubo','Acelera em 50% o crescimento da planta enquanto ela está regada.','Transforme vegetais na composteira da estufa. Use uma vez por planta próxima.','Adubar canteiro']
 };
 const flags={coat:'coatEquipped',blanket:'blanketEquipped',gloves:'glovesEquipped',scarf:'scarf',boots:'boots',hat:'hat',light:'light'};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const art=(key,seed)=>window.FarmItemArt?.icon(key,seed)||'';
 function entries(){
  const p=model.player,inv=p.inv||{},rows=[];
  for(const [key,m]of Object.entries(meta)){
   const permanent=key==='watercan'||key==='hat'||key==='light';
   const amount=key==='watercan'?1:(key==='hat'||key==='light')?Number(!!p[key]):Math.max(0,Number(inv[key])||0);
   rows.push({key,group:m[0],name:m[1],description:m[2],source:m[3],action:m[4],amount,permanent,equipped:!!(flags[key]&&p[flags[key]]),quick:!!model.definitions[key]});
  }
  for(const [id,s]of Object.entries(model.seedTypes))rows.push({key:'seed_'+id,seed:id,group:'seeds',name:'Sementes de '+s.name.toLowerCase(),description:(s.product==='hay'?'Produz feno para a criação.':'Produz vegetais para receitas e entregas.')+(s.coldHardy?' Cresce melhor no frio.':s.heatSensitive?' Cresce mais devagar no calor.':s.longGrow?' Precisa de mais tempo para amadurecer.':''),source:'Compre na loja. Selecione esta semente e use Q perto de um canteiro vazio.',action:'Selecionar para plantar',amount:Math.max(0,Number(inv.seeds?.[id])||0),equipped:p.selectedSeed===id,quick:true});
  for(const s of model.stockItems||[])rows.push({key:'stock_'+s.id,stockId:s.id,group:'stock',name:s.name,description:s.description,source:'Guardado no depósito da fazenda. A quantidade é a mesma do Caderno.',action:s.id==='compota'?'Comer compota':'Ver receitas',amount:s.amount,canConsume:s.canConsume,disabledReason:s.disabledReason,quick:false});
  return rows;
 }
 function mount(){
  if(ready)return;root=document.getElementById('inventoryPanel');if(!root)return;
  root.classList.add('inv-v69');root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','bagTitle');
  root.querySelector('.invWindow').innerHTML=`<header class="bagHeader"><div><span class="bagEyebrow">PREPARAR A PRÓXIMA CAMINHADA</span><h2 id="bagTitle">Sua mochila</h2></div><button type="button" data-bag-command="close" class="bagClose" aria-label="Fechar mochila">Fechar <kbd>Esc</kbd></button></header>
   <div class="bagQuickHeading"><strong>À mão <small>atalhos 1–6</small></strong><span id="invInfo"></span></div><div id="fullHotbarGrid" aria-label="Seis atalhos"></div>
   <div class="bagToolbar"><nav id="bagCategories" aria-label="Categorias de itens"></nav><label class="bagSearch"><span class="bagSr">Buscar item</span><input id="bagSearch" type="search" autocomplete="off" placeholder="Buscar item…"></label></div>
   <div class="bagWorkspace"><section class="bagContents" aria-label="Itens"><div class="bagListHeading"><span id="bagResultCount"></span><span>Selecione para conhecer</span></div><div id="bagGrid"></div><p id="bagEmpty" hidden>Nenhum item encontrado. Experimente outro nome ou categoria.</p></section><aside id="bagDetail" aria-label="Detalhes do item"></aside></div>
   <footer class="bagFooter"><span>O vale espera enquanto você organiza a mochila.</span><span id="bagMoney"></span></footer><p id="bagNotice" class="bagSr" aria-live="polite"></p>`;
  root.addEventListener('click',e=>{
   const b=e.target.closest('button');if(!b||!root.contains(b))return;
   if(b.dataset.bagCommand==='close')return model.close();
   if(b.dataset.bagCategory){category=b.dataset.bagCategory;paint();return;}
   if(b.dataset.bagItem){selected=b.dataset.bagItem;paint();if(innerWidth<=520)root.querySelector('#bagDetail').scrollIntoView({block:'start'});return;}
   if(b.dataset.bagQuick!==undefined){model.setEdit(Number(b.dataset.bagQuick));return;}
   if(b.dataset.bagCommand==='cancel'){model.setEdit(null);return;}
   const row=entries().find(r=>r.key===selected);if(!row)return;
   if(b.dataset.bagCommand==='assign'){if(row.quick&&model.editSlot!==null)model.assign(row.seed?'seed':row.key,row.seed||'');return;}
   if(b.dataset.bagCommand==='use'){
    if(row.seed)model.selectSeed(row.seed);
    else if(row.stockId==='compota')model.consume(row.stockId);
    else if(row.stockId)model.recipes();
    else model.use(row.key);
   }
  });
  root.querySelector('#bagSearch').addEventListener('input',e=>{query=e.target.value;paint();});
  window.addEventListener('keydown',e=>{
   if(!root.classList.contains('show'))return;
   const typing=e.target instanceof HTMLInputElement;
   if(e.key==='Escape'||(!typing&&e.key.toLowerCase()==='i')){e.preventDefault();e.stopImmediatePropagation();model.close();return;}
   if(e.key==='Tab'){
    const nodes=[...root.querySelectorAll('button:not(:disabled),input')].filter(n=>n.getClientRects().length),first=nodes[0],last=nodes[nodes.length-1];
    if(e.shiftKey&&(document.activeElement===first||!root.contains(document.activeElement))){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&(document.activeElement===last||!root.contains(document.activeElement))){e.preventDefault();first?.focus();}
   }
   // Impede os atalhos globais de abrir outro painel ou usar o mundo.
   e.stopImmediatePropagation();
  },true);
  ready=true;
 }
 function paint(){
  if(!ready||!model)return;
  const focused=document.activeElement,focusKey=focused?.dataset?.bagItem,focusCategory=focused?.dataset?.bagCategory,focusCommand=focused?.dataset?.bagCommand,focusQuick=focused?.dataset?.bagQuick;
  const rows=entries(),row=rows.find(r=>r.key===selected)||rows[0];selected=row.key;
  root.querySelector('#bagCategories').innerHTML=Object.entries(categories).map(([id,name])=>`<button type="button" data-bag-category="${id}" aria-pressed="${category===id}">${name}</button>`).join('');
  const needle=query.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const filtered=rows.filter(r=>(category==='all'||r.group===category)&&(!needle||(r.name+' '+r.description).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(needle))).sort((a,b)=>Number(b.amount>0)-Number(a.amount>0)||a.name.localeCompare(b.name,'pt-BR'));
  root.querySelector('#bagGrid').innerHTML=filtered.map(r=>`<button type="button" class="bagItem ${r.amount?'':'bagAbsent'}" data-bag-item="${r.key}" title="${esc(r.name)}" aria-pressed="${r.key===selected}" aria-label="${esc(r.name)}, ${r.amount? r.permanent?'permanente':r.amount+' unidades':'sem estoque'}${r.equipped?', em uso':''}"><span class="bagItemArt">${art(r.seed?'seed':r.stockId||r.key,r.seed)}</span><span class="bagItemName">${esc(r.name)}</span><span class="bagItemCount">${r.amount?r.permanent?'∞':r.amount:'0'}</span>${r.equipped?'<span class="bagEquipped">Em uso</span>':''}</button>`).join('');
  root.querySelector('#bagResultCount').textContent=filtered.length+' tipos de item';root.querySelector('#bagEmpty').hidden=!!filtered.length;
  root.querySelector('#fullHotbarGrid').innerHTML=model.quickItems.map((it,i)=>{const r=it.key==='seed'?rows.find(r=>r.seed===model.player.selectedSeed):rows.find(r=>r.key===it.key);return `<button type="button" class="bagQuick" data-bag-quick="${i}" aria-pressed="${model.editSlot===i}" aria-label="Editar atalho ${i+1}: ${esc(r?.name||it.name)}"><kbd>${i+1}</kbd>${art(it.key,it.key==='seed'?model.player.selectedSeed:undefined)}<span>${esc(r?.name||it.name)}</span><b>${r?.permanent?'∞':r?.amount||0}</b></button>`;}).join('');
  root.querySelector('#invInfo').innerHTML=model.editSlot===null?'Clique em um atalho para trocar seu item.':`Trocando atalho ${model.editSlot+1} <button type="button" data-bag-command="cancel">Cancelar</button>`;
  root.querySelector('#bagMoney').textContent=model.player.coins+' moedas';
  const qty=row.permanent?(row.amount?'Uso permanente':'Ainda não adquirido'):(row.amount+' '+(row.stockId?'no depósito':'na mochila'));
  const blocked=!row.stockId&&!row.amount || row.stockId==='compota'&&!row.canConsume;
  const action=row.equipped&&flags[row.key]&&row.action?'Guardar equipamento':row.action;
  root.querySelector('#bagDetail').innerHTML=`<div class="bagDetailArt">${art(row.seed?'seed':row.stockId||row.key,row.seed)}</div><span class="bagEyebrow">${esc(categories[row.group])}</span><h3>${esc(row.name)}</h3><p class="bagQuantity">${esc(qty)}${row.equipped?' · Em uso':''}</p><p>${esc(row.description)}</p><div class="bagSource"><strong>Como conseguir e usar</strong><p>${esc(row.source)}</p></div>${action?`<button type="button" class="bagPrimary" data-bag-command="use" ${blocked?'disabled':''}>${esc(action)}</button>`:''}${blocked?`<p class="bagReason">${esc(row.stockId==='compota'?row.disabledReason:'Você ainda não tem este item.')}</p>`:''}${row.quick?model.editSlot!==null?`<button type="button" class="bagAssign" data-bag-command="assign">Colocar no atalho ${model.editSlot+1}</button>`:'<p class="bagHint">Para levar à mão, escolha um dos seis atalhos acima.</p>':'<p class="bagHint">'+(row.stockId?'Este produto fica no depósito compartilhado da fazenda.':'Proteção permanente; não ocupa um atalho.')+'</p>'}`;
  if(focusKey)root.querySelector(`[data-bag-item="${focusKey}"]`)?.focus({preventScroll:true});
  else if(focusCategory)root.querySelector(`[data-bag-category="${focusCategory}"]`)?.focus({preventScroll:true});
  else if(focusCommand)root.querySelector(`[data-bag-command="${focusCommand}"]`)?.focus({preventScroll:true});
  else if(focusQuick!==undefined)root.querySelector(`[data-bag-quick="${focusQuick}"]`)?.focus({preventScroll:true});
 }
 const css=`
 #inventoryPanel.inv-v69{display:none!important;position:fixed!important;inset:0!important;background:rgba(10,22,17,.78)!important;pointer-events:auto!important;padding:20px!important;align-items:center!important;justify-content:center!important;z-index:130!important;box-sizing:border-box!important;font-family:Georgia,serif!important;}
 #inventoryPanel.inv-v69.show{display:flex!important;}
 #inventoryPanel.inv-v69 .invWindow{position:relative!important;inset:auto!important;transform:none!important;width:min(960px,100%)!important;max-width:960px!important;min-width:0!important;height:min(740px,calc(100dvh - 40px))!important;max-height:calc(100dvh - 40px)!important;margin:0!important;padding:22px!important;background:#f1ead4!important;color:#253d30!important;border:2px solid #b79a61!important;border-radius:12px!important;box-shadow:0 18px 70px #07160ddd!important;display:flex!important;flex-direction:column!important;gap:12px!important;overflow:hidden!important;box-sizing:border-box!important;}
 #inventoryPanel.inv-v69 *{box-sizing:border-box;}
 #inventoryPanel.inv-v69 button,#inventoryPanel.inv-v69 input{font:inherit;box-shadow:none;background:#f8f3e5;color:#253d30;border:1px solid #c7bb98;border-radius:5px;cursor:pointer;}
 #inventoryPanel.inv-v69 button:focus-visible,#inventoryPanel.inv-v69 input:focus-visible{outline:3px solid #9c6c20;outline-offset:2px;}
 #inventoryPanel.inv-v69 button:hover{background:#e5dcc1;}
 #inventoryPanel.inv-v69 button:disabled{opacity:.5;cursor:default;}
 #inventoryPanel.inv-v69 kbd{font:11px monospace;}
 #inventoryPanel.inv-v69 .bagHeader{display:flex;align-items:center;justify-content:space-between;gap:12px;}
 #inventoryPanel.inv-v69 .bagEyebrow{font:10px Georgia,serif;letter-spacing:1.8px;color:#76613a;}
 #inventoryPanel.inv-v69 h2{font:bold 30px Georgia,serif!important;color:#253d30!important;margin:3px 0 0!important;text-shadow:none!important;}
 #inventoryPanel.inv-v69 .bagClose{padding:10px 13px;min-height:42px;white-space:nowrap;}
 #inventoryPanel.inv-v69 .bagQuickHeading{display:flex;justify-content:space-between;gap:12px;font-size:13px;align-items:center;}
 #inventoryPanel.inv-v69 .bagQuickHeading small{font-weight:normal;color:#6b715b;margin-left:8px;}
 #inventoryPanel.inv-v69 #invInfo{font-size:12px!important;color:#626b54!important;margin:0!important;}
 #inventoryPanel.inv-v69 #invInfo button{padding:3px 7px;margin-left:5px;}
 #inventoryPanel.inv-v69 #fullHotbarGrid{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:6px!important;padding:0!important;margin:0!important;background:none!important;border:0!important;box-shadow:none!important;flex-shrink:0;}
 #inventoryPanel.inv-v69 .bagQuick{min-width:0;position:relative;padding:8px 8px 7px;display:flex;align-items:center;gap:8px;height:60px;text-align:left;}
 #inventoryPanel.inv-v69 .bagQuick svg{width:24px;height:24px;flex:none;image-rendering:pixelated;}
 #inventoryPanel.inv-v69 .bagQuick>span{font-size:10px;line-height:1.2;padding-right:7px;}
 #inventoryPanel.inv-v69 .bagQuick kbd{position:absolute;top:2px;left:3px;color:#78623c;font-size:9px;}
 #inventoryPanel.inv-v69 .bagQuick b{position:absolute;bottom:2px;right:5px;font-size:10px;}
 #inventoryPanel.inv-v69 .bagQuick[aria-pressed=true]{background:#d4dfc9;border-color:#45624c;outline:2px solid #45624c;}
 #inventoryPanel.inv-v69 .bagToolbar{display:flex;gap:12px;align-items:center;border-bottom:1px solid #c9bf9e;padding-bottom:10px;}
 #inventoryPanel.inv-v69 #bagCategories{display:flex;gap:4px;flex:1;flex-wrap:wrap;}
 #inventoryPanel.inv-v69 #bagCategories button{padding:8px 9px;border:0;background:transparent;font-size:12px;min-height:36px;}
 #inventoryPanel.inv-v69 #bagCategories [aria-pressed=true]{color:#f8f1d9;background:#31503d;}
 #inventoryPanel.inv-v69 .bagSearch{width:160px;flex-shrink:0;}
 #inventoryPanel.inv-v69 .bagSearch input{width:100%;min-width:0;padding:9px 10px;font-size:12px;}
 #inventoryPanel.inv-v69 .bagWorkspace{display:grid;grid-template-columns:minmax(0,1fr) 262px;gap:22px;min-height:0;flex:1;}
 #inventoryPanel.inv-v69 .bagContents{overflow:auto;min-width:0;padding:2px 5px 5px 2px;}
 #inventoryPanel.inv-v69 .bagListHeading{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#6b715b;margin:0 0 10px;}
 #inventoryPanel.inv-v69 #bagGrid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;background:none!important;border:0!important;padding:0!important;margin:0!important;}
 #inventoryPanel.inv-v69 .bagItem{position:relative;min-width:0;min-height:116px;padding:12px 7px 10px;display:flex;align-items:center;flex-direction:column;justify-content:flex-start;gap:7px;text-align:center;}
 #inventoryPanel.inv-v69 .bagItemArt{width:48px;height:48px;display:block;}
 #inventoryPanel.inv-v69 .bagItemArt svg{width:100%;height:100%;image-rendering:pixelated;}
 #inventoryPanel.inv-v69 .bagItemName{font-size:12px;line-height:1.25;word-break:normal;}
 #inventoryPanel.inv-v69 .bagItemCount{position:absolute;top:5px;right:6px;font-size:12px;font-weight:bold;}
 #inventoryPanel.inv-v69 .bagEquipped{font-size:9px;letter-spacing:.3px;color:#355640;}
 #inventoryPanel.inv-v69 .bagItem[aria-pressed=true]{background:#e1e6cf;border:2px solid #42664c;padding:11px 6px 9px;}
 #inventoryPanel.inv-v69 .bagAbsent .bagItemArt{opacity:.45;}
 #inventoryPanel.inv-v69 #bagDetail{border-left:1px solid #c7bb98;padding:4px 0 6px 20px;overflow:auto;min-width:0;}
 #inventoryPanel.inv-v69 .bagDetailArt{width:98px;height:98px;background:#e2dcc4;border:1px solid #c7bb98;border-radius:8px;padding:12px;margin-bottom:14px;}
 #inventoryPanel.inv-v69 .bagDetailArt svg{width:100%;height:100%;image-rendering:pixelated;}
 #inventoryPanel.inv-v69 h3{font:bold 23px/1.12 Georgia,serif;margin:6px 0;color:#253d30;}
 #inventoryPanel.inv-v69 #bagDetail p{font-size:13px;line-height:1.45;margin:10px 0;}
 #inventoryPanel.inv-v69 .bagQuantity{color:#6b715b;font-size:12px!important;}
 #inventoryPanel.inv-v69 .bagSource{border-top:1px solid #c7bb98;padding-top:12px;margin-top:15px;}
 #inventoryPanel.inv-v69 .bagSource strong{font-size:12px;}
 #inventoryPanel.inv-v69 .bagPrimary,#inventoryPanel.inv-v69 .bagAssign{display:block;width:100%;padding:11px;margin-top:12px;font-size:13px;min-height:42px;}
 #inventoryPanel.inv-v69 .bagPrimary{background:#31503d;color:#fff6df;border-color:#31503d;}
 #inventoryPanel.inv-v69 .bagPrimary:hover:not(:disabled){background:#43664e;}
 #inventoryPanel.inv-v69 .bagHint,#inventoryPanel.inv-v69 .bagReason{font-size:11px!important;color:#6b715b;}
 #inventoryPanel.inv-v69 .bagFooter{border-top:1px solid #c9bf9e;padding-top:10px;font-size:11px;color:#6b715b;display:flex;justify-content:space-between;gap:12px;flex-shrink:0;}
 #inventoryPanel.inv-v69 .bagSr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;}
 #wrap #inv .slot{padding:0;color:inherit;font-family:inherit;cursor:pointer;flex-shrink:0;}
 #wrap #inv .slot:focus-visible{outline:2px solid #ffdf83;outline-offset:2px;}
 #wrap #inv .slot svg{width:24px!important;height:24px!important;image-rendering:pixelated;filter:none!important;}
 #wrap #inv .inv-open{font-size:10px!important;line-height:1.2!important;color:#fff3ce!important;}
 #wrap #inv .inv-open .bag-open-label{display:block;font-size:9px;}
 @media(max-width:760px){
  #inventoryPanel.inv-v69{padding:10px!important;}
  #inventoryPanel.inv-v69 .invWindow{padding:14px!important;height:calc(100dvh - 20px)!important;max-height:calc(100dvh - 20px)!important;gap:10px!important;}
  #inventoryPanel.inv-v69 .bagWorkspace{grid-template-columns:minmax(0,1fr) 220px;gap:12px;}
  #inventoryPanel.inv-v69 #bagGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;}
  #inventoryPanel.inv-v69 .bagQuick>span{display:none;}
  #inventoryPanel.inv-v69 .bagQuick{justify-content:center;height:52px;}
  #inventoryPanel.inv-v69 .bagToolbar{flex-wrap:wrap;gap:6px;}
  #inventoryPanel.inv-v69 .bagSearch{width:100%;}
 }
 @media(max-width:520px){
  #inventoryPanel.inv-v69 h2{font-size:25px!important;}
  #inventoryPanel.inv-v69 .bagEyebrow{font-size:8px;letter-spacing:1.3px;}
  #inventoryPanel.inv-v69 .bagQuickHeading{display:block;}
  #inventoryPanel.inv-v69 #invInfo{display:block;margin-top:4px!important;}
  #inventoryPanel.inv-v69 #bagCategories{gap:2px;}
  #inventoryPanel.inv-v69 #bagCategories button{padding:7px;font-size:11px;}
  #inventoryPanel.inv-v69 .bagWorkspace{display:flex;flex-direction:column;overflow:auto;gap:14px;}
  #inventoryPanel.inv-v69 .bagContents{overflow:visible;flex:none;}
  #inventoryPanel.inv-v69 #bagGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;max-height:260px;overflow:auto;padding:2px!important;}
  #inventoryPanel.inv-v69 .bagItem{min-height:112px;}
  #inventoryPanel.inv-v69 #bagDetail{overflow:visible;flex:none;border-left:0;border-top:1px solid #c7bb98;padding:14px 0 0;}
  #inventoryPanel.inv-v69 .bagDetailArt{width:62px;height:62px;padding:6px;float:right;margin:0 0 8px 10px;}
  #inventoryPanel.inv-v69 .bagFooter{font-size:10px;}
  #inventoryPanel.inv-v69 .bagFooter>span:first-child{max-width:220px;}
  #wrap #inv{gap:3px!important;padding:5px!important;max-width:calc(100vw - 12px)!important;}
  #wrap #inv .slot{width:40px!important;height:40px!important;flex-basis:40px!important;}
 }
 `;
 const style=document.createElement('style');style.id='farm-inventory-v69-style';style.textContent=css;document.head.append(style);
 window.FarmInventory=Object.freeze({render(next){model=next;mount();paint();},opened(){previousFocus=document.activeElement;root?.querySelector('.bagClose')?.focus();},closed(){const target=previousFocus?.isConnected?previousFocus:document.querySelector('#inv .inv-open');target?.focus({preventScroll:true});previousFocus=null;},snapshot:()=>({selected,category,query,items:model?entries().map(({key,amount,group,equipped})=>({key,amount,group,equipped})):[]})});
})();
