/* Listas por tipo: mantém ordem, referências vivas e o mesmo critério das
   consultas originais. Índice apenas de objetos; o cache de tiles não muda. */
(()=>{
 const indices=new WeakMap(),metrics={queries:0,rebuilds:0,scanned:0,candidates:0};
 function of(list,types){
  if(!Array.isArray(list)||!Array.isArray(types))return [];
  metrics.queries++;
  let index=indices.get(list);
  if(!index||index.length!==list.length){
   index={length:list.length,byType:new Map(),order:new Map(),queries:new Map()};
   list.forEach((o,i)=>{index.order.set(o,i);const bucket=index.byType.get(o.type)||[];bucket.push(o);index.byType.set(o.type,bucket);});
   indices.set(list,index);metrics.rebuilds++;metrics.scanned+=list.length;
  }
  const key=[...new Set(types)].sort().join('|');let result=index.queries.get(key);
  if(!result){result=[];for(const type of new Set(types))result.push(...(index.byType.get(type)||[]));result.sort((a,b)=>index.order.get(a)-index.order.get(b));
   if(index.queries.size>=64)index.queries.delete(index.queries.keys().next().value);
   index.queries.set(key,result);
  }
  metrics.candidates+=result.length;return result;
 }
 window.FarmObjectQueries={of,invalidate(list){if(list)indices.delete(list);},info:()=>({...metrics}),resetMetrics(){for(const key in metrics)metrics[key]=0;}};
})();
