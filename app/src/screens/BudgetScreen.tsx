import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing, type as typo } from '../theme';
import { Card, SegmentedBudgetBar, LegendDot, budgetCategoryColor, airlineLogoUrl } from '../components/ui';
import { Container } from '../components/Layout';
import { useResponsive } from '../hooks/useResponsive';
import { useStore, money } from '../store';
import type { BudgetCategory, FlightOption } from '../types';

const CATEGORY_META: { key: BudgetCategory; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'flights', label: 'טיסות הלוך ושוב', icon: 'flight' },
  { key: 'hotel', label: 'מלונות ואירוח', icon: 'hotel' },
  { key: 'transport', label: 'תחבורה ונסיעות', icon: 'directions-car' },
  { key: 'attractions', label: 'אטרקציות', icon: 'local-activity' },
  { key: 'food', label: 'אוכל ומסעדות', icon: 'restaurant' },
];

function Accordion({ title, icon, amount, currency, children, open: openInit }: { title: string; icon: keyof typeof MaterialIcons.glyphMap; amount: number; currency: string; children?: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(!!openInit);
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <Pressable style={styles.summary} onPress={() => setOpen((o) => !o)}>
        <View style={styles.rowCenter}>
          <View style={styles.iconCircle}>
            <MaterialIcons name={icon} size={20} color={colors.primary} />
          </View>
          <Text style={[typo.headlineSm, { color: colors.onSurface }]}>{title}</Text>
        </View>
        <View style={styles.rowCenter}>
          <Text style={[typo.numericMd, { color: colors.onSurface }]}>{money(amount, currency)}</Text>
          <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={20} color={colors.outline} />
        </View>
      </Pressable>
      {open && children ? <View style={styles.detail}>{children}</View> : null}
    </Card>
  );
}

/** One selectable flight option in the browsable gallery, with the airline's logo. */
function FlightOptionCard({ flight, selected, onSelect, currency }: { flight: FlightOption; selected: boolean; onSelect: () => void; currency: string }) {
  return (
    <Pressable
      style={({ hovered }: any) => [styles.flightCard, selected && styles.flightCardSelected, hovered && !selected && styles.flightCardHover]}
      onPress={onSelect}
    >
      <View style={styles.flightLogoWrap}>
        <Image source={{ uri: airlineLogoUrl(flight.logoDomain, 96) }} style={styles.flightLogo} resizeMode="contain" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[typo.bodyMd, { color: colors.onSurface, fontFamily: 'Rubik_600SemiBold' }]}>{flight.airline}</Text>
        <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>
          {flight.departTime ?? ''} · {flight.stops === 0 ? 'ישיר' : `${flight.stops} עצירה`} · {Math.round(flight.durationMinutes / 60)} שעות
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={[typo.numericMd, { color: colors.onSurface }]}>{money(flight.price, currency)}</Text>
        {selected ? (
          <View style={styles.selectedPill}>
            <MaterialIcons name="check" size={12} color={colors.onPrimary} />
            <Text style={[typo.labelTag, { color: colors.onPrimary }]}>נבחר</Text>
          </View>
        ) : (
          <Text style={[typo.labelTag, { color: colors.primary }]}>בחר טיסה</Text>
        )}
      </View>
    </Pressable>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.detailRow}>
      <MaterialIcons name="check-circle" size={16} color={colors.primary} />
      <Text style={[typo.bodySm, { color: colors.onSurface, flex: 1 }]}>{label}</Text>
      {value ? <Text style={[typo.bodySm, { color: colors.onSurface, fontFamily: 'Rubik_600SemiBold' }]}>{value}</Text> : null}
    </View>
  );
}

function SaveTripButton() {
  const { plan, savedTrips, saveCurrentTrip } = useStore();
  const saved = !!plan && savedTrips.some((t) => t.id === plan.id);
  return (
    <Pressable style={[styles.saveBtn, saved && styles.saveBtnSaved]} onPress={saveCurrentTrip} disabled={saved}>
      <MaterialIcons name={saved ? 'bookmark' : 'bookmark-border'} size={16} color={saved ? colors.primary : colors.onSurfaceVariant} />
      <Text style={[typo.labelTag, { color: saved ? colors.primary : colors.onSurfaceVariant }]}>{saved ? 'נשמר' : 'שמור טיול'}</Text>
    </Pressable>
  );
}

export function BudgetScreen() {
  const { plan, loadingPlan, currency, setTab, selectFlight } = useStore();
  const { isWide } = useResponsive();

  if (loadingPlan) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typo.bodyMd, { color: colors.onSurfaceVariant }]}>ה-AI בונה את החבילה שלך…</Text>
      </View>
    );
  }
  if (!plan) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="account-balance-wallet" size={48} color={colors.outline} />
        <Text style={[typo.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>בחרו הצעה במסך "הצעות AI" כדי לראות את פירוט התקציב.</Text>
      </View>
    );
  }

  const spend = plan.estimatedSpend;
  const cur = plan.currency;
  const total = CATEGORY_META.reduce((s, c) => s + (spend[c.key] || 0), 0);
  const utilization = Math.round((total / plan.budgetTotal) * 100);
  const leftover = plan.budgetTotal - total;
  const over = leftover < 0;

  const flight = plan.selectedFlight;
  const hotel = plan.selectedHotel;

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Container>
        <View style={isWide ? styles.twoCol : styles.oneCol}>
          <View style={isWide ? styles.leftColWide : styles.col}>
      {/* Overview */}
      <Card style={{ backgroundColor: colors.surfaceContainerLow, gap: spacing.xs }}>
        <View style={styles.between}>
          <View style={styles.rowCenter}>
            <MaterialIcons name="verified" size={18} color={colors.primary} />
            <Text style={[typo.labelTag, { color: colors.primary }]}>חבילה מותאמת אישית</Text>
          </View>
          <SaveTripButton />
        </View>
        <Text style={[typo.headlineMd, { color: colors.onSurface }]}>{plan.destination} • {plan.request.nights} לילות</Text>
      </Card>

      {/* Budget summary */}
      <Card style={{ gap: spacing.md }}>
        <View style={styles.between}>
          <View>
            <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>סך עלות מוערכת</Text>
            <View style={styles.rowCenter}>
              <Text style={[typo.numericLg, { color: over ? colors.error : colors.primary }]}>{money(total, cur)}</Text>
              <Text style={[typo.bodyMd, { color: colors.onSurfaceVariant }]}>/ {money(plan.budgetTotal, cur)}</Text>
            </View>
          </View>
          <View style={[styles.statusPill, { backgroundColor: colors.surfaceContainerLow }]}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: over ? colors.error : colors.primary }} />
            <Text style={[typo.labelTag, { color: over ? colors.error : colors.primary }]}>{over ? `חריגה ${money(-leftover, cur)}` : `במסגרת (+${money(leftover, cur)})`}</Text>
          </View>
        </View>
        <SegmentedBudgetBar spend={spend} height={12} />
        <View style={styles.between}>
          <Text style={[typo.labelTag, { color: colors.onSurfaceVariant }]}>נוצל: {utilization}% מהתקציב</Text>
          <Text style={[typo.labelTag, { color: colors.primary }]}>יתרה: {money(Math.max(0, leftover), cur)}</Text>
        </View>
        <View style={styles.wrap}>
          {CATEGORY_META.map((c) => (
            <View key={c.key} style={styles.legendPill}>
              <LegendDot color={budgetCategoryColor(c.key)} />
              <Text style={[typo.labelTag, { color: colors.onSurface }]}>{c.label.split(' ')[0]} {Math.round(((spend[c.key] || 0) / (total || 1)) * 100)}%</Text>
            </View>
          ))}
        </View>
      </Card>

      {plan.usedSampleData ? (
        <View style={styles.sampleNote}>
          <MaterialIcons name="info" size={16} color={colors.tertiary} />
          <Text style={[typo.bodySm, { color: colors.onSurfaceVariant, flex: 1 }]}>הנתונים לדוגמה — יתעדכנו לנתונים אמיתיים כשיוגדרו מפתחות API.</Text>
        </View>
      ) : null}
          </View>

          <View style={isWide ? styles.rightColWide : styles.col}>
      {/* Accordions */}
      <Accordion title="טיסות הלוך ושוב" icon="flight" amount={spend.flights} currency={cur} open>
        {plan.flightOptions.length ? (
          <>
            <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>{plan.request.origin} → {plan.destination} · כל האפשרויות מ־{plan.flightOptions.length} חברות תעופה</Text>
            {plan.flightOptions.map((f) => (
              <FlightOptionCard key={f.id} flight={f} selected={plan.selectedFlight?.id === f.id} onSelect={() => selectFlight(f.id)} currency={cur} />
            ))}
          </>
        ) : flight ? (
          <DetailRow label={`${flight.from} → ${flight.to} · ${flight.airline}`} value={flight.stops === 0 ? 'ישיר' : `${flight.stops} עצירות`} />
        ) : (
          <DetailRow label="לא נבחרה טיסה" />
        )}
      </Accordion>

      <Accordion title="מלונות ואירוח" icon="hotel" amount={spend.hotel} currency={cur} open>
        {hotel ? (
          <>
            <DetailRow label={`${hotel.name} (${hotel.stars}★) · ${hotel.area}`} value={`${hotel.rating}`} />
            <DetailRow label={`${plan.request.nights} לילות · ${money(hotel.pricePerNight, cur)} ללילה`} />
          </>
        ) : <DetailRow label="לא נבחר מלון" />}
      </Accordion>

      <Accordion title="תחבורה ונסיעות" icon="directions-car" amount={spend.transport} currency={cur}>
        <DetailRow label="תחבורה ציבורית / רכב שכור לפי ההעדפה שלך" />
      </Accordion>

      <Accordion title="אטרקציות מומלצות" icon="local-activity" amount={spend.attractions} currency={cur}>
        <DetailRow label="אטרקציות מדורגות שנבחרו בתוך התקציב" />
      </Accordion>

      <Accordion title="הערכת אוכל ומסעדות" icon="restaurant" amount={spend.food} currency={cur}>
        <DetailRow label={`תקציב מומלץ: ~${money(Math.round(spend.food / plan.request.nights), cur)} ליום`} />
      </Accordion>

      {/* Actions */}
      <View style={{ gap: spacing.xs, paddingTop: spacing.sm }}>
        <Pressable style={styles.lockBtn} onPress={() => setTab('itinerary')}>
          <MaterialIcons name="calendar-today" size={20} color={colors.onPrimary} />
          <Text style={[typo.headlineSm, { color: colors.onPrimary }]}>צפה במסלול היומי</Text>
        </Pressable>
      </View>
          </View>
        </View>
      </Container>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: spacing.margin, paddingBottom: spacing.xl },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceContainer, paddingHorizontal: spacing.sm, height: 32, borderRadius: radius.full },
  saveBtnSaved: { backgroundColor: colors.primaryContainer },
  oneCol: { gap: spacing.md },
  flightCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceContainerLow, padding: spacing.sm, borderRadius: radius.md, borderWidth: 2, borderColor: 'transparent' },
  flightCardHover: { backgroundColor: colors.surfaceContainer },
  flightCardSelected: { borderColor: colors.primary, backgroundColor: 'rgba(0,104,95,0.06)' },
  flightLogoWrap: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLowest, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  flightLogo: { width: 32, height: 32 },
  selectedPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full },
  twoCol: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  col: { gap: spacing.md },
  leftColWide: { flex: 1, gap: spacing.md },
  rightColWide: { flex: 1.15, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  wrap: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  legendPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceContainerLow, paddingHorizontal: spacing.xs, paddingVertical: 4, borderRadius: radius.full },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  iconCircle: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: 'rgba(0,104,95,0.10)', alignItems: 'center', justifyContent: 'center' },
  detail: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.xs },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.surfaceContainerLow, padding: spacing.sm, borderRadius: radius.md },
  sampleNote: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'rgba(192,84,0,0.08)', padding: spacing.sm, borderRadius: radius.md },
  lockBtn: { height: 52, borderRadius: radius.xl, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.xs },
});
