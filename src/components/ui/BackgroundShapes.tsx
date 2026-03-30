import React from 'react';
import { View, StyleSheet } from 'react-native';

const STRIPES = (() => {
  const seeded = (s: number) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const rand = seeded(42);
  const stripes = [];
  for (let i = 0; i < 15; i++) {
    stripes.push({
      x: rand() * 120 - 10,
      y: rand() * 120 - 10,
      length: 80 + rand() * 160,
      opacity: 0.02 + rand() * 0.015,
      width: 4 + rand() * 4,
    });
  }
  return stripes;
})();

export function BackgroundShapes({ isDark }: { isDark: boolean }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {STRIPES.map((s, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.width,
            height: s.length,
            borderRadius: s.width / 2,
            backgroundColor: isDark
              ? `rgba(255,255,255,${s.opacity * 0.6})`
              : `rgba(0,0,0,${s.opacity})`,
            transform: [{ rotate: '-45deg' }],
          }}
        />
      ))}
    </View>
  );
}
