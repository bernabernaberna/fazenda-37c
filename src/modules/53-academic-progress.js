/* Currículo acadêmico independente: pontos por domínio, sem moedas ou reinício
   por estação. O score é sempre derivado dos IDs conhecidos, nunca do save. */
(function(){
  'use strict';
  let records=new Map(),cursor=0;
  const questions=()=>window.FarmAcademicHistology?.questions()||[];
  const validIndex=(v,q)=>Number.isInteger(v)&&v>=0&&v<q.options.length;
  function reset(){records=new Map();cursor=0;}
  function restore(raw){
    reset();if(!raw||raw.version!==1||!Array.isArray(raw.records))return;
    const known=new Map(questions().map(q=>[q.id,q]));
    for(const item of raw.records.slice(0,questions().length)){
      const q=known.get(item?.id);if(!q||records.has(q.id)||!validIndex(item.firstIndex,q)||!validIndex(item.lastIndex,q))continue;
      const attempts=Math.max(1,Math.min(100000,Math.floor(Number(item.attempts)||1)));
      records.set(q.id,{id:q.id,attempts,firstIndex:item.firstIndex,lastIndex:item.lastIndex,mastered:item.mastered===true||item.firstIndex===q.correctIndex||item.lastIndex===q.correctIndex});
    }
    cursor=Number.isSafeInteger(raw.cursor)?Math.max(0,raw.cursor)%Math.max(1,questions().length):0;
  }
  function serialize(){return {version:1,cursor,records:[...records.values()].map(r=>({...r}))};}
  function bank(){return questions().map(q=>({...q,completed:!!records.get(q.id)?.mastered,answered:false,queued:false}));}
  function get(id){return bank().find(q=>q.id===id)||null;}
  function answer(id,index){
    const q=questions().find(q=>q.id===id);if(!q||!validIndex(index,q))return null;
    const prev=records.get(id),correct=index===q.correctIndex,review=!!prev?.mastered;
    const entry={id,attempts:Math.min(100000,(prev?.attempts||0)+1),firstIndex:prev?.firstIndex??index,lastIndex:index,mastered:review||correct};
    records.set(id,entry);
    return {correct,delta:correct&&!review?15:0,review,firstAttempt:!prev};
  }
  function next(mode){
    const entries=bank(),visual=entries.filter(q=>!!q.imageId),text=entries.filter(q=>!q.imageId),mixed=[];
    for(let i=0;i<Math.max(visual.length,text.length);i++){if(visual[i])mixed.push(visual[i]);if(text[i])mixed.push(text[i]);}
    const all=mode==='visual'?visual:mixed;if(!all.length)return null;
    const fresh=all.find(q=>!records.has(q.id));if(fresh)return fresh;
    const pending=all.filter(q=>!records.get(q.id)?.mastered),pool=pending.length?pending:all;
    const chosen=pool[cursor%pool.length];cursor=(cursor+1)%all.length;return chosen;
  }
  function snapshot(){
    const all=questions(),rows=[...records.values()],mastered=rows.filter(r=>r.mastered).length;
    const topics=[...new Set(all.map(q=>q.topic))].map(topic=>{const group=all.filter(q=>q.topic===topic);return {topic,total:group.length,mastered:group.filter(q=>records.get(q.id)?.mastered).length};});
    return {score:mastered*15,mastered,attempted:rows.length,total:all.length,attempts:rows.reduce((n,r)=>n+r.attempts,0),firstCorrect:rows.filter(r=>{const q=all.find(q=>q.id===r.id);return q&&r.firstIndex===q.correctIndex;}).length,topics,records:rows.map(r=>({...r}))};
  }
  window.FarmAcademicProgress={reset,restore,serialize,snapshot,answer,next,get,bank};
})();
