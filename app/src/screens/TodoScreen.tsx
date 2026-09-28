import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing, type as typo } from '../theme';
import { Card } from '../components/ui';
import { Container } from '../components/Layout';

/**
 * A running list of what's still missing before Triporia is a real product
 * rather than a demo — kept here (not in a README) so it's visible to
 * whoever's using the live site. Update this list by hand as items land;
 * it's not derived from anything automatically.
 */

type Status = 'pending' | 'blocked' | 'partial';

interface TodoItem {
  title: string;
  detail: string;
  status: Status;
}

interface TodoSection {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  items: TodoItem[];
}

const SECTIONS: TodoSection[] = [
  {
    title: 'מפתחות API ואינטגרציות חיות',
    icon: 'vpn-key',
    items: [
      { title: 'ANTHROPIC_API_KEY', detail: 'ה-AI פועל כרגע במנוע fallback דטרמיניסטי (ללא קריאה אמיתית ל-Claude) — פירוט, נימוקים ותובנות הם מוקאפ.', status: 'blocked' },
      { title: 'KIWI_API_KEY (טיסות)', detail: 'טיסות מוצגות כרגע ממאגר דוגמאות, לא מחיפוש חי.', status: 'blocked' },
      { title: 'BOOKING_API_KEY (מלונות)', detail: 'יש נתוני מלונות אמיתיים ל-6 יעדים בלבד (נאספו ידנית דרך Booking.com); שאר היעדים על מאגר דוגמאות. חיפוש חי per-request עדיין לא מחובר.', status: 'partial' },
      { title: 'GOOGLE_PLACES_API_KEY', detail: 'מסעדות/אטרקציות בזמן אמת — כרגע רק 12 יעדים עם מחקר ידני שנאסף ע"י AI מפורומים, לא Google Places חי.', status: 'blocked' },
      { title: 'SERPAPI_KEY (RAG על פורומים)', detail: 'שכבת ה-RAG החיה שתעדכן תובנות "מה חם עכשיו" מפורומים/ביקורות בזמן אמת עדיין לא מחוברת.', status: 'blocked' },
    ],
  },
  {
    title: 'תשתית ואירוח',
    icon: 'dns',
    items: [
      { title: 'אירוח שרת Node חי', detail: 'render.yaml מוכן ובנוי, אבל השרת עדיין לא מאורח בפועל — דורש חיבור חשבון Render (ראו קובץ render.yaml).', status: 'blocked' },
      { title: 'Vector store אמיתי (Pinecone / Chroma)', detail: 'כרגע in-memory בלבד — לא שורד restart, לא מתאים לפרודקשן.', status: 'pending' },
      { title: 'Redis cache', detail: 'כרגע cache בזיכרון; ל-production צריך Redis אמיתי כדי לא להעמיס על ה-AI וה-providers.', status: 'pending' },
      { title: 'מסד נתונים (Postgres)', detail: 'טיולים שמורים כרגע נשמרים רק ב-localStorage של הדפדפן (מקומי, לא משותף בין מכשירים) — צריך DB אמיתי לחשבונות/היסטוריה.', status: 'pending' },
    ],
  },
  {
    title: 'אבטחה והרשאות',
    icon: 'lock-outline',
    items: [
      { title: 'הרשאות לדף הניהול', detail: 'כרגע ה-API של הניהול פתוח לגמרי (ללא login) — לפי בקשה מפורשת בשלב זה. צריך להוסיף authentication לפני חשיפה רחבה.', status: 'pending' },
      { title: 'חשבונות משתמשים', detail: 'אין עדיין login/הרשמה — כל טיול שמור הוא local לדפדפן הנוכחי בלבד.', status: 'pending' },
    ],
  },
  {
    title: "פיצ'רים מוצריים חסרים",
    icon: 'construction',
    items: [
      { title: 'זרימת הזמנה אמיתית', detail: 'האפליקציה ממליצה ובונה תקציב, אך אין checkout/תשלום בפועל — לחיצה על "בחר טיסה/מלון" לא באמת מזמינה.', status: 'pending' },
      { title: 'טיול רב-יעדי (multi-city)', detail: 'כרגע כל טיול הוא ליעד יחיד.', status: 'pending' },
      { title: 'אפליקציות native ל-iOS/Android', detail: 'נבדק ופורס כרגע כ-web בלבד (GitHub Pages); build native לא בוצע/נבדק.', status: 'pending' },
      { title: 'תרגום לאנגלית', detail: 'יש שדה language בבקשה אך כל ה-UI מיושם בעברית/RTL בלבד.', status: 'pending' },
      { title: 'הרחבת מאגר היעדים', detail: '12 יעדים נחקרו לעומק (541 פריטים עם מקורות) — צריך להרחיב לעוד יעדים פופולריים.', status: 'partial' },
    ],
  },
  {
    title: 'איכות ובדיקות',
    icon: 'science',
    items: [
      { title: 'כיסוי טסטים', detail: 'יש כרגע קובץ טסט יחיד (budget.test.ts) — צריך כיסוי רחב יותר ליחידה ו-E2E.', status: 'pending' },
    ],
  },
];

const STATUS_META: Record<Status, { label: string; color: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  blocked: { label: 'ממתין למפתח API', color: colors.error, icon: 'block' },
  pending: { label: 'טרם התחיל', color: colors.outline, icon: 'radio-button-unchecked' },
  partial: { label: 'חלקי', color: colors.tertiary, icon: 'incomplete-circle' },
};

function TodoRow({ item }: { item: TodoItem }) {
  const meta = STATUS_META[item.status];
  return (
    <View style={styles.row}>
      <MaterialIcons name={meta.icon} size={18} color={meta.color} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.rowHead}>
          <Text style={[typo.bodyMd, { color: colors.onSurface, fontFamily: 'Rubik_600SemiBold' }]}>{item.title}</Text>
          <View style={[styles.statusPill, { backgroundColor: `${meta.color}1A` }]}>
            <Text style={[typo.labelTag, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>{item.detail}</Text>
      </View>
    </View>
  );
}

function TodoSectionCard({ section }: { section: TodoSection }) {
  const [open, setOpen] = useState(true);
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <Pressable style={styles.summary} onPress={() => setOpen((o) => !o)}>
        <View style={styles.rowCenter}>
          <MaterialIcons name={section.icon} size={20} color={colors.primary} />
          <Text style={[typo.headlineSm, { color: colors.onSurface }]}>{section.title}</Text>
        </View>
        <View style={styles.rowCenter}>
          <Text style={[typo.labelTag, { color: colors.onSurfaceVariant }]}>{section.items.length} פריטים</Text>
          <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={20} color={colors.outline} />
        </View>
      </Pressable>
      {open ? (
        <View style={styles.detail}>
          {section.items.map((it) => (
            <TodoRow key={it.title} item={it} />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

export function TodoScreen() {
  const totalItems = SECTIONS.reduce((s, sec) => s + sec.items.length, 0);
  const blockedCount = SECTIONS.reduce((s, sec) => s + sec.items.filter((i) => i.status === 'blocked').length, 0);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Container>
        <View style={{ gap: spacing.xs, marginBottom: spacing.md }}>
          <View style={styles.rowCenter}>
            <MaterialIcons name="checklist" size={20} color={colors.primary} />
            <Text style={[typo.headlineMd, { color: colors.onSurface }]}>מה עוד חסר לנו</Text>
          </View>
          <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>
            {totalItems} פריטים פתוחים · {blockedCount} מהם ממתינים למפתחות API אמיתיים כדי לצאת ממצב הדגמה.
          </Text>
        </View>

        <View style={{ gap: spacing.sm }}>
          {SECTIONS.map((s) => (
            <TodoSectionCard key={s.title} section={s} />
          ))}
        </View>
      </Container>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: spacing.margin, paddingBottom: spacing.xl },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  detail: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.surfaceContainerLow, padding: spacing.sm, borderRadius: radius.md },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
});
