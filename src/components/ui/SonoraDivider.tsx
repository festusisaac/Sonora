import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export interface SonoraDividerProps {
  style?: StyleProp<ViewStyle>;
  color?: string;
}

export const SonoraDivider: React.FC<SonoraDividerProps> = ({ style, color }) => {
  return (
    <View
      accessible={false}
      style={[
        styles.divider,
        color ? { backgroundColor: color } : null,
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
    width: '100%',
  },
});
