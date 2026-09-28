import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing, type as typo } from '../theme';
import { Card } from '../components/ui';
import { Container } from '../components/Layout';
import { useResponsive } from '../hooks/useResponsive';
import { API_URL, isDemo } from '../api';
import { snapshotSummaries, findSnapshot } from '../data/knowledgeSnapshot';
import {
  adminApi,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type AdminCategoryKey,
  type AdminDestinationFull,
  type AdminDestinationSummary,
  type AdminKnowledgeItem,
} from '../admin/adminApi';

type ConnState = 'checking' | 'connected' | 'unreachable';

function NotConnected() {
  return (
    <View style={styles.notConnected}>
      <MaterialIcons name="cloud-off" size={40} color={colors.outline} />
      <Text style={[typo.headlineSm, { color: colors.onSurface, textAlign: 'center' }]}>אין חיבור למאגר הפנימי</Text>
      <Text style={[typo.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
        דף הניהול פועל מול השרת האמיתי בלבד, כדי שכל עריכה באמת תישמר במאגר.
      </Text>
      <Text style={[typo.bodySm, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
        הרימו את השרת המקומי (npm run dev) או הגדירו EXPO_PUBLIC_API_URL לכתובת שרת חי, ואז רעננו.{'\n'}
        מנסה כרגע: {API_URL}
      </Text>
    </View>
  );
}

function StarScore({ value }: { value: number }) {
  return (
    <View style={styles.rowCenter}>
      <MaterialIcons name="star" size={14} color={colors.tertiary} />
      <Text style={[typo.labelTag, { color: colors.onSurfaceVariant }]}>{value.toFixed(1)}</Text>
    </View>
  );
}

function ItemEditor({
  item,
  onSave,
  onDelete,
  onCancel,
}: {
  item: AdminKnowledgeItem;
  onSave: (patch: Partial<AdminKnowledgeItem>) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [descriptionHe, setDescriptionHe] = useState(item.descriptionHe);
  const [priceEstimateUsd, setPriceEstimateUsd] = useState(String(item.priceEstimateUsd ?? ''));
  const [imageQuery, setImageQuery] = useState(item.imageQuery);
  const [mustDo, setMustDo] = useState(item.mustDo);

  return (
    <View style={styles.editorBox}>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="שם" placeholderTextColor={colors.outline} />
      <TextInput style={[styles.input, { height: 64, textAlignVertical: 'top' }]} value={descriptionHe} onChangeText={setDescriptionHe} placeholder="תיאור בעברית" placeholderTextColor={colors.outline} multiline />
      <View style={styles.row}>
        <TextInput style={[styles.input, { flex: 1 }]} value={priceEstimateUsd} onChangeText={setPriceEstimateUsd} placeholder="מחיר משוער ($)" placeholderTextColor={colors.outline} keyboardType="numeric" />
        <TextInput style={[styles.input, { flex: 1 }]} value={imageQuery} onChangeText={setImageQuery} placeholder="חיפוש תמונה (אנגלית)" placeholderTextColor={colors.outline} />
      </View>
      <View style={styles.between}>
        <View style={styles.rowCenter}>
          <Switch value={mustDo} onValueChange={setMustDo} trackColor={{ true: colors.primary }} />
          <Text style={[typo.bodySm, { color: colors.onSurface }]}>חובה לעשות</Text>
        </View>
        <View style={styles.row}>
          <Pressable style={styles.smallBtn} onPress={onDelete}>
            <MaterialIcons name="delete-outline" size={16} color={colors.error} />
            <Text style={[typo.labelTag, { color: colors.error }]}>מחק</Text>
          </Pressable>
          <Pressable style={styles.smallBtn} onPress={onCancel}>
            <Text style={[typo.labelTag, { color: colors.onSurfaceVariant }]}>ביטול</Text>
          </Pressable>
          <Pressable
            style={[styles.smallBtn, styles.smallBtnPrimary]}
            onPress={() =>
              onSave({
                name,
                descriptionHe,
                priceEstimateUsd: priceEstimateUsd ? Number(priceEstimateUsd) : null,
                imageQuery,
                mustDo,
              })
            }
          >
            <MaterialIcons name="check" size={16} color={colors.onPrimary} />
            <Text style={[typo.labelTag, { color: colors.onPrimary }]}>שמור</Text>
          </Pressable>
        </View>
      </View>
      {item.sources.length ? (
        <View style={styles.sourcesBox}>
          <Text style={[typo.labelTag, { color: colors.onSurfaceVariant }]}>מקורות:</Text>
          {item.sources.map((s, i) => (
            <Text key={i} style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>• {s.title} ({s.platform})</Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function CategorySection({
  destination,
  category,
  items,
  onChanged,
  readOnly = false,
}: {
  destination: string;
  category: AdminCategoryKey;
  items: AdminKnowledgeItem[];
  onChanged: () => void;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const save = async (id: string, patch: Partial<AdminKnowledgeItem>) => {
    await adminApi.upsertItem(destination, category, { id, ...patch });
    setEditingId(null);
    onChanged();
  };
  const del = async (id: string) => {
    await adminApi.deleteItem(destination, category, id);
    onChanged();
  };
  const createNew = async () => {
    if (!newName.trim()) return;
    await adminApi.createItem(destination, category, { name: newName.trim(), descriptionHe: '', imageQuery: newName.trim() });
    setNewName('');
    setAdding(false);
    onChanged();
  };

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <Pressable style={styles.summary} onPress={() => setOpen((o) => !o)}>
        <Text style={[typo.headlineSm, { color: colors.onSurface }]}>{CATEGORY_LABELS[category]}</Text>
        <View style={styles.rowCenter}>
          <Text style={[typo.labelTag, { color: colors.onSurfaceVariant }]}>{items.length} פריטים</Text>
          <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={20} color={colors.outline} />
        </View>
      </Pressable>
      {open ? (
        <View style={styles.detail}>
          {items.map((it) =>
            !readOnly && editingId === it.id ? (
              <ItemEditor key={it.id} item={it} onSave={(p) => save(it.id, p)} onDelete={() => del(it.id)} onCancel={() => setEditingId(null)} />
            ) : (
              <Pressable key={it.id} style={styles.itemRow} onPress={() => !readOnly && setEditingId(it.id)}>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.rowCenter}>
                    {it.mustDo ? <MaterialIcons name="verified" size={14} color={colors.primary} /> : null}
                    <Text style={[typo.bodyMd, { color: colors.onSurface, fontFamily: 'Rubik_600SemiBold' }]}>{it.name}</Text>
                  </View>
                  <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]} numberOfLines={2}>{it.descriptionHe || '—'}</Text>
                </View>
                <StarScore value={it.popularityScore} />
                {!readOnly ? <MaterialIcons name="edit" size={16} color={colors.onSurfaceVariant} /> : null}
              </Pressable>
            ),
          )}
          {readOnly ? null : adding ? (
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1 }]} value={newName} onChangeText={setNewName} placeholder="שם פריט חדש" placeholderTextColor={colors.outline} />
              <Pressable style={[styles.smallBtn, styles.smallBtnPrimary]} onPress={createNew}>
                <Text style={[typo.labelTag, { color: colors.onPrimary }]}>הוסף</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.addRow} onPress={() => setAdding(true)}>
              <MaterialIcons name="add" size={16} color={colors.primary} />
              <Text style={[typo.bodySm, { color: colors.primary }]}>הוסף פריט</Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </Card>
  );
}

export function AdminScreen() {
  const { isWide } = useResponsive();
  const [conn, setConn] = useState<ConnState>('checking');
  const [destinations, setDestinations] = useState<AdminDestinationSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminDestinationFull | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadList = useCallback(async () => {
    if (isDemo) {
      setDestinations([...snapshotSummaries].sort((a, b) => a.destination.localeCompare(b.destination)));
      setConn('connected');
      return;
    }
    try {
      const { destinations } = await adminApi.listDestinations();
      setDestinations(destinations.sort((a, b) => a.destination.localeCompare(b.destination)));
      setConn('connected');
    } catch {
      setConn('unreachable');
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const loadDetail = useCallback(async (destination: string) => {
    setSelected(destination);
    if (isDemo) {
      setDetail(findSnapshot(destination));
      return;
    }
    setLoadingDetail(true);
    try {
      const d = await adminApi.getDestination(destination);
      setDetail(d);
    } catch {
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const refreshSelected = useCallback(() => {
    if (selected) loadDetail(selected);
    loadList();
  }, [selected, loadDetail, loadList]);

  if (conn === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (conn === 'unreachable') {
    return <NotConnected />;
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Container>
        <View style={{ gap: spacing.xs, marginBottom: spacing.md }}>
          <View style={styles.rowCenter}>
            <MaterialIcons name="admin-panel-settings" size={20} color={colors.primary} />
            <Text style={[typo.headlineMd, { color: colors.onSurface }]}>ניהול מאגר הידע הפנימי</Text>
          </View>
          <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>
            {destinations.length} יעדים במאגר{isDemo ? '' : ' · פתוח לעריכה לכולם כרגע (ללא הרשאות)'}
          </Text>
          {isDemo ? (
            <View style={styles.demoBanner}>
              <MaterialIcons name="visibility" size={16} color={colors.tertiary} />
              <Text style={[typo.bodySm, { color: colors.tertiary, flex: 1 }]}>
                מצב הדגמה: תצוגה בלבד של המחקר שנשמר מראש (541 פריטים, 12 יעדים, כולם עם מקורות). עריכה בזמן אמת דורשת חיבור לשרת חי — הגדירו EXPO_PUBLIC_API_URL.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={isWide ? styles.twoCol : styles.oneCol}>
          <View style={isWide ? styles.listColWide : undefined}>
            <View style={{ gap: spacing.sm }}>
              {destinations.map((d) => (
                <Pressable key={d.destination} style={[styles.destRow, selected === d.destination && styles.destRowActive]} onPress={() => loadDetail(d.destination)}>
                  <Text style={{ fontSize: 20 }}>{d.flag}</Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[typo.bodyMd, { color: colors.onSurface, fontFamily: 'Rubik_600SemiBold' }]}>{d.destination}</Text>
                    <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>{d.country} · {d.itemCount} פריטים</Text>
                  </View>
                </Pressable>
              ))}
              {destinations.length === 0 ? (
                <Card>
                  <Text style={[typo.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>המאגר עדיין ריק — ממתין למחקר היעדים.</Text>
                </Card>
              ) : null}
            </View>
          </View>

          <View style={isWide ? styles.detailColWide : undefined}>
            {!selected ? (
              <Card>
                <Text style={[typo.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>בחרו יעד מהרשימה כדי לצפות ולערוך.</Text>
              </Card>
            ) : loadingDetail ? (
              <View style={styles.center}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : detail ? (
              <View style={{ gap: spacing.sm }}>
                <Card style={{ gap: spacing.xs }}>
                  <Text style={[typo.headlineSm, { color: colors.onSurface }]}>{detail.flag} {detail.destination}, {detail.country}</Text>
                  {detail.summaryHe ? <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>{detail.summaryHe}</Text> : null}
                  {detail.weatherHe ? <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>🌤 {detail.weatherHe}</Text> : null}
                </Card>
                {CATEGORY_ORDER.map((cat) => (
                  <CategorySection key={cat} destination={detail.destination} category={cat} items={detail.categories[cat] ?? []} onChanged={refreshSelected} readOnly={isDemo} />
                ))}
              </View>
            ) : (
              <Text style={[typo.bodyMd, { color: colors.error }]}>שגיאה בטעינת היעד.</Text>
            )}
          </View>
        </View>
      </Container>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: spacing.margin, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  notConnected: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  demoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: 'rgba(192,84,0,0.10)', padding: spacing.sm, borderRadius: radius.md },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  row: { flexDirection: 'row', gap: spacing.sm },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  oneCol: { gap: spacing.md },
  twoCol: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  listColWide: { width: 280 },
  detailColWide: { flex: 1 },
  destRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceContainerLowest, padding: spacing.sm, borderRadius: radius.md, borderWidth: 2, borderColor: 'transparent' },
  destRowActive: { borderColor: colors.primary },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  detail: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceContainerLow, padding: spacing.sm, borderRadius: radius.md },
  editorBox: { gap: spacing.sm, backgroundColor: colors.surfaceContainerLow, padding: spacing.sm, borderRadius: radius.md },
  input: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, fontFamily: 'Rubik_400Regular', fontSize: 13, color: colors.onSurface, textAlign: 'right' },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, height: 32, borderRadius: radius.md, backgroundColor: colors.surfaceContainer },
  smallBtnPrimary: { backgroundColor: colors.primary },
  sourcesBox: { gap: 2, paddingTop: spacing.xs, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.outlineVariant },
  addRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: spacing.sm },
});
