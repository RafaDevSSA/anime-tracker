export const palette = {
  orange: '#F47521',
  orangeSubtle: 'rgba(244,117,33,0.15)',
  gold: '#F5C518',
  red: '#E53935',
  green: '#43A047',
};

const dark = {
  background: '#14151A',
  surface: '#1F2033',
  card: '#1A1B2E',
  border: '#2A2B3D',
  accent: palette.orange,
  accentSubtle: palette.orangeSubtle,
  text: '#FFFFFF',
  textSecondary: '#A0A3B1',
  textMuted: '#565873',
  error: '#FF6B6B',
  score: palette.gold,
  tint: palette.orange,
  tabIconDefault: '#565873',
  tabIconSelected: palette.orange,
};

const light = {
  background: '#F0F0F5',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E0E0EC',
  accent: palette.orange,
  accentSubtle: 'rgba(244,117,33,0.10)',
  text: '#14151A',
  textSecondary: '#50507A',
  textMuted: '#9090B0',
  error: '#D32F2F',
  score: '#B8860B',
  tint: palette.orange,
  tabIconDefault: '#9090B0',
  tabIconSelected: palette.orange,
};

export type ColorScheme = typeof dark;

const Colors = { light, dark };
export default Colors;
