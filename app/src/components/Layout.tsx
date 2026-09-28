import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { maxContentWidth, gutterFor } from '../theme';
import { useResponsive } from '../hooks/useResponsive';

/**
 * Centers content at a max width with responsive side gutters, so the app fills
 * large screens (up to ~1200px, centered) instead of being stuck at phone width.
 */
export function Container({
  children,
  style,
  gutter = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gutter?: boolean;
}) {
  const { bp } = useResponsive();
  const padding = gutter ? gutterFor(bp) : 0;
  return (
    <View style={[styles.outer, { paddingHorizontal: padding }, style]}>
      <View style={[styles.inner, { maxWidth: maxContentWidth }]}>{children}</View>
    </View>
  );
}

/**
 * A responsive wrap grid. Each child is placed in a cell sized to `columns`
 * (from useResponsive) with a consistent gap. Children should not set their own
 * width — the cell controls it.
 */
export function Grid({
  children,
  columns,
  gap = 16,
}: {
  children: React.ReactNode;
  columns: number;
  gap?: number;
}) {
  const items = React.Children.toArray(children);
  const basis = columns === 1 ? '100%' : `${100 / columns}%`;
  return (
    <View style={[styles.grid, { margin: -gap / 2 }]}>
      {items.map((child, i) => (
        <View key={i} style={{ flexBasis: basis as any, maxWidth: basis as any, padding: gap / 2 }}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { width: '100%', alignItems: 'center' },
  inner: { width: '100%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
});
