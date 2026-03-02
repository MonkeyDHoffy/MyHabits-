import { useCallback, useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DamageEffects, type DamageEvent } from '@/components/damage-effects';
import { useGame } from '@/context/game-context';

const HEADER_CONTENT_HEIGHT = 64;

type PigCanvasBoxProps = {
  headerMinimumHeight: number;
  drawerClosedHeight: number;
  enemyDamageEvent: DamageEvent | null;
};

// Berechnet den oberen Abstand, damit die Canvas unter dem Header liegt.
function getCanvasTopOffset(topInset: number, headerMinimumHeight: number): number {
  const defaultHeaderHeight = topInset + HEADER_CONTENT_HEIGHT;
  return Math.max(defaultHeaderHeight, headerMinimumHeight);
}

// Rendert eine transparente Canvas-Box für Gegner-Sprites.
export function PigCanvasBox({
  headerMinimumHeight,
  drawerClosedHeight,
  enemyDamageEvent,
}: PigCanvasBoxProps) {
  const { isDevMode } = useGame();
  const { top: topInset } = useSafeAreaInsets();
  const topOffset = getCanvasTopOffset(topInset, headerMinimumHeight);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);

  // Aktualisiert die Canvas-Maße für zufällige Damage-Positionen.
  const handleCanvasLayout = useCallback((event: LayoutChangeEvent) => {
    setCanvasWidth(event.nativeEvent.layout.width);
    setCanvasHeight(event.nativeEvent.layout.height);
  }, []);

  return (
    <View
      style={[styles.canvasBox, { top: topOffset, bottom: drawerClosedHeight }]}
      pointerEvents="none"
      onLayout={handleCanvasLayout}>
      {isDevMode ? <View style={styles.debugMidline} /> : null}

      <Image
        source={require('@/assets/images/pigpics/pigone.png')}
        resizeMode="contain"
        style={styles.pigSprite}
      />

      <DamageEffects
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        damageEvent={enemyDamageEvent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  canvasBox: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderWidth: 2,
    borderColor: '#ff000000',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  pigSprite: {
    width: '70%',
    height: '70%',
    zIndex: 1,
  },
  debugMidline: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 2,
    marginTop: -1,
    backgroundColor: '#FF0000',
  },
});
