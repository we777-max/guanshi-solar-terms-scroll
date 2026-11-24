(() => {
  'use strict';
  const stand=document.querySelector('#standPose');
  const walk=document.querySelector('#walkPose');
  const status=document.querySelector('#characterStatus');
  const actor=document.querySelector('#sceneWalker');
  const reduced=window.matchMedia('(prefers-reduced-motion:reduce)');
  const frames=[...document.querySelectorAll('.walk-image')];
  let walking=false,ready=false,position=.76,direction=-1,lastTime=0,request=0;

  function pose(isWalking) {
    walking=isWalking&&ready;
    stand.setAttribute('aria-pressed',String(!walking));
    walk.setAttribute('aria-pressed',String(walking));
    document.querySelectorAll('.stand-image').forEach(image=> { image.hidden=walking; });
    frames.forEach(image=> { image.hidden=!walking; image.style.animationPlayState=walking?'running':'paused'; });
    document.querySelector('#poseCaption').textContent=walking?'缓行 · 八帧步态':'静立 · 斜侧';
    status.textContent=walking?(reduced.matches?'正在演示步态；已减少人物横向移动。':'人物正在沿路行走。'):'人物已站定，可切换行走。';
    window.cancelAnimationFrame(request); request=0; lastTime=0;
    if (walking&&!document.hidden&&!reduced.matches) request=window.requestAnimationFrame(tick);
  }
  function tick(time) {
    const delta=lastTime?Math.min(.05,(time-lastTime)/1000):0;
    lastTime=time;
    position+=delta*.035*direction;
    if(position<.56) {position=.56; direction=1;}
    if(position>.78) {position=.78; direction=-1;}
    actor.style.left=`${position*100}%`;
    actor.style.transform=direction<0?'none':'scaleX(-1)';
    if(walking&&!document.hidden&&!reduced.matches) request=window.requestAnimationFrame(tick);
  }
  function readyState() {
    if(!frames.every(image=>image.complete&&image.naturalWidth===2048)) return;
    ready=true;walk.disabled=false;
    status.textContent='站立与行走素材已就绪。';
  }
  frames.forEach(image=> {
    image.addEventListener('load',readyState);
    image.addEventListener('error',()=> {ready=false;pose(false);walk.disabled=true;status.textContent='行走素材未载入，请刷新页面重试。';});
  });
  stand.addEventListener('click',()=>pose(false));
  walk.addEventListener('click',()=>pose(true));
  document.addEventListener('visibilitychange',()=> {if(document.hidden) pose(false);});
  reduced.addEventListener('change',()=>pose(walking));
  readyState();
})();
