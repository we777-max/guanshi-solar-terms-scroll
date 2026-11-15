export const FESTIVAL_STAGES = Object.freeze({
  ordinary:{name:'冬日平常',period:'年俗布置前',decorated:false,couplets:false,crackers:false},
  prepare:{name:'扫尘备年',period:'腊月下旬',decorated:true,couplets:false,crackers:false},
  eve:{name:'除夕迎新',period:'除夕至正月初一',decorated:true,couplets:true,crackers:true},
  lantern:{name:'上元观灯',period:'正月十五',decorated:true,couplets:true,crackers:false}
});

export class WaterwheelState {
  enabled=true;
  angle=0;
  toggle(){this.enabled=!this.enabled;return this.enabled;}
  step(seconds,playing){if(playing&&this.enabled)this.angle=(this.angle+Math.max(0,Math.min(seconds,.1))*18)%360;}
}

// A vertical wheel with a horizontal axle. Perspective narrows the circle;
// it must not shear the upright wheel or change height between axle ends.
export const MILL_WHEEL=Object.freeze({x:754,y:433,radius:89,scaleX:.56,depth:22});
export function projectWheelPoint(angle,depth=0){
  const radians=angle*Math.PI/180;
  return [MILL_WHEEL.x+depth+Math.cos(radians)*MILL_WHEEL.radius*MILL_WHEEL.scaleX,MILL_WHEEL.y+Math.sin(radians)*MILL_WHEEL.radius];
}

export class FestivalState {
  constructor(){this.setStage('eve');this.coupletVersion=0;}
  setStage(stage){
    if(!FESTIVAL_STAGES[stage])throw new RangeError('未知年俗阶段');
    this.stage=stage;this.couplets=FESTIVAL_STAGES[stage].couplets;this.lit=true;this.spent=false;this.burstAge=null;
  }
  changeCouplets(){this.couplets=true;this.coupletVersion=(this.coupletVersion+1)%2;}
  ignite(playing,wet){
    if(!playing||wet||!FESTIVAL_STAGES[this.stage].crackers||this.spent||this.burstAge!==null)return false;
    this.burstAge=0;this.spent=true;return true;
  }
  step(seconds,playing){
    if(this.burstAge===null)return;
    if(!playing){this.burstAge=null;return;}
    this.burstAge+=Math.max(0,Math.min(seconds,.1));
    if(this.burstAge>=2.8)this.burstAge=null;
  }
  rehang(){if(this.burstAge===null)this.spent=false;}
}
