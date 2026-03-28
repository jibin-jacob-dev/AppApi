import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../constants/Colors';

const ThemeContext = createContext({
  theme: Colors.light,
  mode: 'system', // 'system' | 'light' | 'dark'
  setMode: () => {},
  isDark: false,
});

export const ThemeProvider = ({ children }) => {
  const deviceColorScheme = useDeviceColorScheme() ?? 'light';
  const [mode, setMode] = useState('system');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedMode = await SecureStore.getItemAsync('themeMode');
      if (savedMode) {
        setMode(savedMode);
      }
    } catch (e) {
      console.error('Failed to load theme:', e);
    }
  };

  const saveMode = async (newMode) => {
    setMode(newMode);
    await SecureStore.setItemAsync('themeMode', newMode);
  };

  const themeValue = useMemo(() => {
    const resolvedThemeName = mode === 'system' ? deviceColorScheme : mode;
    return {
      theme: Colors[resolvedThemeName],
      mode,
      setMode: saveMode,
      isDark: resolvedThemeName === 'dark'
    };
  }, [mode, deviceColorScheme]);

  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
