import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { colors, radius, spacing, type as typo } from '../theme';
import { Card, destinationImageUrl } from '../components/ui';
import { Container } from '../components/Layout';
import { BudgetSlider } from '../components/BudgetSlider';
import { useResponsive } from '../hooks/useResponsive';
import { useStore, money } from '../store';
import { CATALOG } from '../mock/catalog';
import type { PartyType, TransportPreference, TripVibe } from '../types';

// ── Hebrew calendar locale ──
LocaleConfig.locales.he = {
  monthNames: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
  monthNamesShort: ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'],
  dayNames: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
  dayNamesShort: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'],
  today: 'היום',
};
LocaleConfig.defaultLocale = 'he';

const VIBES: { key: TripVibe; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'relaxation', label: 'בטן-גב', icon: 'beach-access' },
  { key: 'attractions', label: 'אטרקציות', icon: 'confirmation-number' },
  { key: 'food', label: 'קולינרי', icon: 'restaurant' },
  { key: 'nightlife', label: 'חיי לילה', icon: 'nightlife' },
  { key: 'nature', label: 'טבע', icon: 'park' },
  { key: 'culture', label: 'תרבות', icon: 'museum' },
  { key: 'mixed', label: 'קצת מהכל', icon: 'auto-awesome' },
];
const PARTIES: { key: PartyType; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'solo', label: 'יחיד', icon: 'person' },
  { key: 'couple', label: 'זוג', icon: 'favorite' },
  { key: 'family', label: 'משפחה', icon: 'family-restroom' },
  { key: 'friends', label: 'חברים', icon: 'groups' },
];
const TRANSPORT: { key: TransportPreference; label: string }[] = [
  { key: 'public', label: 'תחבורה ציבורית' },
  { key: 'rental_car', label: 'רכב שכור' },
  { key: 'mixed', label: 'משולב' },
  { key: 'walk', label: 'רגלית' },
];
const MONTHS = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];

const STEPS = [
  { key: 'dest', label: 'יעד', icon: 'place' as const },
  { key: 'dates', label: 'תאריכים', icon: 'event' as const },
  { key: 'who', label: 'מטיילים', icon: 'group' as const },
  { key: 'style', label: 'סגנון', icon: 'mood' as const },
  { key: 'budget', label: 'תקציב', icon: 'account-balance-wallet' as const },
];

function daysBetween(a: string, b: string): number {
  const d = (Math.abs(new Date(b).getTime() - new Date(a).getTime())) / 86400000;
  return Math.max(1, Math.round(d));
}

function Chip({ label, active, onPress, icon }: { label: string; active: boolean; onPress: () => void; icon?: keyof typeof MaterialIcons.glyphMap }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}>
      {icon ? <MaterialIcons name={icon} size={16} color={active ? colors.onPrimary : colors.onSurfaceVariant} /> : null}
      <Text style={[typo.bodySm, { color: active ? colors.onPrimary : colors.onSurfaceVariant, fontFamily: 'Rubik_500Medium' }]}>{label}</Text>
    </Pressable>
  );
}
function Stepper({ value, onChange, min = 0 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepBtn} onPress={() => onChange(Math.max(min, value - 1))}><MaterialIcons name="remove" size={18} color={colors.primary} /></Pressable>
      <Text style={[typo.numericMd, { color: colors.onSurface, minWidth: 24, textAlign: 'center' }]}>{value}</Text>
      <Pressable style={styles.stepBtn} onPress={() => onChange(value + 1)}><MaterialIcons name="add" size={18} color={colors.primary} /></Pressable>
    </View>
  );
}

export function WizardScreen() {
  const { request, setRequest, runSearch, loadingProposals, error } = useStore();
  const { isWide } = useResponsive();
  const [step, setStep] = useState(0);

  const isILS = request.currency === 'ILS';
  const budgetMin = isILS ? 5000 : 1000;
  const budgetMax = isILS ? 80000 : 20000;
  const budgetStep = isILS ? 500 : 100;

  // calendar range markers
  const marked = useMemo(() => {
    const m: Record<string, any> = {};
    const s = request.departDate;
    const e = request.returnDate;
    if (s) {
      m[s] = { startingDay: true, color: colors.primary, textColor: '#fff' };
      if (e && e !== s) {
        m[e] = { endingDay: true, color: colors.primary, textColor: '#fff' };
        // middle days
        let cur = new Date(s);
        const end = new Date(e);
        cur.setDate(cur.getDate() + 1);
        while (cur < end) {
          const ds = cur.toISOString().slice(0, 10);
          m[ds] = { color: colors.surfaceContainerHigh, textColor: colors.onSurface };
          cur.setDate(cur.getDate() + 1);
        }
      }
    }
    return m;
  }, [request.departDate, request.returnDate]);

  const onDayPress = (day: { dateString: string }) => {
    const ds = day.dateString;
    setRequest((r) => {
      if (!r.departDate || (r.departDate && r.returnDate)) {
        return { ...r, departDate: ds, returnDate: null };
      }
      if (ds > r.departDate) {
        return { ...r, returnDate: ds, nights: daysBetween(r.departDate, ds) };
      }
      return { ...r, departDate: ds, returnDate: null };
    });
  };

  const stepValid = (): boolean => {
    switch (STEPS[step].key) {
      case 'dest':
        return request.origin.trim().length >= 2;
      case 'dates':
        return request.flexibleDates ? request.targetMonth != null : Boolean(request.departDate);
      case 'budget':
        return request.budgetTotal > 0;
      default:
        return true;
    }
  };

  const isLast = step === STEPS.length - 1;
  const openDestination = request.destination === null;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Container>
          <View style={[styles.inner, isWide && styles.innerWide]}>
            {/* Progress header */}
            <View style={styles.progress}>
              {STEPS.map((s, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <React.Fragment key={s.key}>
                    <Pressable onPress={() => i <= step && setStep(i)} style={styles.progressItem}>
                      <View style={[styles.progressDot, active && styles.progressDotActive, done && styles.progressDotDone]}>
                        {done ? (
                          <MaterialIcons name="check" size={16} color={colors.onPrimary} />
                        ) : (
                          <MaterialIcons name={s.icon} size={16} color={active ? colors.onPrimary : colors.onSurfaceVariant} />
                        )}
                      </View>
                      <Text style={[typo.labelTag, { color: active ? colors.primary : colors.onSurfaceVariant }]}>{s.label}</Text>
                    </Pressable>
                    {i < STEPS.length - 1 ? <View style={[styles.progressLine, done && { backgroundColor: colors.primary }]} /> : null}
                  </React.Fragment>
                );
              })}
            </View>

            {/* Step content */}
            <Card style={styles.stepCard}>
              {STEPS[step].key === 'dest' && (
                <>
                  <StepTitle icon="place" title="לאן טסים?" subtitle="בחרו יעד מהרשימה, או תנו ל-AI להפתיע" />
                  <View style={styles.originRow}>
                    <MaterialIcons name="flight-takeoff" size={18} color={colors.primary} />
                    <Text style={[typo.bodyMd, { color: colors.onSurface }]}>טסים מ:</Text>
                    <TextInput style={styles.originInput} value={request.origin} onChangeText={(t) => setRequest((r) => ({ ...r, origin: t.toUpperCase() }))} placeholder="TLV" placeholderTextColor={colors.outline} />
                  </View>
                  <View style={styles.destGrid}>
                    <Pressable onPress={() => setRequest((r) => ({ ...r, destination: null }))} style={[styles.surpriseCard, openDestination && styles.destCardActive]}>
                      <MaterialIcons name="auto-awesome" size={26} color={colors.tertiary} />
                      <Text style={[typo.headlineSm, { color: colors.onSurface }]}>הפתיעו אותי ✨</Text>
                      <Text style={[typo.bodySm, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>ה-AI יבחר יעדים לפי הסגנון והתקציב</Text>
                    </Pressable>
                    {CATALOG.map((d) => {
                      const active = request.destination === d.key;
                      return (
                        <Pressable key={d.key} onPress={() => setRequest((r) => ({ ...r, destination: d.key }))} style={[styles.destCard, active && styles.destCardActive]}>
                          <Image source={{ uri: destinationImageUrl(d.photo, 400, 300) }} style={styles.destImage} resizeMode="cover" />
                          <View style={styles.destScrim} />
                          {active ? (
                            <View style={styles.destCheck}><MaterialIcons name="check" size={16} color={colors.onPrimary} /></View>
                          ) : null}
                          <Text style={styles.destName}>{d.he}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              {STEPS[step].key === 'dates' && (
                <>
                  <StepTitle icon="event" title="מתי טסים?" subtitle="בחרו טווח תאריכים ביומן, או עברו לתאריכים גמישים" />
                  <View style={styles.row}>
                    <Chip label="תאריכים ביומן" active={!request.flexibleDates} onPress={() => setRequest((r) => ({ ...r, flexibleDates: false }))} />
                    <Chip label="תאריכים גמישים" active={request.flexibleDates} onPress={() => setRequest((r) => ({ ...r, flexibleDates: true }))} />
                  </View>
                  {request.flexibleDates ? (
                    <>
                      <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>חודש יעד</Text>
                      <View style={styles.wrap}>
                        {MONTHS.map((mo, i) => (
                          <Chip key={mo} label={mo} active={request.targetMonth === i + 1} onPress={() => setRequest((r) => ({ ...r, targetMonth: i + 1 }))} />
                        ))}
                      </View>
                      <View style={styles.between}>
                        <Text style={[typo.bodyMd, { color: colors.onSurface }]}>מספר לילות</Text>
                        <Stepper value={request.nights} min={1} onChange={(v) => setRequest((r) => ({ ...r, nights: v }))} />
                      </View>
                    </>
                  ) : (
                    <>
                      <Calendar
                        markingType="period"
                        markedDates={marked}
                        onDayPress={onDayPress}
                        minDate={new Date().toISOString().slice(0, 10)}
                        firstDay={0}
                        theme={{
                          todayTextColor: colors.primary,
                          arrowColor: colors.primary,
                          textMonthFontFamily: 'Rubik_600SemiBold',
                          textDayFontFamily: 'Rubik_400Regular',
                          textDayHeaderFontFamily: 'Rubik_500Medium',
                          monthTextColor: colors.onSurface,
                        }}
                        style={styles.calendar}
                      />
                      <View style={styles.dateSummary}>
                        <Text style={[typo.bodyMd, { color: colors.onSurface }]}>
                          {request.departDate ? `יציאה ${request.departDate}` : 'בחרו תאריך יציאה'}
                          {request.returnDate ? `  ·  חזרה ${request.returnDate}  ·  ${request.nights} לילות` : request.departDate ? '  ·  בחרו תאריך חזרה' : ''}
                        </Text>
                      </View>
                    </>
                  )}
                </>
              )}

              {STEPS[step].key === 'who' && (
                <>
                  <StepTitle icon="group" title="מי מטייל?" subtitle="נתאים את הקצב, המלונות והאטרקציות" />
                  <View style={styles.wrap}>
                    {PARTIES.map((p) => (
                      <Chip key={p.key} label={p.label} icon={p.icon} active={request.partyType === p.key} onPress={() => setRequest((r) => ({ ...r, partyType: p.key }))} />
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
                </>
              )}

              {STEPS[step].key === 'style' && (
                <>
                  <StepTitle icon="mood" title="מה האופי של החופשה?" subtitle="בחרו סגנון ואיך תעדיפו לנוע" />
                  <View style={styles.wrap}>
                    {VIBES.map((v) => (
                      <Chip key={v.key} label={v.label} icon={v.icon} active={request.vibe === v.key} onPress={() => setRequest((r) => ({ ...r, vibe: v.key }))} />
                    ))}
                  </View>
                  <Text style={[typo.bodySm, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>תחבורה</Text>
                  <View style={styles.wrap}>
                    {TRANSPORT.map((t) => (
                      <Chip key={t.key} label={t.label} active={request.transport === t.key} onPress={() => setRequest((r) => ({ ...r, transport: t.key }))} />
                    ))}
                  </View>
                </>
              )}

              {STEPS[step].key === 'budget' && (
                <>
                  <StepTitle icon="account-balance-wallet" title="מה התקציב הכולל?" subtitle="גררו את הבר, או בחרו סכום מהיר" />
                  <BudgetSlider
                    value={request.budgetTotal}
                    min={budgetMin}
                    max={budgetMax}
                    step={budgetStep}
                    onChange={(v) => setRequest((r) => ({ ...r, budgetTotal: v }))}
                    format={(v) => money(v, request.currency)}
                  />
                  <View style={[styles.wrap, { justifyContent: 'center', marginTop: spacing.sm }]}>
                    {(isILS ? [8000, 12500, 20000, 35000] : [2000, 3500, 6000, 10000]).map((b) => (
                      <Chip key={b} label={money(b, request.currency)} active={request.budgetTotal === b} onPress={() => setRequest((r) => ({ ...r, budgetTotal: b }))} />
                    ))}
                  </View>
                  <Text style={[typo.bodySm, { color: colors.onSurfaceVariant, marginTop: spacing.md }]}>בקשות מיוחדות (לא חובה)</Text>
                  <TextInput
                    style={[styles.input, { height: 76, textAlignVertical: 'top' }]}
                    multiline
                    placeholder="אוכל כשר, קרוב לחוף, נגישות, טיסה ישירה בלבד..."
                    placeholderTextColor={colors.outline}
                    value={request.specialRequests}
                    onChangeText={(t) => setRequest((r) => ({ ...r, specialRequests: t }))}
                  />
                </>
              )}
            </Card>

            {error ? <Text style={[typo.bodySm, { color: colors.error }]}>{error}</Text> : null}

            {/* Footer nav */}
            <View style={styles.footer}>
              {step > 0 ? (
                <Pressable style={styles.backBtn} onPress={() => setStep((s) => s - 1)}>
                  <MaterialIcons name="arrow-forward" size={20} color={colors.onSurface} />
                  <Text style={[typo.headlineSm, { color: colors.onSurface }]}>חזרה</Text>
                </Pressable>
              ) : (
                <View style={{ flex: 1 }} />
              )}
              {isLast ? (
                <Pressable style={[styles.nextBtn, !stepValid() && styles.btnDisabled]} disabled={!stepValid() || loadingProposals} onPress={runSearch}>
                  {loadingProposals ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <>
                      <MaterialIcons name="auto-awesome" size={20} color={colors.onPrimary} />
                      <Text style={[typo.headlineSm, { color: colors.onPrimary }]}>בנה לי חופשה</Text>
                    </>
                  )}
                </Pressable>
              ) : (
                <Pressable style={[styles.nextBtn, !stepValid() && styles.btnDisabled]} disabled={!stepValid()} onPress={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
                  <Text style={[typo.headlineSm, { color: colors.onPrimary }]}>הבא</Text>
                  <MaterialIcons name="arrow-back" size={20} color={colors.onPrimary} />
                </Pressable>
              )}
            </View>
          </View>
        </Container>
      </ScrollView>
    </View>
  );
}

function StepTitle({ icon, title, subtitle }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; subtitle: string }) {
  return (
    <View style={{ gap: 2, marginBottom: spacing.sm }}>
      <View style={styles.rowCenter}>
        <MaterialIcons name={icon} size={20} color={colors.primary} />
        <Text style={[typo.headlineMd, { color: colors.onSurface }]}>{title}</Text>
      </View>
      <Text style={[typo.bodyMd, { color: colors.onSurfaceVariant }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingVertical: spacing.margin, paddingBottom: spacing.xl },
  inner: { gap: spacing.md },
  innerWide: { maxWidth: 720, alignSelf: 'center', width: '100%' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', alignItems: 'center' },
  wrap: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // progress
  progress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressItem: { alignItems: 'center', gap: 4 },
  progressDot: { width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  progressDotActive: { backgroundColor: colors.primary },
  progressDotDone: { backgroundColor: colors.primaryContainer },
  progressLine: { flex: 1, height: 2, backgroundColor: colors.surfaceContainerHigh, marginHorizontal: 4, marginBottom: 16 },

  stepCard: { gap: spacing.sm, minHeight: 260 },

  // destination
  originRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.surfaceContainerLow, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  originInput: { flex: 1, fontFamily: 'Rubik_600SemiBold', fontSize: 15, color: colors.onSurface, textAlign: 'right' },
  destGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  surpriseCard: { width: '48%', minHeight: 120, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', gap: 4, padding: spacing.sm, borderWidth: 2, borderColor: 'transparent' },
  destCard: { width: '48%', height: 120, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.primary, justifyContent: 'flex-end', borderWidth: 2, borderColor: 'transparent' },
  destCardActive: { borderColor: colors.primary },
  destImage: { ...StyleSheet.absoluteFillObject },
  destScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,28,48,0.35)' },
  destName: { fontFamily: 'Rubik_700Bold', fontSize: 15, color: '#fff', padding: spacing.sm },
  destCheck: { position: 'absolute', top: spacing.sm, right: spacing.sm, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },

  // calendar
  calendar: { borderRadius: radius.md, overflow: 'hidden' },
  dateSummary: { backgroundColor: colors.surfaceContainerLow, padding: spacing.sm, borderRadius: radius.md, alignItems: 'center' },

  // chips / steppers / inputs
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, height: 38, borderRadius: radius.full },
  chipActive: { backgroundColor: colors.primary },
  chipIdle: { backgroundColor: colors.surfaceContainer },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBtn: { width: 34, height: 34, borderRadius: radius.full, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  ageBox: { alignItems: 'center', gap: 4, backgroundColor: colors.surfaceContainerLow, padding: spacing.sm, borderRadius: radius.md },
  input: { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontFamily: 'Rubik_400Regular', fontSize: 14, color: colors.onSurface, textAlign: 'right' },

  // footer
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, height: 52, paddingHorizontal: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.surfaceContainer },
  nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, height: 52, borderRadius: radius.xl, backgroundColor: colors.primary },
  btnDisabled: { opacity: 0.4 },
});
