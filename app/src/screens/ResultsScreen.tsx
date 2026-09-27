import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing, type as typo } from '../theme';
import { Card, SegmentedBudgetBar, LegendDot, budgetCategoryColor } from '../components/ui';
import { useStore, money } from '../store';
import { isDemo } from '../api';
import type { ProposalStrategy, ProposalSummary } from '../types';

const STRATEGY: Record<ProposalStrategy, { label: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  best_match: { label: 'בחירת ה-AI', icon: 'auto-awesome' },
  max_savings: { label: 'חיסכון מקסימלי', icon: 'savings' },
  exact_budget: { label: 'בדיוק בתקציב', icon: 'adjust' },
};

const LEGEND: { key: string; label: string }[] = [
  { key: 'flights', label: 'טיסות' },
  { key: 'hotel', label: 'מלון' },
  { key: 'transport', label: 'תחבורה' },
  { key: 'attractions', label: 'אטרקציות' },
  { key: 'food', label: 'אוכל' },
];

function EmptyState({ onPlan }: { onPlan: () => void }) {
  return (
    <View style={styles.empty}>
      <MaterialIcons name="travel-explore" size={48} color={colors.outline} />
      <Text style={[typo.headlineSm, { color: colors.onSurface, textAlign: 'center' }]}>עדיין אין הצעות</Text>
      <Text style={[typo.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>מלאו את פרטי החופשה וה-AI יבנה לכם הצעות מותאמות.</Text>
      <Pressable style={styles.planBtn} onPress={onPlan}>
        <Text style={[typo.labelTag, { color: colors.onPrimary }]}>לתכנון חופשה</Text>
      </Pressable>
    </View>
  );
}

function ProposalCard({ proposal, featured, onChoose }: { proposal: ProposalSummary; featured: boolean; onChoose: () => void }) {
  const s = STRATEGY[proposal.strategy];
  const over = proposal.leftover < 0;
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {/* Hero */}
      <View style={[styles.hero, { height: featured ? 132 : 104 }]}>
        <View style={styles.heroBadges}>
          <View style={styles.aiBadge}>
            <MaterialIcons name={s.icon} size={14} color={colors.onTertiaryContainer} />
            <Text style={[typo.labelTag, { color: colors.onTertiaryContainer }]}>{s.label} • {proposal.matchScore}% התאמה</Text>
          </View>
        </View>
        <View style={styles.heroBottom}>
          <Text style={[typo.headlineMd, { color: '#fff' }]}>{proposal.destination}</Text>
        </View>
      </View>

      <View style={{ padding: spacing.md, gap: spacing.md }}>
        {/* Budget status */}
        <View style={[styles.budgetBanner, { backgroundColor: over ? 'rgba(186,26,26,0.08)' : 'rgba(0,131,120,0.10)' }]}>
          <View style={styles.rowCenter}>
            <MaterialIcons name={over ? 'error-outline' : 'check-circle'} size={20} color={over ? colors.error : colors.primary} />
            <Text style={[typo.headlineSm, { color: over ? colors.error : colors.primary }]}>{money(proposal.estimatedTotal, proposal.currency)}</Text>
            <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>מתוך {money(proposal.budgetTotal, proposal.currency)}</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: over ? colors.error : colors.primary }]}>
            <Text style={[typo.labelTag, { color: '#fff' }]}>{over ? `חריגה ${money(-proposal.leftover, proposal.currency)}` : `עודף ${money(proposal.leftover, proposal.currency)} 🎯`}</Text>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.wrap}>
          {proposal.tags.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={[typo.labelTag, { color: colors.onSurfaceVariant }]}>{t}</Text>
            </View>
          ))}
        </View>

        {/* Budget breakdown */}
        <View style={styles.breakdown}>
          <View style={styles.between}>
            <Text style={[typo.bodySm, { color: colors.onSurface, fontFamily: 'Rubik_600SemiBold' }]}>פירוט הקצאה תקציבית</Text>
            <Text style={[typo.labelTag, { color: colors.onSurfaceVariant }]}>100% שקיפות</Text>
          </View>
          <SegmentedBudgetBar spend={proposal.estimatedSpend} />
          <View style={styles.legendGrid}>
            {LEGEND.map((l) => (
              <View key={l.key} style={styles.legendItem}>
                <LegendDot color={budgetCategoryColor(l.key)} />
                <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>
                  {l.label}: {money((proposal.estimatedSpend as any)[l.key] ?? 0, proposal.currency)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI insight */}
        {proposal.headlineInsight ? (
          <View style={styles.insight}>
            <MaterialIcons name="lightbulb" size={20} color={colors.tertiary} />
            <Text style={[typo.bodySm, { color: colors.onSurface, flex: 1 }]}>
              <Text style={{ fontFamily: 'Rubik_600SemiBold', color: colors.tertiary }}>תובנת AI: </Text>
              {proposal.headlineInsight}
            </Text>
          </View>
        ) : null}

        <Pressable style={styles.cta} onPress={onChoose}>
          <Text style={[typo.headlineSm, { color: colors.onPrimary }]}>צפה בפירוט המלא</Text>
          <MaterialIcons name="arrow-back" size={20} color={colors.onPrimary} />
        </Pressable>
      </View>
    </Card>
  );
}

export function ResultsScreen() {
  const { proposals, request, setTab, choose } = useStore();

  if (proposals.length === 0) {
    return <EmptyState onPlan={() => setTab('wizard')} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.summaryPill}>
        <View style={styles.rowCenter}>
          <MaterialIcons name="auto-awesome" size={22} color={colors.primary} />
          <Text style={[typo.headlineSm, { color: colors.primary }]}>נמצאו {proposals.length} הצעות מותאמות</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={[typo.bodySm, { color: colors.onSurface, fontFamily: 'Rubik_600SemiBold' }]}>תקציב: {money(request.budgetTotal, request.currency)}</Text>
          <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>• {request.nights} לילות</Text>
        </View>
        {isDemo ? (
          <Text style={[typo.labelTag, { color: colors.onSurfaceVariant }]}>מצב הדגמה — נתונים לדוגמה</Text>
        ) : null}
      </Card>

      {proposals.map((p, i) => (
        <ProposalCard key={p.id} proposal={p} featured={i === 0} onChoose={() => choose(p)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.margin, gap: spacing.md, paddingBottom: spacing.xl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  planBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  summaryPill: { backgroundColor: colors.surfaceContainerLow, gap: spacing.xs },
  metaRow: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', flexWrap: 'wrap' },
  hero: { backgroundColor: colors.primary, justifyContent: 'space-between', padding: spacing.sm },
  heroBadges: { flexDirection: 'row', justifyContent: 'space-between' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.tertiaryContainer, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  heroBottom: {},
  budgetBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.sm, borderRadius: radius.md },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  wrap: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: { backgroundColor: colors.surfaceContainer, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  breakdown: { backgroundColor: colors.surfaceContainerLow, padding: spacing.sm, borderRadius: radius.md, gap: 6 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4, width: '45%' },
  insight: { flexDirection: 'row', gap: spacing.xs, backgroundColor: 'rgba(192,84,0,0.08)', padding: spacing.sm, borderRadius: radius.md, alignItems: 'flex-start' },
  cta: { height: 48, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.xs },
});
