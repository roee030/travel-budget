import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, spacing, shadow, type as typo } from '../theme';
import type { BudgetAllocation } from '../types';

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
