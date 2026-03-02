import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

const PLAYER_GRADIENT_COLORS = ['#0A2F20', '#0F4E34', '#1D6B44', '#0F4E34', '#0A2F20'] as const;
const ENEMY_GRADIENT_COLORS = ['#2A0B11', '#4A121C', '#6B1C2A', '#4A121C', '#2A0B11'] as const;

type HPBarProps = {
  label: string;
  current: number;
  max: number;
  fillColor: string;
  variant?: 'default' | 'player' | 'enemy';
  showValue?: boolean;
  flatTopCorners?: boolean;
  flatBottomCorners?: boolean;
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
export function HPBar({
  label,
  current,
  max,
  fillColor,
  variant = 'default',
  showValue = true,
  flatTopCorners = false,
  flatBottomCorners = false,
}: HPBarProps) {
  const fillPercent = getFillPercent(current, max);
  const dynamicStyles = useMemo(() => {
    return createDynamicStyles(fillPercent, fillColor);
  }, [fillColor, fillPercent]);
  const gradientOffset = useRef(new Animated.Value(0)).current;

  // Bewegt den Gradient im thematischen HP-Balken für einen flüssigen Effekt.
  useEffect(() => {
    if (variant !== 'player' && variant !== 'enemy') {
      gradientOffset.stopAnimation();
      gradientOffset.setValue(0);
      return;
    }

    const loopAnimation = Animated.loop(
      Animated.timing(gradientOffset, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loopAnimation.start();

    return () => {
      loopAnimation.stop();
      gradientOffset.stopAnimation();
      gradientOffset.setValue(0);
    };
  }, [gradientOffset, variant]);

  const gradientTranslateX = gradientOffset.interpolate({
    inputRange: [0, 1],
    outputRange: [-90, 0],
  });

  if (variant === 'player' || variant === 'enemy') {
    const trackStyle = [
      variant === 'player' ? styles.playerTrack : styles.enemyTrack,
      flatTopCorners ? styles.themedTrackFlatTop : null,
      flatBottomCorners ? styles.themedTrackFlatBottom : null,
    ];
    const fillClipStyle = [
      styles.playerFillClip,
      flatTopCorners ? styles.themedFillClipFlatTop : null,
      flatBottomCorners ? styles.themedFillClipFlatBottom : null,
    ];
    const gradientColors =
      variant === 'player'
        ? PLAYER_GRADIENT_COLORS
        : ENEMY_GRADIENT_COLORS;

    return (
      <View style={styles.playerContainer}>
        <View style={trackStyle}>
          <View style={[fillClipStyle, dynamicStyles.fill]}>
            <Animated.View style={[styles.playerGradientMover, { transform: [{ translateX: gradientTranslateX }] }]}>
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.playerGradientFill}
              />
            </Animated.View>
          </View>

          {showValue ? (
            <ThemedText style={styles.playerValue} lightColor="#E8CF74" darkColor="#E8CF74">
              {`${Math.round(clampValue(current, max))}/${max}`}
            </ThemedText>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.infoRow}>
        <ThemedText style={styles.label} lightColor="#FFFFFF" darkColor="#FFFFFF">
          {label}
        </ThemedText>
        {showValue ? (
          <ThemedText style={styles.value} lightColor="#FFFFFF" darkColor="#FFFFFF">
            {`${Math.round(clampValue(current, max))}/${max}`}
          </ThemedText>
        ) : null}
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
  playerContainer: {
    width: '100%',
  },
  playerTrack: {
    width: '100%',
    height: 28,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#D8B75A',
    backgroundColor: '#0A2B1F',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  enemyTrack: {
    width: '100%',
    height: 28,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#D8B75A',
    backgroundColor: '#23080E',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  themedTrackFlatTop: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  themedTrackFlatBottom: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  playerFillClip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 999,
    overflow: 'hidden',
  },
  themedFillClipFlatTop: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  themedFillClipFlatBottom: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  playerGradientMover: {
    width: '170%',
    height: '100%',
  },
  playerGradientFill: {
    width: '100%',
    height: '100%',
  },
  playerValue: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
