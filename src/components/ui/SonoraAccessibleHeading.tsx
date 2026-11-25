import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { SonoraText } from './SonoraText';

export interface SonoraAccessibleHeadingProps {
  title: string;
  subtitle?: string;
  level?: 1 | 2 | 3;
  style?: StyleProp<ViewStyle>;
  action?: React.ReactNode;
}

export const SonoraAccessibleHeading: React.FC<SonoraAccessibleHeadingProps> = ({
  title,
  subtitle,
  style,
  action,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textColumn}>
        <SonoraText
          variant="title"
          accessibilityRole="header"
          style={styles.title}
        >
          {title}
        </SonoraText>
        {subtitle ? (
          <SonoraText variant="subtitle" style={styles.subtitle}>
            {subtitle}
          </SonoraText>
        ) : null}
      </View>
      {action}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  textColumn: {
    flex: 1,
  },
  title: {
    color: colors.black,
    fontWeight: typography.fontWeights.heavy,
  },
  subtitle: {
    color: colors.secondary,
    marginTop: 2,
  },
});
