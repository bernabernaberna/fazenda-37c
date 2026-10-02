'use strict';
// Testa a telemetria em uma VM, com localStorage em memória e fetch falso.
// Nenhum navegador, servidor ou request real é criado por este roteiro.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname,'../src/modules/80-teacher-mode.js'),'utf8');
const OUTBOX='farm37_outbox';
const event = (uid,code,name='Apelido') => ({event_uid:uid,class_code:code,student_name:name,
  created_at:'2026-10-02T12:00:00.000Z',mission_id:'quiz-'+uid,concept:'Conceito',
  category:'integracao',difficulty:'basico',correct:true,score:10});

function harness({consent=false,code=null,queue=[],fetchImpl=null}={}){
  const storage=new Map([[OUTBOX,JSON.stringify(queue)]]), calls=[], timers=new Map(), listeners={};
  if(consent) storage.set('farm37_consent','1');
  if(code) storage.set('farm37_class_code',code);
  let nextTimer=0;
  const window={addEventListener:(type,callback)=>listeners[type]=callback};
  const context={window,player:{name:'Atual'},navigator:{onLine:true},console,
    localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)},
    setTimeout:(callback,ms)=>{const id=++nextTimer;timers.set(id,{callback,ms});return id;},
    clearTimeout:id=>timers.delete(id),setInterval:()=>++nextTimer,
    fetch:async(url,options)=>{
      const call={url,method:options.method||'GET',records:JSON.parse(options.body||'[]')};
      calls.push(call);
      return fetchImpl?fetchImpl(call):{ok:true,status:201};
    }
  };
  vm.runInNewContext(source,context,{filename:'80-teacher-mode.js',timeout:1000});
  return {tm:window.TeacherMode,calls,storage,timers,listeners,
    queue:()=>JSON.parse(storage.get(OUTBOX)||'[]')};
}
const uids = rows => rows.map(row=>row.event_uid);
const checked=[];
async function main(){
  const original=event('sem-consentimento','TURMAA');
  let h=harness({code:'TURMAA',queue:[original]});
  await h.tm.flushOutbox();
  assert.equal(h.calls.length,0); assert.deepEqual(h.queue(),[original]);
  h.listeners.online();
  for(const {callback} of [...h.timers.values()]) await callback();
  assert.equal(h.calls.length,0); assert.deepEqual(h.queue(),[original]);
  checked.push('Consentimento falso bloqueia flush, reload, timer inicial e retorno online, preservando a fila.');

  h=harness({consent:true,queue:[original]});
  await h.tm.flushOutbox();
  assert.equal(h.calls.length,0); assert.deepEqual(h.queue(),[original]);
  checked.push('Consentimento verdadeiro com turma nula não envia pendências antigas.');

  const a1=event('a1','TURMAA','Aluno A'), b1=event('b1','TURMAB','Aluno B'),
    a2=event('a2','TURMAA','Aluno A'), b2=event('b2','TURMAB','Aluno B');
  h=harness({consent:true,code:'TURMAB',queue:[a1,b1,a2,b2]});
  await h.tm.flushOutbox();
  assert.equal(h.calls.length,1); assert.equal(h.calls[0].method,'POST');
  assert.deepEqual(uids(h.calls[0].records),['b1','b2']);
  assert.deepEqual(h.queue(),[a1,a2]);
  h.tm.setClassCode('TURMAA'); await h.tm.flushOutbox();
  assert.deepEqual(uids(h.calls[1].records),['a1','a2']); assert.deepEqual(h.queue(),[]);
  checked.push('Lotes intercalados enviam somente a turma atual; confirmação preserva as outras turmas.');

  h=harness({consent:true,code:'TURMAA',queue:[a1,b1]});
  h.tm.setClassCode('TURMAB'); await h.tm.flushOutbox();
  assert.deepEqual(uids(h.calls[0].records),['b1']); assert.deepEqual(h.queue(),[a1]);
  h.tm.setConsent(false); h.tm.setClassCode('TURMAA'); await h.tm.flushOutbox();
  assert.equal(h.calls.length,1); assert.deepEqual(h.queue(),[a1]);
  checked.push('Troca de turma não mistura filas; revogação posterior interrompe novos envios.');

  h=harness({queue:[a1]});
  h.tm.submitQuizEvent({missionId:'offline',concept:'Conceito atual',category:'integracao',difficulty:'basico',correct:true,score:10});
  await h.tm.flushOutbox();
  assert.equal(h.calls.length,0); assert.deepEqual(h.queue(),[a1]);
  assert.equal(h.tm._readLocal().length,1);
  checked.push('Resposta sem turma/consentimento permanece local e não autoriza a fila antiga.');

  let confirm;
  h=harness({consent:true,code:'TURMAA',queue:[b1,a1],fetchImpl:()=>new Promise(resolve=>confirm=resolve)});
  const pending=h.tm.flushOutbox();
  h.tm.submitQuizEvent({missionId:'adicionado',concept:'Durante o envio',category:'integracao',difficulty:'basico',correct:true,score:10});
  const newer=h.queue().find(row=>row.mission_id==='adicionado'); assert.ok(newer);
  confirm({ok:true,status:201}); await pending;
  assert.deepEqual(uids(h.queue()),['b1',newer.event_uid]);
  checked.push('Confirmar lote não apaga evento novo recebido enquanto o envio aguardava.');

  h=harness({consent:true,code:'TURMAB',queue:[a1,b1],fetchImpl:()=>({ok:false,status:403})});
  await h.tm.flushOutbox();
  assert.deepEqual(h.queue(),[a1,b1]); // primeira falha tenta compatibilidade, sem descarte
  await h.tm.flushOutbox();
  assert.deepEqual(h.queue(),[a1]);
  assert.equal(h.tm.dataSummary().recusadosPeloServidor,1);
  checked.push('Falha definitiva registra somente o lote autorizado e preserva pendências de outra turma.');
  console.log(JSON.stringify({passou:true,checagens:checked,requestsReais:0},null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
