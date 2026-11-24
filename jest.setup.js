// Jest Setup File for Sonora
import './src/config/polyfills';

// Mock expo-speech
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
}));

// Mock expo-speech-recognition
jest.mock('expo-speech-recognition', () => ({
  ExpoSpeechRecognitionModule: {
    getStateAsync: jest.fn().mockResolvedValue({ isRecognizing: false }),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    start: jest.fn(),
    stop: jest.fn(),
    abort: jest.fn(),
    addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
}));
