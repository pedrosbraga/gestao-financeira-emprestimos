// Theme configuration based on design document
export const COLORS = {
  primary: '#00D632',
  secondary: '#FF8C00',
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  error: '#EF4444',
  success: '#10B981',
  border: '#E5E7EB',
} as const;

export const TYPOGRAPHY = {
  sizes: {
    title: 24,
    subtitle: 18,
    body: 16,
    caption: 14,
  },
  weights: {
    regular: '400' as const,
    medium: '600' as const,
    bold: '700' as const,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 32,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;
