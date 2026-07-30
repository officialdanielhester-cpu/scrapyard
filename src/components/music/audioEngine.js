// Original Web Audio engine for the Studio music editor.
// Playback scheduling, per-track mixing + real-time meters, recording,
// import/decode, offline WAV export, metronome, procedural samples, effects.

export const BUILTIN_SAMPLES = {
  // drums / percussion
  kick: { name: "Kick", duration: 0.4 },
  snare: { name: "Snare", duration: 0.3 },
  hihat: { name: "Hi-Hat", duration: 0.2 },
  openhat: { name: "Open Hat", duration: 0.5 },
  clap: { name: "Clap", duration: 0.3 },
  tom: { name: "Tom", duration: 0.4 },
  ride: { name: "Ride", duration: 0.6 },
  crash: { name: "Crash", duration: 0.8 },
  drum: { name: "Drum Hit", duration: 0.4 },
  noise: { name: "Noise", duration: 2.0 },
  // melodic / instruments
  bass: { name: "Bass", duration: 1.5 },
  piano: { name: "Piano", duration: 1.2 },
  strings: { name: "Strings", duration: 1.8 },
  pluck: { name: "Pluck", duration: 0.6 },
  synth: { name: "Synth", duration: 1.0 },
  lead: { name: "Lead", duration: 1.0 },
  organ: { name: "Organ", duration: 1.2 },
  flute: { name: "Flute", duration: 1.0 },
  guitar: { name: "Guitar", duration: 0.8 },
  marimba: { name: "Marimba", duration: 0.9 },
  pad: { name: "Soft Pad", duration: 0.6 },
  bell: { name: "Bell", duration: 1.2 },
  sine: { name: "Sine Tone", duration: 2.0 },
  saw: { name: "Saw Tone", duration: 2.0 },
  loop: { name: "Loop Snippet", duration: 3.0 },
};

function genBuffer(ctx, type, duration) {
  const len = Math.max(1, Math.floor(duration * 44100));
  const buf = ctx.createBuffer(1, len, 44100);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const t = i / 44100;
    let v = 0;
    switch (type) {
      case "kick": { const e = Math.exp(-t * 40); v = (Math.sin(t * 180) * 0.6 + (Math.random() * 2 - 1) * 0.2) * e; break; }
      case "snare": { const e = Math.exp(-t * 18); v = ((Math.random() * 2 - 1) * 0.5 + Math.sin(t * 200) * 0.2) * e; break; }
      case "hihat": { const e = Math.exp(-t * 60); v = (Math.random() * 2 - 1) * e * 0.4; break; }
      case "openhat": { const e = Math.exp(-t * 12); v = (Math.random() * 2 - 1) * e * 0.35; break; }
      case "clap": { const e = Math.exp(-t * 20); v = (Math.random() * 2 - 1) * e * 0.5; break; }
      case "tom": { const e = Math.exp(-t * 12); v = Math.sin(t * 120) * e * 0.6; break; }
      case "ride": { const e = Math.exp(-t * 6); v = ((Math.random() * 2 - 1) * 0.2 + Math.sin(t * 600) * 0.1) * e; break; }
      case "crash": { const e = Math.exp(-t * 4); v = (Math.random() * 2 - 1) * e * 0.5; break; }
      case "drum": { const e = Math.exp(-t * 30); v = (Math.random() * 2 - 1) * e * 0.9 + Math.sin(t * 220) * e * 0.3; break; }
      case "noise": v = (Math.random() * 2 - 1) * 0.45; break;
      case "bass": { const e = Math.exp(-t * 2.5); v = (Math.sin(t * 6.9) * 0.6 + Math.sin(t * 1.9) * 0.4) * e; break; }
      case "piano": { const e = Math.exp(-t * 4); v = Math.sin(t * 34.5) * e * 0.5; break; }
      case "strings": { const e = Math.exp(-t * 1.8); v = (Math.sin(t * 18.8) * 0.4 + Math.sin(t * 8.8 + 0.3) * 0.3 + Math.sin(t * 5 + 0.7) * 0.2) * e; break; }
      case "pluck": { const e = Math.exp(-t * 8); v = Math.sin(t * 20) * e * 0.5; break; }
      case "synth": { const e = Math.exp(-t * 3); v = (Math.sin(t * 15) * 0.4 + Math.sin(t * 30) * 0.2) * e; break; }
      case "lead": { const e = Math.exp(-t * 4); v = (Math.sin(t * 25) + Math.sin(t * 25.3)) * 0.3 * e; break; }
      case "organ": { const e = Math.exp(-t * 2); v = (Math.sin(t * 20) * 0.4 + Math.sin(t * 40) * 0.2) * e; break; }
      case "flute": { const e = Math.exp(-t * 1.5); v = Math.sin(t * 22) * e * 0.4; break; }
      case "guitar": { const e = Math.exp(-t * 6); v = (Math.sin(t * 16) * 0.4 + Math.sin(t * 32) * 0.2) * e; break; }
      case "marimba": { const e = Math.exp(-t * 5); v = (Math.sin(t * 30) * 0.5 + Math.sin(t * 60) * 0.2) * e; break; }
      case "pad": { const e = Math.exp(-t * 14) * (0.5 + Math.sin(t * 60) * 0.5); v = Math.sin(t * 11.3) * e * 0.5; break; }
      case "bell": v = Math.sin(t * 25.1) * Math.exp(-t * 3.2) * 0.8; break;
      case "sine": v = Math.sin(t * 13.8) * 0.5; break;
      case "saw": v = Math.tan(t * 5) * 0.1 * 0.5; break;
      case "loop": { const m = Math.sin(t * 9.4) * 0.5 + Math.sin(t * 4.4) * 0.5; v = m * 0.4 * (0.6 + Math.sin(t * 2) * 0.4); break; }
      default: v = 0;
    }
    d[i] = v;
  }
  return buf;
}

function genPianoBuffer(ctx, midi, duration) {
  const len = Math.max(1, Math.floor(duration * 44100));
  const buf = ctx.createBuffer(1, len, 44100);
  const d = buf.getChannelData(0);
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  const cycles = (freq * 2 * Math.PI) / 44100;
  for (let i = 0; i < len; i++) {
    const t = i / 44100;
    const env = Math.exp(-t * 5);
    d[i] = Math.sin(i * cycles) * env * 0.6;
  }
  return buf;
}

// Encode an AudioBuffer to a WAV Blob (16-bit PCM).
export function audioBufferToWav(buffer) {
  const numCh = buffer.numberOfChannels;
  const len = buffer.length * numCh * 2 + 44;
  const ab = new ArrayBuffer(len);
  const view = new DataView(ab);
  const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
  writeStr(0, "RIFF"); view.setUint32(4, len - 8, true); writeStr(8, "WAVE");
  writeStr(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true); view.setUint32(24, 44100, true);
  view.setUint32(28, 44100 * numCh * 2, true); view.setUint16(32, numCh * 2, true); view.setUint16(34, 16, true);
  writeStr(36, "data"); view.setUint32(40, len - 44, true);
  const channels = []; for (let c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c));
  let off = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      off += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}

export default class MusicEngine {
  constructor() {
    this.ctx = null;
    this.project = { tracks: [], clips: [], bpm: 120, masterVolume: 0.8, duration: 60 };
    this.bufferCache = new Map();
    this.playing = false;
    this._t0 = 0;
    this.pauseTime = 0;
    this.loop = true;
    this.onTime = null;
    this.onEnd = null;
    this.raf = null;
    this.masterGain = null;
    this.analyser = null;
    this.trackNodes = new Map();
    this.sources = [];
    this.meterData = null;
    this.onBeat = null;
    this._metTimer = null;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.project.masterVolume ?? 0.8;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.meterData = new Uint8Array(this.analyser.fftSize);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  setProject(p) { this.project = p; this._rebuildTracks(); }
  setLoop(v) { this.loop = v; }

  _rebuildTracks() {
    if (!this.ctx) return;
    const ids = new Set(this.project.tracks.map((t) => t.id));
    for (const [id, node] of this.trackNodes) {
      if (!ids.has(id)) { this._disposeTrack(node); this.trackNodes.delete(id); }
    }
    this.project.tracks.forEach((t) => this._buildTrack(t));
    this._applySoloMute();
  }

  _disposeTrack(node) {
    [node.input, node.eq, node.flangerDelay, node.distortion, node.tremoloGain, node.gain, node.delayWet].forEach((n) => { try { n.disconnect(); } catch {} });
    try { node.flangerLfo.stop(); node.tremoloLfo.stop(); } catch {}
    try { node.flangerLfo.disconnect(); node.flangerDepth.disconnect(); node.flangerFb.disconnect(); } catch {}
    try { node.tremoloLfo.disconnect(); node.tremoloDepth.disconnect(); } catch {}
    try { node.delay.disconnect(); node.delayFb.disconnect(); } catch {}
    if (node.compressor) { try { node.compressor.disconnect(); } catch {} }
    if (node.reverb) { try { node.reverb.delay.disconnect(); node.reverb.fb.disconnect(); } catch {} }
  }

  _buildTrack(track) {
    const existing = this.trackNodes.get(track.id);
    if (existing) this._disposeTrack(existing);
    const input = this.ctx.createGain();
    const eq = this.ctx.createBiquadFilter(); eq.type = "lowpass"; eq.frequency.value = 8000;
    const flangerDelay = this.ctx.createDelay(0.02); flangerDelay.delayTime.value = 0.003;
    const flangerLfo = this.ctx.createOscillator(); flangerLfo.type = "sine"; flangerLfo.frequency.value = 0.5;
    const flangerDepth = this.ctx.createGain(); flangerDepth.gain.value = 0;
    const flangerFb = this.ctx.createGain(); flangerFb.gain.value = 0;
    flangerLfo.connect(flangerDepth); flangerDepth.connect(flangerDelay.delayTime);
    try { flangerLfo.start(); } catch {}
    const distortion = this.ctx.createWaveShaper();
    const tremoloGain = this.ctx.createGain(); tremoloGain.gain.value = 1;
    const tremoloLfo = this.ctx.createOscillator(); tremoloLfo.type = "sine"; tremoloLfo.frequency.value = 5;
    const tremoloDepth = this.ctx.createGain(); tremoloDepth.gain.value = 0;
    tremoloLfo.connect(tremoloDepth); tremoloDepth.connect(tremoloGain.gain);
    try { tremoloLfo.start(); } catch {}
    const gain = this.ctx.createGain(); gain.gain.value = track.volume ?? 0.8;
    const delay = this.ctx.createDelay(); delay.delayTime.value = 0.3;
    const delayFb = this.ctx.createGain(); delayFb.gain.value = 0.3;
    const delayWet = this.ctx.createGain(); delayWet.gain.value = (track.delay || 0) * 0.5;
    input.connect(eq); eq.connect(flangerDelay); flangerDelay.connect(distortion); flangerDelay.connect(flangerFb); flangerFb.connect(flangerDelay);
    distortion.connect(tremoloGain); tremoloGain.connect(gain); gain.connect(this.masterGain);
    gain.connect(delay); delay.connect(delayFb); delayFb.connect(delay); delay.connect(delayWet); delayWet.connect(this.masterGain);
    const node = { input, eq, flangerDelay, flangerLfo, flangerDepth, flangerFb, distortion, compressor: null, tremoloGain, tremoloLfo, tremoloDepth, gain, delay, delayFb, delayWet, reverb: null };
    this._setEq(node, track.eq || "none");
    this._setFlanger(node, track.flanger || 0);
    this._setDistortion(node, track.distortion || 0);
    this._setCompressor(node, !!track.compressor);
    this._setTremolo(node, track.tremolo || 0);
    this._setDelay(node, track.delay || 0);
    this._setReverb(node, !!track.reverb);
    this.trackNodes.set(track.id, node);
  }

  _setEq(node, eq) {
    try {
      if (eq === "lowpass") { node.eq.type = "lowpass"; node.eq.frequency.value = 1200; }
      else if (eq === "highpass") { node.eq.type = "highpass"; node.eq.frequency.value = 300; }
      else { node.eq.type = "lowpass"; node.eq.frequency.value = 8000; }
    } catch {}
  }

  _setFlanger(node, v) {
    try {
      node.flangerDepth.gain.value = (v || 0) * 0.003;
      node.flangerFb.gain.value = (v || 0) * 0.4;
      node.flangerLfo.frequency.value = 0.2 + (v || 0) * 1.5;
    } catch {}
  }
  _setDistortion(node, v) {
    try { node.distortion.curve = (v || 0) > 0 ? this._makeDistortionCurve(v) : null; } catch {}
  }
  _makeDistortionCurve(amount) {
    const k = Math.max(0, amount) * 80;
    const n = 1024;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * Math.PI / 180) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }
  _setTremolo(node, v) { try { node.tremoloDepth.gain.value = (v || 0) * 0.5; node.tremoloLfo.frequency.value = 4 + (v || 0) * 6; } catch {} }
  _setDelay(node, v) { try { node.delayWet.gain.value = (v || 0) * 0.5; node.delayFb.gain.value = 0.2 + (v || 0) * 0.3; } catch {} }

  _setCompressor(node, on) {
    try { node.distortion.disconnect(); if (node.compressor) node.compressor.disconnect(); } catch {}
    if (on) {
      if (!node.compressor) node.compressor = this.ctx.createDynamicsCompressor();
      node.distortion.connect(node.compressor);
      node.compressor.connect(node.tremoloGain);
    } else {
      node.distortion.connect(node.tremoloGain);
    }
  }

  _setReverb(node, on) {
    if (on && !node.reverb) {
      try {
        const delay = this.ctx.createDelay();
        delay.delayTime.value = 0.045;
        const fb = this.ctx.createGain();
        fb.gain.value = 0.22;
        node.eq.connect(delay);
        delay.connect(fb);
        fb.connect(node.eq);
        node.reverb = { delay, fb };
      } catch {}
    } else if (!on && node.reverb) {
      try { node.reverb.delay.disconnect(); node.reverb.fb.disconnect(); } catch {}
      node.reverb = null;
    }
  }

  _applySoloMute() {
    const tracks = this.project.tracks || [];
    const anySolo = tracks.some((t) => t.solo);
    tracks.forEach((t) => {
      const node = this.trackNodes.get(t.id);
      if (!node) return;
      const muted = t.muted || (anySolo && !t.solo);
      node.gain.gain.value = muted ? 0 : (t.volume ?? 0.8);
    });
  }

  setTrackProp(id, patch) {
    const t = this.project.tracks.find((x) => x.id === id);
    if (!t) return;
    Object.assign(t, patch);
    const node = this.trackNodes.get(id);
    if (!node) return;
    if (patch.volume !== undefined || patch.muted !== undefined || patch.solo !== undefined) this._applySoloMute();
    if (patch.eq !== undefined) this._setEq(node, t.eq);
    if (patch.flanger !== undefined) this._setFlanger(node, t.flanger);
    if (patch.distortion !== undefined) this._setDistortion(node, t.distortion);
    if (patch.compressor !== undefined) this._setCompressor(node, t.compressor);
    if (patch.tremolo !== undefined) this._setTremolo(node, t.tremolo);
    if (patch.delay !== undefined) this._setDelay(node, t.delay);
    if (patch.reverb !== undefined) this._setReverb(node, t.reverb);
  }

  setMasterVolume(v) { this.project.masterVolume = v; if (this.masterGain) this.masterGain.gain.value = v; }

  async ensureSample(url) {
    if (!url) return null;
    if (this.bufferCache.has(url)) return this.bufferCache.get(url);
    if (!this.ctx) this.init();
    if (url.startsWith("builtin:")) {
      const type = url.split(":")[1];
      const meta = BUILTIN_SAMPLES[type] || { duration: 1 };
      const buf = genBuffer(this.ctx, type, meta.duration);
      this.bufferCache.set(url, buf);
      return buf;
    }
    try {
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      const buf = await this.ctx.decodeAudioData(arr);
      this.bufferCache.set(url, buf);
      return buf;
    } catch { return null; }
  }

  async loadProjectSamples(clips) {
    if (!clips) clips = this.project.clips;
    await Promise.all(clips.map((c) => this.ensureSample(c.sampleUrl)));
  }

  addBuiltin(type) {
    if (!this.ctx) this.init();
    const key = `builtin:${type}`;
    if (!this.bufferCache.has(key)) {
      const meta = BUILTIN_SAMPLES[type] || { duration: 1 };
      this.bufferCache.set(key, genBuffer(this.ctx, type, meta.duration));
    }
    return { key, name: BUILTIN_SAMPLES[type]?.name || "Sample", duration: BUILTIN_SAMPLES[type]?.duration || 1 };
  }

  async addFileSample(file) {
    if (!this.ctx) this.init();
    const key = URL.createObjectURL(file);
    const arr = await file.arrayBuffer();
    try {
      const buf = await this.ctx.decodeAudioData(arr);
      this.bufferCache.set(key, buf);
      return { key, name: file.name.replace(/\.[^.]+$/, ""), duration: buf.duration };
    } catch { URL.revokeObjectURL(key); return null; }
  }

  async addBlobSample(blob, name) {
    if (!this.ctx) this.init();
    const key = URL.createObjectURL(blob);
    const arr = await blob.arrayBuffer();
    try {
      const buf = await this.ctx.decodeAudioData(arr);
      this.bufferCache.set(key, buf);
      return { key, name: name || "Recording", duration: buf.duration };
    } catch { URL.revokeObjectURL(key); return null; }
  }

  async play(from = this.pauseTime) {
    if (!this.ctx) this.init();
    if (this.ctx.state === "suspended") { try { await this.ctx.resume(); } catch {} }
    await this.loadProjectSamples();
    this._stopSources();
    this.playing = true;
    this._t0 = this.ctx.currentTime - from;
    this._schedule(from);
    this._tick();
  }

  _schedule(from) {
    const { clips, tracks } = this.project;
    const trackIds = new Set(tracks.map((t) => t.id));
    clips.forEach((clip) => {
      if (!trackIds.has(clip.trackId)) return;
      const buffer = this.bufferCache.get(clip.sampleUrl);
      if (!buffer) return;
      const clipEnd = clip.start + clip.duration;
      if (clipEnd <= from) return;
      let startInBuffer = clip.sourceStart || 0;
      let whenStart = 0;
      let playDur = clip.duration;
      if (clip.start < from) { const into = from - clip.start; startInBuffer += into; playDur = clip.duration - into; }
      else { whenStart = clip.start - from; }
      if (playDur <= 0) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const node = this.trackNodes.get(clip.trackId);
      if (node) src.connect(node.input); else src.connect(this.masterGain);
      try { src.start(this.ctx.currentTime + whenStart, Math.max(0, startInBuffer), Math.max(0.02, playDur)); } catch {}
      this.sources.push(src);
      src.onended = () => { this.sources = this.sources.filter((s) => s !== src); };
    });
  }

  _tick = () => {
    if (!this.playing) return;
    const t = this.ctx.currentTime - this._t0;
    if (t >= (this.project.duration || 60)) {
      if (this.loop) { this.pauseTime = 0; this.play(0); return; }
      this.playing = false; this.pauseTime = 0; this.onTime?.(0); this.onEnd?.(); return;
    }
    this.onTime?.(t);
    this.raf = requestAnimationFrame(this._tick);
  };

  _stopSources() { this.sources.forEach((s) => { try { s.stop(); } catch {} try { s.disconnect(); } catch {} }); this.sources = []; if (this.raf) cancelAnimationFrame(this.raf); }

  pause() { if (!this.playing) return; this.pauseTime = this.ctx.currentTime - this._t0; this.playing = false; this._stopSources(); }
  stop() { this.playing = false; this._stopSources(); this.pauseTime = 0; this.onTime?.(0); }
  seek(t) { const d = this.project.duration || 60; const c = Math.max(0, Math.min(d, t)); this.pauseTime = c; if (this.playing) this.play(c); else this.onTime?.(c); }

  getMasterLevel() {
    if (!this.analyser) return 0;
    this.analyser.getByteTimeDomainData(this.meterData);
    let sum = 0;
    for (let i = 0; i < this.meterData.length; i += 16) { const v = (this.meterData[i] - 128) / 128; sum += v * v; }
    const rms = Math.sqrt(sum / (this.meterData.length / 16));
    return Math.min(1, rms * 1.6);
  }

  startRecording() {
    if (!this.ctx) this.init();
    return navigator.mediaDevices.getUserMedia({ audio: { noiseSuppression: true, echoCancellation: true } });
  }

  // ---- Metronome ----
  startMetronome(cb) {
    this.onBeat = cb;
    const interval = 60000 / (this.project.bpm || 120);
    if (this._metTimer) clearInterval(this._metTimer);
    this._metTimer = setInterval(() => { this._beep(); this.onBeat?.(); }, interval);
  }
  stopMetronome() { if (this._metTimer) clearInterval(this._metTimer); this._metTimer = null; }
  _beep() {
    if (!this.ctx) return;
    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.frequency.value = 880; g.gain.value = 0.12;
      o.connect(g); g.connect(this.masterGain);
      const now = this.ctx.currentTime;
      o.start(now); o.stop(now + 0.04);
    } catch {}
  }

  // ---- Live note/sample preview ----
  playNoteNow(midi) {
    if (!this.ctx) this.init();
    try {
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      o.connect(g); g.connect(this.masterGain);
      const now = this.ctx.currentTime;
      g.gain.setValueAtTime(0.25, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      o.start(now); o.stop(now + 0.4);
    } catch {}
  }

  playSampleNow(url) {
    if (!this.ctx) this.init();
    this.ensureSample(url).then((buf) => {
      if (!buf) return;
      try {
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const g = this.ctx.createGain(); g.gain.value = 0.6;
        src.connect(g); g.connect(this.masterGain);
        src.start();
      } catch {}
    });
  }

  addPianoNote(midi) {
    if (!this.ctx) this.init();
    const key = `piano:${midi}`;
    if (!this.bufferCache.has(key)) this.bufferCache.set(key, genPianoBuffer(this.ctx, midi, 0.6));
    const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const note = names[((midi % 12) + 12) % 12];
    const oct = Math.floor(midi / 12) - 1;
    return { key, name: `${note}${oct}`, duration: 0.6 };
  }

  // ---- Offline WAV export (master + per-track stems) ----
  async exportWAV() {
    await this.loadProjectSamples();
    const dur = this.project.duration || 60;
    const Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const off = new Off(2, Math.ceil(dur * 44100), 44100);
    const master = off.createGain(); master.gain.value = this.project.masterVolume ?? 0.8;
    master.connect(off.destination);
    const anySolo = this.project.tracks.some((t) => t.solo);
    this.project.tracks.forEach((track) => {
      const muted = track.muted || (anySolo && !track.solo);
      const tg = off.createGain(); tg.gain.value = muted ? 0 : (track.volume ?? 0.8);
      tg.connect(master);
      this.project.clips.filter((c) => c.trackId === track.id).forEach((clip) => {
        const buf = this.bufferCache.get(clip.sampleUrl); if (!buf) return;
        const src = off.createBufferSource(); src.buffer = buf;
        src.connect(tg);
        try { src.start(clip.start, clip.sourceStart || 0, clip.duration); } catch {}
      });
    });
    const rendered = await off.startRendering();
    return audioBufferToWav(rendered);
  }

  async exportStems() {
    await this.loadProjectSamples();
    const dur = this.project.duration || 60;
    const Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const results = [];
    for (const track of this.project.tracks) {
      const off = new Off(2, Math.ceil(dur * 44100), 44100);
      const tg = off.createGain(); tg.gain.value = track.volume ?? 0.8; tg.connect(off.destination);
      this.project.clips.filter((c) => c.trackId === track.id).forEach((clip) => {
        const buf = this.bufferCache.get(clip.sampleUrl); if (!buf) return;
        const src = off.createBufferSource(); src.buffer = buf; src.connect(tg);
        try { src.start(clip.start, clip.sourceStart || 0, clip.duration); } catch {}
      });
      const rendered = await off.startRendering();
      results.push({ name: track.name, blob: audioBufferToWav(rendered) });
    }
    return results;
  }
}