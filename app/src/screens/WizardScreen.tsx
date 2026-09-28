import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing, type as typo } from '../theme';
import { Card } from '../components/ui';
import { Container, Grid } from '../components/Layout';
import { useResponsive } from '../hooks/useResponsive';
import { useStore, money } from '../store';
import type { PartyType, TransportPreference, TripVibe } from '../types';

const VIBES: { key: TripVibe; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'relaxation', label: 'בטן-גב', icon: 'beach-access' },
  { key: 'attractions', label: 'אטרקציות', icon: 'confirmation-number' },
  { key: 'food', label: 'קולינרי', icon: 'restaurant' },
  { key: 'nightlife', label: 'חיי לילה', icon: 'nightlife' },
  { key: 'nature', label: 'טבע', icon: 'park' },
  { key: 'culture', label: 'תרבות', icon: 'museum' },
  { key: 'mixed', label: 'קצת מהכל', icon: 'auto-awesome' },
];

const PARTIES: { key: PartyType; label: string }[] = [
  { key: 'solo', label: 'יחיד' },
  { key: 'couple', label: 'זוג' },
  { key: 'family', label: 'משפחה' },
  { key: 'friends', label: 'חברים' },
];

const TRANSPORT: { key: TransportPreference; label: string }[] = [
  { key: 'public', label: 'תחבורה ציבורית' },
  { key: 'rental_car', label: 'רכב שכור' },
  { key: 'mixed', label: 'משולב' },
  { key: 'walk', label: 'רגלית' },
];

const MONTHS = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];

const SUGGESTIONS: { label: string; icon: keyof typeof MaterialIcons.glyphMap; hints: string[]; vibe?: TripVibe }[] = [
  { label: 'יעדים אקזוטיים', icon: 'travel-explore', hints: ['exotic', 'warm'] },
  { label: 'יעדים אורבניים', icon: 'location-city', hints: ['city', 'urban'], vibe: 'culture' },
  { label: 'קיץ 2027', icon: 'wb-sunny', hints: ['summer', 'beach'], vibe: 'relaxation' },
  { label: 'קולינרי', icon: 'restaurant', hints: ['food'], vibe: 'food' },
  { label: 'טבע ונופש', icon: 'park', hints: ['nature'], vibe: 'nature' },
];

function SelectChip({ label, active, onPress, icon }: { label: string; active: boolean; onPress: () => void; icon?: keyof typeof MaterialIcons.glyphMap }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}>
      {icon ? <MaterialIcons name={icon} size={16} color={active ? colors.onPrimary : colors.onSurfaceVariant} /> : null}
      <Text style={[typo.bodySm, { color: active ? colors.onPrimary : colors.onSurfaceVariant, fontFamily: 'Rubik_500Medium' }]}>{label}</Text>
    </Pressable>
  );
}

function Section({ title, icon, children }: { title: string; icon: keyof typeof MaterialIcons.glyphMap; children: React.ReactNode }) {
  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={styles.sectionHead}>
        <MaterialIcons name={icon} size={18} color={colors.primary} />
        <Text style={[typo.headlineSm, { color: colors.onSurface }]}>{title}</Text>
      </View>
      {children}
    </Card>
  );
}

function Stepper({ value, onChange, min = 0 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepBtn} onPress={() => onChange(Math.max(min, value - 1))}>
        <MaterialIcons name="remove" size={18} color={colors.primary} />
      </Pressable>
      <Text style={[typo.numericMd, { color: colors.onSurface, minWidth: 24, textAlign: 'center' }]}>{value}</Text>
      <Pressable style={styles.stepBtn} onPress={() => onChange(value + 1)}>
        <MaterialIcons name="add" size={18} color={colors.primary} />
      </Pressable>
    </View>
  );
}

export function WizardScreen() {
  const { request, setRequest, runSearch, loadingProposals, error } = useStore();
  const { isWide } = useResponsive();
  const openDestination = request.destination === null;

  // ── section building blocks (shared between mobile & desktop) ──
  const destinationSection = (
    <Section title="לאן טסים?" icon="place">
      <View style={styles.row}>
        <SelectChip label="הפתיעו אותי" active={openDestination} onPress={() => setRequest((r) => ({ ...r, destination: null }))} />
        <SelectChip label="יעד ספציפי" active={!openDestination} onPress={() => setRequest((r) => ({ ...r, destination: r.destination ?? 'Barcelona' }))} />
      </View>
      {openDestination ? (
        <TextInput style={styles.input} placeholder="רמזים: חם, אירופה, חוף, אוכל..." placeholderTextColor={colors.outline} value={request.destinationHints.join(', ')} onChangeText={(t) => setRequest((r) => ({ ...r, destinationHints: t.split(',').map((s) => s.trim()).filter(Boolean) }))} />
      ) : (
        <TextInput style={styles.input} placeholder="עיר יעד (למשל Barcelona)" placeholderTextColor={colors.outline} value={request.destination ?? ''} onChangeText={(t) => setRequest((r) => ({ ...r, destination: t }))} />
      )}
      <TextInput style={styles.input} placeholder="מוצא (למשל TLV)" placeholderTextColor={colors.outline} value={request.origin} onChangeText={(t) => setRequest((r) => ({ ...r, origin: t.toUpperCase() }))} />
    </Section>
  );

  const whenSection = (
    <Section title="מתי?" icon="event">
      <View style={styles.row}>
        <SelectChip label="תאריכים גמישים" active={request.flexibleDates} onPress={() => setRequest((r) => ({ ...r, flexibleDates: true }))} />
        <SelectChip label="תאריכים קבועים" active={!request.flexibleDates} onPress={() => setRequest((r) => ({ ...r, flexibleDates: false }))} />
      </View>
      {request.flexibleDates ? (
        <>
          <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>חודש יעד</Text>
          <View style={styles.wrap}>
            {MONTHS.map((m, i) => (
              <SelectChip key={m} label={m} active={request.targetMonth === i + 1} onPress={() => setRequest((r) => ({ ...r, targetMonth: i + 1 }))} />
            ))}
          </View>
        </>
      ) : (
        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="יציאה YYYY-MM-DD" placeholderTextColor={colors.outline} value={request.departDate ?? ''} onChangeText={(t) => setRequest((r) => ({ ...r, departDate: t }))} />
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="חזרה YYYY-MM-DD" placeholderTextColor={colors.outline} value={request.returnDate ?? ''} onChangeText={(t) => setRequest((r) => ({ ...r, returnDate: t }))} />
        </View>
      )}
      <View style={styles.between}>
        <Text style={[typo.bodyMd, { color: colors.onSurface }]}>מספר לילות</Text>
        <Stepper value={request.nights} min={1} onChange={(v) => setRequest((r) => ({ ...r, nights: v }))} />
      </View>
    </Section>
  );

  const whoSection = (
    <Section title="מי נוסע?" icon="group">
      <View style={styles.wrap}>
        {PARTIES.map((p) => (
          <SelectChip key={p.key} label={p.label} active={request.partyType === p.key} onPress={() => setRequest((r) => ({ ...r, partyType: p.key }))} />
        ))}
      </View>
      <View style={styles.between}>
        <Text style={[typo.bodyMd, { color: colors.onSurface }]}>מבוגרים</Text>
        <Stepper value={request.adults} min={1} onChange={(v) => setRequest((r) => ({ ...r, adults: v }))} />
      </View>
      <View style={styles.between}>
        <Text style={[typo.bodyMd, { color: colors.onSurface }]}>ילדים</Text>
        <Stepper value={request.children.length} onChange={(v) => setRequest((r) => ({ ...r, children: Array.from({ length: v }, (_, i) => r.children[i] ?? { age: 6 }) }))} />
      </View>
      {request.children.length > 0 ? (
        <View style={styles.wrap}>
          {request.children.map((c, i) => (
            <View key={i} style={styles.ageBox}>
              <Text style={[typo.labelTag, { color: colors.onSurfaceVariant }]}>גיל ילד {i + 1}</Text>
              <Stepper value={c.age} onChange={(v) => setRequest((r) => ({ ...r, children: r.children.map((cc, ci) => (ci === i ? { age: v } : cc)) }))} />
            </View>
          ))}
        </View>
      ) : null}
    </Section>
  );

  const vibeSection = (
    <Section title="אופי החופשה" icon="mood">
      <View style={styles.wrap}>
        {VIBES.map((v) => (
          <SelectChip key={v.key} label={v.label} icon={v.icon} active={request.vibe === v.key} onPress={() => setRequest((r) => ({ ...r, vibe: v.key }))} />
        ))}
      </View>
    </Section>
  );

  const transportSection = (
    <Section title="תחבורה" icon="directions-transit">
      <View style={styles.wrap}>
        {TRANSPORT.map((t) => (
          <SelectChip key={t.key} label={t.label} active={request.transport === t.key} onPress={() => setRequest((r) => ({ ...r, transport: t.key }))} />
        ))}
      </View>
    </Section>
  );

  const budgetSection = (
    <Section title="תקציב כולל" icon="account-balance-wallet">
      <View style={styles.between}>
        <Text style={[typo.numericLg, { color: colors.primary }]}>{money(request.budgetTotal, request.currency)}</Text>
        <View style={styles.wrap}>
          {[6000, 12500, 20000, 35000].map((b) => (
            <SelectChip key={b} label={money(b, request.currency)} active={request.budgetTotal === b} onPress={() => setRequest((r) => ({ ...r, budgetTotal: b }))} />
          ))}
        </View>
      </View>
      <TextInput style={styles.input} keyboardType="numeric" placeholder="סכום מדויק" placeholderTextColor={colors.outline} value={String(request.budgetTotal)} onChangeText={(t) => setRequest((r) => ({ ...r, budgetTotal: Number(t.replace(/[^0-9]/g, '')) || 0 }))} />
    </Section>
  );

  const specialSection = (
    <Section title="בקשות מיוחדות" icon="edit-note">
      <TextInput style={[styles.input, { height: 88, textAlignVertical: 'top' }]} multiline placeholder="למשל: אוכל כשר, קרוב לחוף, נגישות, טיסה ישירה בלבד..." placeholderTextColor={colors.outline} value={request.specialRequests} onChangeText={(t) => setRequest((r) => ({ ...r, specialRequests: t }))} />
    </Section>
  );

  const cta = (
    <Pressable style={styles.cta} onPress={runSearch} disabled={loadingProposals}>
      {loadingProposals ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <>
          <MaterialIcons name="auto-awesome" size={20} color={colors.onPrimary} />
          <Text style={[typo.headlineSm, { color: colors.onPrimary }]}>בנה לי חופשה</Text>
        </>
      )}
    </Pressable>
  );

  // ── Desktop / tablet: hero + horizontal search bar + 2-col sections ──
  if (isWide) {
    return (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Container>
          <View style={styles.heroWrap}>
            <Text style={[typo.displayHero, styles.heroTitle]}>החופשה שלך מתחילה עכשיו</Text>
            <Text style={[typo.bodyLg, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>ספרו לנו מה בא לכם — וה-AI יבנה חופשה מושלמת בתוך התקציב.</Text>

            {/* Horizontal search bar */}
            <Card style={styles.searchBar}>
              <View style={styles.searchField}>
                <Text style={[typo.labelTag, { color: colors.onSurfaceVariant }]}>מאיפה טסים?</Text>
                <TextInput style={styles.searchInput} placeholder="TLV" placeholderTextColor={colors.outline} value={request.origin} onChangeText={(t) => setRequest((r) => ({ ...r, origin: t.toUpperCase() }))} />
              </View>
              <View style={styles.searchDivider} />
              <View style={styles.searchField}>
                <Text style={[typo.labelTag, { color: colors.onSurfaceVariant }]}>לאן טסים?</Text>
                <TextInput style={styles.searchInput} placeholder={openDestination ? 'הפתיעו אותי / רמז' : 'עיר יעד'} placeholderTextColor={colors.outline} value={openDestination ? request.destinationHints.join(', ') : request.destination ?? ''} onChangeText={(t) => setRequest((r) => (openDestination ? { ...r, destinationHints: t.split(',').map((s) => s.trim()).filter(Boolean) } : { ...r, destination: t }))} />
              </View>
              <View style={styles.searchDivider} />
              <View style={styles.searchField}>
                <Text style={[typo.labelTag, { color: colors.onSurfaceVariant }]}>לילות</Text>
                <Stepper value={request.nights} min={1} onChange={(v) => setRequest((r) => ({ ...r, nights: v }))} />
              </View>
              <Pressable style={styles.searchBtn} onPress={runSearch} disabled={loadingProposals}>
                {loadingProposals ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={[typo.headlineSm, { color: colors.onPrimary }]}>חיפוש</Text>}
              </Pressable>
            </Card>

            {/* AI free-text */}
            <Card style={styles.aiSearch}>
              <MaterialIcons name="auto-awesome" size={20} color={colors.tertiary} />
              <TextInput style={[styles.searchInput, { flex: 1 }]} placeholder="חדש! חיפוש בעזרת AI — למשל: טיסה לבנגקוק ביולי" placeholderTextColor={colors.outline} value={request.specialRequests} onChangeText={(t) => setRequest((r) => ({ ...r, specialRequests: t }))} />
            </Card>

            {/* Suggestion chips */}
            <View style={styles.suggestRow}>
              {SUGGESTIONS.map((s) => (
                <SelectChip key={s.label} label={s.label} icon={s.icon} active={false} onPress={() => setRequest((r) => ({ ...r, destination: null, destinationHints: s.hints, vibe: s.vibe ?? r.vibe }))} />
              ))}
            </View>
          </View>

          {error ? <Text style={[typo.bodySm, { color: colors.error, marginTop: spacing.sm }]}>{error}</Text> : null}

          {/* Detailed preferences in two columns */}
          <View style={{ marginTop: spacing.lg }}>
            <Grid columns={2} gap={spacing.md}>
              {whenSection}
              {whoSection}
              {vibeSection}
              {transportSection}
              {budgetSection}
              {specialSection}
            </Grid>
          </View>

          <View style={{ marginTop: spacing.md, alignItems: 'center' }}>
            <View style={{ width: 320, maxWidth: '100%' }}>{cta}</View>
          </View>
        </Container>
      </ScrollView>
    );
  }

  // ── Mobile: stacked wizard ──
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Container>
        <View style={styles.stack}>
          <View style={styles.intro}>
            <Text style={[typo.headlineMd, { color: colors.onSurface }]}>בונים חופשה לפי התקציב 🧳</Text>
            <Text style={[typo.bodyMd, { color: colors.onSurfaceVariant }]}>ענו על כמה שאלות — וה-AI יבנה לכם חופשה מושלמת בתוך התקציב.</Text>
          </View>
          {destinationSection}
          {whenSection}
          {whoSection}
          {vibeSection}
          {transportSection}
          {budgetSection}
          {specialSection}
          {error ? <Text style={[typo.bodySm, { color: colors.error }]}>{error}</Text> : null}
          {cta}
        </View>
      </Container>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: spacing.margin, paddingBottom: spacing.xl },
  stack: { gap: spacing.md },
  intro: { gap: spacing.xs },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', alignItems: 'center' },
  wrap: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, height: 36, borderRadius: radius.full },
  chipActive: { backgroundColor: colors.primary },
  chipIdle: { backgroundColor: colors.surfaceContainer },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: 'Rubik_400Regular',
    fontSize: 14,
    color: colors.onSurface,
    textAlign: 'right',
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBtn: { width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  ageBox: { alignItems: 'center', gap: 4, backgroundColor: colors.surfaceContainerLow, padding: spacing.sm, borderRadius: radius.md },
  cta: { height: 52, borderRadius: radius.xl, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.xs },

  // desktop hero
  heroWrap: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.lg },
  heroTitle: { color: colors.onSurface, textAlign: 'center' },
  searchBar: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm },
  searchField: { flex: 1, gap: 2, paddingHorizontal: spacing.sm },
  searchInput: { fontFamily: 'Rubik_500Medium', fontSize: 15, color: colors.onSurface, textAlign: 'right', paddingVertical: 4 },
  searchDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: colors.outlineVariant, marginVertical: spacing.xs },
  searchBtn: { backgroundColor: colors.primary, height: 52, paddingHorizontal: spacing.lg, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', minWidth: 120 },
  aiSearch: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  suggestRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
});
