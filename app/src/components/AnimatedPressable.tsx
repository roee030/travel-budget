import React, { useRef } from 'react';
import { Animated, Pressable, StyleProp, ViewStyle, GestureResponderEvent } from 'react-native';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

/**
 * A Pressable that scales down slightly on press and up slightly on hover
 * (web), with a spring animation — a small, consistent tactile cue used
 * across cards, buttons and chips instead of each screen inventing its own.
 */
export function AnimatedPressable({
  children,
  onPress,
  style,
  hoverStyle,
  pressedStyle,
  disabled,
  hoverScale = 1.02,
  pressScale = 0.97,
}: {
  children: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  /** Extra style (e.g. a background color change) merged in while hovered/pressed. */
  hoverStyle?: StyleProp<ViewStyle> | false;
  pressedStyle?: StyleProp<ViewStyle> | false;
  disabled?: boolean;
  hoverScale?: number;
  pressScale?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);

  const animateTo = (value: number) => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };

  return (
    <AnimatedPressableBase
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        setPressed(true);
        animateTo(pressScale);
      }}
      onPressOut={() => {
        setPressed(false);
        animateTo(1);
      }}
      onHoverIn={() => {
        setHovered(true);
        animateTo(hoverScale);
      }}
      onHoverOut={() => {
        setHovered(false);
        animateTo(1);
      }}
      style={[style, hovered && hoverStyle, pressed && pressedStyle, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressableBase>
  );
}
