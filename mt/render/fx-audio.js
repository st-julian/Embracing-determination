// mt/render/fx-audio.js — synthesized monster-trainer SFX (cute Gen-5 chiptune flavour, mixed into the legacy audio
// director's buses so master/sfx volume, ducking, glue compression and room reverb apply). Owner: VFX/audio specialist.
//
// The legacy director (registry 'audio') creates its AudioContext on the first user gesture; until then `play` is a
// no-op. Voices: pulse (12.5/25/50 % duty via PeriodicWave), triangle, noise (filtered), with envelopes, slides,
// arpeggios. Spatial: distance attenuation + stereo pan vs the director's listener (camera focus).
// `__mtFx.audio.renderTest(name)` renders a sound offline and reports peak/RMS (verification without speakers).

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);          // MIDI -> Hz
const C = { C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71, C5: 72, D5: 74, E5: 76, F5: 77, G5: 79, A5: 81, B5: 83, C6: 84, D6: 86, E6: 88, G6: 91, C7: 96 };

class Synth {
  constructor(ac, out, kit) { this.ac = ac; this.out = out; this.kit = kit; }
  env(g, t, a, peak, hold, r, curve = 'exp') {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    if (hold > 0) g.gain.setValueAtTime(peak, t + a + hold);
    if (curve === 'exp') g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + r); else g.gain.linearRampToValueAtTime(0.0001, t + a + hold + r);
    return t + a + hold + r;
  }
  /** tone: {type:'pulse12'|'pulse25'|'square'|'triangle'|'sine'|'saw', f0, f1, dur, a, r, vol, vib, vibHz, steps:[[dt,f],...], lp} */
  tone(t, o) {
    const ac = this.ac, osc = ac.createOscillator(), g = ac.createGain();
    const ty = o.type || 'square';
    if (ty.startsWith('pulse')) osc.setPeriodicWave(this.kit.pulse(ty === 'pulse12' ? 0.125 : 0.25));
    else osc.type = ty === 'saw' ? 'sawtooth' : ty;
    const dur = o.dur || 0.1, a = o.a ?? 0.004, r = o.r ?? Math.max(0.02, dur * 0.6), hold = Math.max(0, dur - a - r);
    osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1 && o.f1 !== o.f0) { if (o.lin) osc.frequency.linearRampToValueAtTime(o.f1, t + dur); else osc.frequency.exponentialRampToValueAtTime(o.f1, t + dur); }
    if (o.steps) for (const [dt, f] of o.steps) osc.frequency.setValueAtTime(f, t + dt);
    let node = osc;
    if (o.vib) {
      const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = o.vibHz || 7; lg.gain.value = o.f0 * o.vib;
      l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + 0.05);
    }
    if (o.lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = 0.7; node.connect(f); node = f; }
    node.connect(g); g.connect(this.out);
    const end = this.env(g, t, a, o.vol ?? 0.1, hold, r);
    osc.start(t); osc.stop(end + 0.02);
    return end;
  }
  /** noise: {dur, vol, type:'bandpass'|'lowpass'|'highpass', f, f1, q, a, r} */
  noise(t, o) {
    const ac = this.ac, src = ac.createBufferSource(); src.buffer = this.kit.noiseBuf(o.metal);
    const f = ac.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 2000, t); f.Q.value = o.q ?? 1;
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + (o.dur || 0.1));
    const g = ac.createGain(); src.connect(f); f.connect(g); g.connect(this.out);
    const dur = o.dur || 0.1, a = o.a ?? 0.003, r = o.r ?? dur * 0.8;
    const end = this.env(g, t, a, o.vol ?? 0.1, Math.max(0, dur - a - r), r);
    src.start(t, Math.random() * 0.5); src.stop(end + 0.02);
    return end;
  }
  arp(t, notes, step, o) { let e = t; notes.forEach((n, i) => { e = Math.max(e, this.tone(t + i * step, { ...o, f0: NOTE(n), f1: o.slide ? NOTE(n) * o.slide : undefined })); }); return e; }
  chord(t, notes, o) { let e = t; for (const n of notes) e = Math.max(e, this.tone(t, { ...o, f0: NOTE(n) })); return e; }
}

// ---------------------------------------------------------------------------------------------- sound catalogue
// fn(s: Synth, t, p) -> end time. p = {power, el, super, weak}
const S = {
  throw: (s, t) => Math.max(s.noise(t, { type: 'bandpass', f: 500, f1: 3200, q: 2.2, dur: 0.28, vol: 0.32 }),
    s.tone(t, { type: 'pulse25', f0: 330, f1: 990, dur: 0.18, vol: 0.05 })),
  absorb: (s, t) => Math.max(s.tone(t, { type: 'pulse12', f0: 1800, f1: 160, dur: 0.34, vol: 0.09, r: 0.2 }),
    s.tone(t + 0.02, { type: 'triangle', f0: NOTE(C.C6), f1: NOTE(C.C7), dur: 0.12, vol: 0.08 }),
    s.noise(t, { type: 'highpass', f: 5000, dur: 0.3, vol: 0.05 })),
  land: (s, t) => Math.max(s.tone(t, { type: 'triangle', f0: 220, f1: 90, dur: 0.07, vol: 0.2 }), s.noise(t, { type: 'lowpass', f: 900, dur: 0.05, vol: 0.12 })),
  click: (s, t) => Math.max(s.noise(t, { type: 'highpass', f: 3200, dur: 0.025, vol: 0.22, a: 0.001 }), s.tone(t, { type: 'square', f0: 1250, dur: 0.018, vol: 0.05, a: 0.001, r: 0.012 }),
    s.tone(t + 0.005, { type: 'triangle', f0: 150, f1: 110, dur: 0.06, vol: 0.18 })),
  wobble: (s, t, p) => Math.max(S.click(s, t), s.tone(t + 0.07, { type: 'triangle', f0: 240 + (p.n || 1) * 30, f1: 190, dur: 0.08, vol: 0.12 })),
  catch: (s, t) => {
    let e = S.click(s, t);
    e = Math.max(e, s.arp(t + 0.18, [C.C6, C.E6, C.G6, C.C7], 0.075, { type: 'pulse25', dur: 0.12, vol: 0.07, r: 0.08 }));
    e = Math.max(e, s.tone(t + 0.18 + 0.3, { type: 'pulse25', f0: NOTE(C.C7), dur: 0.45, vol: 0.06, vib: 0.012, vibHz: 6, r: 0.3 }));
    e = Math.max(e, s.arp(t + 0.18, [C.C4, C.G4, C.C5], 0.1, { type: 'triangle', dur: 0.2, vol: 0.16 }));
    return Math.max(e, s.noise(t + 0.2, { type: 'highpass', f: 7000, dur: 0.6, vol: 0.04, r: 0.5 }));
  },
  fail: (s, t) => Math.max(s.noise(t, { type: 'lowpass', f: 2400, f1: 500, dur: 0.22, vol: 0.32 }), s.tone(t, { type: 'square', f0: 700, f1: 140, dur: 0.22, vol: 0.06 }),
    s.tone(t + 0.02, { type: 'triangle', f0: 320, f1: 70, dur: 0.2, vol: 0.2 })),
  angry: (s, t) => s.arp(t, [C.G5, C.F5], 0.07, { type: 'pulse25', dur: 0.08, vol: 0.11 }),
  evolveRise: (s, t, p) => {
    const dur = p.duration || 2.4, ac = s.ac;
    const osc = ac.createOscillator(); osc.setPeriodicWave(s.kit.pulse(0.125));
    osc.frequency.setValueAtTime(160, t); osc.frequency.exponentialRampToValueAtTime(1500, t + dur);
    const g = ac.createGain(); const n = 64, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) { const k = i / (n - 1), ph = (6 * k + 15 * k * k * k) * Math.PI * 2; curve[i] = (0.02 + 0.06 * k) * (0.55 + 0.45 * Math.sin(ph)); }
    g.gain.setValueCurveAtTime(curve, t, dur);
    osc.connect(g); g.connect(s.out); osc.start(t); osc.stop(t + dur + 0.05);
    s.tone(t, { type: 'triangle', f0: 110, f1: 220, dur, vol: 0.08, r: 0.2 });
    return s.noise(t, { type: 'highpass', f: 2500, f1: 9000, dur, vol: 0.05, a: dur * 0.7, r: 0.2 });
  },
  evolveDone: (s, t) => {
    let e = s.noise(t, { type: 'highpass', f: 4000, dur: 1.2, vol: 0.09, r: 1.1, metal: true });
    e = Math.max(e, s.chord(t, [C.G4, C.C5, C.E5], { type: 'pulse25', dur: 0.14, vol: 0.05 }));
    e = Math.max(e, s.chord(t + 0.16, [C.G4, C.C5, C.E5], { type: 'pulse25', dur: 0.12, vol: 0.05 }));
    e = Math.max(e, s.chord(t + 0.32, [C.C5, C.E5, C.G5, C.C6], { type: 'pulse25', dur: 0.85, vol: 0.045, vib: 0.01, vibHz: 6, r: 0.5 }));
    e = Math.max(e, s.arp(t, [C.C4, C.C4, C.C4], 0.16, { type: 'triangle', dur: 0.14, vol: 0.2 }));
    return Math.max(e, s.tone(t + 0.32, { type: 'triangle', f0: NOTE(48), dur: 0.85, vol: 0.2, r: 0.5 }));
  },
  evolveCancel: (s, t) => Math.max(s.tone(t, { type: 'pulse25', f0: 900, f1: 200, dur: 0.3, vol: 0.06 }), s.noise(t, { type: 'lowpass', f: 1200, f1: 300, dur: 0.3, vol: 0.1 })),
  levelUp: (s, t) => Math.max(s.arp(t, [C.E5, 80, C.B5, C.E6], 0.065, { type: 'pulse25', dur: 0.09, vol: 0.06 }),
    s.tone(t + 0.26, { type: 'pulse25', f0: NOTE(C.E6), dur: 0.32, vol: 0.06, vib: 0.01, r: 0.2 }),
    s.arp(t, [C.E4, C.B4], 0.13, { type: 'triangle', dur: 0.16, vol: 0.14 })),
  faint: (s, t) => Math.max(s.tone(t, { type: 'square', f0: 620, f1: 420, dur: 0.22, vol: 0.05, vib: 0.03, vibHz: 9 }),
    s.tone(t + 0.22, { type: 'square', f0: 400, f1: 120, dur: 0.45, vol: 0.05, vib: 0.04, vibHz: 7 }),
    s.tone(t, { type: 'triangle', f0: 200, f1: 60, dur: 0.6, vol: 0.12 })),
  summon: (s, t) => Math.max(s.noise(t, { type: 'bandpass', f: 2200, q: 1.4, dur: 0.06, vol: 0.2 }), s.tone(t, { type: 'triangle', f0: 520, f1: 1300, dur: 0.14, vol: 0.12 }),
    s.arp(t + 0.08, [C.G5, C.C6], 0.06, { type: 'pulse25', dur: 0.08, vol: 0.05 }), s.noise(t + 0.05, { type: 'highpass', f: 6500, dur: 0.35, vol: 0.04 })),
  recall: (s, t) => Math.max(s.tone(t, { type: 'pulse12', f0: 1300, f1: 300, dur: 0.22, vol: 0.06 }), s.noise(t, { type: 'highpass', f: 4000, f1: 1500, dur: 0.2, vol: 0.05 })),
  swap: (s, t) => Math.max(s.noise(t, { type: 'bandpass', f: 800, f1: 2600, q: 1.8, dur: 0.18, vol: 0.26 }), s.tone(t + 0.12, { type: 'pulse25', f0: 660, f1: 1320, dur: 0.1, vol: 0.08 })),
  hit_fire: (s, t, p) => Math.max(s.noise(t, { type: 'lowpass', f: p.weak ? 900 : 2200, f1: 400, dur: 0.16, vol: 0.18 }), s.tone(t, { type: 'triangle', f0: 170, f1: 60, dur: 0.1, vol: 0.18 }),
    s.noise(t + 0.03, { type: 'highpass', f: 3000, dur: 0.1, vol: 0.05 })),
  hit_water: (s, t, p) => Math.max(s.tone(t, { type: 'pulse25', f0: 900, f1: 420, dur: 0.035, vol: 0.05, lp: p.weak ? 900 : 0 }), s.tone(t + 0.04, { type: 'pulse25', f0: 1100, f1: 520, dur: 0.035, vol: 0.045 }),
    s.tone(t + 0.08, { type: 'pulse25', f0: 760, f1: 380, dur: 0.035, vol: 0.04 }), s.noise(t, { type: 'lowpass', f: 1800, dur: 0.12, vol: 0.17 })),
  hit_grass: (s, t, p) => Math.max(s.noise(t, { type: 'highpass', f: p.weak ? 1500 : 2800, f1: 6000, dur: 0.09, vol: 0.12 }), s.tone(t + 0.02, { type: 'triangle', f0: 720, f1: 520, dur: 0.06, vol: 0.12 })),
  hit_electric: (s, t) => Math.max(s.tone(t, { type: 'square', f0: 1700, dur: 0.12, vol: 0.04, steps: [[0.02, 900], [0.04, 2100], [0.06, 700], [0.08, 1900], [0.1, 1100]] }),
    s.noise(t, { type: 'highpass', f: 3500, dur: 0.11, vol: 0.12 })),
  hit_earth: (s, t, p) => Math.max(s.tone(t, { type: 'triangle', f0: 210, f1: 45, dur: 0.16, vol: p.weak ? 0.15 : 0.26 }), s.noise(t, { type: 'lowpass', f: 700, dur: 0.12, vol: 0.18 })),
  hit_wind: (s, t) => s.noise(t, { type: 'bandpass', f: 3200, f1: 800, q: 1.6, dur: 0.13, vol: 0.32 }),
  hit_sling: (s, t) => Math.max(s.tone(t, { type: 'triangle', f0: 300, f1: 120, dur: 0.05, vol: 0.1 }), s.noise(t, { type: 'bandpass', f: 1600, dur: 0.04, vol: 0.08 })),
  super: (s, t) => Math.max(s.arp(t + 0.02, [C.C6, C.G6], 0.045, { type: 'pulse25', dur: 0.06, vol: 0.05 }), s.noise(t, { type: 'highpass', f: 6000, dur: 0.15, vol: 0.05 })),
  weak: (s, t) => s.tone(t, { type: 'triangle', f0: 260, f1: 200, dur: 0.08, vol: 0.08 }),
  cast: (s, t, p) => {
    const f = { fire: 300, water: 420, grass: 360, electric: 520, earth: 200, wind: 460 }[p.el] || 380;
    return Math.max(s.tone(t, { type: 'pulse25', f0: f, f1: f * 2.6, dur: 0.13, vol: 0.08 }), s.noise(t, { type: 'bandpass', f: f * 4, f1: f * 9, dur: 0.12, vol: 0.11 }));
  },
  volley: (s, t) => Math.max(s.noise(t, { type: 'bandpass', f: 900, f1: 2400, dur: 0.18, vol: 0.16 }), s.tone(t, { type: 'triangle', f0: 260, f1: 140, dur: 0.12, vol: 0.12 })),
  pillar: (s, t) => Math.max(s.noise(t, { type: 'lowpass', f: 2600, f1: 500, dur: 0.6, vol: 0.32, r: 0.5 }), s.tone(t, { type: 'triangle', f0: 110, f1: 38, dur: 0.45, vol: 0.3 }),
    s.tone(t, { type: 'square', f0: 220, f1: 70, dur: 0.25, vol: 0.04 })),
  telegraph: (s, t) => s.tone(t, { type: 'pulse12', f0: 300, f1: 900, dur: 0.5, vol: 0.07, a: 0.3, r: 0.15 }),
  bubbles: (s, t) => { let e = t; for (let i = 0; i < 6; i++) e = Math.max(e, s.tone(t + i * 0.035, { type: 'pulse25', f0: 600 + ((i * 7) % 5) * 160, f1: 1400, dur: 0.03, vol: 0.08 })); return e; },
  heal: (s, t) => Math.max(s.arp(t, [C.C5, C.E5, C.G5, C.C6], 0.07, { type: 'triangle', dur: 0.3, vol: 0.1, r: 0.25 }), s.noise(t, { type: 'highpass', f: 6000, dur: 0.5, vol: 0.03 })),
  shield: (s, t) => Math.max(s.tone(t, { type: 'pulse12', f0: 400, f1: 800, dur: 0.2, vol: 0.05 }), s.tone(t, { type: 'triangle', f0: 800, dur: 0.3, vol: 0.06, vib: 0.02 })),
  vine: (s, t) => Math.max(s.noise(t, { type: 'bandpass', f: 1200, f1: 3500, q: 2, dur: 0.14, vol: 0.14 }), s.tone(t + 0.1, { type: 'triangle', f0: 200, f1: 120, dur: 0.08, vol: 0.14 })),
  thorns: (s, t) => Math.max(s.noise(t, { type: 'bandpass', f: 2600, q: 3, dur: 0.2, vol: 0.1 }), s.tone(t, { type: 'square', f0: 180, f1: 240, dur: 0.2, vol: 0.04 })),
  zap: (s, t) => Math.max(s.tone(t, { type: 'saw', f0: 2400, dur: 0.16, vol: 0.035, steps: [[0.02, 800], [0.04, 3000], [0.07, 600], [0.1, 2200], [0.13, 900]] }), s.noise(t, { type: 'highpass', f: 2500, dur: 0.18, vol: 0.14 })),
  dash: (s, t) => Math.max(s.noise(t, { type: 'bandpass', f: 600, f1: 3000, q: 1.2, dur: 0.2, vol: 0.26 }), s.tone(t, { type: 'pulse25', f0: 300, f1: 1200, dur: 0.15, vol: 0.04 })),
  slam: (s, t) => Math.max(s.tone(t, { type: 'triangle', f0: 130, f1: 32, dur: 0.38, vol: 0.38 }), s.noise(t, { type: 'lowpass', f: 1100, f1: 200, dur: 0.4, vol: 0.3 }),
    s.noise(t + 0.05, { type: 'bandpass', f: 2600, dur: 0.15, vol: 0.06 })),
  slash: (s, t) => Math.max(s.noise(t, { type: 'bandpass', f: 4000, f1: 1200, q: 2.4, dur: 0.12, vol: 0.3 }), s.tone(t, { type: 'pulse12', f0: 1800, f1: 600, dur: 0.08, vol: 0.04 })),
  cyclone: (s, t, p) => s.noise(t, { type: 'bandpass', f: 500, f1: 2400, q: 2.5, dur: p.duration || 2, vol: 0.34, a: 0.3, r: 0.6 }),
  rally: (s, t) => Math.max(s.arp(t, [C.G4, C.C5, C.E5, C.G5], 0.07, { type: 'square', dur: 0.1, vol: 0.045 }), s.tone(t + 0.28, { type: 'square', f0: NOTE(C.C6), dur: 0.3, vol: 0.045, vib: 0.012, r: 0.2 }),
    s.arp(t, [C.C4, C.G4], 0.14, { type: 'triangle', dur: 0.16, vol: 0.16 })),
  mend: (s, t) => Math.max(s.arp(t, [C.F5, C.A5, C.C6, C.F5 + 12], 0.09, { type: 'triangle', dur: 0.4, vol: 0.09, r: 0.35 }), s.noise(t, { type: 'highpass', f: 7000, dur: 0.7, vol: 0.035 })),
  surge: (s, t) => Math.max(s.tone(t, { type: 'pulse12', f0: 200, f1: 2400, dur: 0.45, vol: 0.06 }), s.tone(t + 0.1, { type: 'triangle', f0: NOTE(C.E6), dur: 0.4, vol: 0.06, vib: 0.03, vibHz: 12 }),
    s.noise(t, { type: 'highpass', f: 3000, f1: 9000, dur: 0.45, vol: 0.05 })),
  potion: (s, t) => { let e = t; for (let i = 0; i < 4; i++) e = Math.max(e, s.tone(t + i * 0.09, { type: 'triangle', f0: 300 + i * 70, f1: 600 + i * 90, dur: 0.07, vol: 0.09 })); return Math.max(e, S.heal(s, t + 0.3)); },
  crumble: (s, t, p) => Math.max(s.noise(t, { type: 'lowpass', f: 900, f1: 120, dur: 1.4 * (p.power || 1), vol: 0.32, r: 1.1 }), s.tone(t, { type: 'triangle', f0: 90, f1: 28, dur: 0.9, vol: 0.32 })),
  victory: (s, t) => {
    let e = s.arp(t, [C.C5, C.E5, C.G5, C.C6, C.E6, C.G6], 0.09, { type: 'pulse25', dur: 0.12, vol: 0.05 });
    e = Math.max(e, s.chord(t + 0.6, [C.C5, C.E5, C.G5, C.C6], { type: 'pulse25', dur: 1.2, vol: 0.04, vib: 0.01, r: 0.8 }));
    return Math.max(e, s.arp(t, [48, 55, 60, 48], 0.18, { type: 'triangle', dur: 0.3, vol: 0.18 }));
  },
  defeat: (s, t) => Math.max(s.arp(t, [C.G4, 66, C.F4, C.E4], 0.22, { type: 'pulse25', dur: 0.3, vol: 0.05, vib: 0.02 }), s.tone(t, { type: 'triangle', f0: NOTE(43), f1: NOTE(36), dur: 1.2, vol: 0.18 })),
  sparkle: (s, t) => { let e = t; for (let i = 0; i < 5; i++) e = Math.max(e, s.tone(t + i * 0.05, { type: 'triangle', f0: NOTE(C.C7 + [0, 4, 7, 12, 16][i]), dur: 0.08, vol: 0.075 })); return e; },
};

/** Per-sound minimum interval (s) and priority (higher wins when the voice cap is reached). */
const META = { hit_fire: [0.05, 20], hit_water: [0.05, 20], hit_grass: [0.05, 20], hit_electric: [0.05, 20], hit_earth: [0.05, 20], hit_wind: [0.05, 20],
  hit_sling: [0.06, 10], super: [0.12, 40], weak: [0.12, 15], cast: [0.05, 35], click: [0.05, 70], wobble: [0.1, 80], catch: [0.5, 95], fail: [0.3, 90],
  evolveRise: [0.5, 90], evolveDone: [0.5, 95], levelUp: [0.25, 80], cyclone: [0.4, 40], sparkle: [0.1, 30], crumble: [0.2, 85], victory: [2, 99], defeat: [2, 99] };

class Kit {
  constructor(ac) { this.ac = ac; this.waves = {}; this.nb = null; this.mb = null; }
  pulse(d) {
    if (this.waves[d]) return this.waves[d];
    const n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) { re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * d) * Math.cos(k * Math.PI * d); im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * d) * Math.sin(k * Math.PI * d); }
    return (this.waves[d] = this.ac.createPeriodicWave(re, im));
  }
  noiseBuf(metal) {
    if (metal ? this.mb : this.nb) return metal ? this.mb : this.nb;
    const len = this.ac.sampleRate, b = this.ac.createBuffer(1, len, this.ac.sampleRate), d = b.getChannelData(0);
    let seed = 1234567, hold = 0, v = 0;
    for (let i = 0; i < len; i++) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      if (metal) { if (hold-- <= 0) { v = (seed / 4294967296) * 2 - 1; hold = 3; } d[i] = v; }   // NES-ish short-period noise
      else d[i] = (seed / 4294967296) * 2 - 1;
    }
    if (metal) this.mb = b; else this.nb = b;
    return b;
  }
}

export class FxAudio {
  constructor(ctx) { this.ctx = ctx; this.last = new Map(); this.kits = new WeakMap(); this.active = []; this.maxVoices = 18; this.played = 0; this.enabled = true; }
  director() { const a = this.ctx.registry && this.ctx.registry.get('audio'); return a && a.ready && a.ac && a.mix && !a.disposed ? a : null; }
  /** play(name, x, z (sim x,y), p) — p: {power, el, weak, super, n, gain, ui (non-spatial), prio} */
  play(name, x, z, p = {}) {
    if (!this.enabled) return;
    const fn = S[name]; if (!fn) return;
    const A = this.director(); if (!A || A.muted) return;
    const ac = A.ac, now = ac.currentTime, meta = META[name] || [0.04, 50];
    const key = name + (p.key || '');
    if (now - (this.last.get(key) ?? -9) < meta[0]) return;
    let vol = p.gain ?? 1, pan = 0;
    if (!p.ui && Number.isFinite(x) && A.listener) {
      const d = Math.hypot(x - A.listener.x, z - A.listener.y);
      vol *= Math.max(0, Math.min(1, 1 - (d - 9) / 26)); if (vol < 0.03) return;
      pan = Math.max(-0.8, Math.min(0.8, (x - A.listener.x) / 16));
    }
    this.active = this.active.filter((v) => v.end > now);
    const prio = p.prio ?? meta[1];
    if (this.active.length >= this.maxVoices) {
      let lo = null; for (const v of this.active) if (!lo || v.prio < lo.prio) lo = v;
      if (!lo || lo.prio >= prio) return;
      try { lo.g.gain.cancelScheduledValues(now); lo.g.gain.setTargetAtTime(0, now, 0.01); } catch (e) { /* ignore */ }
      this.active.splice(this.active.indexOf(lo), 1);
    }
    this.last.set(key, now);
    let kit = this.kits.get(ac); if (!kit) this.kits.set(ac, kit = new Kit(ac));
    const g = ac.createGain(); g.gain.value = vol * 0.9;
    const pn = ac.createStereoPanner ? ac.createStereoPanner() : null;
    const dest = p.ui && A.mix.uiIn ? A.mix.uiIn : A.mix.sfxIn;
    if (pn) { pn.pan.value = pan; g.connect(pn); pn.connect(dest); } else g.connect(dest);
    if (A.mix.sfxSend && !p.ui) { const sg = ac.createGain(); sg.gain.value = 0.35; g.connect(sg); sg.connect(A.mix.sfxSend); }
    const end = fn(new Synth(ac, g, kit), now + 0.01, p);
    this.active.push({ end, prio, g }); this.played++;
  }
  /** Offline render of one sound -> {peak, rms, dur}. For verification (no speakers in CI). */
  async renderTest(name, p = {}) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!OAC || !S[name]) return null;
    const ac = new OAC(2, 44100 * 3.5, 44100), kit = new Kit(ac), g = ac.createGain(); g.connect(ac.destination);
    const end = S[name](new Synth(ac, g, kit), 0.01, p);
    const buf = await ac.startRendering(), d = buf.getChannelData(0);
    let pk = 0, ss = 0; for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > pk) pk = v; ss += d[i] * d[i]; }
    const n = Math.max(1, Math.round(end * 44100));
    return { name, peak: +pk.toFixed(3), rms: +Math.sqrt(ss / n).toFixed(4), dur: +end.toFixed(2) };
  }
  names() { return Object.keys(S); }
}
