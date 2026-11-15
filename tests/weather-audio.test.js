import test from 'node:test';
import assert from 'node:assert/strict';
import { WeatherAudio } from '../src/weather-audio.js';

class Param {
  constructor(value=0){this.value=value;}
  cancelScheduledValues(){}
  setTargetAtTime(value){this.value=value;}
  setValueAtTime(value){this.value=value;}
  linearRampToValueAtTime(value){this.value=value;}
  exponentialRampToValueAtTime(value){this.value=value;}
}
class AudioNode {
  constructor(){this.gain=new Param();this.frequency=new Param();this.Q=new Param();this.pan=new Param();this.threshold=new Param();this.ratio=new Param();}
  connect(){} disconnect(){}
  start(at){this.started=at??0;}
  stop(at){this.stopAt=at;if(at===undefined){this.stopped=true;this.onended?.();}}
}
class Context {
  constructor(){this.sampleRate=1000;this.currentTime=5;this.state='running';this.sources=[];this.destination={};}
  createGain(){return new AudioNode();}
  createBiquadFilter(){return new AudioNode();}
  createDynamicsCompressor(){return new AudioNode();}
  createStereoPanner(){return new AudioNode();}
  createBufferSource(){const node=new AudioNode();this.sources.push(node);return node;}
  createBuffer(channels,length){const data=Array.from({length:channels},()=>new Float32Array(length));return {getChannelData:c=>data[c]};}
  createAnalyser(){return {...new AudioNode(),connect(){},getFloatTimeDomainData:data=>data.fill(0)};}
  async resume(){this.state='running';}
  close(){this.state='closed';}
}
test('soundstage reuses two ambience loops across scenes and cancels pending thunder on pause or mute',async()=>{
  const previous=globalThis.window;globalThis.window={AudioContext:Context};
  try{
    const audio=new WeatherAudio();await audio.unlock();
    const rain={rain:1,wet:true,storm:true};
    for(let scene=0;scene<8;scene++)audio.update(rain,true,{level:.06,pan:0,scene});
    assert.equal(audio.context.sources.length,2);assert.equal(audio.levels.scene,7);
    audio.thunder(2);assert.equal(audio.thunders.size,1);assert.equal(audio.context.sources[2].started,7);
    audio.update(rain,false,{level:.06,pan:0,scene:7});
    assert.equal(audio.thunders.size,0);assert.equal(audio.levels.rain,0);assert.equal(audio.levels.river,0);assert.equal(audio.context.sources[2].stopped,true);
    audio.update(rain,true,{level:.1,pan:.8,scene:1});assert.ok(audio.levels.rain>0);assert.equal(audio.pan.pan.value,.8);
    audio.enabled=false;audio.update(rain,true,{level:.1,pan:0,scene:1});assert.equal(audio.master.gain.value,0);assert.equal(audio.levels.rain,0);assert.equal(audio.levels.river,0);
    assert.equal(audio.firecrackers(),false);
    let crackerEnds=0;audio.onCrackersEnded=()=>crackerEnds++;
    audio.enabled=true;audio.update(rain,true,{level:.1,pan:0,scene:6});assert.equal(audio.firecrackers(.3),true);assert.equal(audio.firecrackers(),false);
    const crackers=audio.crackers;audio.update(rain,false,{level:0,pan:0,scene:1});assert.equal(audio.crackers,null);assert.equal(crackers.stopped,true);assert.equal(crackerEnds,1);
    audio.close();
  }finally{globalThis.window=previous;}
});
