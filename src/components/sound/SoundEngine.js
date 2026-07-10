// Web Audio API synthesis engine — no external audio files needed.
// All instruments are synthesized programmatically.
// Supports per-track pan, solo, and master volume.

const NOTE_FREQS = {
  C: 261.63, "C#": 277.18, D: 293.66, "D#": 311.13,
  E: 329.63, F: 349.23, "F#": 369.99, G: 392.0,
  "G#": 415.3, A: 440.0, "A#": 466.16, B: 493.88,
};
const SCALE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteFreq(rootIndex, octave, semitoneOffset) {
  const offset = semitoneOffset || 0;
  const idx = (rootIndex + offset + 12) % 12;
  const oct = octave + Math.floor((rootIndex + offset) / 12);
  return NOTE_FREQS[SCALE_NAMES[idx]] * Math.pow(2, oct - 4);
}

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.isPlaying = false;
    this.currentStep = 0;
    this.bpm = 120;
    this.tracks = [];
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
  setMasterVolume(vol) {
    if (this.master) this.master.gain.value = vol;
  }

  stepDuration() {
    return 60 / this.bpm / 4;
  }

  play() {
    this.init();
    this.resume();
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
    const hasSolo = this.tracks.some(function (t) { return t.solo; });
    var delay = (time - this.ctx.currentTime) * 1000;
    for (var i = 0; i < this.tracks.length; i++) {
      var track = this.tracks[i];
      if (track.muted) continue;
      if (hasSolo && !track.solo) continue;
      if (track.steps[step]) {
        this._trigger(track.instrument, time, track.volume, track.rootNote, track.pan);
      }
    }
    var self = this;
    setTimeout(function () { if (self.onStep) self.onStep(step); }, Math.max(0, delay));
  }

  _trigger(instrument, time, volume, rootNote, pan) {
    var dest = this.master;
    if (pan && pan !== 0) {
      var panner = this.ctx.createStereoPanner();
      panner.pan.value = pan;
      panner.connect(this.master);
      dest = panner;
    }
    var vol = volume;
    var rn = rootNote || 0;
    switch (instrument) {
      case "kick": this._kick(time, vol, dest); break;
      case "snare": this._snare(time, vol, dest); break;
      case "hihat": this._hihat(time, vol, dest); break;
      case "openhat": this._openhat(time, vol, dest); break;
      case "clap": this._clap(time, vol, dest); break;
      case "cowbell": this._cowbell(time, vol, dest); break;
      case "tom": this._tom(time, vol, dest, noteFreq(rn, 3)); break;
      case "bass": this._bass(time, vol, dest, noteFreq(rn, 2)); break;
      case "piano": this._piano(time, vol, dest, noteFreq(rn, 4)); break;
      case "lead": this._lead(time, vol, dest, noteFreq(rn, 4)); break;
      case "pluck": this._pluck(time, vol, dest, noteFreq(rn, 4)); break;
      case "pad": this._pad(time, vol, dest, noteFreq(rn, 3)); break;
      case "arp": this._arp(time, vol, dest, noteFreq(rn, 4)); break;
    }
  }

  _kick(time, vol, dest) {
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    gain.gain.setValueAtTime(vol * 0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    osc.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.5);
  }

  _snare(time, vol, dest) {
    var noise = this._noise(0.2);
    var filter = this.ctx.createBiquadFilter();
    filter.type = "highpass"; filter.frequency.value = 1000;
    var gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    noise.connect(filter); filter.connect(gain); gain.connect(dest);
    noise.start(time); noise.stop(time + 0.2);

    var osc = this.ctx.createOscillator();
    osc.type = "triangle"; osc.frequency.value = 180;
    var g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(vol * 0.3, time);
    g2.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(g2); g2.connect(dest);
    osc.start(time); osc.stop(time + 0.1);
  }

  _hihat(time, vol, dest) {
    var noise = this._noise(0.05);
    var filter = this.ctx.createBiquadFilter();
    filter.type = "highpass"; filter.frequency.value = 7000;
    var gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    noise.connect(filter); filter.connect(gain); gain.connect(dest);
    noise.start(time); noise.stop(time + 0.05);
  }

  _openhat(time, vol, dest) {
    var noise = this._noise(0.35);
    var filter = this.ctx.createBiquadFilter();
    filter.type = "highpass"; filter.frequency.value = 6000;
    var gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
    noise.connect(filter); filter.connect(gain); gain.connect(dest);
    noise.start(time); noise.stop(time + 0.35);
  }

  _clap(time, vol, dest) {
    var self = this;
    [0, 0.01, 0.02, 0.03].forEach(function (offset) {
      var noise = self._noise(0.1);
      var filter = self.ctx.createBiquadFilter();
      filter.type = "bandpass"; filter.frequency.value = 1500; filter.Q.value = 1;
      var gain = self.ctx.createGain();
      gain.gain.setValueAtTime(vol * 0.4, time + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, time + offset + 0.1);
      noise.connect(filter); filter.connect(gain); gain.connect(dest);
      noise.start(time + offset); noise.stop(time + offset + 0.1);
    });
  }

  _cowbell(time, vol, dest) {
    var osc1 = this.ctx.createOscillator();
    osc1.type = "square"; osc1.frequency.value = 560;
    var osc2 = this.ctx.createOscillator();
    osc2.type = "square"; osc2.frequency.value = 845;
    var gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    var filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass"; filter.frequency.value = 800;
    osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(dest);
    osc1.start(time); osc1.stop(time + 0.15);
    osc2.start(time); osc2.stop(time + 0.15);
  }

  _tom(time, vol, dest, freq) {
    var osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, time + 0.3);
    var gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    osc.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.3);
  }

  _bass(time, vol, dest, freq) {
    var osc = this.ctx.createOscillator();
    osc.type = "sawtooth"; osc.frequency.value = freq;
    var filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(100, time + 0.3);
    filter.Q.value = 5;
    var gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    osc.connect(filter); filter.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.3);
  }

  _piano(time, vol, dest, freq) {
    var carrier = this.ctx.createOscillator();
    carrier.type = "sine"; carrier.frequency.value = freq;
    var modulator = this.ctx.createOscillator();
    modulator.type = "sine"; modulator.frequency.value = freq * 2;
    var modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(freq * 3, time);
    modGain.gain.exponentialRampToValueAtTime(0.1, time + 0.4);
    modulator.connect(modGain); modGain.connect(carrier.frequency);
    var gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    carrier.connect(gain); gain.connect(dest);
    carrier.start(time); carrier.stop(time + 0.4);
    modulator.start(time); modulator.stop(time + 0.4);
  }

  _lead(time, vol, dest, freq) {
    var osc = this.ctx.createOscillator();
    osc.type = "square"; osc.frequency.value = freq;
    var osc2 = this.ctx.createOscillator();
    osc2.type = "sawtooth"; osc2.frequency.value = freq * 1.005;
    var gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    var filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.value = 3000;
    osc.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.25);
    osc2.start(time); osc2.stop(time + 0.25);
  }

  _pluck(time, vol, dest, freq) {
    var osc = this.ctx.createOscillator();
    osc.type = "sawtooth"; osc.frequency.value = freq;
    var filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.setValueAtTime(4000, time);
    filter.frequency.exponentialRampToValueAtTime(200, time + 0.2);
    var gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    osc.connect(filter); filter.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.2);
  }

  _pad(time, vol, dest, freq) {
    var self = this;
    [1, 1.003, 0.997, 2].forEach(function (mult) {
      var osc = self.ctx.createOscillator();
      osc.type = "sawtooth"; osc.frequency.value = freq * mult;
      var gain = self.ctx.createGain();
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol * 0.15, time + 0.05);
      gain.gain.linearRampToValueAtTime(0.001, time + 0.5);
      var filter = self.ctx.createBiquadFilter();
      filter.type = "lowpass"; filter.frequency.value = 2000;
      osc.connect(filter); filter.connect(gain); gain.connect(dest);
      osc.start(time); osc.stop(time + 0.5);
    });
  }

  _arp(time, vol, dest, freq) {
    var self = this;
    [0, 4, 7, 12].forEach(function (semi, i) {
      var f = freq * Math.pow(2, semi / 12);
      var osc = self.ctx.createOscillator();
      osc.type = "square"; osc.frequency.value = f;
      var gain = self.ctx.createGain();
      var t = time + i * 0.04;
      gain.gain.setValueAtTime(vol * 0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain); gain.connect(dest);
      osc.start(t); osc.stop(t + 0.08);
    });
  }

  _noise(duration) {
    var bufferSize = this.ctx.sampleRate * duration;
    var buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    var source = this.ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }
}

export var INSTRUMENTS = [
  { id: "kick", name: "Kick", color: "#ef4444", melodic: false },
  { id: "snare", name: "Snare", color: "#f97316", melodic: false },
  { id: "hihat", name: "Hi-Hat", color: "#eab308", melodic: false },
  { id: "openhat", name: "Open Hat", color: "#d97706", melodic: false },
  { id: "clap", name: "Clap", color: "#84cc16", melodic: false },
  { id: "cowbell", name: "Cowbell", color: "#22c55e", melodic: false },
  { id: "tom", name: "Tom", color: "#14b8a6", melodic: true },
  { id: "bass", name: "Bass", color: "#06b6d4", melodic: true },
  { id: "piano", name: "Piano", color: "#3b82f6", melodic: true },
  { id: "lead", name: "Lead", color: "#6366f1", melodic: true },
  { id: "pluck", name: "Pluck", color: "#8b5cf6", melodic: true },
  { id: "pad", name: "Pad", color: "#a855f7", melodic: true },
  { id: "arp", name: "Arp", color: "#d946ef", melodic: true },
];

export var NOTE_NAMES = SCALE_NAMES;

export var DEFAULT_TRACKS = INSTRUMENTS.map(function (inst) {
  return {
    id: inst.id,
    name: inst.name,
    instrument: inst.id,
    volume: 0.7,
    pan: 0,
    muted: false,
    solo: false,
    rootNote: 0,
    steps: Array(16).fill(0),
  };
});

export var DEFAULT_BEAT = [
  { id: "kick", name: "Kick", instrument: "kick", volume: 0.8, pan: 0, muted: false, solo: false, rootNote: 0, steps: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0] },
  { id: "snare", name: "Snare", instrument: "snare", volume: 0.7, pan: 0, muted: false, solo: false, rootNote: 0, steps: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0] },
  { id: "hihat", name: "Hi-Hat", instrument: "hihat", volume: 0.5, pan: 0, muted: false, solo: false, rootNote: 0, steps: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0] },
  { id: "clap", name: "Clap", instrument: "clap", volume: 0.6, pan: 0, muted: false, solo: false, rootNote: 0, steps: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0] },
  { id: "bass", name: "Bass", instrument: "bass", volume: 0.6, pan: 0, muted: false, solo: false, rootNote: 0, steps: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0] },
  { id: "lead", name: "Lead", instrument: "lead", volume: 0.45, pan: 0, muted: false, solo: false, rootNote: 0, steps: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0] },
  { id: "pad", name: "Pad", instrument: "pad", volume: 0.35, pan: 0, muted: false, solo: false, rootNote: 0, steps: [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
];

export default new SoundEngine();