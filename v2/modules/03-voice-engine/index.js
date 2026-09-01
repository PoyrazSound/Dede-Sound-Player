// Poyraz Dede Sound Player v2
// Module 03 — Voice Engine
// Bağımsız test motoru: poly/mono voice + ADSR + velocity + voice stealing.

export class VoiceEngine {
  constructor(options = {}) {
    this.mode = options.mode === 'mono' ? 'mono' : 'poly';
    this.maxVoices = Math.max(1, options.maxVoices ?? 32);
    this.masterGain = Math.max(0, Math.min(1, options.masterGain ?? 0.18));
    this.attack = Math.max(0.001, options.attack ?? 0.008);
    this.release = Math.max(0.005, options.release ?? 0.08);
    this.waveform = options.waveform || 'sawtooth';

    this.voices = new Map();
    this.voiceOrder = [];
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

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  setMode(mode) {
    const next = mode === 'mono' ? 'mono' : 'poly';
    if (next === this.mode) return;

    this.mode = next;
    if (next === 'mono') this.allNotesOff(true);
  }

  setMaxVoices(value) {
    this.maxVoices = Math.max(1, Math.floor(Number(value) || 1));
    this._stealVoicesIfNeeded();
  }

  setADSR({ attack, release } = {}) {
    if (attack != null) this.attack = Math.max(0.001, Number(attack));
    if (release != null) this.release = Math.max(0.005, Number(release));
  }

  setMasterGain(value) {
    this.masterGain = Math.max(0, Math.min(1, Number(value) || 0));
    if (this.output) this.output.gain.setTargetAtTime(
      this.masterGain,
      this.audioContext.currentTime,
      0.005
    );
  }

  noteOn(note, velocity = 100, frequency = null) {
    if (!this.audioContext) throw new Error('VoiceEngine.init() çağrılmalı.');

    const midiNote = Math.max(0, Math.min(127, Math.round(note)));
    const level = Math.max(0.0002, Math.min(1, Number(velocity) / 127));

    // Mono modda yalnızca son nota aktif kalır.
    if (this.mode === 'mono') this.allNotesOff(true);

    // Aynı MIDI notasını yeniden tetikliyorsak eski voice'u temizle.
    if (this.voices.has(midiNote)) this._releaseVoice(midiNote, true);

    this._stealVoicesIfNeeded();

    const now = this.audioContext.currentTime;
    const freq = frequency ?? 440 * Math.pow(2, (midiNote - 69) / 12);
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = this.waveform;
    osc.frequency.setValueAtTime(Math.max(1, freq), now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(level, now + this.attack);

    osc.connect(gain);
    gain.connect(this.output);
    osc.start(now);

    const voice = { note: midiNote, osc, gain, startedAt: now, released: false };
    this.voices.set(midiNote, voice);
    this.voiceOrder.push(midiNote);

    return voice;
  }

  noteOff(note, immediate = false) {
    return this._releaseVoice(Math.round(note), immediate);
  }

  _releaseVoice(note, immediate = false) {
    const voice = this.voices.get(note);
    if (!voice || !this.audioContext || voice.released) return false;

    voice.released = true;
    const now = this.audioContext.currentTime;
    const end = now + (immediate ? 0.005 : this.release);
    const current = Math.max(0.0001, voice.gain.gain.value);

    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(current, now);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, end);

    try {
      voice.osc.stop(end + 0.01);
    } catch (_) {}

    this.voices.delete(note);
    const index = this.voiceOrder.indexOf(note);
    if (index !== -1) this.voiceOrder.splice(index, 1);
    return true;
  }

  _stealVoicesIfNeeded() {
    while (this.voices.size >= this.maxVoices) {
      const oldest = this.voiceOrder[0];
      if (oldest == null) break;
      this._releaseVoice(oldest, true);
    }
  }

  allNotesOff(immediate = true) {
    for (const note of [...this.voices.keys()]) {
      this._releaseVoice(note, immediate);
    }
  }

  getActiveVoiceCount() {
    return this.voices.size;
  }

  destroy() {
    this.allNotesOff(true);
    if (this.output) this.output.disconnect();

    if (this.audioContext) {
      this.audioContext.close();
    }

    this.voices.clear();
    this.voiceOrder.length = 0;
    this.output = null;
    this.audioContext = null;
  }
}

export async function runVoiceEngineTest(logEl) {
  const engine = new VoiceEngine({
    mode: 'poly',
    maxVoices: 8,
    attack: 0.012,
    release: 0.16,
    masterGain: 0.16
  });

  try {
    await engine.init();

    logEl.textContent =
      'MODÜL 3 — VOICE ENGINE\n' +
      'Polyphonic test başlıyor...';

    engine.noteOn(60, 110);
    setTimeout(() => engine.noteOn(64, 95), 120);
    setTimeout(() => engine.noteOn(67, 90), 240);

    setTimeout(() => {
      engine.noteOff(60);
      engine.noteOff(64);
      engine.noteOff(67);
      logEl.textContent +=
        `\n3 voice üretildi. Aktif voice: ${engine.getActiveVoiceCount()}`;
    }, 900);

    setTimeout(() => {
      engine.destroy();
      logEl.textContent += '\nVoice Engine temizlendi.';
    }, 1300);
  } catch (error) {
    logEl.textContent = `MODÜL 3 HATA: ${error.message}`;
  }

  return engine;
}

export const module3 = {
  id: 3,
  name: 'Voice Engine',
  description: 'Poly/mono voice yönetimi + ADSR + velocity + voice stealing',
  test: runVoiceEngineTest
};
