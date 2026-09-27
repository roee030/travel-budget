import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing, type as typo } from '../theme';
import { useStore, type TabKey } from '../store';

const SUBTITLE: Record<TabKey, string> = {
  wizard: 'Plan',
  results: 'Results',
  budget: 'Budget',
  itinerary: 'Itinerary',
};

export function Header() {
  const { tab, currency, toggleCurrency } = useStore();
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.logo}>
          <MaterialIcons name="travel-explore" size={20} color={colors.onPrimary} />
        </View>
        <View>
          <View style={styles.brandTop}>
            <Text style={[typo.headlineSm, { color: colors.onSurface }]}>טריפוריה</Text>
            <View style={styles.aiBadge}>
              <MaterialIcons name="auto-awesome" size={12} color={colors.tertiary} />
              <Text style={[typo.labelTag, { color: colors.tertiary }]}>AI</Text>
            </View>
          </View>
          <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>{SUBTITLE[tab]}</Text>
        </View>
      </View>
      <Pressable style={styles.currency} onPress={toggleCurrency}>
        <Text style={[typo.labelTag, { color: currency === 'ILS' ? colors.primary : colors.onSurfaceVariant }]}>₪</Text>
        <Text style={[typo.labelTag, { color: colors.outline }]}> / </Text>
        <Text style={[typo.labelTag, { color: currency === 'USD' ? colors.primary : colors.onSurfaceVariant }]}>$</Text>
      </Pressable>
    </View>
  );
}

const TABS: { key: TabKey; icon: keyof typeof MaterialIcons.glyphMap; label: string }[] = [
  { key: 'wizard', icon: 'tune', label: 'תכנון חופשה' },
  { key: 'results', icon: 'travel-explore', label: 'הצעות AI' },
  { key: 'budget', icon: 'account-balance-wallet', label: 'פירוט ותקציב' },
  { key: 'itinerary', icon: 'calendar-today', label: 'מסלול יומי' },
];

export function BottomNav() {
  const { tab, setTab } = useStore();
  return (
    <View style={styles.nav}>
      {TABS.map((t) => {
        const active = t.key === tab;
        return (
          <Pressable key={t.key} style={styles.navItem} onPress={() => setTab(t.key)}>
            <MaterialIcons name={t.icon} size={24} color={active ? colors.primary : colors.onSurfaceVariant} />
            <Text style={[typo.labelTag, { color: active ? colors.primary : colors.onSurfaceVariant }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: spacing.margin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(192,84,0,0.15)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  currency: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 64,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
    paddingHorizontal: spacing.gutter,
  },
  navItem: { alignItems: 'center', gap: 2, minWidth: 44, paddingHorizontal: spacing.xs },
});
