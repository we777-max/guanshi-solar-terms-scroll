import { SKYLINES, TREE_SKY_CUTOUTS, MOON_ANCHORS, skyContains } from './sky-model.js?v=7';

const ns='http://www.w3.org/2000/svg';
const random=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
function element(tag,attributes={}) {
  const node=document.createElementNS(ns,tag);
  Object.entries(attributes).forEach(([key,value])=>node.setAttribute(key,String(value)));return node;
}
function animate(node,attributes,transform=false) {node.append(element(transform?'animateTransform':'animate',{repeatCount:'indefinite',...attributes}));}
function opacity(node,value) {const next=value.toFixed(3);if(node.getAttribute('opacity')!==next)node.setAttribute('opacity',next);}

// Everything attached to the painting lives in its SVG. Native scrolling
// moves these nodes and their background together, even between JS frames.
export function createWorldAtmosphere(scene,index,{windows,eaves}) {
  const defs=scene.svg.querySelector('defs');
  const layer=element('g',{class:'world-atmosphere','aria-hidden':'true','data-world-scene':index});
  const wash=element('rect',{width:2172,height:724,fill:'#0e192b',opacity:0,class:'world-night-wash'});
  layer.append(wash);
  const mask=element('mask',{id:`world-sky-${index}`,maskUnits:'userSpaceOnUse',maskContentUnits:'userSpaceOnUse',x:0,y:0,width:2172,height:724});
  mask.append(element('rect',{width:2172,height:724,fill:'black'}));
  const ridge=`M0 0H2172V${SKYLINES[index].at(-1)[1]}L${[...SKYLINES[index]].reverse().map(p=>p.join(' ')).join('L')}Z`;
  mask.append(element('path',{d:ridge,fill:'white'}));
  TREE_SKY_CUTOUTS[index].forEach(points=>mask.append(element('polygon',{points:points.map(p=>p.join(',')).join(' '),fill:'black',stroke:'black','stroke-width':16,'stroke-linejoin':'round'})));
  defs.append(mask);
  const sky=element('g',{'mask':`url(#${mask.id})`,class:'world-sky'});
  const stars=element('g',{class:'world-stars',fill:'#e9e0bf',opacity:0});
  let accepted=0;
  for(let i=0;i<1500&&accepted<48;i++) {
    const x=random(i+index*79+22)*2172,y=12+random(i+index*37+82)*151;
    if(!skyContains(index,x,y))continue;
    stars.append(element('circle',{cx:x,cy:y,r:.55+random(i+2)*1.2,'data-sky-star':'',opacity:.4+random(i+901)*.5}));accepted++;
  }
  const [mx,my]=MOON_ANCHORS[index];
  const moon=element('g',{class:'world-moon',transform:`translate(${mx} ${my})`,opacity:0,'data-world-x':mx,'data-world-y':my});
  const disk=element('g');
  disk.append(element('circle',{r:1,fill:'#d8d3bc',opacity:.035}));
  const lit=element('path',{fill:'#e9dec3',stroke:'#f0e5c9','stroke-width':.012});disk.append(lit);moon.append(disk);
  const rainbow=element('g',{class:'world-rainbow',opacity:0,'data-world-x':1300,'data-world-y':330,fill:'none','stroke-width':5});
  ['#c88675','#cfaa72','#d4c58b','#9fb090','#8faeaa','#939eb3','#aaa0b6'].forEach((color,i)=>{
    const radius=292-i*5;
    rainbow.append(element('path',{d:`M${1300-radius} 330A${radius} ${radius} 0 0 1 ${1300+radius} 330`,stroke:color}));
  });
  sky.append(stars,moon,rainbow);layer.append(sky);
  const lights=element('g',{class:'world-windows',opacity:0});
  const lampGradient=element('radialGradient',{id:`world-window-glow-${index}`});
  lampGradient.append(element('stop',{offset:0,'stop-color':'#efae53','stop-opacity':.32}),element('stop',{offset:1,'stop-color':'#efae53','stop-opacity':.06}));defs.append(lampGradient);
  windows.forEach(([x,y,width,height])=>lights.append(element('rect',{class:'world-window',x,y,width,height,fill:`url(#${lampGradient.id})`,'data-world-x':x,'data-world-y':y})));
  layer.append(lights);
  const drops=element('g',{class:'world-eave-drops',opacity:0,stroke:'#dce5dd','stroke-width':1.6,'stroke-linecap':'round'});
  eaves.forEach(([x1,y1,x2,y2],row)=>{
    for(let i=0;i<9;i++) {
      const part=(i+.5)/9,x=x1+(x2-x1)*part,y=y1+(y2-y1)*part;
      const anchor=element('g',{transform:`translate(${x} ${y})`,'data-world-eave':''});
      const drop=element('path',{d:'M0 0v5'});
      const begin=`${-(i*.173+row*.41)}s`;
      animate(drop,{attributeName:'transform',type:'translate',values:'0 0;-1 8;-2 43',keyTimes:'0;.4;1',dur:'1.3s',begin},true);
      animate(drop,{attributeName:'opacity',values:'0;.85;0',keyTimes:'0;.2;1',dur:'1.3s',begin});
      anchor.append(drop);drops.append(anchor);
    }
  });
  const rings=element('g',{class:'world-rain-rings',opacity:0,fill:'none',stroke:'#e2e6d3','stroke-width':1.3,'clip-path':scene.ripples.getAttribute('clip-path')||'url(#spring-river-clip)'});
  const growing=[];
  if(index<6)for(let i=0;i<95;i++) {
    const x=random(i+index*19+8)*2172,y=290+random(i+301)*420;
    if(!scene.onWater({x,y}))continue;
    const ring=element('ellipse',{cx:x,cy:y,rx:2,ry:1,opacity:0});
    const begin=`${-i*.29}s`;
    const expansion=element('animate',{attributeName:'rx',from:2,to:22,dur:'1.5s',begin,repeatCount:'indefinite'});ring.append(expansion);growing.push(expansion);
    animate(ring,{attributeName:'ry',from:.5,to:5.5,dur:'1.5s',begin});
    animate(ring,{attributeName:'opacity',values:'0;.7;0',keyTimes:'0;.12;1',dur:'1.5s',begin});rings.append(ring);
  }
  layer.append(rings,drops);
  const cast=scene.svg.querySelector('.rural-life');
  scene.svg.querySelectorAll('.weather-smoke-cover').forEach(patch=>scene.svg.insertBefore(patch,cast));
  scene.svg.insertBefore(layer,cast);
  let moonDate='',rainBand=-1;
  return {
    setMoon(appearance) {
      if(moonDate===appearance.date.toISOString())return;
      moonDate=appearance.date.toISOString();lit.setAttribute('d',appearance.path);
      disk.setAttribute('transform',`scale(${26*appearance.scale})`);
      moon.dataset.moonPhase=appearance.phase.toFixed(3);moon.dataset.moonDistanceKm=appearance.distanceKm.toFixed(1);moon.dataset.moonRadius=(26*appearance.scale).toFixed(3);
      moon.dataset.moonIllumination=appearance.illumination.toFixed(4);
    },
    update(state,rainbowOwner,appearance,moonOwner) {
      const openSky=state.dark*(1-state.amount)**2;
      opacity(wash,state.dark*.76);opacity(stars,openSky);
      opacity(moon,index!==moonOwner||appearance.illumination<.003?0:openSky);
      opacity(lights,state.dark);opacity(rainbow,index===rainbowOwner?state.rainbow*.42:0);
      opacity(drops,index<6?state.rain*.85:0);opacity(rings,index<6?state.rain*.65:0);
      const band=Math.round(state.rain*4);
      if(band!==rainBand){growing.forEach(node=>node.setAttribute('to',14+band*6));rainBand=band;}
    }
  };
}
