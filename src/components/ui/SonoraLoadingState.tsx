import React from 'react';
import { View, StyleSheet, ActivityIndicator, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { SonoraText } from './SonoraText';

export interface SonoraLoadingStateProps {
  message?: string;
  style?: StyleProp<ViewStyle>;
}

export const SonoraLoadingState: React.FC<SonoraLoadingStateProps> = ({
  message = 'Loading… Please wait',
  style,
}) => {
  return (
    <View
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={message}
      style={[styles.container, style]}
    >
      <ActivityIndicator size="large" color={colors.black} />
      <SonoraText variant="body" style={styles.text}>
        {message}
      </SonoraText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  text: {
    color: colors.secondary,
    textAlign: 'center',
  },
});
