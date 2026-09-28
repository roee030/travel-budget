import React, { useRef, useState } from 'react';
import { View, Text, PanResponder, StyleSheet, LayoutChangeEvent } from 'react-native';
import { colors, radius, spacing, type as typo } from '../theme';

/**
 * A polished, dependency-free draggable budget slider. Physical left→right =
 * low→high regardless of RTL (drag right raises the amount, which feels natural).
 * Works with mouse (web) and touch (native) via PanResponder.
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
        const deltaValue = (g.dx / w) * (max - min);
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
  const thumbLeft = Math.max(0, Math.min(width - THUMB, fraction * width - THUMB / 2));

  // Tick marks for reference
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <View style={styles.wrap}>
      <View style={styles.valueRow}>
        <Text style={[typo.numericLg, { color: colors.primary }]}>{format(clampSnap(value))}</Text>
        <Text style={[typo.bodySm, { color: colors.onSurfaceVariant }]}>סה״כ לחופשה</Text>
      </View>

      <View style={styles.trackArea} onLayout={onLayout}>
        {/* base track */}
        <View style={styles.track} />
        {/* filled */}
        <View style={[styles.fill, { width: fraction * width }]} />
        {/* ticks */}
        {ticks.map((t) => (
          <View key={t} style={[styles.tick, { left: Math.max(0, Math.min(width - 2, t * width - 1)) }]} />
        ))}
        {/* thumb */}
        <View
          {...pan.panHandlers}
          style={[styles.thumb, { left: thumbLeft, width: THUMB, height: THUMB }]}
        >
          <View style={styles.thumbDot} />
        </View>
      </View>

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
  fill: { position: 'absolute', height: 8, borderRadius: 4, backgroundColor: colors.primary, left: 0 },
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
    ...(typeof document !== 'undefined' ? { cursor: 'grab' } as any : {}),
  },
  thumbDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
