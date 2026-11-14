// One shared soundstage: two ambience loops, never one loop per painting.
export class WeatherAudio {
  constructor() { this.enabled = true; this.volume = .45; this.context = null; this.thunders = new Set(); this.levels = { rain: 0, river: 0 }; }
  async unlock() {
    if (!this.enabled) return;
    try {
      if (!this.context) this.build();
      if (this.context.state === 'suspended') await this.context.resume();
    } catch { this.unavailable = true; }
  }
  noise(seconds, brown = false) {
    const ctx = this.context, buffer = ctx.createBuffer(2, Math.ceil(ctx.sampleRate*seconds), ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c); let last = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random()*2-1;
        last = (last+.025*white)/1.025;
        data[i] = brown ? last*3.8 : white*(.78+.15*Math.sin(i/ctx.sampleRate*2.3+c));
      }
      // Blend the loop boundary to avoid a click on every repeat.
      const fade = Math.min(1024,data.length/4);
      for (let i = 0; i < fade; i++) data[i] = data[i]*(i/fade)+data[data.length-fade+i]*(1-i/fade);
    }
    return buffer;
  }
  build() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) { this.unavailable = true; return; }
    const ctx = this.context = new Audio();
    this.master = ctx.createGain(); this.master.gain.value = this.volume;
    const limiter = ctx.createDynamicsCompressor(); limiter.threshold.value = -15; limiter.ratio.value = 6;
    this.analyser = ctx.createAnalyser(); this.analyser.fftSize = 512;
    this.samples = new Float32Array(this.analyser.fftSize);
    this.master.connect(this.analyser); this.analyser.connect(limiter); limiter.connect(ctx.destination);
    const loop = (buffer, frequency, type) => {
      const source = ctx.createBufferSource(); source.buffer = buffer; source.loop = true;
      const filter = ctx.createBiquadFilter(); filter.type = type; filter.frequency.value = frequency; filter.Q.value = .35;
      const gain = ctx.createGain(); gain.gain.value = 0;
      source.connect(filter); filter.connect(gain); source.start();
      return { gain, filter, source };
    };
    this.rain = loop(this.noise(11), 3500, 'lowpass'); this.rain.gain.connect(this.master);
    this.river = loop(this.noise(13,true), 1300, 'lowpass');
    this.pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    this.river.gain.connect(this.pan); this.pan.connect(this.master);
    this.thunderBuffer = this.noise(6,true);
  }
  ramp(param, target, seconds = .8) {
    const now = this.context.currentTime;
    param.cancelScheduledValues(now); param.setTargetAtTime(target, now, Math.max(.02,seconds/3));
  }
  update(state, active, river) {
    const audible = active && this.enabled;
    const rain = audible ? state.rain*(.09+.12*state.rain) : 0;
    const water = audible ? river.level*(1+state.rain*.6) : 0;
    this.levels = { rain, river: water, scene: river.scene, pan: river.pan };
    if (!this.context) return;
    this.ramp(this.master.gain, this.enabled ? this.volume : 0, .35);
    this.ramp(this.rain.gain.gain, rain, .65);
    this.ramp(this.rain.filter.frequency, 2400+state.rain*2300, .8);
    this.ramp(this.river.gain.gain, water, .9);
    if (this.pan.pan) this.ramp(this.pan.pan, river.pan, .8);
    if (!audible || !state.storm || !state.wet) this.cancelThunder();
  }
  thunder(delay, pan = 0) {
    if (!this.context || !this.enabled || this.context.state !== 'running') return;
    const ctx = this.context, at = ctx.currentTime+delay;
    const source = ctx.createBufferSource(); source.buffer = this.thunderBuffer;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 420;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0,at); gain.gain.linearRampToValueAtTime(.58,at+.19);
    gain.gain.exponentialRampToValueAtTime(.22,at+.85); gain.gain.exponentialRampToValueAtTime(.001,at+5.7);
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    if (panner.pan) panner.pan.value = pan*.65;
    source.connect(filter); filter.connect(gain); gain.connect(panner); panner.connect(this.master);
    const item = { source, gain }; this.thunders.add(item);
    source.onended = () => { this.thunders.delete(item); source.disconnect(); filter.disconnect(); gain.disconnect(); panner.disconnect(); };
    source.start(at); source.stop(at+5.9);
  }
  cancelThunder() {
    for (const item of this.thunders) { try { item.source.stop(); } catch {} }
    this.thunders.clear();
  }
  close() {
    this.cancelThunder(); this.rain?.source.stop(); this.river?.source.stop(); this.context?.close();
  }
  meter() {
    if (!this.analyser || this.context.state !== 'running') return 0;
    this.analyser.getFloatTimeDomainData(this.samples);
    return Math.sqrt(this.samples.reduce((sum,value)=>sum+value*value,0)/this.samples.length);
  }
}
