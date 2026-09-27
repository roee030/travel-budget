/**
 * Material-3 design tokens lifted directly from the Triporia mockups so the
 * app renders 1:1 with the design. Used across all screens.
 */
export const colors = {
  primary: '#00685f',
  onPrimary: '#ffffff',
  primaryContainer: '#008378',
  onPrimaryContainer: '#f4fffc',
  primaryFixedDim: '#6bd8cb',
  onPrimaryFixedVariant: '#005049',

  secondary: '#565e74',
  onSecondary: '#ffffff',
  secondaryContainer: '#dae2fd',
  onSecondaryFixed: '#131b2e',

  tertiary: '#994100',
  onTertiary: '#ffffff',
  tertiaryContainer: '#c05400',
  onTertiaryContainer: '#fffbff',
  tertiaryFixed: '#ffdbca',
  tertiaryFixedDim: '#ffb690',

  error: '#ba1a1a',

  background: '#f8f9ff',
  surface: '#f8f9ff',
  onSurface: '#0b1c30',
  onSurfaceVariant: '#3d4947',
  surfaceVariant: '#d3e4fe',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#eff4ff',
  surfaceContainer: '#e5eeff',
  surfaceContainerHigh: '#dce9ff',
  surfaceContainerHighest: '#d3e4fe',
  inverseSurface: '#213145',
  inverseOnSurface: '#eaf1ff',

  outline: '#6d7a77',
  outlineVariant: '#bcc9c6',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  gutterSm: 12,
  md: 16,
  gutter: 16,
  margin: 20,
  lg: 24,
  marginLg: 32,
  xl: 36,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const font = {
  regular: 'Rubik_400Regular',
  medium: 'Rubik_500Medium',
  semibold: 'Rubik_600SemiBold',
  bold: 'Rubik_700Bold',
} as const;

export const type = {
  displayHero: { fontFamily: font.bold, fontSize: 32, lineHeight: 40 },
  headlineLg: { fontFamily: font.semibold, fontSize: 28, lineHeight: 36 },
  headlineMd: { fontFamily: font.semibold, fontSize: 22, lineHeight: 30 },
  headlineSm: { fontFamily: font.semibold, fontSize: 18, lineHeight: 24 },
  bodyLg: { fontFamily: font.regular, fontSize: 16, lineHeight: 24 },
  bodyMd: { fontFamily: font.regular, fontSize: 14, lineHeight: 20 },
  bodySm: { fontFamily: font.regular, fontSize: 12, lineHeight: 16 },
  labelTag: { fontFamily: font.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 0.4 },
  numericLg: { fontFamily: font.bold, fontSize: 24, lineHeight: 28 },
  numericMd: { fontFamily: font.semibold, fontSize: 16, lineHeight: 20 },
} as const;

export const shadow = {
  card: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
} as const;

/** Category → Material icon + color, shared by budget & itinerary screens. */
export const categoryVisual: Record<string, { icon: string; color: string; bg: string }> = {
  flight: { icon: 'flight', color: colors.primary, bg: 'rgba(0,104,95,0.10)' },
  hotel: { icon: 'hotel', color: colors.primaryContainer, bg: 'rgba(0,131,120,0.15)' },
  restaurant: { icon: 'restaurant', color: colors.tertiary, bg: 'rgba(153,65,0,0.12)' },
  attraction: { icon: 'local-activity', color: colors.tertiaryContainer, bg: 'rgba(192,84,0,0.15)' },
  nightlife: { icon: 'nightlife', color: colors.primary, bg: 'rgba(0,104,95,0.10)' },
  transport: { icon: 'directions-car', color: colors.secondary, bg: 'rgba(86,94,116,0.15)' },
  free: { icon: 'directions-walk', color: colors.primary, bg: 'rgba(0,104,95,0.10)' },
};
