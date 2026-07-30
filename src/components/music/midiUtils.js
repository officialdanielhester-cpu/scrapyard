// Minimal MIDI file parser + encoder (pure JS, format-0/1 read, format-0 write).

function readVarLen(bytes, off) {
  let v = 0;
  for (;;) {
    const b = bytes[off++];
    v = (v << 7) | (b & 0x7f);
    if (!(b & 0x80)) break;
  }
  return { value: v, next: off };
}

// Parse a MIDI file into { tracks: [{ notes: [{ midi, start, duration, velocity }] }], tpq, tempo }
export function parseMidi(buffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 14) return { tracks: [] };
  const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (magic !== "MThd") return { tracks: [] };
  const ntrks = (bytes[10] << 8) | bytes[11];
  const division = (bytes[12] << 8) | bytes[13];
  const tpq = division & 0x8000 ? 480 : division;
  let off = 14;
  const tracks = [];
  let tempo = 500000;
  for (let tr = 0; tr < ntrks && off + 8 <= bytes.length; tr++) {
    const id = String.fromCharCode(bytes[off], bytes[off + 1], bytes[off + 2], bytes[off + 3]);
    if (id !== "MTrk") break;
    const len = (bytes[off + 4] << 24) | (bytes[off + 5] << 16) | (bytes[off + 6] << 8) | bytes[off + 7];
    off += 8;
    const end = off + len;
    let tick = 0;
    const notes = [];
    let status = 0;
    const active = {};
    while (off < end && off < bytes.length) {
      const d = readVarLen(bytes, off); off = d.next;
      tick += d.value;
      let b = bytes[off];
      if (b < 0x80) { b = status; } else { off++; }
      status = b;
      const type = b & 0xf0;
      if (type === 0x80 || type === 0x90) {
        const note = bytes[off]; const vel = bytes[off + 1]; off += 2;
        if (type === 0x90 && vel > 0) { active[note] = tick; }
        else { const s = active[note]; if (s !== undefined) { notes.push({ midi: note, startTick: s, durTick: tick - s, velocity: vel }); delete active[note]; } }
      } else if (type === 0xa0 || type === 0xb0 || type === 0xe0) { off += 2; }
      else if (type === 0xc0 || type === 0xd0) { off += 1; }
      else if (type === 0xf0) {
        if (b === 0xff) {
          const metaType = bytes[off]; off++;
          const ml = readVarLen(bytes, off); off = ml.next;
          if (metaType === 0x51 && ml.value === 3) { tempo = (bytes[off] << 16) | (bytes[off + 1] << 8) | bytes[off + 2]; }
          off += ml.value;
        } else {
          const ml = readVarLen(bytes, off); off = ml.next; off += ml.value;
        }
      } else { off += 1; }
    }
    const secPerTick = (tempo / 1000000) / tpq;
    notes.forEach((n) => { n.start = n.startTick * secPerTick; n.duration = Math.max(0.1, n.durTick * secPerTick); });
    tracks.push({ notes });
    off = end;
  }
  return { tracks, tpq, tempo };
}

// Encode notes [{ midi, start, duration, velocity }] into a format-0 MIDI Uint8Array.
export function encodeMidi(notes, opts = {}) {
  const tpq = opts.tpq || 480;
  const bpm = opts.bpm || 120;
  const tempo = Math.round(60000000 / bpm);
  const tickPerSec = (tpq * bpm) / 60;
  const ev = [];
  notes.forEach((n) => {
    const onTick = Math.round(n.start * tickPerSec);
    const offTick = Math.max(onTick + 1, Math.round((n.start + n.duration) * tickPerSec));
    ev.push({ tick: onTick, type: "on", midi: n.midi, vel: n.velocity || 100 });
    ev.push({ tick: offTick, type: "off", midi: n.midi, vel: 0 });
  });
  ev.sort((a, b) => a.tick - b.tick || (a.type === "off" ? -1 : 1));
  const tb = [];
  const writeVar = (v) => {
    const a = [];
    let x = v;
    a.unshift(x & 0x7f);
    while ((x >>= 7)) a.unshift((x & 0x7f) | 0x80);
    a.forEach((b) => tb.push(b));
  };
  let last = 0; let status = 0;
  ev.forEach((e) => {
    writeVar(e.tick - last); last = e.tick;
    const st = e.type === "on" ? 0x90 : 0x80;
    if (st !== status) { tb.push(st); status = st; }
    tb.push(e.midi & 0x7f, e.vel & 0x7f);
  });
  writeVar(0); tb.push(0xff, 0x2f, 0x00);
  const tempoEv = [0x00, 0xff, 0x51, 0x03, (tempo >> 16) & 0xff, (tempo >> 8) & 0xff, tempo & 0xff];
  const trackBytes = [...tempoEv, ...tb];
  const out = [];
  const pushStr = (s) => { for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i)); };
  pushStr("MThd"); out.push(0, 0, 0, 6); out.push(0, 0); out.push(0, 1); out.push((tpq >> 8) & 0xff, tpq & 0xff);
  pushStr("MTrk");
  out.push((trackBytes.length >> 24) & 0xff, (trackBytes.length >> 16) & 0xff, (trackBytes.length >> 8) & 0xff, trackBytes.length & 0xff);
  trackBytes.forEach((b) => out.push(b));
  return new Uint8Array(out);
}