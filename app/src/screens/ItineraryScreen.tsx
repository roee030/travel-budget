import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing, type as typo, categoryVisual } from '../theme';
import { Card, destinationImageUrl } from '../components/ui';
import { Container } from '../components/Layout';
import { useResponsive } from '../hooks/useResponsive';
import { useStore, money } from '../store';
import { findDestination } from '../mock/catalog';
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

function TimelineItem({ item, currency, last, onSwap }: { item: ItineraryItem; currency: string; last: boolean; onSwap: () => void }) {
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

        {item.imageQuery ? (
          <View style={styles.placeImageWrap}>
            <Image source={{ uri: destinationImageUrl(item.imageQuery, 640, 360) }} style={styles.placeImage} resizeMode="cover" />
          </View>
        ) : null}

        {item.rating || item.social ? (
          <View style={styles.socialRow}>
            {item.rating ? (
              <>
                <MaterialIcons name="star" size={16} color={colors.tertiary} />
                <Text style={[typo.labelTag, { color: colors.onSurface }]}>{item.rating}</Text>
              </>
            ) : null}
            {item.social ? <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>• {item.social}</Text> : null}
          </View>
        ) : null}

        {item.tip ? (
          <View style={styles.tipAccent}>
            <MaterialIcons name="tips-and-updates" size={16} color={colors.tertiary} />
            <Text style={[typo.bodySm, { color: colors.onSurface, flex: 1 }]}>
              <Text style={{ fontFamily: 'Rubik_600SemiBold', color: colors.tertiary }}>טיפ AI: </Text>
              {item.tip}
            </Text>
          </View>
        ) : null}

        {item.swappable ? (
          <Pressable
            style={({ pressed, hovered }: any) => [styles.swapBtn, hovered && { backgroundColor: colors.surfaceContainerHigh }, pressed && { opacity: 0.85 }]}
            onPress={onSwap}
          >
            <MaterialIcons name="sync" size={16} color={colors.tertiary} />
            <Text style={[typo.bodySm, { color: colors.onSurface, fontFamily: 'Rubik_600SemiBold' }]}>
              {isFood ? 'החלף מסעדה עם AI' : 'החלף אטרקציה עם AI'}
            </Text>
          </Pressable>
        ) : null}
      </Card>
    </View>
  );
}

export function ItineraryScreen() {
  const { plan, loadingPlan, currency, swapItem, repace } = useStore();
  const { isWide } = useResponsive();
  const [activeDay, setActiveDay] = useState(1);
  const [paceOpen, setPaceOpen] = useState(false);

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
  const dayIndex = Math.max(0, plan.days.findIndex((d) => d.day === day.day));
  const dayCost = day ? day.items.reduce((s, it) => s + (it.estimatedCost || 0), 0) : 0;
  const weather = findDestination(plan.destination)?.weather;

  const dayButtons = plan.days.map((d) => {
    const active = d.day === activeDay;
    return (
      <Pressable
        key={d.day}
        onPress={() => setActiveDay(d.day)}
        style={[styles.dayChip, isWide && styles.dayChipWide, active ? styles.dayChipActive : styles.dayChipIdle]}
      >
        <Text style={[typo.labelTag, { color: active ? colors.onPrimary : colors.onSurfaceVariant }]}>יום {d.day}</Text>
        <Text style={[typo.headlineSm, { color: active ? colors.onPrimary : colors.onSurface }]} numberOfLines={1}>{d.summary}</Text>
      </Pressable>
    );
  });

  const budgetCapsule = (
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
  );

  const timeline = (
    <View style={{ marginTop: spacing.xs }}>
      {day?.items.map((item, i) => (
        <TimelineItem key={i} item={item} currency={currency} last={i === day.items.length - 1} onSwap={() => swapItem(dayIndex, i)} />
      ))}
    </View>
  );

  const paceButton = (
    <Pressable
      style={({ pressed }: any) => [styles.paceBtn, pressed && { opacity: 0.9 }]}
      onPress={() => setPaceOpen((o) => !o)}
    >
      <MaterialIcons name="tune" size={20} color={colors.onTertiary} />
      <Text style={[typo.headlineSm, { color: colors.onTertiary }]}>בקש מה-AI לרווח / לצופף את הלו״ז 🤖</Text>
    </Pressable>
  );

  const tips = plan.tips.length ? (
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
  ) : null;

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Container>
        <View style={styles.headRow}>
          <View style={styles.rowCenter}>
            <MaterialIcons name="route" size={20} color={colors.primary} />
            <Text style={[typo.labelTag, { color: colors.primary }]}>תוכנית מותאמת אישית</Text>
          </View>
          {weather ? (
            <View style={styles.weatherPill}>
              <MaterialIcons name="wb-sunny" size={16} color={colors.tertiary} />
              <Text style={[typo.bodySm, { color: colors.onSurface }]}>{weather}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[typo.headlineMd, { color: colors.onSurface, marginBottom: spacing.sm }]}>מסלול יומי: {plan.destination}</Text>

        {isWide ? (
          <View style={styles.twoCol}>
            <View style={styles.rail}>
              <View style={styles.dayListVertical}>{dayButtons}</View>
              {budgetCapsule}
            </View>
            <View style={styles.mainCol}>
              {timeline}
              {tips}
            </View>
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroller}>
              {dayButtons}
            </ScrollView>
            {budgetCapsule}
            {timeline}
            {tips}
          </>
        )}

        <View style={{ marginTop: spacing.md }}>{paceButton}</View>

        {paceOpen ? (
          <Card style={styles.paceModal}>
            <View style={styles.between}>
              <View style={styles.rowCenter}>
                <MaterialIcons name="smart-toy" size={20} color={colors.tertiary} />
                <Text style={[typo.headlineSm, { color: colors.onSurface }]}>התאמת קצב היום</Text>
              </View>
              <Pressable onPress={() => setPaceOpen(false)}>
                <MaterialIcons name="close" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>
            <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>איך לעצב מחדש את יום {day.day}?</Text>
            <View style={styles.paceOptions}>
              <Pressable style={styles.paceOption} onPress={() => { repace(dayIndex, 'relax'); setPaceOpen(false); }}>
                <MaterialIcons name="bedtime" size={18} color={colors.primary} />
                <Text style={[typo.bodySm, { color: colors.onSurface, fontFamily: 'Rubik_600SemiBold' }]}>יותר מנוחה</Text>
              </Pressable>
              <Pressable style={styles.paceOption} onPress={() => { repace(dayIndex, 'intense'); setPaceOpen(false); }}>
                <MaterialIcons name="bolt" size={18} color={colors.tertiary} />
                <Text style={[typo.bodySm, { color: colors.onSurface, fontFamily: 'Rubik_600SemiBold' }]}>הספק מירבי</Text>
              </Pressable>
            </View>
          </Card>
        ) : null}
      </Container>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: spacing.margin, paddingBottom: spacing.xl, gap: spacing.sm },
  twoCol: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  rail: { width: 300, gap: spacing.sm },
  dayListVertical: { gap: spacing.sm },
  mainCol: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dayScroller: { gap: spacing.sm, paddingVertical: spacing.xs },
  dayChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg, maxWidth: 180 },
  dayChipWide: { maxWidth: 400, width: '100%' },
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
  weatherPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceContainer, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  placeImageWrap: { height: 130, borderRadius: radius.md, overflow: 'hidden', marginTop: 4 },
  placeImage: { width: '100%', height: '100%' },
  socialRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceContainerLow, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.md, marginTop: 2, flexWrap: 'wrap' },
  tipAccent: { flexDirection: 'row', gap: spacing.xs, backgroundColor: 'rgba(192,84,0,0.10)', padding: spacing.sm, borderRadius: radius.md, marginTop: 2, alignItems: 'flex-start' },
  swapBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.surfaceContainer, paddingVertical: 8, borderRadius: radius.md, marginTop: 4 },
  paceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, height: 52, borderRadius: radius.xl, backgroundColor: colors.tertiary },
  paceModal: { marginTop: spacing.sm, gap: spacing.sm },
  paceOptions: { flexDirection: 'row', gap: spacing.sm },
  paceOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.surfaceContainer, paddingVertical: 12, borderRadius: radius.md },
});
