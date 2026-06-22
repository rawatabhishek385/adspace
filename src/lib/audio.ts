let sharedAudioCtx: AudioContext | null = null;

export const initAudio = () => {
  if (typeof window === "undefined") return;
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(e => console.warn("Audio resume failed", e));
  }
};

if (typeof window !== "undefined") {
  const unlockAudio = () => {
    initAudio();
    window.removeEventListener("click", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
  };
  window.addEventListener("click", unlockAudio);
  window.addEventListener("keydown", unlockAudio);
}

export const playNotificationSound = () => {
  try {
    console.log("🔊 Attempting to play notification sound...");
    initAudio(); // Try to initialize/resume if not done
    const ctx = sharedAudioCtx;
    if (!ctx) {
      console.warn("No AudioContext available");
      return;
    }
    
    if (ctx.state === "suspended") {
      console.warn("AudioContext is suspended. User needs to interact with the page first.");
      // We will try to resume it anyway
      ctx.resume();
    }
    
    // A pleasant "ding-ding" chime
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.8, startTime + 0.05); // louder attack
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration); // decay
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Play the chime
    playTone(880, ctx.currentTime, 0.4); // A5
    playTone(1108.73, ctx.currentTime + 0.15, 0.6); // C#6
    console.log("🔊 Sound played successfully!");
  } catch (err) {
    console.error("Audio playback failed", err);
  }
};

