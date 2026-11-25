import React, { useRef } from 'react';
import { View, ViewProps, findNodeHandle, AccessibilityInfo } from 'react-native';

export interface FocusManagerProps extends ViewProps {
  children: React.ReactNode;
}

export const FocusManager: React.FC<FocusManagerProps> = ({ children, ...props }) => {
  const containerRef = useRef<React.ElementRef<typeof View> | null>(null);

  const requestAccessibilityFocus = () => {
    const node = findNodeHandle(containerRef.current);
    if (node) {
      AccessibilityInfo.setAccessibilityFocus(node);
    }
  };

  return (
    <View ref={containerRef} onLayout={requestAccessibilityFocus} {...props}>
      {children}
    </View>
  );
};
