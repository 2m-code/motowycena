export const theme = {
  colors: {
    // Dopasowanie do oryginalnego @theme w index.css
    forest: '#1E293B',
    forestLight: '#E2E8F0',
    sand: '#FFFFFF',
    clay: '#0066FF',
    // Pozostałe odcienie użyte w Tailwindowych klasach
    slate50: '#F8FAFC',
    slate200: '#E2E8F0',
    slate300: '#CBD5E1',
    slate400: '#94A3B8',
    slate500: '#64748B',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1E293B',
    slate900: '#0F172A',
    blue400: '#60A5FA',
    blue500: '#0066FF',
    blue700: '#0044BB',
    white: '#FFFFFF',
  },
  fonts: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
  radii: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    full: '9999px',
  },
  maxWidth: {
    container: '80rem', // max-w-7xl
  },
};

export const media = {
  sm: `@media (min-width: ${theme.breakpoints.sm})`,
  md: `@media (min-width: ${theme.breakpoints.md})`,
  lg: `@media (min-width: ${theme.breakpoints.lg})`,
  xl: `@media (min-width: ${theme.breakpoints.xl})`,
};

export type Theme = typeof theme;
