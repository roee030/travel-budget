import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp, Animated, DimensionValue } from 'react-native';
import { colors, radius, spacing, shadow, type as typo } from '../theme';
import type { BudgetAllocation } from '../types';

/** A pulsing placeholder block for loading states. */
export function Skeleton({ width = '100%', height = 16, radius: r = 8, style }: { width?: DimensionValue; height?: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ width, height, borderRadius: r, backgroundColor: colors.surfaceContainerHigh, opacity }, style]} />;
}

/** A skeleton stand-in for a proposal card while results load. */
export function ProposalCardSkeleton() {
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <Skeleton height={120} radius={0} />
      <View style={{ padding: spacing.md, gap: spacing.sm }}>
        <Skeleton height={40} />
        <Skeleton height={14} width="70%" />
        <Skeleton height={10} />
        <Skeleton height={48} radius={12} />
      </View>
    </Card>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Chip({
  label,
  icon,
  tone = 'neutral',
}: {
  label: string;
  icon?: React.ReactNode;
  tone?: 'neutral' | 'primary' | 'tertiary';
}) {
  const bg =
    tone === 'primary'
      ? colors.primaryContainer
      : tone === 'tertiary'
        ? 'rgba(192,84,0,0.15)'
        : colors.surfaceContainer;
  const fg =
    tone === 'primary' ? colors.onPrimaryContainer : tone === 'tertiary' ? colors.tertiary : colors.onSurfaceVariant;
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      {icon}
      <Text style={[typo.labelTag, { color: fg }]}>{label}</Text>
    </View>
  );
}

/** The 5-segment budget bar used on the results, budget and card views. */
const CATEGORY_COLORS: Record<string, string> = {
  flights: colors.primary,
  hotel: colors.primaryContainer,
  transport: colors.secondary,
  attractions: colors.tertiaryContainer,
  food: colors.tertiary,
  buffer: colors.outlineVariant,
};
const SEGMENT_ORDER: (keyof BudgetAllocation)[] = ['flights', 'hotel', 'transport', 'attractions', 'food'];

export function SegmentedBudgetBar({
  spend,
  height = 10,
}: {
  spend: BudgetAllocation;
  height?: number;
}) {
  const total = SEGMENT_ORDER.reduce((s, k) => s + (spend[k] || 0), 0) || 1;
  return (
    <View style={[styles.barTrack, { height, borderRadius: height }]}>
      {SEGMENT_ORDER.map((k) => {
        const pct = ((spend[k] || 0) / total) * 100;
        if (pct <= 0) return null;
        return (
          <View key={k} style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[k], height: '100%' }} />
        );
      })}
    </View>
  );
}

export function LegendDot({ color }: { color: string }) {
  return <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />;
}

export const budgetCategoryColor = (k: string) => CATEGORY_COLORS[k] ?? colors.outline;

/**
 * A keyless, themed destination photo URL derived from a query like
 * "Barcelona travel skyline". Uses LoremFlickr (no API key); if it fails to
 * load the caller keeps its solid teal fallback behind the image. When the
 * Google Places integration is live, swap this for real place photos.
 */
export function destinationImageUrl(query: string, w = 900, h = 500): string {
  const keywords = query
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(',');
  return `https://loremflickr.com/${w}/${h}/${encodeURIComponent(keywords || 'travel')}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadow.card,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  barTrack: {
    width: '100%',
    backgroundColor: colors.surfaceContainer,
    overflow: 'hidden',
    flexDirection: 'row',
  },
});
