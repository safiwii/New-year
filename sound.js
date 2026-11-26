class MidnightSoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.ambientGain = null;
    this.ambientStarted = false;
    this.ambientLevel = 0.035;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(this.muted ? 0 : this.ambientLevel, this.ctx.currentTime, 0.2);
    }
    return this.muted;
  }

  // Тёплая зимняя ночь: плывущие аккорды, музыкальная шкатулка, камин, тихий ветер
  startAmbient() {
    this.init();
    if (this.ambientStarted) return;
    this.ambientStarted = true;
    this.buildWinterNight();
  }

  // Мягкий шелест перелистывания страницы
  playPageFlip() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.22;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + 0.22);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  // Колокольчик за полученную звезду
  playStarChime() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    [1046.5, 1318.5, 1567.98].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.12, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + idx * 0.07 + 0.9);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.95);
    });
  }

  // Щелчок печатной машинки
  playTypeClick() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(240 + Math.random() * 60, now);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + this.ambientLevel);
  }

  // Хруст печенья
  playCookieCrack() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.16;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() > 0.65 ? (Math.random() * 2 - 1) : 0) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1400, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  // 12 ударов курантов
  playChimes12() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    for (let i = 0; i < 12; i++) {
      const start = now + i * 0.55;
      const osc = this.ctx.createOscillator();
      const overtone = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(220, start);
      overtone.type = "sine";
      overtone.frequency.setValueAtTime(440, start);

      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.85);

      osc.connect(gain);
      overtone.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      overtone.start(start);
      osc.stop(start + 0.9);
      overtone.stop(start + 0.9);
    }
  }
}

const soundFX = new MidnightSoundEngine();

// Настоящие звуки из config.js: если файл не указан или не загрузился, играет встроенный синтез.
(() => {
  const cfgS = (typeof ISSUE_CONFIG !== "undefined" && ISSUE_CONFIG.sounds) || {};
  const map = { playPageFlip: ["pageFlip", 0.55], playStarChime: ["starChime", 0.6], playTypeClick: ["typeClick", 0.35], playCookieCrack: ["cookieCrack", 0.85], playChimes12: ["chimes12", 0.9] };
  const buf = {};
  const fetchBuf = async (url) => soundFX.ctx.decodeAudioData(await (await fetch(url)).arrayBuffer());

  Object.entries(map).forEach(([method, [key, vol]]) => {
    const synth = soundFX[method].bind(soundFX);
    soundFX[method] = () => {
      const b = buf[key];
      if (!b) return synth();
      if (soundFX.muted) return;
      soundFX.init();
      const src = soundFX.ctx.createBufferSource(), g = soundFX.ctx.createGain();
      g.gain.value = vol; src.buffer = b; src.connect(g); g.connect(soundFX.ctx.destination); src.start();
    };
  });

  const synthAmbient = soundFX.startAmbient.bind(soundFX);
  soundFX.startAmbient = async () => {
    soundFX.init();
    // эффекты подгружаем после первого касания, когда браузер разрешает звук
    Object.values(map).forEach(([key]) => { if (cfgS[key] && buf[key] === undefined) { buf[key] = null; fetchBuf(cfgS[key]).then((b) => (buf[key] = b)).catch(() => (buf[key] = null)); } });
    if (!cfgS.ambient) return synthAmbient();
    if (soundFX.ambientStarted) return;
    soundFX.ambientStarted = true;
    soundFX.ambientLevel = cfgS.ambientVolume != null ? cfgS.ambientVolume : 0.18;
    try {
      const g = soundFX.ctx.createGain();
      g.gain.value = soundFX.muted ? 0 : soundFX.ambientLevel;
      g.connect(soundFX.ctx.destination);
      soundFX.ambientGain = g;
      const src = soundFX.ctx.createBufferSource();
      src.buffer = await fetchBuf(cfgS.ambient); src.loop = true; src.connect(g); src.start();
    } catch (e) { soundFX.ambientStarted = false; soundFX.ambientLevel = 0.035; synthAmbient(); }
  };
})();

MidnightSoundEngine.prototype.buildWinterNight = function () {
  const c = this.ctx, now = c.currentTime;
  this.ambientLevel = 0.5;
  const out = (this.ambientGain = c.createGain());
  out.gain.setValueAtTime(0, now);
  out.gain.linearRampToValueAtTime(this.muted ? 0 : this.ambientLevel, now + 5);
  out.connect(c.destination);

  // Комната: реверберация из сгенерированного импульса
  const len = c.sampleRate * 3, ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8); }
  const verb = c.createConvolver(); verb.buffer = ir;
  const wet = c.createGain(); wet.gain.value = 0.7; verb.connect(wet); wet.connect(out);
  const bus = c.createGain(); bus.connect(verb);
  const dry = c.createGain(); dry.gain.value = 0.45; bus.connect(dry); dry.connect(out);

  // Аккорды F - Dm - Bb - C плавно перетекают друг в друга
  const chords = [[174.61, 220, 261.63, 329.63, 392], [146.83, 174.61, 220, 261.63, 329.63], [116.54, 146.83, 174.61, 220, 261.63], [130.81, 164.81, 196, 293.66, 392]];
  let ci = 0;
  const pad = () => {
    const t = c.currentTime;
    chords[ci++ % 4].forEach((f, i) => [-5, 5].forEach((det) => {
      const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
      o.type = i % 2 ? "triangle" : "sine"; o.frequency.value = f; o.detune.value = det;
      lp.type = "lowpass"; lp.frequency.value = 950;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.028, t + 4.5); g.gain.linearRampToValueAtTime(0, t + 15);
      o.connect(lp); lp.connect(g); g.connect(bus); o.start(t); o.stop(t + 15.2);
    }));
  };
  pad(); setInterval(pad, 11000);

  // Музыкальная шкатулка: редкие колокольные ноты пентатоники
  const scale = [523.25, 587.33, 698.46, 783.99, 880, 1046.5, 1174.66];
  const bell = () => {
    const t = c.currentTime, f = scale[Math.floor(Math.random() * scale.length)];
    [[1, 0.05], [2.76, 0.018], [5.4, 0.007]].forEach(([k, v]) => {
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.value = f * k;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + 2.7);
    });
    setTimeout(bell, 2200 + Math.random() * 5200);
  };
  setTimeout(bell, 6000);

  // Камин (гул и потрескивание) и тихий ветер
  const nb = c.createBuffer(1, c.sampleRate * 4, c.sampleRate), nd = nb.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const loop = (type, freq, vol) => { const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = nb; s.loop = true; f.type = type; f.frequency.value = freq; g.gain.value = vol; s.connect(f); f.connect(g); s.start(); return g; };
  loop("lowpass", 180, 0.07).connect(dry);
  const wind = loop("bandpass", 520, 0.018); wind.connect(bus);
  const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 0.012; lfo.connect(lg); lg.connect(wind.gain); lfo.start();
  const crackle = () => {
    const t = c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = nb; f.type = "bandpass"; f.frequency.value = 1500 + Math.random() * 2800; f.Q.value = 1.2;
    g.gain.setValueAtTime(0.03 + Math.random() * 0.13, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.012 + Math.random() * 0.03);
    s.connect(f); f.connect(g); g.connect(dry); s.start(t, Math.random() * 3, 0.06);
    setTimeout(crackle, Math.random() < 0.25 ? 20 + Math.random() * 60 : 150 + Math.random() * 900);
  };
  crackle();
};
