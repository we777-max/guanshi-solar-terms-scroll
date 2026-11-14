// Weather is an authored seasonal illustration, not a live forecast.
export const WEATHER_PROFILES = [
  { name: '春雨', kind: 'rain', rain: .25, drops: 75, speed: 190 },
  { name: '夏雷雨', kind: 'rain', rain: 1, drops: 420, speed: 640 },
  { name: '秋雨', kind: 'rain', rain: .48, drops: 165, speed: 300 },
  { name: '冬雪', kind: 'snow', rain: 0, drops: 160, speed: 26 }
];
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const x = clamp(value); return x*x*(3-2*x); };
function tween(from, to, duration) { return { from, to, duration, elapsed: 0 }; }
function advance(item, dt) { item.elapsed = Math.min(item.duration, item.elapsed+dt); return item.from+(item.to-item.from)*smooth(item.duration ? item.elapsed/item.duration : 1); }

export class WeatherModel {
  constructor() {
    this.season = 0; this.wet = false; this.night = false;
    this.amount = 0; this.dark = 0; this.time = 0; this.dryAge = 10;
    this.wetTween = tween(0,0,0); this.darkTween = tween(0,0,0);
    this.rainbowAge = null; this.eligible = false; this.rainAge = 0;
  }
  setSeason(season) {
    if (season === this.season) return;
    this.season = season; this.rainbowAge = null; this.eligible = false; this.rainAge = 0;
  }
  setWet(wet, instant = false) {
    if (wet === this.wet) return;
    this.wet = wet;
    this.wetTween = tween(this.amount, wet ? 1 : 0, instant ? 0 : wet ? 10 : 9);
    if (wet) { this.rainbowAge = null; this.eligible = false; this.dryAge = 0; this.rainAge = 0; }
    if (instant) this.step(0);
  }
  setNight(night, instant = false) {
    this.night = night; this.darkTween = tween(this.dark, night ? 1 : 0, instant ? 0 : 4);
    // A night shower must never produce a daytime rainbow later on a toggle.
    if (night) { this.rainbowAge = null; this.eligible = false; this.rainAge = 0; }
    if (instant) this.step(0);
  }
  step(dt) {
    this.time += dt;
    const previous = this.amount;
    this.amount = advance(this.wetTween, dt); this.dark = advance(this.darkTween, dt);
    if (this.wet && this.season === 1 && !this.night && this.dark < .1) this.rainAge += dt;
    if (this.wet && this.amount > .55 && this.rainAge >= 3 && this.season === 1 && !this.night && this.dark < .1) this.eligible = true;
    let rainbowStarted = false;
    if (!this.wet && previous > 0 && this.amount === 0) {
      if (this.eligible && this.season === 1 && !this.night && this.dark < .1) { this.rainbowAge = 0; rainbowStarted = true; }
      this.eligible = false;
    }
    this.dryAge = this.amount > .02 || previous > .02 ? 0 : this.dryAge+dt;
    if (this.rainbowAge !== null && !rainbowStarted) { this.rainbowAge += dt; if (this.rainbowAge > 38) this.rainbowAge = null; }
    return this.snapshot();
  }
  snapshot() {
    const profile = WEATHER_PROFILES[this.season];
    const rain = profile.rain*this.amount;
    const storm = this.season === 1 && this.amount > .48;
    const fieldRest = this.dark > .5 || storm || (this.season === 2 && this.amount > .16);
    const birdShelter = this.amount > .06 || this.dark > .45 || this.dryAge < 3;
    const rainbow = this.rainbowAge === null || this.night || this.wet ? 0 : smooth(this.rainbowAge/4)*smooth((38-this.rainbowAge)/9);
    return { season: this.season, profile, wet: this.wet, night: this.night, amount: this.amount,
      dark: this.dark, rain, snow: profile.kind === 'snow' ? this.amount : 0, time: this.time,
      storm, fieldRest, birdShelter, rainbow,
      transitioning: this.wetTween.elapsed < this.wetTween.duration || this.darkTween.elapsed < this.darkTween.duration,
      phase: this.wet ? this.amount < .98 ? '渐起' : '正盛' : this.amount > .01 ? '渐歇' : rainbow ? '雨霁虹现' : '晴' };
  }
}
