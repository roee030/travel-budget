import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing, type as typo, maxContentWidth, gutterFor } from '../theme';
import { useStore, type TabKey } from '../store';
import { useResponsive } from '../hooks/useResponsive';

const SUBTITLE: Record<TabKey, string> = {
  wizard: 'Plan',
  results: 'Results',
  budget: 'Budget',
  itinerary: 'Itinerary',
  admin: 'Admin',
};

const TABS: { key: TabKey; icon: keyof typeof MaterialIcons.glyphMap; label: string }[] = [
  { key: 'wizard', icon: 'tune', label: 'תכנון חופשה' },
  { key: 'results', icon: 'travel-explore', label: 'הצעות AI' },
  { key: 'budget', icon: 'account-balance-wallet', label: 'פירוט ותקציב' },
  { key: 'itinerary', icon: 'calendar-today', label: 'מסלול יומי' },
  { key: 'admin', icon: 'admin-panel-settings', label: 'ניהול' },
];

function Brand() {
  const { tab } = useStore();
  return (
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
  );
}

function CurrencyToggle() {
  const { currency, toggleCurrency } = useStore();
  return (
    <Pressable style={styles.currency} onPress={toggleCurrency}>
      <Text style={[typo.labelTag, { color: currency === 'ILS' ? colors.primary : colors.onSurfaceVariant }]}>₪</Text>
      <Text style={[typo.labelTag, { color: colors.outline }]}> / </Text>
      <Text style={[typo.labelTag, { color: currency === 'USD' ? colors.primary : colors.onSurfaceVariant }]}>$</Text>
    </Pressable>
  );
}

function TopTab({ tab }: { tab: (typeof TABS)[number] }) {
  const { tab: active, setTab } = useStore();
  const isActive = tab.key === active;
  return (
    <Pressable
      onPress={() => setTab(tab.key)}
      style={[styles.topTab, isActive && styles.topTabActive]}
    >
      <MaterialIcons name={tab.icon} size={18} color={isActive ? colors.primary : colors.onSurfaceVariant} />
      <Text style={[typo.labelTag, { color: isActive ? colors.primary : colors.onSurfaceVariant }]}>{tab.label}</Text>
    </Pressable>
  );
}

export function Header() {
  const { isWide, bp } = useResponsive();
  return (
    <View style={styles.headerBar}>
      <View style={[styles.headerInner, { maxWidth: maxContentWidth, paddingHorizontal: gutterFor(bp) }]}>
        <Brand />
        {isWide ? (
          <View style={styles.topNav}>
            {TABS.map((t) => (
              <TopTab key={t.key} tab={t} />
            ))}
          </View>
        ) : null}
        <CurrencyToggle />
      </View>
    </View>
  );
}

export function BottomNav() {
  const { tab, setTab } = useStore();
  const { isWide } = useResponsive();
  if (isWide) return null; // desktop/tablet use the top nav
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
  headerBar: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  headerInner: {
    width: '100%',
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
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
  topNav: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 },
  topTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radius.full,
  },
  topTabActive: { backgroundColor: colors.surfaceContainer },
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
