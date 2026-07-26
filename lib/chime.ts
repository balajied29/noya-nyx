/**
 * A short struck-glass chime, synthesised rather than loaded.
 *
 * Avoids shipping an audio asset and keeps the reward instant. Built from a
 * few detuned partials with a fast attack and a long decay, which is roughly
 * how a rim-struck glass behaves.
 */

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

/** Browsers suspend audio until a gesture; call this from the first pour. */
export function primeAudio() {
  const ac = context();
  if (ac && ac.state === "suspended") void ac.resume();
}

function strike(
  ac: AudioContext,
  freq: number,
  startAt: number,
  gain: number,
  decay: number
) {
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startAt);
  // Slight downward drift — struck glass never holds perfect pitch.
  osc.frequency.exponentialRampToValueAtTime(freq * 0.995, startAt + decay);

  amp.gain.setValueAtTime(0.0001, startAt);
  amp.gain.exponentialRampToValueAtTime(gain, startAt + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.0001, startAt + decay);

  osc.connect(amp).connect(ac.destination);
  osc.start(startAt);
  osc.stop(startAt + decay + 0.05);
}

/** Played when the pour matches the signature serve. */
export function playChime() {
  const ac = context();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();

  const t = ac.currentTime + 0.01;
  // A major-ish cluster: fundamental, fifth, octave, plus an airy partial.
  strike(ac, 880, t, 0.16, 1.9);
  strike(ac, 1318.5, t + 0.012, 0.1, 1.6);
  strike(ac, 1760, t + 0.02, 0.07, 1.3);
  strike(ac, 2637, t + 0.03, 0.03, 0.9);
}

/** A soft tick as each ingredient lands, so pours feel physical. */
export function playPour(density: number) {
  const ac = context();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();

  const t = ac.currentTime + 0.01;
  const dur = 0.42;

  // Filtered noise burst — the pour itself.
  const frames = Math.floor(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    const fade = 1 - i / frames;
    data[i] = (Math.random() * 2 - 1) * fade * fade;
  }
  const src = ac.createBufferSource();
  src.buffer = buffer;

  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  // Thicker pours sit lower — honey glugs, citrus splashes.
  filter.frequency.value = 900 - density * 500;
  filter.Q.value = 1.2;

  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.055, t);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(filter).connect(amp).connect(ac.destination);
  src.start(t);
}
