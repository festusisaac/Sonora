import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export interface FocusWrapperProps extends ViewProps {
  isFocused?: boolean;
  children: React.ReactNode;
}

/**
 * Visual focus indicator wrapper for TalkBack navigation
 */
export const FocusWrapper: React.FC<FocusWrapperProps> = ({
  isFocused = false,
  children,
  style,
  ...props
}) => {
  return (
    <View
      style={[
        styles.container,
        isFocused && styles.focused,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
  },
  focused: {
    borderWidth: 2,
    borderColor: colors.focusRing,
  },
});
