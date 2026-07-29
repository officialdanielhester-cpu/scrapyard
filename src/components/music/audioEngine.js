// Original Web Audio engine for the Studio music editor.
// Playback scheduling, per-track mixing, real-time meters, recording,
// import/decode, and procedurally generated built-in samples.

export const BUILTIN_SAMPLES = {
  drum:  { name: "Drum Hit",     duration: 0.4 },
  pad:   { name: "Soft Pad",     duration: 0.6 },
  bell:  { name: "Bell",         duration: 1.2 },
  sine:  { name: "Sine Tone",    duration: 2.0 },
  saw:   { name: "Saw Tone",     duration: 2.0 },
  noise: { name: "Noise",        duration: 2.0 },
  loop:  { name: "Loop Snippet", duration: 3.0 },
};

function genBuffer(ctx, type, duration) {
  const len = Math.max(1, Math.floor(duration * 44100));
  const buf = ctx.createBuffer(1, len, 44100);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const t = i / 44100;
    let v = 0;
    switch (type) {
      case "drum": {
        const e = Math.exp(-t * 30);
        v = (Math.random() * 2 - 1) * e * 0.9 + Math.sin(t * 220) * e * 0.3;
        break;
      }
      case "pad": {
        const e = Math.exp(-t * 14) * (0.5 + Math.sin(t * 60) * 0.5);
        v = Math.sin(t * 180) * e * 0.5;
        break;
      }
      case "bell": v = Math.sin(t * Math.PI * 2 * 4) * Math.exp(-t * 3.2) * 0.8; break;
      case "sine": v = Math.sin(t * Math.PI * 2 * 2.2) * 0.5; break;
      case "saw":  v = (Math.tan(t * 5) * 0.2) * 0.5; break;
      case "noise": v = (Math.random() * 2 - 1) * 0.45; break;
      case "loop": {
        const m = Math.sin(t * Math.PI * 2 * 1.5) * 0.5 + Math.sin(t * Math.PI * 2 * 0.7) * 0.5;
        v = m * 0.4 * (0.6 + Math.sin(t * 2) * 0.4);
        break;
      }
      default: v = 0;
    }
    d[i] = v;
  }
  return buf;
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
      if (!ids.has(id)) { try { node.input.disconnect(); node.gain.disconnect(); } catch {} this.trackNodes.delete(id); }
    }
    this.project.tracks.forEach((t) => this._ensureTrack(t));
    this._applySoloMute();
  }

  _ensureTrack(track) {
    let node = this.trackNodes.get(track.id);
    if (!node) {
      const input = this.ctx.createGain();
      const eq = this.ctx.createBiquadFilter();
      eq.type = "lowpass";
      eq.frequency.value = 8000;
      const gain = this.ctx.createGain();
      input.connect(eq);
      eq.connect(gain);
      gain.connect(this.masterGain);
      node = { input, eq, gain, reverb: null };
      this.trackNodes.set(track.id, node);
    }
    node.gain.gain.value = track.volume ?? 0.8;
    this._setEq(node, track.eq || "none");
    this._setReverb(node, !!track.reverb);
    return node;
  }

  _setEq(node, eq) {
    try {
      if (eq === "lowpass") { node.eq.type = "lowpass"; node.eq.frequency.value = 1200; }
      else if (eq === "highpass") { node.eq.type = "highpass"; node.eq.frequency.value = 300; }
      else { node.eq.type = "lowpass"; node.eq.frequency.value = 8000; }
    } catch {}
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
      if (clip.start < from) {
        const into = from - clip.start;
        startInBuffer += into;
        playDur = clip.duration - into;
      } else {
        whenStart = clip.start - from;
      }
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
}