export const colors = {
  bg: '#0A0A0A',
  surface: '#141414',
  surfaceLight: '#1E1E1E',
  border: '#2A2A2A',
  text: '#FAFAFA',
  textSecondary: '#888888',
  textTertiary: '#555555',
  accent: '#22C55E', // green — matches heatmap, gym energy
  accentDim: '#16A34A',
  accentMuted: 'rgba(34, 197, 94, 0.15)',
  red: '#EF4444',
  redMuted: 'rgba(239, 68, 68, 0.15)',
  heatmap0: '#1E1E1E', // no workout
  heatmap1: '#14532D', // light
  heatmap2: '#166534', // moderate
  heatmap3: '#22C55E', // full
  overlay: 'rgba(10, 10, 10, 0.6)',
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
