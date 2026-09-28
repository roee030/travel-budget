import React, { useRef, useState } from 'react';
import { View, Text, PanResponder, StyleSheet, LayoutChangeEvent, I18nManager, Platform } from 'react-native';
import { colors, radius, spacing, type as typo } from '../theme';

/**
 * I18nManager.isRTL is a separate internal RN flag that does not reliably
 * reflect the document's real `dir` attribute on web (see index.ts, which
 * sets document.documentElement.dir directly — the actual source of truth
 * for this app). Read the DOM on web; fall back to I18nManager on native.
 */
function resolveIsRTL(): boolean {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return document.documentElement.dir === 'rtl';
  }
  return I18nManager.isRTL;
}

/**
 * A polished, dependency-free draggable budget slider.
 *
 * RTL-aware: React Native (and react-native-web) auto-mirrors `flexDirection:
 * 'row'`, but literal absolute-position `left`/`right` values are NOT
 * auto-flipped — using them unconditionally is exactly the kind of bug that
 * makes a slider fill the "wrong" direction in a Hebrew RTL app. Here we
 * anchor the fill/thumb from the right in RTL (min on the right, max on the
 * left — matching native Hebrew sliders) and from the left in LTR, and map
 * drag deltas accordingly.
 */
export function BudgetSlider({
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  const isRTL = resolveIsRTL();
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const startValue = useRef(value);

  const clampSnap = (v: number) => {
    const clamped = Math.max(min, Math.min(max, v));
    return Math.round(clamped / step) * step;
  };

  const fraction = max > min ? (clampSnap(value) - min) / (max - min) : 0;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startValue.current = value;
      },
      onPanResponderMove: (_e, g) => {
        const w = widthRef.current || 1;
        // In RTL, dragging physically left increases the value (mirrors LTR).
        const signedDx = isRTL ? -g.dx : g.dx;
        const deltaValue = (signedDx / w) * (max - min);
        onChange(clampSnap(startValue.current + deltaValue));
      },
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    widthRef.current = w;
    setWidth(w);
  };

  const THUMB = 28;
  // Physical x of the fraction point, anchored from the RTL-correct side.
  const pointX = isRTL ? width - fraction * width : fraction * width;
  const thumbLeft = Math.max(0, Math.min(width - THUMB, pointX - THUMB / 2));
  const fillWidth = fraction * width;

  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <View style={styles.wrap}>
      <View style={styles.valueRow}>
        <Text style={[typo.numericLg, { color: colors.primary }]}>{format(clampSnap(value))}</Text>
        <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>סה״כ לחופשה</Text>
      </View>

      <View style={styles.trackArea} onLayout={onLayout}>
        <View style={styles.track} />
        {/* filled portion, anchored from the RTL-correct side */}
        <View style={[styles.fill, isRTL ? { right: 0, width: fillWidth } : { left: 0, width: fillWidth }]} />
        {ticks.map((t) => {
          const tx = isRTL ? width - t * width : t * width;
          return <View key={t} style={[styles.tick, { left: Math.max(0, Math.min(width - 2, tx - 1)) }]} />;
        })}
        <View {...pan.panHandlers} style={[styles.thumb, { left: thumbLeft, width: THUMB, height: THUMB }]}>
          <View style={styles.thumbDot} />
        </View>
      </View>

      {/* Plain flex row — the document's real dir="rtl" (set in index.ts) makes
          the browser auto-mirror this, so literal [min, max] JSX order already
          renders min on the right / max on the left, matching the track. */}
      <View style={styles.rangeRow}>
        <Text style={[typo.labelTag, { color: colors.onSurfaceVariant }]}>{format(min)}</Text>
        <Text style={[typo.labelTag, { color: colors.onSurfaceVariant }]}>{format(max)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, justifyContent: 'center' },
  trackArea: { height: 40, justifyContent: 'center' },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceContainerHigh, width: '100%' },
  fill: { position: 'absolute', height: 8, borderRadius: 4, backgroundColor: colors.primary },
  tick: { position: 'absolute', width: 2, height: 8, backgroundColor: colors.surfaceContainerLowest, opacity: 0.7 },
  thumb: {
    position: 'absolute',
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    ...(typeof document !== 'undefined' ? ({ cursor: 'grab' } as any) : {}),
  },
  thumbDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
