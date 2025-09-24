export async function playSfx(src: string, volume: number = 0.9): Promise<void> {
  if (typeof window === 'undefined') return;
  return new Promise<void>((resolve) => {
    try {
      const audio = new Audio(src);
      audio.volume = Math.max(0, Math.min(1, volume));
      const done = () => resolve();
      audio.addEventListener('ended', done, { once: true });
      audio.addEventListener('error', done, { once: true });
      audio.play().catch(() => resolve());
    } catch {
      resolve();
    }
  });
}

export async function playSfxSequence(sources: string[], gapMs: number = 120, volume: number = 0.9): Promise<void> {
  for (let i = 0; i < sources.length; i++) {
    await playSfx(sources[i], volume);
    if (gapMs > 0 && i < sources.length - 1) {
      await new Promise((r) => setTimeout(r, gapMs));
    }
  }
}
