import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  AccessibilityInfo,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';
import { SonoraText } from '../ui/SonoraText';
import { HapticsService } from '../../services/device/haptics';

export interface VoiceOrbProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  onPress: () => void;
  disabled?: boolean;
}

/**
 * VoiceOrb
 *
 * Immersive, large conversational audio wave centerpiece.
 * Features 3 concentric fluid pulsing ripples and animated equalizer bars.
 * High-contrast, WCAG AAA compliant, fully animated with native driver.
 */
export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  onPress,
  disabled = false,
}) => {
  const [reduceMotion, setReduceMotion] = useState(false);

  // Ripple animations
  const [pulse1] = useState(() => new Animated.Value(0));
  const [pulse2] = useState(() => new Animated.Value(0));
  const [pulse3] = useState(() => new Animated.Value(0));

  // Equalizer wave bars
  const [bar1] = useState(() => new Animated.Value(0.4));
  const [bar2] = useState(() => new Animated.Value(0.8));
  const [bar3] = useState(() => new Animated.Value(1.0));
  const [bar4] = useState(() => new Animated.Value(0.7));
  const [bar5] = useState(() => new Animated.Value(0.5));

  // Breathing animation for idle state
  const [idleBreath] = useState(() => new Animated.Value(1.0));

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

  // Idle subtle breathing loop
  useEffect(() => {
    if (state !== 'idle' || reduceMotion) {
      idleBreath.setValue(1.0);
      return;
    }

    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(idleBreath, {
          toValue: 1.04,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(idleBreath, {
          toValue: 1.0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    breathLoop.start();
    return () => breathLoop.stop();
  }, [state, reduceMotion, idleBreath]);

  // Active audio ripple and wave loop
  useEffect(() => {
    const isActive = state === 'listening' || state === 'speaking';
    if (!isActive || reduceMotion) {
      pulse1.setValue(0);
      pulse2.setValue(0);
      pulse3.setValue(0);
      bar1.setValue(0.4);
      bar2.setValue(0.8);
      bar3.setValue(1.0);
      bar4.setValue(0.7);
      bar5.setValue(0.5);
      return;
    }

    const createRipple = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.cubic),
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

    const createBar = (anim: Animated.Value, min: number, max: number, dur: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: max,
            duration: dur,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: min,
            duration: dur,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const r1 = createRipple(pulse1, 0);
    const r2 = createRipple(pulse2, 500);
    const r3 = createRipple(pulse3, 1000);

    const b1 = createBar(bar1, 0.3, 1.3, 340);
    const b2 = createBar(bar2, 0.2, 1.5, 420);
    const b3 = createBar(bar3, 0.4, 1.8, 300);
    const b4 = createBar(bar4, 0.2, 1.4, 460);
    const b5 = createBar(bar5, 0.3, 1.2, 380);

    r1.start();
    r2.start();
    r3.start();
    b1.start();
    b2.start();
    b3.start();
    b4.start();
    b5.start();

    return () => {
      r1.stop();
      r2.stop();
      r3.stop();
      b1.stop();
      b2.stop();
      b3.stop();
      b4.stop();
      b5.stop();
    };
  }, [state, reduceMotion, pulse1, pulse2, pulse3, bar1, bar2, bar3, bar4, bar5]);

  const handlePress = async () => {
    if (disabled) return;
    await HapticsService.impactHeavy();
    onPress();
  };

  const getAccessibilityLabel = () => {
    switch (state) {
      case 'listening':
        return 'Microphone is active. Listening for your voice. Tap to finish speaking.';
      case 'thinking':
        return 'SONORA is processing your request. Please wait.';
      case 'speaking':
        return 'SONORA is speaking. Double tap to interrupt.';
      case 'idle':
      default:
        return 'Double tap to activate microphone and speak to SONORA.';
    }
  };

  // Ripple scales (1.0 -> 1.7) and opacities (0.5 -> 0)
  const scale1 = pulse1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const opacity1 = pulse1.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 0.3, 0] });

  const scale2 = pulse2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const opacity2 = pulse2.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 0.3, 0] });

  const scale3 = pulse3.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const opacity3 = pulse3.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 0.3, 0] });

  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';
  const isThinking = state === 'thinking';

  return (
    <View style={styles.container}>
      <View style={styles.orbAnchor}>
        {/* Animated Ripple Waves */}
        {(isListening || isSpeaking) && !reduceMotion ? (
          <>
            <Animated.View
              accessible={false}
              importantForAccessibility="no"
              style={[
                styles.ripple,
                { transform: [{ scale: scale1 }], opacity: opacity1 },
              ]}
            />
            <Animated.View
              accessible={false}
              importantForAccessibility="no"
              style={[
                styles.ripple,
                { transform: [{ scale: scale2 }], opacity: opacity2 },
              ]}
            />
            <Animated.View
              accessible={false}
              importantForAccessibility="no"
              style={[
                styles.ripple,
                { transform: [{ scale: scale3 }], opacity: opacity3 },
              ]}
            />
          </>
        ) : null}

        {/* Center Orb Touch Control */}
        <Animated.View style={{ transform: [{ scale: state === 'idle' ? idleBreath : 1.0 }] }}>
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={getAccessibilityLabel()}
            accessibilityState={{ selected: isListening, busy: isThinking }}
            activeOpacity={0.88}
            onPress={handlePress}
            disabled={disabled}
            style={[
              styles.orb,
              isListening && styles.orbListening,
              isThinking && styles.orbThinking,
              isSpeaking && styles.orbSpeaking,
            ]}
          >
            {isThinking ? (
              <ActivityIndicator size="large" color={colors.white} />
            ) : isListening || isSpeaking ? (
              /* Live Waveform Equalizer Bars */
              <View
                accessible={false}
                importantForAccessibility="no"
                style={styles.waveGroup}
              >
                <Animated.View style={[styles.bar, { transform: [{ scaleY: bar1 }] }]} />
                <Animated.View style={[styles.bar, { transform: [{ scaleY: bar2 }] }]} />
                <Animated.View style={[styles.bar, styles.centerBar, { transform: [{ scaleY: bar3 }] }]} />
                <Animated.View style={[styles.bar, { transform: [{ scaleY: bar4 }] }]} />
                <Animated.View style={[styles.bar, { transform: [{ scaleY: bar5 }] }]} />
              </View>
            ) : (
              /* Microphone Icon in Idle State */
              <View
                accessible={false}
                importantForAccessibility="no"
                style={styles.micGlyph}
              >
                <View style={styles.micHead} />
                <View style={styles.micUStand} />
                <View style={styles.micStem} />
                <View style={styles.micFoot} />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Spoken Action Callout */}
      <View style={styles.captionContainer}>
        <SonoraText variant="title" style={styles.statusTitle}>
          {isListening
            ? 'Listening…'
            : isThinking
            ? 'Thinking…'
            : isSpeaking
            ? 'Speaking…'
            : 'Tap to speak'}
        </SonoraText>
        <SonoraText variant="body" style={styles.statusSubtitle}>
          {isListening
            ? 'Speak your request clearly'
            : isThinking
            ? 'Processing with Stellar intelligence'
            : isSpeaking
            ? 'Tap the orb to interrupt'
            : '“Check balance” or “Send 10 XLM to David”'}
        </SonoraText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  orbAnchor: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.yellow,
    borderWidth: 2,
    borderColor: colors.black,
  },
  orb: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.black,
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  orbListening: {
    backgroundColor: colors.black,
    borderColor: colors.yellow,
    transform: [{ scale: 1.05 }],
  },
  orbThinking: {
    backgroundColor: colors.black,
    borderColor: colors.border,
  },
  orbSpeaking: {
    backgroundColor: colors.black,
    borderColor: colors.yellow,
  },
  waveGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 60,
  },
  bar: {
    width: 6,
    height: 40,
    backgroundColor: colors.yellow,
    borderRadius: 3,
  },
  centerBar: {
    height: 50,
  },
  micGlyph: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micHead: {
    width: 26,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.black,
  },
  micUStand: {
    width: 40,
    height: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 4,
    borderTopWidth: 0,
    borderColor: colors.black,
    marginTop: -8,
  },
  micStem: {
    width: 4,
    height: 12,
    backgroundColor: colors.black,
  },
  micFoot: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.black,
  },
  captionContainer: {
    alignItems: 'center',
    marginTop: 24,
    gap: 4,
    paddingHorizontal: 20,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.black,
  },
  statusSubtitle: {
    color: colors.secondary,
    textAlign: 'center',
    fontSize: 15,
  },
});
