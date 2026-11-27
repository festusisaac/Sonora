import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface ScreenReaderAnnouncementProps {
  message: string;
}

/**
 * ScreenReaderAnnouncement
 * Uses TalkBack accessibilityLiveRegion="assertive" to announce dynamic changes
 * (e.g., "Balance loaded: 150 XLM", "Payment prepared")
 */
export const ScreenReaderAnnouncement: React.FC<ScreenReaderAnnouncementProps> = ({
  message,
}) => {
  if (!message) return null;

  return (
    <View
      accessible={true}
      accessibilityLiveRegion="polite"
      style={styles.srOnly}
    >
      <Text>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  srOnly: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
});
