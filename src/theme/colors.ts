export const colors = {
  background: '#FFFFFF',
  surface: '#F7F7F7',
  primary: '#00C16A',
  primaryDark: '#009E55',
  textPrimary: '#111111',
  textSecondary: '#6B6B6B',
  textHint: '#ABABAB',
  border: '#EFEFEF',
  error: '#FF4444',
  success: '#00C16A',
  warning: '#FF9500',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',

  // Navy theme colors
  navy: '#0B1A3E',
  navyDark: '#060F28',
  navyLight: '#132452',
  navyMid: '#0F2048',
  accent: '#1A3070',
} as const;

export const lightColors = {
  ...colors,
  screenBg: '#ECEDF3',
  cardBg: '#FFFFFF',
  headerBg: '#1A1A2E',
  tabBarBg: 'rgba(255,255,255,0.15)',
  tabBarBorder: 'rgba(200,200,200,0.4)',
  tabBarIcon: '#0B1A3E',
  tabBarLabel: '#0B1A3E',
  inputBg: '#F7F7F7',
  shimmer: 'rgba(0,0,0,0.04)',
  stripeBg: (opacity: number) => `rgba(0,0,0,${opacity})`,
} as const;

export const darkColors = {
  ...colors,
  background: '#060F28',
  surface: '#0F1D3D',
  textPrimary: '#EEF0F6',
  textSecondary: '#8A94B0',
  textHint: '#556080',
  border: '#1A2A52',
  white: '#EEF0F6',
  overlay: 'rgba(4,8,20,0.7)',
  navy: '#0B1A3E',
  navyDark: '#040B1E',
  navyLight: '#162B5C',
  navyMid: '#0F2048',

  screenBg: '#060F28',
  cardBg: '#0C1832',
  headerBg: '#040B1E',
  tabBarBg: 'rgba(6,15,40,0.8)',
  tabBarBorder: 'rgba(255,255,255,0.08)',
  tabBarIcon: '#C8D0E8',
  tabBarLabel: '#C8D0E8',
  inputBg: '#0F1D3D',
  shimmer: 'rgba(255,255,255,0.03)',
  stripeBg: (opacity: number) => `rgba(150,170,220,${opacity * 0.5})`,
} as const;

export type ThemeColors = typeof lightColors;
