// Poyraz Dede Sound Player v2
// Module 03 — Voice Engine
// Bağımsız test motoru: poly/mono voice + ADSR + note on/off.

export class VoiceEngine {
  constructor(options = {}) {
    this.mode = options.mode || 'poly';
    this.maxVoices = options.maxVoices ?? 32;
    this.masterGain = options.masterGain ?? 0.18;
    this.attack = options.attack ?? 0.008;
    this.release = options.release ?? 0.08;
    this.voices = new Map();
    this.audioContext = null;
    this.output = null;
  }

  async init() {
    if (!this.audioContext) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) throw new Error('Web Audio API desteklenmiyor.');
      this.audioContext = new Ctx();
      this.output = this.audioContext.createGain();
      this.output.gain.value = this.masterGain;
      this.output.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') await this.audioContext.resume();
  }

  setMode(mode) {
    this.mode = mode === 'mono' ? 'mono' : 'poly';
    if (this.mode === 'mono') {
      for (const note of [...this.voices.keys()]) this.noteOff(note);
    }
  }

  noteOn(note, velocity = 100, frequency = null) {
    if (!this.audioContext) throw new Error('VoiceEngine.init() çağrılmalı.');

    if (this.mode === 'mono') {
      for (const oldNote of [...this.voices.keys()]) {
        if (oldNote !== note) this.noteOff(oldNote);
      }
    }

    if (this.voices.has(note)) this.noteOff(note, true);

    while (this.voices.size >= this.maxVoices) {
      const oldest = this.voices.keys().next().value;
      this.noteOff(oldest, true);
    }

    const now = this.audioContext.currentTime;
    const freq = frequency ?? 440 * Math.pow(2, (note - 69) / 12);
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    const level = Math.max(0, Math.min(1, velocity / 127));
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), now + this.attack);

    osc.connect(gain);
    gain.connect(this.output);
    osc.start(now);

    this.voices.set(note, { osc, gain, startedAt: now });
  }

  noteOff(note, immediate = false) {
    const voice = this.voices.get(note);
    if (!voice || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const end = immediate ? now + 0.005 : now + this.release;
    const current = Math.max(0.0001, voice.gain.gain.value);

    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(current, now);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, end);
    voice.osc.stop(end + 0.01);

    this.voices.delete(note);
  }

  allNotesOff() {
    for (const note of [...this.voices.keys()]) this.noteOff(note, true);
  }

  destroy() {
    this.allNotesOff();
    if (this.output) this.output.disconnect();
    if (this.audioContext) this.audioContext.close();
    this.output = null;
    this.audioContext = null;
  }
}

export async function runVoiceEngineTest(logEl) {
  const engine = new VoiceEngine({ mode: 'poly', maxVoices: 8 });
  try {
    await engine.init();
    logEl.textContent = 'MODÜL 3 — VOICE ENGINE\nPoly test: C4 + E4 + G4 çalıyor...';

    engine.noteOn(60, 110);
    setTimeout(() => engine.noteOn(64, 95), 120);
    setTimeout(() => engine.noteOn(67, 90), 240);

    setTimeout(() => {
      engine.noteOff(60);
      engine.noteOff(64);
      engine.noteOff(67);
      logEl.textContent += '\n3 ses başarıyla üretildi ve release uygulandı.';
    }, 900);

    setTimeout(() => engine.destroy(), 1300);
  } catch (error) {
    logEl.textContent = `MODÜL 3 HATA: ${error.message}`;
  }

  return engine;
}

export const module3 = {
  id: 3,
  name: 'Voice Engine',
  description: 'Poly/mono voice yönetimi + bağımsız Web Audio test motoru',
  test: runVoiceEngineTest
};
