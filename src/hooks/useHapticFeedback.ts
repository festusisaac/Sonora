import { useCallback } from 'react';
import { HapticsService } from '../services/device/haptics';

export function useHapticFeedback() {
  const triggerTick = useCallback(() => HapticsService.selection(), []);
  const triggerImpact = useCallback(() => HapticsService.impactMedium(), []);
  const triggerSuccess = useCallback(() => HapticsService.notificationSuccess(), []);
  const triggerError = useCallback(() => HapticsService.notificationError(), []);

  return {
    triggerTick,
    triggerImpact,
    triggerSuccess,
    triggerError,
  };
}
