import React, { createContext, useContext, useState } from 'react';
import { colors } from '../theme/colors';

export interface ThemeContextValue {
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  colors: typeof colors;
}

const ThemeContext = createContext<ThemeContextValue>({
  highContrast: false,
  setHighContrast: () => {},
  colors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrast] = useState(false);

  return (
    <ThemeContext.Provider value={{ highContrast, setHighContrast, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
