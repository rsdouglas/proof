/**
 * Vouch Design Tokens
 * Single source of truth for colors, spacing, shadows, radii.
 * All inline-style components should import from here.
 */

export const colors = {
  // Brand — indigo-600 as the single accent
  brand: '#4f46e5',
  brandHover: '#4338ca',
  brandLight: '#eef2ff',
  brandBorder: '#c7d2fe',

  // Neutrals
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Semantic
  success: '#16a34a',
  successLight: '#f0fdf4',
  successBorder: '#bbf7d0',

  warning: '#d97706',
  warningLight: '#fffbeb',

  danger: '#dc2626',
  dangerLight: '#fef2f2',
  dangerBorder: '#fecaca',
} as const

export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const

export const shadow = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
  lg: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
} as const

export const font = {
  sans: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
  mono: '"SF Mono", "Fira Code", monospace',
} as const

// Common button styles
export const btn = {
  primary: {
    padding: '8px 16px',
    background: colors.brand,
    color: colors.white,
    border: 'none',
    borderRadius: radius.md,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: font.sans,
    transition: 'background 0.15s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  outline: {
    padding: '8px 16px',
    background: colors.white,
    color: colors.gray700,
    border: `1px solid ${colors.gray200}`,
    borderRadius: radius.md,
    fontWeight: 500,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: font.sans,
    transition: 'border-color 0.15s, background 0.15s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  ghost: {
    padding: '8px 12px',
    background: 'transparent',
    color: colors.gray500,
    border: 'none',
    borderRadius: radius.md,
    fontWeight: 500,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: font.sans,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  danger: {
    padding: '8px 12px',
    background: 'transparent',
    color: colors.danger,
    border: 'none',
    borderRadius: radius.md,
    fontWeight: 500,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: font.sans,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
} as const

// Common card style
export const card = {
  background: colors.white,
  border: `1px solid ${colors.gray200}`,
  borderRadius: radius.lg,
  boxShadow: shadow.sm,
  padding: '24px',
} as const
