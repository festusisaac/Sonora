import React, { useEffect, useRef, useState } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
  AccessibilityState,
  AccessibilityInfo,
  Animated,
  Easing,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { SonoraText } from '../ui/SonoraText';
import { HapticsService } from '../../services/device/haptics';

export interface VoiceInputControlProps {
  isListening: boolean;
  isProcessing?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * VoiceInputControl
 * High-contrast, large touch target (80x80dp) microphone control.
 * Features a lightweight native-driver audio pulse & waveform animation
 * optimized for budget Android devices with full Reduce Motion accessibility support.
 */
export const VoiceInputControl: React.FC<VoiceInputControlProps> = ({
  isListening,
  isProcessing = false,
  onPress,
  disabled = false,
}) => {
  const [reduceMotion, setReduceMotion] = useState(false);

  // Animated values for pulse halo and waveform bars
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const wave1 = useRef(new Animated.Value(0.4)).current;
  const wave2 = useRef(new Animated.Value(0.8)).current;
  const wave3 = useRef(new Animated.Value(0.5)).current;
  const wave4 = useRef(new Animated.Value(0.7)).current;

  // Check Android Reduce Motion accessibility setting
  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (isMounted) setReduceMotion(enabled);
    });

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      if (isMounted) setReduceMotion(enabled);
    });

    return () => {
      isMounted = false;
      sub?.remove();
    };
  }, []);

  // Native driver animation loop
  useEffect(() => {
    if (!isListening || reduceMotion) {
      pulseAnim1.setValue(0);
      pulseAnim2.setValue(0);
      wave1.setValue(0.4);
      wave2.setValue(0.8);
      wave3.setValue(0.5);
      wave4.setValue(0.7);
      return;
    }

    // Concentric pulsing rings loop
    const createPulseLoop = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Waveform rhythmic bar oscillator
    const createWaveLoop = (anim: Animated.Value, minVal: number, maxVal: number, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: maxVal,
            duration: duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: minVal,
            duration: duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const pulse1 = createPulseLoop(pulseAnim1, 0);
    const pulse2 = createPulseLoop(pulseAnim2, 600);
    const waveLoop1 = createWaveLoop(wave1, 0.3, 1.2, 450);
    const waveLoop2 = createWaveLoop(wave2, 0.2, 1.4, 380);
    const waveLoop3 = createWaveLoop(wave3, 0.4, 1.3, 520);
    const waveLoop4 = createWaveLoop(wave4, 0.3, 1.1, 410);

    pulse1.start();
    pulse2.start();
    waveLoop1.start();
    waveLoop2.start();
    waveLoop3.start();
    waveLoop4.start();

    return () => {
      pulse1.stop();
      pulse2.stop();
      waveLoop1.stop();
      waveLoop2.stop();
      waveLoop3.stop();
      waveLoop4.stop();
    };
  }, [isListening, reduceMotion, pulseAnim1, pulseAnim2, wave1, wave2, wave3, wave4]);

  const handlePress = async () => {
    if (disabled || isProcessing) return;
    await HapticsService.impactHeavy();
    onPress();
  };

  const accessibilityState: AccessibilityState = {
    selected: isListening,
    busy: isProcessing,
    disabled,
  };

  const getLabel = () => {
    if (isProcessing) return 'Thinking… Please wait';
    if (isListening) return 'Stop listening';
    return 'Speak to SONORA';
  };

  const getHint = () => {
    if (isProcessing) return 'SONORA is processing your request';
    if (isListening) return 'Double tap to stop microphone';
    return 'Double tap to activate microphone and speak your request';
  };

  // Pulse interpolations (scale 1.0 -> 1.45, opacity 0.6 -> 0)
  const pulseScale1 = pulseAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.45],
  });
  const pulseOpacity1 = pulseAnim1.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.6, 0.3, 0],
  });

  const pulseScale2 = pulseAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.45],
  });
  const pulseOpacity2 = pulseAnim2.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.6, 0.3, 0],
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.buttonAnchor}>
        {/* Outer Pulsing Halo Rings (Native Driver, zero JS thread cost) */}
        {isListening && !reduceMotion ? (
          <>
            <Animated.View
              accessible={false}
              importantForAccessibility="no"
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseScale1 }],
                  opacity: pulseOpacity1,
                },
              ]}
            />
            <Animated.View
              accessible={false}
              importantForAccessibility="no"
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseScale2 }],
                  opacity: pulseOpacity2,
                },
              ]}
            />
          </>
        ) : null}

        {/* Primary Action Button */}
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={getLabel()}
          accessibilityHint={getHint()}
          accessibilityState={accessibilityState}
          activeOpacity={0.85}
          onPress={handlePress}
          disabled={disabled || isProcessing}
          style={[
            styles.button,
            isListening && styles.buttonListening,
            isProcessing && styles.buttonProcessing,
          ]}
        >
          {isProcessing ? (
            <ActivityIndicator size="large" color={colors.white} />
          ) : isListening ? (
            /* Live Audio Waveform Bars when listening */
            <View
              accessible={false}
              importantForAccessibility="no"
              style={styles.waveformContainer}
            >
              <Animated.View style={[styles.waveBar, { transform: [{ scaleY: wave1 }] }]} />
              <Animated.View style={[styles.waveBar, { transform: [{ scaleY: wave2 }] }]} />
              <Animated.View style={[styles.waveBar, { transform: [{ scaleY: wave3 }] }]} />
              <Animated.View style={[styles.waveBar, { transform: [{ scaleY: wave4 }] }]} />
            </View>
          ) : (
            /* Microphone Glyph when idle */
            <View
              accessible={false}
              importantForAccessibility="no"
              style={styles.iconContainer}
            >
              <View style={styles.micStem} />
              <View style={styles.micBase} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <SonoraText
        variant="label"
        style={[
          styles.statusCaption,
          isListening && styles.statusCaptionListening,
        ]}
      >
        {isListening ? 'Listening… Tap to finish' : isProcessing ? 'Processing…' : 'Tap to speak'}
      </SonoraText>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
    gap: spacing.xs,
  },
  buttonAnchor: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.yellow,
    borderWidth: 2,
    borderColor: colors.black,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.black,
    elevation: 4,
  },
  buttonListening: {
    backgroundColor: colors.black,
    borderColor: colors.yellow,
    transform: [{ scale: 1.05 }],
  },
  buttonProcessing: {
    backgroundColor: colors.black,
    borderColor: colors.border,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 36,
  },
  waveBar: {
    width: 4,
    height: 24,
    backgroundColor: colors.yellow,
    borderRadius: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micStem: {
    width: 16,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.black,
  },
  micBase: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.black,
    marginTop: 4,
  },
  statusCaption: {
    color: colors.black,
    fontWeight: '700',
    fontSize: 13,
  },
  statusCaptionListening: {
    color: colors.black,
  },
});
