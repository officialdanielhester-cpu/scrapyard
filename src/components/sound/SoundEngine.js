// Web Audio API synthesis engine — all instruments synthesized programmatically.
// Supports per-track pan/solo, master volume, live key play, sample playback, and recording.

const NOTE_FREQS = {
  C: 261.63, "C#": 277.18, D: 293.66, "D#": 311.13,
  E: 329.63, F: 349.23, "F#": 369.99, G: 392.0,
  "G#": 415.3, A: 440.0, "A#": 466.16, B: 493.88,
};
const SCALE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const BASE_FREQ = 261.63; // C4

function noteFreq(rootIndex, octave, semitoneOffset) {
  const offset = semitoneOffset || 0;
  const idx = (rootIndex + offset + 12) % 12;
  const oct = octave + Math.floor((rootIndex + offset) / 12);
  return NOTE_FREQS[SCALE_NAMES[idx]] * Math.pow(2, oct - 4);
}

// Default octave per instrument family — keeps bass/low voices in register.
const OCTAVE = { bass: 2, acid: 2, wobble: 2, tom: 3, pad: 3 };

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.recordDest = null;
    this.isPlaying = false;
    this.currentStep = 0;
    this.bpm = 120;
    this.tracks = [];
    this.samples = {}; // sampleId -> AudioBuffer
    this.onStep = null;
    this._timer = null;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.75;
    const compressor = this.ctx.createDynamicsCompressor();
    this.master.connect(compressor);
    compressor.connect(this.ctx.destination);
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  setTracks(tracks) { this.tracks = tracks; }
  setBpm(bpm) { this.bpm = bpm; }
  setMasterVolume(vol) { if (this.master) this.master.gain.value = vol; }

  stepDuration() { return 60 / this.bpm / 4; }

  play() {
    this.init(); this.resume();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this._nextTime = this.ctx.currentTime + 0.05;
    this._schedule();
  }

  stop() {
    this.isPlaying = false;
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    this.currentStep = 0;
    if (this.onStep) this.onStep(-1);
  }

  _schedule() {
    if (!this.isPlaying) return;
    const lookahead = 0.1;
    while (this._nextTime < this.ctx.currentTime + lookahead) {
      this._scheduleStep(this.currentStep, this._nextTime);
      this._nextTime += this.stepDuration();
      this.currentStep = (this.currentStep + 1) % 16;
    }
    this._timer = setTimeout(() => this._schedule(), 25);
  }

  _scheduleStep(step, time) {
    const hasSolo = this.tracks.some((t) => t.solo);
    const delay = (time - this.ctx.currentTime) * 1000;
    for (const track of this.tracks) {
      if (track.muted) continue;
      if (hasSolo && !track.solo) continue;
      if (track.steps[step]) this._trigger(track, time);
    }
    const self = this;
    setTimeout(() => { if (self.onStep) self.onStep(step); }, Math.max(0, delay));
  }

  _destForPan(pan) {
    if (pan && pan !== 0) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = pan;
      panner.connect(this.master);
      return panner;
    }
    return this.master;
  }

  _trigger(track, time) {
    const dest = this._destForPan(track.pan);
    const vol = track.volume ?? 0.7;
    if (track.instrument === "sample") {
      const buffer = this.samples[track.id];
      if (buffer) this._sample(time, vol, dest, buffer);
      return;
    }
    const freq = noteFreq(track.rootNote || 0, OCTAVE[track.instrument] ?? 4, 0);
    this._triggerVoice(track.instrument, time, vol, freq, dest);
  }

  _triggerVoice(instrument, time, vol, freq, dest) {
    switch (instrument) {
      case "kick": this._kick(time, vol, dest); break;
      case "snare": this._snare(time, vol, dest); break;
      case "hihat": this._hihat(time, vol, dest); break;
      case "openhat": this._openhat(time, vol, dest); break;
      case "clap": this._clap(time, vol, dest); break;
      case "cowbell": this._cowbell(time, vol, dest); break;
      case "tom": this._tom(time, vol, dest, freq); break;
      case "bass": this._bass(time, vol, dest, freq); break;
      case "acid": this._acid(time, vol, dest, freq); break;
      case "wobble": this._wobble(time, vol, dest, freq); break;
      case "piano": this._piano(time, vol, dest, freq); break;
      case "fm": this._fm(time, vol, dest, freq); break;
      case "organ": this._organ(time, vol, dest, freq); break;
      case "bell": this._bell(time, vol, dest, freq); break;
      case "lead": this._lead(time, vol, dest, freq); break;
      case "sawlead": this._sawlead(time, vol, dest, freq); break;
      case "square": this._square(time, vol, dest, freq); break;
      case "brass": this._brass(time, vol, dest, freq); break;
      case "strings": this._strings(time, vol, dest, freq); break;
      case "choir": this._choir(time, vol, dest, freq); break;
      case "pluck": this._pluck(time, vol, dest, freq); break;
      case "pad": this._pad(time, vol, dest, freq); break;
      case "arp": this._arp(time, vol, dest, freq); break;
      case "ride": this._ride(time, vol, dest); break;
      case "crash": this._crash(time, vol, dest); break;
      case "rim": this._rim(time, vol, dest); break;
      case "shaker": this._shaker(time, vol, dest); break;
      case "kalimba": this._kalimba(time, vol, dest, freq); break;
      case "music_box": this._music_box(time, vol, dest, freq); break;
      case "sitar": this._sitar(time, vol, dest, freq); break;
      default: break;
    }
  }

  // Live play — semitone offset from C4 (use negative for lower octaves).
  playKey(instrument, semitone, vol, pan) {
    this.init(); this.resume();
    const dest = this._destForPan(pan);
    const freq = BASE_FREQ * Math.pow(2, semitone / 12);
    this._triggerVoice(instrument, this.ctx.currentTime, vol ?? 0.7, freq, dest);
  }

  // One-shot sample preview.
  playSample(sampleId, vol) {
    this.init(); this.resume();
    const buffer = this.samples[sampleId];
    if (!buffer) return;
    this._sample(this.ctx.currentTime, vol ?? 0.8, this.master, buffer);
  }

  async loadSample(sampleId, url) {
    this.init();
    try {
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      const buffer = await this.ctx.decodeAudioData(arr);
      this.samples[sampleId] = buffer;
      return true;
    } catch (e) {
      return false;
    }
  }

  // MediaStream tap of the master bus for recording.
  getRecordStream() {
    this.init();
    if (!this.recordDest) {
      this.recordDest = this.ctx.createMediaStreamDestination();
      this.master.connect(this.recordDest);
    }
    return this.recordDest.stream;
  }

  // ---- Sample playback ----
  _sample(time, vol, dest, buffer) {
    if (!buffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    src.connect(gain); gain.connect(dest);
    src.start(time);
  }

  // ---- Drums / percussion ----
  _kick(time, vol, dest) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    gain.gain.setValueAtTime(vol * 0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    osc.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.5);
  }

  _snare(time, vol, dest) {
    const noise = this._noise(0.2);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass"; filter.frequency.value = 1000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    noise.connect(filter); filter.connect(gain); gain.connect(dest);
    noise.start(time); noise.stop(time + 0.2);
    const osc = this.ctx.createOscillator();
    osc.type = "triangle"; osc.frequency.value = 180;
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(vol * 0.3, time);
    g2.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(g2); g2.connect(dest);
    osc.start(time); osc.stop(time + 0.1);
  }

  _hihat(time, vol, dest) {
    const noise = this._noise(0.05);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass"; filter.frequency.value = 7000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    noise.connect(filter); filter.connect(gain); gain.connect(dest);
    noise.start(time); noise.stop(time + 0.05);
  }

  _openhat(time, vol, dest) {
    const noise = this._noise(0.35);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass"; filter.frequency.value = 6000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
    noise.connect(filter); filter.connect(gain); gain.connect(dest);
    noise.start(time); noise.stop(time + 0.35);
  }

  _clap(time, vol, dest) {
    const self = this;
    [0, 0.01, 0.02, 0.03].forEach((offset) => {
      const noise = self._noise(0.1);
      const filter = self.ctx.createBiquadFilter();
      filter.type = "bandpass"; filter.frequency.value = 1500; filter.Q.value = 1;
      const gain = self.ctx.createGain();
      gain.gain.setValueAtTime(vol * 0.4, time + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, time + offset + 0.1);
      noise.connect(filter); filter.connect(gain); gain.connect(dest);
      noise.start(time + offset); noise.stop(time + offset + 0.1);
    });
  }

  _cowbell(time, vol, dest) {
    const osc1 = this.ctx.createOscillator();
    osc1.type = "square"; osc1.frequency.value = 560;
    const osc2 = this.ctx.createOscillator();
    osc2.type = "square"; osc2.frequency.value = 845;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass"; filter.frequency.value = 800;
    osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(dest);
    osc1.start(time); osc1.stop(time + 0.15);
    osc2.start(time); osc2.stop(time + 0.15);
  }

  _tom(time, vol, dest, freq) {
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, time + 0.3);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    osc.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.3);
  }

  // ---- Bass ----
  _bass(time, vol, dest, freq) {
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth"; osc.frequency.value = freq;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(100, time + 0.3);
    filter.Q.value = 5;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    osc.connect(filter); filter.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.3);
  }

  _acid(time, vol, dest, freq) {
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth"; osc.frequency.value = freq;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass"; filter.Q.value = 12;
    filter.frequency.setValueAtTime(200, time);
    filter.frequency.exponentialRampToValueAtTime(3000, time + 0.05);
    filter.frequency.exponentialRampToValueAtTime(200, time + 0.25);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    osc.connect(filter); filter.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.25);
  }

  _wobble(time, vol, dest, freq) {
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth"; osc.frequency.value = freq;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.value = 400; filter.Q.value = 8;
    const lfo = this.ctx.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 8;
    const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 600;
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    osc.connect(filter); filter.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.3);
    lfo.start(time); lfo.stop(time + 0.3);
  }

  // ---- Keys ----
  _piano(time, vol, dest, freq) {
    const carrier = this.ctx.createOscillator();
    carrier.type = "sine"; carrier.frequency.value = freq;
    const modulator = this.ctx.createOscillator();
    modulator.type = "sine"; modulator.frequency.value = freq * 2;
    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(freq * 3, time);
    modGain.gain.exponentialRampToValueAtTime(0.1, time + 0.4);
    modulator.connect(modGain); modGain.connect(carrier.frequency);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    carrier.connect(gain); gain.connect(dest);
    carrier.start(time); carrier.stop(time + 0.4);
    modulator.start(time); modulator.stop(time + 0.4);
  }

  _fm(time, vol, dest, freq) {
    const carrier = this.ctx.createOscillator();
    carrier.type = "sine"; carrier.frequency.value = freq;
    const mod = this.ctx.createOscillator();
    mod.type = "sine"; mod.frequency.value = freq * 14;
    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(freq * 4, time);
    modGain.gain.exponentialRampToValueAtTime(0.1, time + 0.5);
    mod.connect(modGain); modGain.connect(carrier.frequency);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol * 0.35, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
    carrier.connect(gain); gain.connect(dest);
    carrier.start(time); carrier.stop(time + 0.6);
    mod.start(time); mod.stop(time + 0.6);
  }

  _organ(time, vol, dest, freq) {
    [1, 2, 3, 4, 6].forEach((m) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sine"; osc.frequency.value = freq * m;
      const gain = this.ctx.createGain();
      const amp = vol * (m === 1 ? 0.25 : m === 2 ? 0.18 : m === 3 ? 0.1 : 0.06);
      gain.gain.setValueAtTime(amp, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
      osc.connect(gain); gain.connect(dest);
      osc.start(time); osc.stop(time + 0.5);
    });
  }

  _bell(time, vol, dest, freq) {
    const carrier = this.ctx.createOscillator();
    carrier.type = "sine"; carrier.frequency.value = freq * 2;
    const mod = this.ctx.createOscillator();
    mod.type = "sine"; mod.frequency.value = freq * 3;
    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(freq * 8, time);
    modGain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
    mod.connect(modGain); modGain.connect(carrier.frequency);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
    carrier.connect(gain); gain.connect(dest);
    carrier.start(time); carrier.stop(time + 0.8);
    mod.start(time); mod.stop(time + 0.8);
  }

  // ---- Synths ----
  _lead(time, vol, dest, freq) {
    const osc = this.ctx.createOscillator();
    osc.type = "square"; osc.frequency.value = freq;
    const osc2 = this.ctx.createOscillator();
    osc2.type = "sawtooth"; osc2.frequency.value = freq * 1.005;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.value = 3000;
    osc.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.25);
    osc2.start(time); osc2.stop(time + 0.25);
  }

  _sawlead(time, vol, dest, freq) {
    const osc1 = this.ctx.createOscillator();
    osc1.type = "sawtooth"; osc1.frequency.value = freq;
    const osc2 = this.ctx.createOscillator();
    osc2.type = "sawtooth"; osc2.frequency.value = freq * 1.007;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.value = 3500; filter.Q.value = 1;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol * 0.3, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(dest);
    osc1.start(time); osc1.stop(time + 0.4);
    osc2.start(time); osc2.stop(time + 0.4);
  }

  _square(time, vol, dest, freq) {
    const osc = this.ctx.createOscillator();
    osc.type = "square"; osc.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    osc.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.2);
  }

  _brass(time, vol, dest, freq) {
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth"; osc.frequency.value = freq;
    const osc2 = this.ctx.createOscillator();
    osc2.type = "sawtooth"; osc2.frequency.value = freq * 1.005;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.linearRampToValueAtTime(2500, time + 0.1);
    filter.frequency.exponentialRampToValueAtTime(800, time + 0.4);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol * 0.25, time + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    osc.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.4);
    osc2.start(time); osc2.stop(time + 0.4);
  }

  _strings(time, vol, dest, freq) {
    [1, 1.003, 0.997].forEach((m) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth"; osc.frequency.value = freq * m;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass"; filter.frequency.value = 2200;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol * 0.12, time + 0.08);
      gain.gain.linearRampToValueAtTime(0.001, time + 0.6);
      osc.connect(filter); filter.connect(gain); gain.connect(dest);
      osc.start(time); osc.stop(time + 0.6);
    });
  }

  _choir(time, vol, dest, freq) {
    [1, 1.005, 0.995, 2.01].forEach((m) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sine"; osc.frequency.value = freq * m;
      const vibrato = this.ctx.createOscillator();
      vibrato.type = "sine"; vibrato.frequency.value = 5;
      const vibGain = this.ctx.createGain(); vibGain.gain.value = freq * 0.01;
      vibrato.connect(vibGain); vibGain.connect(osc.frequency);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol * 0.1, time + 0.15);
      gain.gain.linearRampToValueAtTime(0.001, time + 0.7);
      osc.connect(gain); gain.connect(dest);
      osc.start(time); osc.stop(time + 0.7);
      vibrato.start(time); vibrato.stop(time + 0.7);
    });
  }

  _pluck(time, vol, dest, freq) {
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth"; osc.frequency.value = freq;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.setValueAtTime(4000, time);
    filter.frequency.exponentialRampToValueAtTime(200, time + 0.2);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    osc.connect(filter); filter.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.2);
  }

  _pad(time, vol, dest, freq) {
    [1, 1.003, 0.997, 2].forEach((m) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth"; osc.frequency.value = freq * m;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol * 0.15, time + 0.05);
      gain.gain.linearRampToValueAtTime(0.001, time + 0.5);
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass"; filter.frequency.value = 2000;
      osc.connect(filter); filter.connect(gain); gain.connect(dest);
      osc.start(time); osc.stop(time + 0.5);
    });
  }

  _arp(time, vol, dest, freq) {
    [0, 4, 7, 12].forEach((semi, i) => {
      const f = freq * Math.pow(2, semi / 12);
      const osc = this.ctx.createOscillator();
      osc.type = "square"; osc.frequency.value = f;
      const gain = this.ctx.createGain();
      const t = time + i * 0.04;
      gain.gain.setValueAtTime(vol * 0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain); gain.connect(dest);
      osc.start(t); osc.stop(t + 0.08);
    });
  }

  // ---- Cymbals & auxiliary percussion ----
  _ride(time, vol, dest) {
    const o1 = this.ctx.createOscillator(); o1.type = "square"; o1.frequency.value = 498;
    const o2 = this.ctx.createOscillator(); o2.type = "square"; o2.frequency.value = 745;
    const bp = this.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 7600; bp.Q.value = 0.7;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.16, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    o1.connect(bp); o2.connect(bp); bp.connect(gain); gain.connect(dest);
    o1.start(time); o1.stop(time + 0.5);
    o2.start(time); o2.stop(time + 0.5);
    const noise = this._noise(0.5);
    const nf = this.ctx.createBiquadFilter(); nf.type = "highpass"; nf.frequency.value = 8000;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(vol * 0.1, time);
    ng.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    noise.connect(nf); nf.connect(ng); ng.connect(dest);
    noise.start(time); noise.stop(time + 0.5);
  }

  _crash(time, vol, dest) {
    const noise = this._noise(0.9);
    const hp = this.ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 5000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.9);
    noise.connect(hp); hp.connect(gain); gain.connect(dest);
    noise.start(time); noise.stop(time + 0.9);
    const o = this.ctx.createOscillator(); o.type = "square"; o.frequency.value = 320;
    const obp = this.ctx.createBiquadFilter(); obp.type = "bandpass"; obp.frequency.value = 9000; obp.Q.value = 0.5;
    const og = this.ctx.createGain();
    og.gain.setValueAtTime(vol * 0.07, time);
    og.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    o.connect(obp); obp.connect(og); og.connect(dest);
    o.start(time); o.stop(time + 0.5);
  }

  _rim(time, vol, dest) {
    const o = this.ctx.createOscillator(); o.type = "triangle"; o.frequency.value = 420;
    const og = this.ctx.createGain();
    og.gain.setValueAtTime(vol * 0.28, time);
    og.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    o.connect(og); og.connect(dest);
    o.start(time); o.stop(time + 0.05);
    const noise = this._noise(0.04);
    const nf = this.ctx.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = 2400; nf.Q.value = 2;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(vol * 0.22, time);
    ng.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    noise.connect(nf); nf.connect(ng); ng.connect(dest);
    noise.start(time); noise.stop(time + 0.04);
  }

  _shaker(time, vol, dest) {
    const noise = this._noise(0.08);
    const hp = this.ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 6500;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol * 0.18, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    noise.connect(hp); hp.connect(gain); gain.connect(dest);
    noise.start(time); noise.stop(time + 0.08);
  }

  // ---- World / tuned instruments ----
  _kalimba(time, vol, dest, freq) {
    [1, 2, 3, 4].forEach((m) => {
      const o = this.ctx.createOscillator();
      o.type = "sine"; o.frequency.value = freq * m;
      const g = this.ctx.createGain();
      const amp = vol * (m === 1 ? 0.4 : m === 2 ? 0.18 : m === 3 ? 0.1 : 0.05);
      g.gain.setValueAtTime(amp, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
      o.connect(g); g.connect(dest);
      o.start(time); o.stop(time + 0.6);
    });
  }

  _music_box(time, vol, dest, freq) {
    const carrier = this.ctx.createOscillator();
    carrier.type = "sine"; carrier.frequency.value = freq * 2;
    const mod = this.ctx.createOscillator();
    mod.type = "sine"; mod.frequency.value = freq * 3.5;
    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(freq * 6, time);
    modGain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    mod.connect(modGain); modGain.connect(carrier.frequency);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.32, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    carrier.connect(gain); gain.connect(dest);
    carrier.start(time); carrier.stop(time + 0.5);
    mod.start(time); mod.stop(time + 0.5);
  }

  _sitar(time, vol, dest, freq) {
    const o1 = this.ctx.createOscillator(); o1.type = "sawtooth"; o1.frequency.value = freq;
    const o2 = this.ctx.createOscillator(); o2.type = "sawtooth"; o2.frequency.value = freq * 1.004;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.Q.value = 7;
    bp.frequency.setValueAtTime(freq * 5, time);
    bp.frequency.exponentialRampToValueAtTime(freq * 1.6, time + 0.35);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol * 0.3, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    o1.connect(bp); o2.connect(bp); bp.connect(gain); gain.connect(dest);
    o1.start(time); o1.stop(time + 0.5);
    o2.start(time); o2.stop(time + 0.5);
  }

  _noise(duration) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }
}

export const INSTRUMENTS = [
  // drums / percussion
  { id: "kick", name: "Kick", color: "#ef4444", melodic: false },
  { id: "snare", name: "Snare", color: "#f97316", melodic: false },
  { id: "hihat", name: "Hi-Hat", color: "#eab308", melodic: false },
  { id: "openhat", name: "Open Hat", color: "#d97706", melodic: false },
  { id: "clap", name: "Clap", color: "#84cc16", melodic: false },
  { id: "cowbell", name: "Cowbell", color: "#22c55e", melodic: false },
  { id: "tom", name: "Tom", color: "#14b8a6", melodic: true },
  { id: "ride", name: "Ride", color: "#0d9488", melodic: false },
  { id: "crash", name: "Crash", color: "#0891b2", melodic: false },
  { id: "rim", name: "Rim", color: "#65a30d", melodic: false },
  { id: "shaker", name: "Shaker", color: "#84cc16", melodic: false },
  // bass
  { id: "bass", name: "Bass", color: "#06b6d4", melodic: true },
  { id: "acid", name: "Acid 303", color: "#0891b2", melodic: true },
  { id: "wobble", name: "Wobble", color: "#0e7490", melodic: true },
  // keys
  { id: "piano", name: "Piano", color: "#3b82f6", melodic: true },
  { id: "fm", name: "FM E.Piano", color: "#6366f1", melodic: true },
  { id: "organ", name: "Organ", color: "#8b5cf6", melodic: true },
  { id: "bell", name: "Bell", color: "#a855f7", melodic: true },
  // synths
  { id: "lead", name: "Lead", color: "#6366f1", melodic: true },
  { id: "sawlead", name: "Saw Lead", color: "#7c3aed", melodic: true },
  { id: "square", name: "Square", color: "#9333ea", melodic: true },
  { id: "brass", name: "Brass", color: "#c026d3", melodic: true },
  { id: "strings", name: "Strings", color: "#d946ef", melodic: true },
  { id: "choir", name: "Choir", color: "#ec4899", melodic: true },
  { id: "pluck", name: "Pluck", color: "#8b5cf6", melodic: true },
  { id: "pad", name: "Pad", color: "#a855f7", melodic: true },
  { id: "arp", name: "Arp", color: "#d946ef", melodic: true },
  // world / tuned
  { id: "kalimba", name: "Kalimba", color: "#f59e0b", melodic: true },
  { id: "music_box", name: "Music Box", color: "#fbbf24", melodic: true },
  { id: "sitar", name: "Sitar", color: "#ea580c", melodic: true },
  // sample (recorded / imported — not shown in the add-track menu)
  { id: "sample", name: "Sample", color: "#94a3b8", melodic: false },
];

export const NOTE_NAMES = SCALE_NAMES;

export const DEFAULT_TRACKS = INSTRUMENTS.filter((i) => i.id !== "sample").map((inst) => ({
  id: inst.id, name: inst.name, instrument: inst.id,
  volume: 0.7, pan: 0, muted: false, solo: false, rootNote: 0, steps: Array(16).fill(0),
}));

export const DEFAULT_BEAT = [
  { id: "kick", name: "Kick", instrument: "kick", volume: 0.8, pan: 0, muted: false, solo: false, rootNote: 0, steps: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0] },
  { id: "snare", name: "Snare", instrument: "snare", volume: 0.7, pan: 0, muted: false, solo: false, rootNote: 0, steps: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0] },
  { id: "hihat", name: "Hi-Hat", instrument: "hihat", volume: 0.5, pan: 0, muted: false, solo: false, rootNote: 0, steps: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0] },
  { id: "clap", name: "Clap", instrument: "clap", volume: 0.6, pan: 0, muted: false, solo: false, rootNote: 0, steps: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0] },
  { id: "bass", name: "Bass", instrument: "bass", volume: 0.6, pan: 0, muted: false, solo: false, rootNote: 0, steps: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0] },
  { id: "piano", name: "Piano", instrument: "piano", volume: 0.45, pan: 0, muted: false, solo: false, rootNote: 0, steps: [0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0] },
  { id: "lead", name: "Lead", instrument: "lead", volume: 0.4, pan: 0, muted: false, solo: false, rootNote: 0, steps: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0] },
  { id: "pad", name: "Pad", instrument: "pad", volume: 0.3, pan: 0, muted: false, solo: false, rootNote: 0, steps: [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
];

export default new SoundEngine();