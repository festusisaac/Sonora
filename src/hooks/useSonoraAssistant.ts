import { useCallback, useRef, useEffect } from 'react';
import { useAIStore } from '../store/aiStore';
import { useWalletStore } from '../store/walletStore';
import { SonoraAIOrchestrator } from '../services/ai/SonoraAIOrchestrator';
import { getSpeechToTextAdapter } from '../services/speech/sttAdapter';
import { TTSService } from '../services/speech/tts';
import { HapticsService } from '../services/device/haptics';

export function useSonoraAssistant() {
  const {
    messages,
    assistantState,
    workflowStep,
    activeDraft,
    lastSpokenMessage,
    suggestedQuickReplies,
    speechSpeed,
    setAssistantState,
    clearConversation,
  } = useAIStore();

  const { publicKey } = useWalletStore();
  const sttAdapter = getSpeechToTextAdapter();
  const startListeningRef = useRef<() => Promise<void>>(async () => {});

  const processUserInput = useCallback(
    async (input: string) => {
      const orchestrator = SonoraAIOrchestrator.getInstance();
      return await orchestrator.processUserInput(input, publicKey);
    },
    [publicKey]
  );

  const startListening = useCallback(async () => {
    try {
      const orchestrator = SonoraAIOrchestrator.getInstance();
      orchestrator.setOnSpeakingDone(() => {
        setTimeout(() => {
          startListeningRef.current().catch(() => {});
        }, 350);
      });

      // If currently speaking, stop first
      await TTSService.stop();
      await HapticsService.impactMedium();
      setAssistantState('listening');

      await sttAdapter.startListening(
        async (phrase: string) => {
          await HapticsService.selection();
          await processUserInput(phrase);
        },
        async (error: Error) => {
          setAssistantState('idle');
          await HapticsService.notificationError();
        }
      );
    } catch {
      setAssistantState('idle');
    }
  }, [sttAdapter, processUserInput, setAssistantState]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const stopListening = useCallback(async () => {
    try {
      SonoraAIOrchestrator.getInstance().setOnSpeakingDone(undefined);
      await sttAdapter.stopListening();
    } finally {
      setAssistantState('idle');
    }
  }, [sttAdapter, setAssistantState]);

  const stopSpeaking = useCallback(async () => {
    SonoraAIOrchestrator.getInstance().setOnSpeakingDone(undefined);
    await TTSService.stop();
    setAssistantState('idle');
  }, [setAssistantState]);

  const repeatLastResponse = useCallback(async () => {
    await HapticsService.selection();
    await processUserInput('repeat');
  }, [processUserInput]);

  const cancelWorkflow = useCallback(async () => {
    await HapticsService.impactLight();
    await processUserInput('cancel');
  }, [processUserInput]);

  return {
    messages,
    assistantState,
    workflowStep,
    activeDraft,
    lastSpokenMessage,
    suggestedQuickReplies,
    speechSpeed,
    startListening,
    stopListening,
    stopSpeaking,
    processUserInput,
    repeatLastResponse,
    cancelWorkflow,
    clearConversation,
  };
}
