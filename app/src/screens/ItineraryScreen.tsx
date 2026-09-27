import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing, type as typo, categoryVisual } from '../theme';
import { Card } from '../components/ui';
import { useStore, money } from '../store';
import type { ItineraryItem } from '../types';

function costBadge(item: ItineraryItem, currency: string) {
  if (item.category === 'free' || item.estimatedCost === 0) {
    return { label: 'חינם', bg: 'rgba(0,104,95,0.12)', fg: colors.primary };
  }
  if (item.category === 'attraction') {
    return { label: 'כלול בתקציב', bg: 'rgba(0,104,95,0.12)', fg: colors.primary };
  }
  if (item.category === 'restaurant') {
    return { label: `~${money(item.estimatedCost, currency)}`, bg: 'rgba(153,65,0,0.10)', fg: colors.tertiary };
  }
  return { label: money(item.estimatedCost, currency), bg: colors.surfaceContainer, fg: colors.onSurfaceVariant };
}

function TimelineItem({ item, currency, last }: { item: ItineraryItem; currency: string; last: boolean }) {
  const vis = categoryVisual[item.category] ?? categoryVisual.free;
  const badge = costBadge(item, currency);
  const isFood = item.category === 'restaurant';
  return (
    <View style={[styles.timelineRow, { paddingBottom: last ? 0 : spacing.lg }]}>
      <View style={[styles.node, { backgroundColor: vis.bg }]}>
        <MaterialIcons name={vis.icon as any} size={20} color={vis.color} />
      </View>
      <Card style={[styles.itemCard, isFood ? styles.foodCard : null]}>
        <View style={styles.between}>
          <Text style={[typo.numericMd, { color: isFood ? colors.tertiary : colors.primary }]}>{item.time}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[typo.labelTag, { color: badge.fg }]}>{badge.label}</Text>
          </View>
        </View>
        <Text style={[typo.headlineSm, { color: colors.onSurface }]}>{item.title}</Text>
        {item.description ? <Text style={[typo.bodyMd, { color: colors.onSurfaceVariant }]}>{item.description}</Text> : null}
      </Card>
    </View>
  );
}

export function ItineraryScreen() {
  const { plan, loadingPlan, currency } = useStore();
  const [activeDay, setActiveDay] = useState(1);

  if (loadingPlan) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typo.bodyMd, { color: colors.onSurfaceVariant }]}>מרכיב את המסלול…</Text>
      </View>
    );
  }
  if (!plan) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="calendar-today" size={48} color={colors.outline} />
        <Text style={[typo.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>בחרו הצעה כדי לראות את המסלול היומי.</Text>
      </View>
    );
  }

  const day = plan.days.find((d) => d.day === activeDay) ?? plan.days[0];
  const dayCost = day ? day.items.reduce((s, it) => s + (it.estimatedCost || 0), 0) : 0;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headRow}>
        <View style={styles.rowCenter}>
          <MaterialIcons name="route" size={20} color={colors.primary} />
          <Text style={[typo.labelTag, { color: colors.primary }]}>תוכנית מותאמת אישית</Text>
        </View>
      </View>
      <Text style={[typo.headlineMd, { color: colors.onSurface }]}>מסלול יומי: {plan.destination}</Text>

      {/* Day scroller */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroller}>
        {plan.days.map((d) => {
          const active = d.day === activeDay;
          return (
            <Pressable key={d.day} onPress={() => setActiveDay(d.day)} style={[styles.dayChip, active ? styles.dayChipActive : styles.dayChipIdle]}>
              <Text style={[typo.labelTag, { color: active ? colors.onPrimary : colors.onSurfaceVariant }]}>יום {d.day}</Text>
              <Text style={[typo.headlineSm, { color: active ? colors.onPrimary : colors.onSurface }]} numberOfLines={1}>{d.summary}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Daily budget capsule */}
      <Card style={styles.budgetCapsule}>
        <View style={styles.rowCenter}>
          <View style={styles.walletIcon}>
            <MaterialIcons name="account-balance-wallet" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>הוצאה משוערת ליום זה</Text>
            <Text style={[typo.headlineSm, { color: colors.onSurface }]}>{money(dayCost, currency)}</Text>
          </View>
        </View>
        <View style={styles.trendPill}>
          <MaterialIcons name="trending-down" size={14} color={colors.primary} />
          <Text style={[typo.labelTag, { color: colors.primary }]}>לפי התקציב</Text>
        </View>
      </Card>

      {/* Timeline */}
      <View style={{ marginTop: spacing.xs }}>
        {day?.items.map((item, i) => (
          <TimelineItem key={i} item={item} currency={currency} last={i === day.items.length - 1} />
        ))}
      </View>

      {/* Tips */}
      {plan.tips.length ? (
        <Card style={styles.tips}>
          <View style={styles.rowCenter}>
            <MaterialIcons name="tips-and-updates" size={18} color={colors.tertiary} />
            <Text style={[typo.headlineSm, { color: colors.onSurface }]}>טיפים מה-AI</Text>
          </View>
          {plan.tips.map((t, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={[typo.bodySm, { color: colors.tertiary }]}>•</Text>
              <Text style={[typo.bodySm, { color: colors.onSurfaceVariant, flex: 1 }]}>{t}</Text>
            </View>
          ))}
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.margin, gap: spacing.sm, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dayScroller: { gap: spacing.sm, paddingVertical: spacing.xs },
  dayChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg, maxWidth: 180 },
  dayChipActive: { backgroundColor: colors.primary },
  dayChipIdle: { backgroundColor: colors.surfaceContainerLow },
  budgetCapsule: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  walletIcon: { width: 36, height: 36, borderRadius: radius.full, backgroundColor: 'rgba(0,104,95,0.10)', alignItems: 'center', justifyContent: 'center' },
  trendPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,104,95,0.12)', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  timelineRow: { flexDirection: 'row', gap: spacing.md },
  node: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  itemCard: { flex: 1, gap: spacing.xs },
  foodCard: { shadowColor: '#994100', shadowOpacity: 0.15, shadowRadius: 24 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  tips: { gap: spacing.xs, marginTop: spacing.sm },
  tipRow: { flexDirection: 'row', gap: spacing.xs },
});
