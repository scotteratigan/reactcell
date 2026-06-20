// Lightweight, dependency-free sound effects via the Web Audio API. All tones
// are synthesized on the fly, so there are no audio assets to ship and nothing
// to download at runtime -- in keeping with the rest of the project.
//
// Browsers only allow an AudioContext to start in response to a user gesture,
// so the context is created lazily on the first sound (which always follows a
// click, keypress, or drag) and resumed if the browser had it suspended.

type WindowWithAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

let audioCtx: AudioContext | null = null;
let muted = false;

const getContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  const w = window as WindowWithAudio;
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) {
    try {
      audioCtx = new Ctor();
    } catch {
      // Audio unavailable (e.g. blocked context); fail silently.
      return null;
    }
  }
  // Autoplay policies can leave the context suspended until a gesture.
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
};

// Plays a single enveloped tone. `delay` (seconds) schedules notes relative to
// the call so we can fire little melodies without timers.
const tone = (
  ctx: AudioContext,
  {
    freq,
    duration,
    type = "triangle",
    gain = 0.18,
    delay = 0,
  }: {
    freq: number;
    duration: number;
    type?: OscillatorType;
    gain?: number;
    delay?: number;
  },
): void => {
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  // Quick attack, smooth exponential decay -- a soft, percussive blip rather
  // than a flat beep.
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(env);
  env.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
};

export const setMuted = (value: boolean): void => {
  muted = value;
};

export const isMuted = (): boolean => muted;

// A short buffer of white noise, reused for every card-flick sound. Filtered
// noise (rather than a tone) is what gives the move sound its papery, non-
// musical character.
let noiseBuffer: AudioBuffer | null = null;

const getNoiseBuffer = (ctx: AudioContext): AudioBuffer => {
  if (noiseBuffer) return noiseBuffer;
  const length = Math.floor(ctx.sampleRate * 0.2);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buffer;
  return buffer;
};

// A short burst of band-passed noise: the broadband "fwip" of a card sliding
// and landing on the table. The centre frequency is nudged at random so a rapid
// run of moves (e.g. the endgame auto-complete) sounds lively, not mechanical.
export const playMove = (): void => {
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;
  const start = ctx.currentTime;
  // A slide/whoosh has some length to it -- long enough to hear the movement,
  // short enough to stay snappy during rapid auto-complete.
  const duration = 0.16;

  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);

  // Band-pass centred in the low-mids gives a deeper, airier "whoosh" instead of
  // a thin high tick. A short upward sweep adds the sense of the card sliding.
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  const centre = 520 + Math.random() * 180;
  band.frequency.setValueAtTime(centre, start);
  band.frequency.exponentialRampToValueAtTime(centre * 2.4, start + duration);
  band.Q.value = 1.2;

  // Keep the very top end out so it reads as air/paper, not hiss.
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 4000;

  // A soft swell up and back down -- no sharp transient -- is what makes it a
  // whoosh rather than a click.
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.linearRampToValueAtTime(0.3, start + duration * 0.4);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  src.connect(band);
  band.connect(lowpass);
  lowpass.connect(env);
  env.connect(ctx.destination);
  src.start(start);
  src.stop(start + duration + 0.02);
};

// A cheerful ascending arpeggio capped with a bright chord for the win.
export const playWin = (): void => {
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;
  // C major arpeggio: C5, E5, G5, C6, then E6.
  const melody = [523.25, 659.25, 783.99, 1046.5, 1318.51];
  melody.forEach((freq, i) => {
    tone(ctx, { freq, duration: 0.32, type: "triangle", gain: 0.2, delay: i * 0.12 });
  });
  // Sustained triad swelling under the run for a fuller finish.
  const chordDelay = melody.length * 0.12;
  [523.25, 659.25, 783.99].forEach((freq) => {
    tone(ctx, { freq, duration: 0.9, type: "sine", gain: 0.12, delay: chordDelay });
  });
};
