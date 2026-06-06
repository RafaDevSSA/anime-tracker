import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import Colors, { type ColorScheme } from '../../constants/Colors';
import { SettingsRepository } from '../db/SettingsRepository';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  colors: ColorScheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: Colors.dark,
  mode: 'system',
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceScheme = useDeviceColorScheme() ?? 'dark';
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    SettingsRepository.getString('colorScheme', 'system').then((v) =>
      setModeState((v as ThemeMode) ?? 'system')
    );
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    SettingsRepository.setString('colorScheme', next);
  };

  const resolved = mode === 'system' ? (deviceScheme === 'light' ? 'light' : 'dark') : mode;
  const colors = Colors[resolved];

  return (
    <ThemeContext.Provider value={{ colors, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
