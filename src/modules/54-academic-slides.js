/* Micrografias reais incorporadas pelo build. A licença de cada fotografia é
   preservada no crédito e no manifesto; dados de imagem nunca entram no save. */
(function(){
  'use strict';
  const data=window.FarmAcademicSlideData||{assets:[],questions:[]};
  delete window.FarmAcademicSlideData;
  const copy=value=>JSON.parse(JSON.stringify(value));
  const assets=new Map(data.assets.map(a=>[a.id,Object.freeze(a)]));
  const questions=data.questions;
  let current=null,level=1,ready=false,error=false,token=0;
  const node=id=>document.getElementById(id);
  const picture=()=>node('histologySlideImage');
  function setOptions(enabled){
    document.querySelectorAll('#histologyOptions button').forEach(button=>button.disabled=!enabled||!!current?.answered);
  }
  function setZoom(value){
    const a=assets.get(current?.imageId),viewport=node('histologySlideViewport'),stage=node('histologySlideStage');
    if(!a||!viewport||!stage)return false;
    level=Math.max(1,Math.min(4,Number(value)||1));
    const fit=Math.max(1,Math.min(viewport.clientWidth,a.width,280*a.width/a.height));
    stage.style.width=Math.round(fit*level)+'px';stage.style.aspectRatio=a.width+'/'+a.height;
    const label=node('histologySlideZoomValue');if(label)label.textContent=level+'×';
    node('histologySlideZoomOut').disabled=level===1;node('histologySlideZoomIn').disabled=level===4;
    const focus=current.target||{x:.5,y:.25};
    viewport.scrollTop=Math.max(0,stage.clientHeight*focus.y-viewport.clientHeight/2);
    viewport.scrollLeft=Math.max(0,stage.clientWidth*focus.x-viewport.clientWidth/2);
    return true;
  }
  function clear(){
    token++;current=null;level=1;ready=false;error=false;
    const img=picture();if(img){img.onload=null;img.onerror=null;img.removeAttribute('src');img.alt='';}
    const root=node('histologySlide');if(root)root.hidden=true;
    for(const id of ['histologySlideCredit','histologySlideDescription'])node(id)?.replaceChildren();
    const target=node('histologySlideTarget');if(target)target.hidden=true;
  }
  function show(mission){
    clear();if(!mission?.imageId)return false;
    current=mission;const root=node('histologySlide'),img=picture(),a=assets.get(mission.imageId),loadToken=token;
    if(!root||!img)return false;root.hidden=false;
    const fail=()=>{if(token!==loadToken)return;ready=false;error=true;setOptions(false);const e=node('histologySlideError');e.hidden=false;e.textContent='Não foi possível exibir a lâmina. Volte ao mundo e abra a prática novamente. Nenhuma resposta ou ponto foi registrado.';};
    node('histologySlideError').hidden=true;
    node('histologySlideDescription').textContent=mission.imageAlt||'Micrografia real; observe a organização dos tecidos e o marcador A.';
    const target=node('histologySlideTarget'),point=mission.target;
    if(target){target.hidden=!point;if(point){target.style.left=(point.x*100)+'%';target.style.top=(point.y*100)+'%';}}
    setOptions(false);
    if(!a){fail();return false;}
    const credit=node('histologySlideCredit');credit.append(document.createTextNode('Fotografia: '+a.author+' · '));
    for(const [title,href]of [[a.license,a.licenseUrl],['Fonte original',a.sourceUrl]]){
      const link=document.createElement('a');link.textContent=title;link.href=href;link.target='_blank';link.rel='noopener noreferrer';credit.append(link,document.createTextNode(' · '));
    }
    credit.append(document.createTextNode('Adaptação: redimensionamento e conversão WebP'+(a.crop?', recorte':'')+(a.rotation?', rotação':'')+'; cores preservadas.'));
    img.alt=mission.imageAlt;img.onload=()=>{if(token!==loadToken)return;ready=img.naturalWidth>0;error=!ready;if(!ready){fail();return;}node('histologySlideError').hidden=true;setOptions(true);setZoom(level);};img.onerror=fail;
    img.src=a.dataUrl;setZoom(1);
    if(img.complete&&img.naturalWidth>0)img.onload();
    return true;
  }
  window.addEventListener('resize',()=>{if(current)setZoom(level);});
  window.FarmAcademicSlides={
    questions:()=>copy(questions),
    sources:()=>[...assets.values()].map(a=>({id:'slide_source_'+a.id,title:'Fonte da micrografia · '+a.author,url:a.sourceUrl})),
    assets:()=>[...assets.values()].map(a=>({...a})),asset:id=>{const a=assets.get(id);return a?{...a}:null;},
    show,clear,setZoom,zoom:()=>level,
    info:()=>({imageId:current?.imageId||null,zoom:level,visible:!!current,ready,error}),
    explain(mission){if(current?.id===mission?.id){node('histologySlideDescription').textContent=mission.imageExplanation||mission.explanationCorrect;const a=assets.get(mission.imageId);if(a)node('histologySlideCredit').append(document.createTextNode(' Título da fonte: '+a.title+'. '+a.changes));}}
  };
})();
