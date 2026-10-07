/* Encenação transitória do descanso; posições mecânicas e saves não mudam.
   Na cama, só a passada transporta o corpo. Sentar, deitar e levantar acontecem
   na mesma âncora, antes de devolver o controle ao deslocamento normal. */
(()=>{
 let context=null,blend=0,elapsed=0;
 const clamp=n=>Math.max(0,Math.min(1,n));
 function reset(){context=null;blend=0;elapsed=0;}
 function start(scene,bed=null){
  // R/E durante a saída retoma a encenação atual, sem saltar para o chão.
  if(context?.scene===scene&&(!bed||context.bed===bed))return;
  context={scene,bed,phase:bed?'approach':'sit',x:null,y:null,walkPhase:0};blend=0;elapsed=0;
 }
 function initialize(actor){
  if(context.x!==null)return;
  context.x=actor.x;context.y=actor.y;context.origin={x:actor.x,y:actor.y};
  const bed=context.bed;
  if(bed)context.target={x:bed.x+(bed.w||48)/2,y:bed.y+(bed.h||32)-15};
 }
 function travel(target,dt){
  const dx=target.x-context.x,dy=target.y-context.y,d=Math.hypot(dx,dy),step=Math.min(d,42*dt);
  if(d>.001){context.x+=dx/d*step;context.y+=dy/d*step;context.walkPhase+=step*Math.PI*2/24;
   context.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);}
  return d-step<.001;
 }
 function update(dt,actor,scene,reducedMotion=false){
  if(context&&(context.scene!==scene||actor.dead))reset();
  if(actor.resting&&!context&&!actor.dead)start(scene);
  if(!context)return;
  initialize(actor);dt=Math.max(0,Math.min(.1,dt));elapsed+=actor.resting?dt:0;
  if(reducedMotion){
   blend=actor.resting?1:0;
   if(!actor.resting){reset();return;}
   context.phase='rest';if(context.bed){context.x=context.target.x;context.y=context.target.y;}return;
  }
  if(!context.bed){
   blend=clamp(blend+(actor.resting?dt/.24:-dt/.18));
   if(!actor.resting&&blend===0)reset();return;
  }
  // Uma inversão durante a passagem inverte os passos; durante a pose,
  // inverte a flexão. Nenhuma troca de intenção reposiciona o personagem.
  if(actor.resting){
   if(context.phase==='depart')context.phase='approach';
   if(context.phase==='rise')context.phase='settle';
   if(context.phase==='approach'){
    blend=0;if(travel(context.target,dt)){context.phase='settle';context.dir=0;}
   }else if(context.phase==='settle'){
    blend=clamp(blend+dt/.36);if(blend===1)context.phase='rest';
   }
  }else{
   if(context.phase==='approach')context.phase='depart';
   if(context.phase==='rest'||context.phase==='settle')context.phase='rise';
   if(context.phase==='rise'){
    blend=clamp(blend-dt/.30);if(blend===0)context.phase='depart';
   }else if(context.phase==='depart'&&travel(context.origin,dt))reset();
  }
 }
 function pose(actor,scene){
  const c=context?.scene===scene?context:null,bed=c?.bed;
  const walking=!!bed&&['approach','depart'].includes(c.phase);
  return{restMode:bed?'bed':'sit',restElapsed:elapsed,restBlend:blend,
   restWalking:walking,restWalkPhase:c?.walkPhase||0,restWalkDir:c?.dir??actor.dir,
   x:bed&&c.x!==null?c.x:actor.x,y:bed&&c.y!==null?c.y:actor.y,
   depth:bed?Math.max((c.y??actor.y)+10,bed.y+(bed.h||32)+.5):actor.y+10};
 }
 function blocksMovement(actor,scene,reducedMotion=false){
  return !reducedMotion&&!actor.dead&&!actor.resting&&context?.scene===scene&&(!!context.bed||blend>0);
 }
 window.FarmRestVisual={start,reset,update,pose,blocksMovement,
  info:()=>({blend,elapsed,scene:context?.scene||null,bed:context?.bed?.type||null,phase:context?.phase||null})};
})();
