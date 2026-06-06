import { useCallback, useState, useEffect } from 'react';

const SOUNDS_ENABLED_KEY = 'webterminal-sounds-enabled';

export function useSound() {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem(SOUNDS_ENABLED_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem(SOUNDS_ENABLED_KEY, enabled.toString());
  }, [enabled]);

  const toggle = useCallback(() => {
    setEnabled((e) => !e);
  }, []);

  const play = useCallback(
    (type: 'success' | 'error' | 'info') => {
      if (!enabled) return;

      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const frequencies = {
          success: 800,
          error: 300,
          info: 600,
        };

        const durations = {
          success: 0.1,
          error: 0.2,
          info: 0.05,
        };

        oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + durations[type]);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + durations[type]);

        setTimeout(() => {
          audioContext.close();
        }, durations[type] * 1000 + 100);
      } catch {
        // Web Audio API not supported
      }
    },
    [enabled]
  );

  return { play, enabled, toggle };
}
