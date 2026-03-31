let audioCtx: AudioContext | null = null;

type BgmScene = 'title' | 'host' | 'play' | 'results';

const withBase = (path: string) => {
  const normalizedBase = import.meta.env.BASE_URL || '/';
  const baseUrl = new URL(normalizedBase, window.location.origin);
  return new URL(path.replace(/^\//, ''), baseUrl).toString();
};

const BGM_SOURCES: Record<BgmScene, string[]> = {
  title: [withBase('/bgm/title/title_main.mp3')],
  host: [withBase('/bgm/host/host_lobby.mp3')],
  play: [withBase('/bgm/play/gameplay_main.mp3')],
  results: [withBase('/bgm/results/results_win.mp3')],
};

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playCorrectSound = () => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) { console.error(e); }
};

export const playIncorrectSound = () => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) { console.error(e); }
};

export const playHitSound = () => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) { console.error(e); }
};

export const playCupInSound = () => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) { console.error(e); }
};

let bgmOscillators: OscillatorNode[] = [];
let bgmGain: GainNode | null = null;
let bgmInterval: number | null = null;
let bgmAudio: HTMLAudioElement | null = null;
let currentScene: BgmScene | null = null;
let unlockHandler: (() => void) | null = null;
let bgmSessionId = 0;

const stopSynthBGM = () => {
  if (bgmInterval) {
    window.clearInterval(bgmInterval);
    bgmInterval = null;
  }
  if (bgmGain) {
    bgmGain.disconnect();
    bgmGain = null;
  }
  bgmOscillators.forEach((osc) => {
    try { osc.stop(); } catch (e) {}
  });
  bgmOscillators = [];
};

const removeUnlockHandler = () => {
  if (!unlockHandler) return;
  window.removeEventListener('pointerdown', unlockHandler);
  window.removeEventListener('keydown', unlockHandler);
  unlockHandler = null;
};

const scheduleUnlockRetry = (audio: HTMLAudioElement, sessionId: number) => {
  removeUnlockHandler();
  unlockHandler = () => {
    if (sessionId !== bgmSessionId || bgmAudio !== audio) {
      removeUnlockHandler();
      return;
    }
    audio.play().catch(() => {});
    removeUnlockHandler();
  };
  window.addEventListener('pointerdown', unlockHandler, { once: true });
  window.addEventListener('keydown', unlockHandler, { once: true });
};

const startSynthBGM = () => {
  try {
    const ctx = getCtx();
    if (bgmInterval) return;

    bgmGain = ctx.createGain();
    bgmGain.gain.value = 0.05;
    bgmGain.connect(ctx.destination);

    const notes = [
      261.63, 329.63, 392.0, 523.25,
      220.0, 261.63, 329.63, 440.0,
      174.61, 220.0, 261.63, 349.23,
      196.0, 246.94, 293.66, 392.0,
    ];
    let step = 0;

    bgmInterval = window.setInterval(() => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = notes[step % notes.length];

      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0.3, ctx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(noteGain);
      noteGain.connect(bgmGain!);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);

      bgmOscillators.push(osc);
      if (bgmOscillators.length > 10) {
        bgmOscillators.shift();
      }

      step++;
    }, 400);
  } catch (e) {
    console.error(e);
  }
};

const stopAudioBGM = () => {
  removeUnlockHandler();
  if (!bgmAudio) return;
  bgmAudio.pause();
  bgmAudio.currentTime = 0;
  bgmAudio.src = '';
  bgmAudio.load();
  bgmAudio = null;
};

export const startBGM = (scene: BgmScene = 'host') => {
  const preferredSources = BGM_SOURCES[scene];
  if (currentScene === scene && (bgmAudio || bgmInterval || unlockHandler)) return;

  stopAudioBGM();
  stopSynthBGM();
  bgmSessionId += 1;
  currentScene = scene;
  const sessionId = bgmSessionId;

  const src = preferredSources.find(Boolean);
  if (!src) {
    startSynthBGM();
    return;
  }

  const audio = new Audio(src);
  audio.loop = true;
  audio.volume = 0.35;
  audio.preload = 'auto';
  audio.addEventListener('error', () => {
    if (sessionId === bgmSessionId && bgmAudio === audio) {
      bgmAudio = null;
      startSynthBGM();
    }
  }, { once: true });

  bgmAudio = audio;
  audio.play().catch(() => {
    scheduleUnlockRetry(audio, sessionId);
  });
};

export const stopBGM = () => {
  bgmSessionId += 1;
  currentScene = null;
  stopAudioBGM();
  stopSynthBGM();
};
