import test from 'node:test';
import assert from 'node:assert/strict';
import { WeatherModel } from '../src/weather-model.js';

test('rain starts and stops gradually; reversing mid-shower is continuous',()=>{
  const weather=new WeatherModel();weather.setWet(true);weather.step(3);
  const before=weather.amount;assert.ok(before>0&&before<.5);
  weather.setWet(false);assert.equal(weather.amount,before);weather.step(2);assert.ok(weather.amount<before);
  const turning=weather.amount;weather.setWet(true);assert.equal(weather.amount,turning);weather.step(10);assert.equal(weather.amount,1);
  weather.setWet(false);weather.step(4);assert.ok(weather.amount>0);weather.step(5);assert.equal(weather.amount,0);
});
test('summer rain is heavier than spring rain and winter precipitation is snow',()=>{
  const weather=new WeatherModel();weather.setWet(true);weather.step(10);const spring=weather.snapshot();
  weather.setSeason(1);const summer=weather.snapshot();assert.ok(summer.rain>spring.rain*3);assert.equal(summer.storm,true);assert.equal(summer.fieldRest,true);
  weather.setSeason(3);const winter=weather.snapshot();assert.equal(winter.rain,0);assert.equal(winter.snow,1);assert.equal(winter.storm,false);
});
test('insects and sparrows shelter during precipitation and return after a dry interval',()=>{
  const weather=new WeatherModel();weather.setWet(true);weather.step(3);assert.equal(weather.snapshot().birdShelter,true);
  weather.setWet(false);weather.step(9);assert.equal(weather.amount,0);weather.step(3);assert.equal(weather.snapshot().birdShelter,false);
  weather.setNight(true);weather.step(4);assert.equal(weather.snapshot().birdShelter,true);assert.equal(weather.snapshot().fieldRest,true);
});
test('a mature summer daytime shower yields a fading rainbow only after stopping',()=>{
  const weather=new WeatherModel();weather.setSeason(1);weather.setWet(true);weather.step(10);assert.equal(weather.snapshot().rainbow,0);
  weather.setWet(false);weather.step(8);assert.equal(weather.snapshot().rainbow,0);
  weather.step(1);weather.step(4);assert.ok(weather.snapshot().rainbow>.9);weather.step(38);assert.equal(weather.snapshot().rainbow,0);
});
test('night showers, interrupted drizzles, and a different season do not produce a rainbow',()=>{
  for(const scenario of ['night','short','season']){
    const weather=new WeatherModel();weather.setSeason(1);
    if(scenario==='night'){weather.setNight(true);weather.step(4);}
    weather.setWet(true);weather.step(scenario==='short'?1:10);
    if(scenario==='season')weather.setSeason(0);
    weather.setWet(false);weather.step(9);weather.setNight(false);weather.step(4);assert.equal(weather.snapshot().rainbow,0,scenario);
  }
});
test('starting another shower or switching to night clears an existing rainbow',()=>{
  for(const action of ['wet','night']){
    const weather=new WeatherModel();weather.setSeason(1);weather.setWet(true);weather.step(10);weather.setWet(false);weather.step(9);weather.step(4);
    assert.ok(weather.snapshot().rainbow>0);
    if(action==='wet')weather.setWet(true);else weather.setNight(true);
    assert.equal(weather.snapshot().rainbow,0);
  }
});
