import { useCallback } from 'react';
import { soundService, ChessAudioOptions } from '../services/sound';
import { GameSettings } from '../types';

export function useChessAudio(settings?: Partial<GameSettings>) {
  const soundEnabled = settings?.soundEnabled ?? true;
  const volume = settings?.volume ?? 80;

  const playMove = useCallback(() => {
    if (!soundEnabled) return;
    soundService.playMove(volume);
  }, [soundEnabled, volume]);

  const playCapture = useCallback(() => {
    if (!soundEnabled) return;
    soundService.playCapture(volume);
  }, [soundEnabled, volume]);

  const playCheck = useCallback(() => {
    if (!soundEnabled) return;
    soundService.playCheck(volume);
  }, [soundEnabled, volume]);

  const playCastle = useCallback(() => {
    if (!soundEnabled) return;
    soundService.playCastle(volume);
  }, [soundEnabled, volume]);

  const playPromote = useCallback(() => {
    if (!soundEnabled) return;
    soundService.playPromote(volume);
  }, [soundEnabled, volume]);

  const playGameEnd = useCallback((victory: boolean = true) => {
    if (!soundEnabled) return;
    soundService.playGameEnd(victory, volume);
  }, [soundEnabled, volume]);

  const playDraw = useCallback(() => {
    if (!soundEnabled) return;
    soundService.playDraw(volume);
  }, [soundEnabled, volume]);

  const playLowTime = useCallback(() => {
    if (!soundEnabled) return;
    soundService.playLowTime(volume);
  }, [soundEnabled, volume]);

  const triggerAudioCue = useCallback((options: ChessAudioOptions) => {
    if (!soundEnabled) return;
    soundService.playMoveCue(options, volume);
  }, [soundEnabled, volume]);

  return {
    playMove,
    playCapture,
    playCheck,
    playCastle,
    playPromote,
    playGameEnd,
    playDraw,
    playLowTime,
    triggerAudioCue,
  };
}
