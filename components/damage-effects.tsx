import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

export type DamageEvent = {
  id: number;
  amount: number;
};

type FloatingDamage = {
  id: number;
  amount: number;
  left: number;
  top: number;
  opacity: Animated.Value;
  translateY: Animated.Value;
};

type DamageEffectsProps = {
  canvasWidth: number;
  canvasHeight: number;
  damageEvent: DamageEvent | null;
};

const FLOAT_DURATION_MS = 850;
const DAMAGE_TEXT_WIDTH_ESTIMATE = 208;

// Liefert einen Zufallswert im angegebenen Bereich.
function getRandomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Berechnet eine zufällige X-Position innerhalb der Canvas.
function getRandomLeft(canvasWidth: number): number {
  const minLeft = 12;
  const maxLeft = Math.max(minLeft, canvasWidth - DAMAGE_TEXT_WIDTH_ESTIMATE);
  return getRandomBetween(minLeft, maxLeft);
}

// Berechnet eine zufällige Y-Position oberhalb der Midline.
function getRandomTopAboveMidline(canvasHeight: number): number {
  const minTop = 12;
  const maxTop = Math.max(minTop, canvasHeight * 0.5 - 42);
  return getRandomBetween(minTop, maxTop);
}

// Rendert schwebende Damage-Zahlen für Treffer am Gegner.
export function DamageEffects({ canvasWidth, canvasHeight, damageEvent }: DamageEffectsProps) {
  const [floatingDamages, setFloatingDamages] = useState<FloatingDamage[]>([]);

  useEffect(() => {
    if (!damageEvent) {
      return;
    }

    if (canvasWidth <= 0 || canvasHeight <= 0) {
      return;
    }

    const nextFloatingDamage: FloatingDamage = {
      id: damageEvent.id,
      amount: damageEvent.amount,
      left: getRandomLeft(canvasWidth),
      top: getRandomTopAboveMidline(canvasHeight),
      opacity: new Animated.Value(1),
      translateY: new Animated.Value(0),
    };

    setFloatingDamages((currentItems) => {
      return [...currentItems, nextFloatingDamage];
    });

    Animated.parallel([
      Animated.timing(nextFloatingDamage.translateY, {
        toValue: -56,
        duration: FLOAT_DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(nextFloatingDamage.opacity, {
        toValue: 0,
        duration: FLOAT_DURATION_MS,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setFloatingDamages((currentItems) => {
        return currentItems.filter((item) => item.id !== nextFloatingDamage.id);
      });
    });
  }, [canvasHeight, canvasWidth, damageEvent]);

  return (
    <>
      {floatingDamages.map((item) => (
        <Animated.View
          key={item.id}
          style={[
            styles.damageTag,
            {
              left: item.left,
              top: item.top,
              opacity: item.opacity,
              transform: [{ translateY: item.translateY }],
            },
          ]}>
          <Animated.Text style={styles.damageText}>{`-${item.amount}`}</Animated.Text>
        </Animated.View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  damageTag: {
    position: 'absolute',
    zIndex: 20,
    elevation: 20,
  },
  damageText: {
    color: '#FF5B5B',
    fontSize: 68,
    lineHeight: 76,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
