import { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ACCENTS = {
  rose:   { primary: '#ff4d8d', secondary: '#cc2266', light: 'rgba(255,77,141,0.15)',  teal: '#3ecf8e' },
  bleu:   { primary: '#38bdf8', secondary: '#0284c7', light: 'rgba(56,189,248,0.15)',  teal: '#3ecf8e' },
  violet: { primary: '#a855f7', secondary: '#7c3aed', light: 'rgba(168,85,247,0.15)',  teal: '#3ecf8e' },
  noir:   { primary: '#e8e8ea', secondary: '#a0a0a8', light: 'rgba(232,232,234,0.12)', teal: '#3ecf8e' },
  vert:   { primary: '#3ecf8e', secondary: '#2a9060', light: 'rgba(62,207,142,0.15)',  teal: '#38bdf8' },

  // Thèmes saisonniers
  printemps: { primary: '#f472b6', secondary: '#ec4899', light: 'rgba(244,114,182,0.15)', teal: '#34d399' },
  ete:       { primary: '#fbbf24', secondary: '#f59e0b', light: 'rgba(251,191,36,0.15)',  teal: '#60a5fa' },
  automne:   { primary: '#f97316', secondary: '#ea580c', light: 'rgba(249,115,22,0.15)',  teal: '#fbbf24' },
  hiver:     { primary: '#93c5fd', secondary: '#3b82f6', light: 'rgba(147,197,253,0.15)', teal: '#e0f2fe' },
};

export const THEMES = {
  dark: {
    bg:     '#0a0a0b',
    bg2:    '#0d0d0f',
    bg3:    '#161618',
    bg4:    '#1e1e21',
    bg5:    '#252528',
    border: '#2a2a2f',
    text:   '#e8e8ea',
    text2:  '#9a9a9e',
    text3:  '#5a5a60',
    text4:  '#3a3a40',
    statusBar: 'light',
  },
  light: {
    bg:     '#f5f5f7',
    bg2:    '#ffffff',
    bg3:    '#efefef',
    bg4:    '#e5e5e7',
    bg5:    '#dcdcde',
    border: '#d0d0d5',
    text:   '#1a1a1c',
    text2:  '#5a5a60',
    text3:  '#9a9a9e',
    text4:  '#c0c0c5',
    statusBar: 'dark',
  },

  // Thèmes saisonniers sombres
  dark_printemps: {
    bg: '#0d0a0d', bg2: '#110d11', bg3: '#1a1219',
    bg4: '#221820', bg5: '#2a1e28',
    border: '#2e1f2c',
    text: '#f0e8f0', text2: '#b09ab0', text3: '#7a6078', text4: '#4a3848',
    statusBar: 'light',
  },
  dark_ete: {
    bg: '#0d0d0a', bg2: '#11110d', bg3: '#1a1a12',
    bg4: '#22221a', bg5: '#2a2a20',
    border: '#2e2e1f',
    text: '#f0f0e8', text2: '#b0b09a', text3: '#7a7a60', text4: '#4a4a38',
    statusBar: 'light',
  },
  dark_automne: {
    bg: '#0d0b0a', bg2: '#11100d', bg3: '#1a1712',
    bg4: '#221f1a', bg5: '#2a2720',
    border: '#2e291f',
    text: '#f0ede8', text2: '#b0a89a', text3: '#7a7060', text4: '#4a4238',
    statusBar: 'light',
  },
  dark_hiver: {
    bg: '#0a0b0d', bg2: '#0d1011', bg3: '#121619',
    bg4: '#1a1e22', bg5: '#20262a',
    border: '#1f282e',
    text: '#e8eef0', text2: '#9aaab0', text3: '#607078', text4: '#384048',
    statusBar: 'light',
  },
};

const getSeason = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'printemps';
  if (month >= 6 && month <= 8) return 'ete';
  if (month >= 9 && month <= 11) return 'automne';
  return 'hiver';
};

const getSeasonalEmoji = (season) => {
  const emojis = { printemps: '🌸', ete: '☀️', automne: '🍂', hiver: '❄️' };
  return emojis[season] || '🌸';
};

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState('adaptive');
  const [accentKey, setAccentKeyState] = useState('rose');
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);
  const [seasonalMode, setSeasonalModeState] = useState(false);

  const currentSeason = getSeason();

  useEffect(() => { loadPrefs(); }, []);

  const loadPrefs = async () => {
    try {
      const savedMode     = await AsyncStorage.getItem('theme_mode');
      const savedAccent   = await AsyncStorage.getItem('accent');
      const launched      = await AsyncStorage.getItem('has_launched');
      const savedSeasonal = await AsyncStorage.getItem('seasonal_mode');

      if (savedMode)     setModeState(savedMode);
      if (savedAccent)   setAccentKeyState(savedAccent);
      if (savedSeasonal) setSeasonalModeState(savedSeasonal === 'true');
      setIsFirstLaunch(launched === null);
    } catch {
      setIsFirstLaunch(true);
    }
  };

  const setThemeMode = async (m) => {
    setModeState(m);
    await AsyncStorage.setItem('theme_mode', m);
  };

  const setAccent = async (key) => {
    setAccentKeyState(key);
    await AsyncStorage.setItem('accent', key);
    if (seasonalMode) {
      setSeasonalModeState(false);
      await AsyncStorage.setItem('seasonal_mode', 'false');
    }
  };

  const setSeasonalMode = async (enabled) => {
    setSeasonalModeState(enabled);
    await AsyncStorage.setItem('seasonal_mode', enabled.toString());
    if (enabled) {
      setAccentKeyState(currentSeason);
      await AsyncStorage.setItem('accent', currentSeason);
    }
  };

  const markLaunched = async () => {
    await AsyncStorage.setItem('has_launched', 'true');
    setIsFirstLaunch(false);
  };

  const resolvedMode = mode === 'adaptive'
    ? (systemScheme === 'light' ? 'light' : 'dark')
    : mode;

  const resolvedAccentKey = seasonalMode ? currentSeason : accentKey;

  const getTheme = () => {
    if (seasonalMode && resolvedMode === 'dark') {
      return THEMES[`dark_${currentSeason}`] || THEMES.dark;
    }
    return THEMES[resolvedMode];
  };

  const theme  = getTheme();
  const accent = ACCENTS[resolvedAccentKey] || ACCENTS.rose;

  return (
    <ThemeContext.Provider value={{
      theme, accent, mode, accentKey: resolvedAccentKey, resolvedMode,
      isFirstLaunch, seasonalMode, currentSeason,
      getSeasonalEmoji,
      setThemeMode, setAccent, markLaunched, setSeasonalMode,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);