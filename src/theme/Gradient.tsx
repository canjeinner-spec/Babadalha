import { LinearGradient, type LinearGradientProps } from "expo-linear-gradient";
import { type ReactNode } from "react";
import { type StyleProp, type ViewStyle } from "react-native";

export function degToStartEnd(deg: number) {
  const rad = (deg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  return {
    start: { x: 0.5 - dx * 0.5, y: 0.5 - dy * 0.5 },
    end: { x: 0.5 + dx * 0.5, y: 0.5 + dy * 0.5 },
  };
}

type GradientProps = {
  colors: readonly [string, string, ...string[]];
  deg?: number;
  locations?: LinearGradientProps["locations"];
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  pointerEvents?: "auto" | "none" | "box-none" | "box-only";
};

export function Gradient({ colors, deg = 135, locations, style, children, pointerEvents }: GradientProps) {
  const { start, end } = degToStartEnd(deg);
  return (
    <LinearGradient
      colors={colors as unknown as [string, string, ...string[]]}
      start={start}
      end={end}
      locations={locations}
      style={style}
      pointerEvents={pointerEvents}
    >
      {children}
    </LinearGradient>
  );
}
