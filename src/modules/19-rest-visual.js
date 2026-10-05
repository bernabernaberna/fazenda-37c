/* Estado visual transitório; nunca faz parte de player nem de saves. */
(()=>{
 let context=null,blend=0,elapsed=0;
 const ease=t=>t*t*(3-2*t);
 function reset(){context=null;blend=0;elapsed=0;}
 function start(scene,bed=null){context={scene,bed};blend=0;elapsed=0;}
 function update(dt,actor,scene,reducedMotion=false){
  if(context&&context.scene!==scene)reset();
  if(actor.resting&&!context)start(scene);
  elapsed+=actor.resting?Math.max(0,dt):0;
  blend=reducedMotion?(actor.resting?1:0):Math.max(0,Math.min(1,blend+(actor.resting?dt/.24:-dt/.18)));
  if(!actor.resting&&blend===0)context=null;
 }
 function pose(actor,scene){
  const bed=context?.scene===scene?context.bed:null,amount=ease(blend);
  return{restMode:bed?'bed':'sit',restElapsed:elapsed,restBlend:blend,
   x:bed?actor.x+((bed.x+(bed.w||48)/2)-actor.x)*amount:actor.x,
   y:bed?actor.y+((bed.y+(bed.h||32)-15)-actor.y)*amount:actor.y,
   depth:bed&&blend>0?Math.max(actor.y+10,bed.y+(bed.h||32)+.5):actor.y+10};
 }
 window.FarmRestVisual={start,reset,update,pose,info:()=>({blend,elapsed,scene:context?.scene||null,bed:context?.bed?.type||null})};
})();
