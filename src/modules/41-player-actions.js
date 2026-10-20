/* Encenação das atividades. O resultado continua pertencendo à interação;
   alvo, duração e fase são transitórios e nunca entram no save. */
(()=>{
 'use strict';
 const durations=Object.freeze({plant:.50,water:.68,harvest:.56,collect:.55,feed:.62,fish:1.05});
 const contact=Object.freeze({plant:.52,water:.55,harvest:.55,collect:.55,feed:.58,fish:.58});
 let current=null;
 function reset(actor){
  const a=actor||current?.actor;
  if(a){a.actionTimer=0;a.actionType=null;}
  current=null;
 }
 function begin(actor,scene,kind,target){
  const duration=durations[kind]||.35;
  const valid=target&&Number.isFinite(target.x)&&Number.isFinite(target.y);
  current={actor,scene,kind,duration,target:valid?target:null};
  return duration;
 }
 function matches(actor,scene){
  return current&&current.actor===actor&&current.scene===scene&&actor.actionTimer>0&&!actor.dead&&!actor.resting;
 }
 function progress(actor){return Math.max(0,Math.min(1,1-actor.actionTimer/current.duration));}
 function pose(actor,scene){
  if(!matches(actor,scene))return {};
  const t=current.target;
  // O animal pode terminar de acomodar o corpo; a mão acompanha o alvo vivo.
  const target=t&&Number.isFinite(t.x)&&Number.isFinite(t.y)&&Math.hypot(t.x-actor.x,t.y-actor.y)<96?{x:t.x,y:t.y}:null;
  return{actionKind:current.kind,actionProgress:progress(actor),actionTarget:target};
 }
 function update(actor,scene){
  if(current&&!matches(actor,scene))reset(actor);
 }
 function cancelForMove(actor,scene,reducedMotion){
  if(!matches(actor,scene))return false;
  // Depois do contato, andar tem prioridade sobre terminar a pose de retorno.
  if(!reducedMotion&&progress(actor)<(contact[current.kind]||.55))return false;
  reset(actor);return true;
 }
 function waterTarget(spot,map,tiles,size){
  const ox=Math.floor(spot.x/size),oy=Math.floor(spot.y/size);
  let best=null;
  for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){
   if(![tiles.WATER,tiles.RIVER,tiles.OASIS].includes(map[oy+dy]?.[ox+dx]))continue;
   const x=(ox+dx+.5)*size,y=(oy+dy+.5)*size,distance=Math.hypot(x-spot.x,y-spot.y),score=Math.abs(distance-24);
   if(!best||score<best.score)best={x,y,score};
  }
  return best?{x:best.x,y:best.y}:null;
 }
 window.FarmPlayerActions=Object.freeze({begin,pose,update,reset,cancelForMove,waterTarget,
  info(){return current?{kind:current.kind,scene:current.scene,duration:current.duration,progress:progress(current.actor),active:!!matches(current.actor,current.scene)}:null;}});
})();
