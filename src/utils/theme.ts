export const colors = {
  bg: '#0A0A0A',
  surface: '#141414',
  surfaceLight: '#1A1A1A',
  border: '#262626',
  text: '#F5F5F5',
  textSecondary: '#8A8A8A',
  textTertiary: '#4A4A4A',
  accent: '#22C55E', // green — matches heatmap, gym energy
  accentDim: '#16A34A',
  accentMuted: 'rgba(34, 197, 94, 0.12)',
  red: '#EF4444',
  redMuted: 'rgba(239, 68, 68, 0.15)',
  heatmap0: '#161616', // no workout
  heatmap1: '#14532D', // light
  heatmap2: '#166534', // moderate
  heatmap3: '#22C55E', // full
  overlay: 'rgba(0, 0, 0, 0.65)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const font = {
  regular: 'System',
  mono: 'Courier',
} as const;
