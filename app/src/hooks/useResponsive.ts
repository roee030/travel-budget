import { useWindowDimensions } from 'react-native';
import { breakpoints } from '../theme';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface Responsive {
  width: number;
  height: number;
  bp: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** tablet or desktop — i.e. wide enough for top nav / multi-column. */
  isWide: boolean;
  /** number of columns to use for a card grid at this width. */
  columns: number;
}

/**
 * Single source of truth for responsive layout. Recomputes on window resize
 * (works on web and native rotation) so screens can switch layout by breakpoint.
 */
export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= breakpoints.desktop;
  const isTablet = !isDesktop && width >= breakpoints.tablet;
  const isMobile = width < breakpoints.tablet;
  const bp: Breakpoint = isDesktop ? 'desktop' : isTablet ? 'tablet' : 'mobile';
  const columns = isDesktop ? 3 : isTablet ? 2 : 1;
  return {
    width,
    height,
    bp,
    isMobile,
    isTablet,
    isDesktop,
    isWide: !isMobile,
    columns,
  };
}
