(() => {
  'use strict';
  const $=selector=>document.querySelector(selector);
  const assets={
    tools:{name:'春耕农具',image:'assets/props/spring-tools-v1.png',size:[1536,1024],crop:[411,35,714,967],advice:'锄柄约为门洞高度的一半至三分之二。种子篓落在田边路肩，保留通行宽度。',use:'锄头、种子篓；一组作为一个入口。'},
    harvest:{name:'秋收器具',image:'assets/props/harvest-v1.png',size:[1774,887],crop:[49,100,1675,702],advice:'放在晒场右侧平地，远离石阶和院墙；粮筐高度明显低于门洞。',use:'簸箕、粮筐、稻束；集中在晒场。'},
    stationery:{name:'文房用具',image:'assets/props/stationery-v1.png',size:[1774,887],crop:[85,370,1592,241],advice:'集中放书案左侧。案面中央和右侧留给取书、展卷；小件不散放到室外。',use:'砚台、墨锭、毛笔笔架、砚滴；一组放案头。'},
    gnomon:{name:'圭表',image:'assets/gnomon/gnomon-scroll-v1.png',size:[1536,1024],crop:[0,0,1536,1024],ratio:3,advice:'沿用当前长卷的浅透视。表脚和尺端留在院内铺砖范围，门洞与石阶保持畅通。',use:'沿用已有二维圭表，庭院只保留一件大器物。'}
  };
  const scenes=[
    {id:'spring',name:'村落田园',image:'assets/scroll/spring.png',size:[2172,724],note:'田边一组农具，庭院一件圭表；屋门前留出通路。',zones:[{name:'田边路肩',x:10.5,y:52,w:7.5,h:21.2},{name:'院内观测',x:68,y:50,w:18,h:19.5}],items:[{id:'tools',x:12.6,y:55.8,w:4},{id:'gnomon',x:69,y:53,w:16}]},
    {id:'spring-bridge',name:'溪桥水磨',image:'assets/scroll/spring-bridge.png',size:[2172,724],note:'桥头和水磨是视觉重点，先保留通行空间。',zones:[],items:[]},
    {id:'summer',name:'荷塘亭榭',image:'assets/scroll/summer.png',size:[2172,724],note:'亭面、台阶与水岸保持完整，第一批不新增器物。',zones:[],items:[]},
    {id:'summer-street',name:'水乡长街',image:'assets/scroll/summer-street.png',size:[2172,724],note:'沿街门洞和码头密集，先保留街面留白。',zones:[],items:[]},
    {id:'autumn',name:'秋收晒场',image:'assets/scroll/autumn.png',size:[2172,724],note:'右侧有连续平地，先集中试放一组收获器具。',zones:[{name:'晒场平地',x:57.3,y:56.8,w:14.2,h:11.5}],items:[{id:'harvest',x:61.8,y:59,w:7}]},
    {id:'autumn-terraces',name:'山麓梯田',image:'assets/scroll/autumn-terraces.png',size:[2172,724],note:'田埂与台阶高差明显，先保留农田层次和行走路线。',zones:[],items:[]},
    {id:'winter',name:'冬日庭院',image:'assets/scroll/winter.png',size:[2172,724],note:'可作为后续冬藏器物的候选场所，第一批先看原有庭院。',zones:[],items:[]},
    {id:'winter-ferry',name:'古渡雪岸',image:'assets/scroll/winter-ferry.png',size:[2172,724],note:'码头和石阶需要保持上下船通道，先不添加器物。',zones:[],items:[]},
    {id:'study',name:'书房室内',image:'assets/study/interior-v1.png',size:[1659,948],note:'小件集中在案头左侧，右侧保留原来的展卷位置。',zones:[{name:'案面左侧',x:34,y:68,w:21,h:7}],items:[{id:'stationery',x:37,y:70,w:15}]}
  ];
  const initial=scenes.map(scene=>scene.items.map(item=>({...item})));
  let current=4,selected=0,drag=null;
  const canvas=$('#sceneCanvas'),layer=$('#propLayer');
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function ratio(asset) {return asset.ratio||asset.crop[2]/asset.crop[3];}
  function height(item,scene) {return item.w*scene.size[0]/scene.size[1]/ratio(assets[item.id]);}
  function artwork(asset) {
    const crop=document.createElement('span');crop.className='prop-crop';
    const image=document.createElement('img');image.src=asset.image;image.alt='';image.draggable=false;
    const [x,y,w,h]=asset.crop;
    image.style.cssText=`width:${asset.size[0]/w*100}%;height:${asset.size[1]/h*100}%;left:${-x/w*100}%;top:${-y/h*100}%;`;
    crop.append(image);return crop;
  }
  const tabButtons=scenes.map((scene,index)=> {
    const button=document.createElement('button');button.type='button';button.textContent=scene.name;button.dataset.scene=scene.id;
    const count=document.createElement('small');count.textContent=scene.items.length?`${scene.items.length}组`:'留白';button.append(count);
    button.addEventListener('click',()=>{current=index;selected=0;render();});$('#sceneTabs').append(button);return button;
  });
  function selectedItem() {return scenes[current].items[selected];}
  function bounds(item) {const h=height(item,scenes[current]);return {x:item.x,y:item.y,w:item.w,h};}
  function fitsZone(item) {
    const b=bounds(item);
    return scenes[current].zones.some(z=>b.x>=z.x&&b.y>=z.y&&b.x+b.w<=z.x+z.w+.05&&b.y+b.h<=z.y+z.h+.05);
  }
  function updateStatus() {
    const item=selectedItem(),status=$('#placementStatus');
    status.classList.toggle('is-warning',!!item&&!fitsZone(item));
    status.textContent=!item?'这一景先保留原有画面。':fitsZone(item)?'当前摆位在建议范围内；仍需目视检查脚点、透视和遮挡。':'道具超出建议范围，注意是否压到路面、院墙、水面或桌沿。';
  }
  function syncControls() {
    const item=selectedItem();$('#positionControls').hidden=!item;
    if(!item) {updateStatus();return;}
    $('#selectedPropName').textContent=assets[item.id].name;$('#placementAdvice').textContent=assets[item.id].advice;
    for(const [key,id] of [['x','x'],['y','y'],['w','size']]) {$('#'+id+'Range').value=item[key];$('#'+id+'Output').textContent=`${item[key].toFixed(1)}%`;}
    document.querySelectorAll('.instance-list button').forEach((button,index)=>button.setAttribute('aria-pressed',String(index===selected)));
    updateStatus();
  }
  function drawPositions() {
    scenes[current].items.forEach((item,index)=>{
      const button=layer.children[index];button.style.left=`${item.x}%`;button.style.top=`${item.y}%`;button.style.width=`${item.w}%`;button.style.height=`${height(item,scenes[current])}%`;
      button.setAttribute('aria-label',`${assets[item.id].name}，可拖动调整位置`);
    });syncControls();
  }
  function limit(item) {
    const scene=scenes[current];item.w=clamp(item.w,1,Math.min(30,ratio(assets[item.id])*scene.size[1]/scene.size[0]*100));item.x=clamp(item.x,0,100-item.w);item.y=clamp(item.y,0,Math.max(0,100-height(item,scene)));
  }
  function fixedBooks(scene) {
    const layer=$('#fixedLayer');layer.replaceChildren();if(scene.id!=='study')return;
    const books=[['月令七十二候集解',.253,[47,177,362,821]],['淮南子',.389,[37,177,353,821]],['周髀算经',.524,[28,177,344,821]],['齐民要术',.658,[18,176,336,821]]];
    books.forEach(([name,center,bounds],index)=> {
      const [left,top,right,bottom]=bounds,cellHeight=.18*1024/(bottom-top),cellWidth=cellHeight*(384/1024)/1.75;
      const book=document.createElement('span');book.className='fixed-book';book.setAttribute('role','img');book.setAttribute('aria-label','现有书册：《'+name+'》');
      book.style.cssText=`left:${(center-(left+right)/2/384*cellWidth)*100}%;top:${(.481-bottom/1024*cellHeight)*100}%;width:${cellWidth*100}%;height:${cellHeight*100}%;`;
      const art=document.createElement('span');art.className='fixed-book-art';const image=document.createElement('img');image.src='assets/study/books-v1.png';image.alt='';image.style.left=`${-index*100}%`;art.append(image);
      const title=document.createElement('span');title.className='fixed-book-title';title.textContent=name;title.style.left=`${(left+64)/384*100}%`;book.append(art,title);layer.append(book);
    });
  }
  function startDrag(event,index) {
    if(event.isPrimary===false||(event.pointerType==='mouse'&&event.button!==0)) return;
    selected=index;syncControls();const item=selectedItem(),rect=canvas.getBoundingClientRect();
    drag={id:event.pointerId,button:event.currentTarget,x:event.clientX,y:event.clientY,startX:item.x,startY:item.y,width:rect.width,height:rect.height};
    drag.button.setPointerCapture(event.pointerId);
  }
  function render() {
    const scene=scenes[current];drag=null;$('#sceneTitle').textContent=scene.name;$('#sceneDescription').textContent=scene.note;
    $('#sceneCount').textContent=scene.id==='study'?'4册旧书＋1组试摆':scene.items.length?`${scene.items.length}组试摆`:'保留留白';fixedBooks(scene);
    const background=$('#sceneImage');background.src=scene.image;background.alt=scene.name+'：'+scene.note;background.width=scene.size[0];background.height=scene.size[1];
    canvas.style.aspectRatio=`${scene.size[0]}/${scene.size[1]}`;
    $('#canvasViewport').scrollLeft=0;$('#canvasViewport').scrollTop=0;
    tabButtons.forEach((button,index)=>button.setAttribute('aria-pressed',String(index===current)));
    layer.replaceChildren();$('#instanceList').replaceChildren();$('#zoneLayer').replaceChildren();
    $('#emptyReason').hidden=scene.items.length>0;$('#emptyReason').textContent=scene.note;
    scene.zones.forEach(zone=> {const element=document.createElement('div');element.className='zone';element.style.cssText=`left:${zone.x}%;top:${zone.y}%;width:${zone.w}%;height:${zone.h}%;`;const label=document.createElement('span');label.textContent=zone.name;element.append(label);$('#zoneLayer').append(element);});
    scene.items.forEach((item,index)=> {
      const button=document.createElement('button');button.type='button';button.className='prop';button.dataset.prop=item.id;button.append(artwork(assets[item.id]));
      button.addEventListener('click',()=>{selected=index;syncControls();});button.addEventListener('pointerdown',event=>startDrag(event,index));
      button.addEventListener('pointermove',event=> {if(!drag||event.pointerId!==drag.id)return;item.x=drag.startX+(event.clientX-drag.x)/drag.width*100;item.y=drag.startY+(event.clientY-drag.y)/drag.height*100;limit(item);drawPositions();});
      const stop=()=>{drag=null;};button.addEventListener('pointerup',stop);button.addEventListener('pointercancel',stop);button.addEventListener('lostpointercapture',stop);
      button.addEventListener('keydown',event=> {const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};const move=moves[event.key];if(!move)return;event.preventDefault();selected=index;const step=event.shiftKey?.1:.5;item.x+=move[0]*step;item.y+=move[1]*step;limit(item);drawPositions();});
      layer.append(button);const select=document.createElement('button');select.type='button';select.textContent=assets[item.id].name;select.addEventListener('click',()=>{selected=index;syncControls();});$('#instanceList').append(select);
    });drawPositions();
  }
  for(const [id,key] of [['x','x'],['y','y'],['size','w']]) $('#'+id+'Range').addEventListener('input',()=> {const item=selectedItem();if(!item)return;item[key]=Number($('#'+id+'Range').value);limit(item);drawPositions();});
  $('#compareOriginal').addEventListener('click',()=> {const hide=layer.classList.toggle('is-original');$('#compareOriginal').setAttribute('aria-pressed',String(hide));$('#compareOriginal').textContent=hide?'显示试摆道具':'对照原图';});
  $('#showZones').addEventListener('click',()=> {const hidden=$('#zoneLayer').hidden;$('#zoneLayer').hidden=!hidden;$('#showZones').setAttribute('aria-pressed',String(hidden));});
  $('#zoomSelect').addEventListener('change',()=> {
    canvas.style.setProperty('--zoom',$('#zoomSelect').value);
    window.requestAnimationFrame(()=> {
      const viewport=$('#canvasViewport'),item=selectedItem();
      const x=item?(item.x+item.w/2)/100:.5;
      const y=item?(item.y+height(item,scenes[current])/2)/100:.5;
      viewport.scrollLeft=Math.max(0,canvas.clientWidth*x-viewport.clientWidth/2);
      viewport.scrollTop=Math.max(0,canvas.clientHeight*y-viewport.clientHeight/2);
    });
  });
  $('#resetScene').addEventListener('click',()=> {scenes[current].items=initial[current].map(item=>({...item}));selected=0;render();});
  $('#downloadLayout').addEventListener('click',()=> {
    const record={version:1,coordinateSystem:'percent of source image; x/y at upper-left, w is width',scenes:scenes.map(scene=>({id:scene.id,image:scene.image,sourceSize:scene.size,items:scene.items.map(item=>({...item,asset:assets[item.id].image,heightPercent:Number(height(item,scene).toFixed(3))}))}))};
    const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)+'\n'],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='guanshi-prop-placement-v1.json';link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  for(const [id,asset] of Object.entries(assets)) {
    const card=document.createElement('article');card.className='asset-card';const preview=document.createElement('div');preview.className='asset-preview';
    const shape=document.createElement('div');shape.className='asset-shape';shape.style.aspectRatio=String(ratio(asset));shape.style.width=`${100*ratio(asset)}px`;shape.append(artwork(asset));preview.append(shape);
    const title=document.createElement('h3');title.textContent=asset.name+(id==='gnomon'?' · 已有':' · 新增');const description=document.createElement('p');description.textContent=asset.use;
    const link=document.createElement('a');link.href=asset.image;link.target='_blank';link.rel='noopener';link.textContent='查看透明素材 ↗';card.append(preview,title,description,link);$('#assetCards').append(card);
    new ResizeObserver(entries=> {const box=entries[0].contentRect;const width=Math.min(box.width*.87,box.height*.86*ratio(asset));shape.style.width=`${width}px`;shape.style.height=`${width/ratio(asset)}px`;}).observe(preview);
  }
  scenes.slice(0,8).forEach(scene=> {const row=document.createElement('div');row.className='allocation-row';const title=document.createElement('span');title.textContent=scene.name;const note=document.createElement('span');note.textContent=scene.items.length?scene.items.map(item=>assets[item.id].name).join('、'):scene.note;row.append(title,note);$('#allocationRows').append(row);});
  render();
})();
