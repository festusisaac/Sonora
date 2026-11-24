import { useState, useCallback } from 'react';
import { useVoiceStore } from '../store/voiceStore';
import { TTSService } from '../services/speech/tts';
import { getSpeechToTextAdapter } from '../services/speech/sttAdapter';
import { parseVoiceCommand } from '../services/speech/commandParser';
import { HapticsService } from '../services/device/haptics';

const sttAdapter = getSpeechToTextAdapter();

export function useVoiceAssistant() {
  const {
    isListening,
    lastRecognizedPhrase,
    spokenResponseStatus,
    setListening,
    setRecognitionStatus,
    setLastRecognizedPhrase,
    setSpokenResponseStatus,
    setLastSpokenText,
  } = useVoiceStore();

  const [activeAnnouncement, setActiveAnnouncement] = useState<string>('');

  const speak = useCallback(
    async (text: string) => {
      setSpokenResponseStatus('speaking');
      setLastSpokenText(text);
      setActiveAnnouncement(text);

      await TTSService.speak(text, {
        onDone: () => {
          setSpokenResponseStatus('completed');
        },
        onError: () => {
          setSpokenResponseStatus('error');
        },
      });
    },
    [setLastSpokenText, setSpokenResponseStatus]
  );

  const startListening = useCallback(async () => {
    await HapticsService.impactMedium();
    setListening(true);
    setRecognitionStatus('listening');

    await sttAdapter.startListening(
      async (phrase) => {
        setListening(false);
        setLastRecognizedPhrase(phrase);
        setRecognitionStatus('success');
        await HapticsService.notificationSuccess();

        const parsed = parseVoiceCommand(phrase);
        if (parsed.type === 'CHECK_BALANCE') {
          await speak('Checking your Stellar wallet balance on Testnet.');
        } else if (parsed.type === 'SEND_PAYMENT') {
          await speak(
            `Preparing to send ${parsed.params?.amount} ${parsed.params?.asset} to ${parsed.params?.recipient}. Please confirm.`
          );
        } else {
          await speak(`Recognized command: ${phrase}`);
        }
      },
      (error) => {
        setListening(false);
        setRecognitionStatus('error');
      }
    );
  }, [setListening, setRecognitionStatus, setLastRecognizedPhrase, speak]);

  const stopListening = useCallback(async () => {
    await sttAdapter.stopListening();
    setListening(false);
    setRecognitionStatus('idle');
  }, [setListening, setRecognitionStatus]);

  return {
    isListening,
    lastRecognizedPhrase,
    spokenResponseStatus,
    activeAnnouncement,
    speak,
    startListening,
    stopListening,
  };
}
