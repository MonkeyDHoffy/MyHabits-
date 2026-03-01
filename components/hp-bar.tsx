import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type HPBarProps = {
  label: string;
  current: number;
  max: number;
  fillColor: string;
};

// Klemmt einen Wert sicher zwischen 0 und max.
function clampValue(value: number, max: number): number {
  return Math.max(0, Math.min(max, value));
}

// Wandelt HP in eine Prozentbreite für den Balken um.
function getFillPercent(current: number, max: number): number {
  if (max <= 0) {
    return 0;
  }

  return (clampValue(current, max) / max) * 100;
}

// Erzeugt dynamische Styles für die aktuelle Balkenfüllung.
function createDynamicStyles(fillPercent: number, fillColor: string) {
  return StyleSheet.create({
    fill: {
      width: `${fillPercent}%`,
      backgroundColor: fillColor,
    },
  });
}

// Rendert einen kompakten HP-Balken mit Label und Zahlenwert.
export function HPBar({ label, current, max, fillColor }: HPBarProps) {
  const fillPercent = getFillPercent(current, max);
  const dynamicStyles = useMemo(() => {
    return createDynamicStyles(fillPercent, fillColor);
  }, [fillColor, fillPercent]);

  return (
    <View style={styles.container}>
      <View style={styles.infoRow}>
        <ThemedText style={styles.label} lightColor="#FFFFFF" darkColor="#FFFFFF">
          {label}
        </ThemedText>
        <ThemedText style={styles.value} lightColor="#FFFFFF" darkColor="#FFFFFF">
          {`${Math.round(clampValue(current, max))}/${max}`}
        </ThemedText>
      </View>

      <View style={styles.track}>
        <View style={[styles.fillBase, dynamicStyles.fill]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  value: {
    fontSize: 12,
    lineHeight: 16,
  },
  track: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    overflow: 'hidden',
  },
  fillBase: {
    height: '100%',
    borderRadius: 999,
  },
});
