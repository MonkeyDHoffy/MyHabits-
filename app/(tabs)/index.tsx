import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';

import { BottomDrawer } from '@/components/bottom-drawer';
import type { DamageEvent } from '@/components/damage-effects';
import { PigCanvasBox } from '@/components/pig-canvas-box';
import { ScreenHeader } from '@/components/screen-header';
import { useGame } from '@/context/game-context';

type BackgroundState = 'bg1' | 'bg2' | 'bg3' | 'bg4';

const backgroundImages: Record<BackgroundState, number> = {
  bg1: require('@/assets/background/bg1.png'),
  bg2: require('@/assets/background/bg2.png'),
  bg3: require('@/assets/background/bg3.png'),
  bg4: require('@/assets/background/bg4.png'),
};

const BACKGROUND_ASPECT_RATIO = 1024 / 1536;

// Liefert das passende Bild auf Basis des aktuellen Hintergrund-Status.
function getBackgroundImage(backgroundState: BackgroundState): number {
  return backgroundImages[backgroundState];
}

// Liefert den Hintergrund-Zustand passend zur aktuellen Gegner-HP.
function getBackgroundStateByEnemyHP(enemyHP: number, maxHP: number): BackgroundState {
  if (maxHP <= 0) {
    return 'bg4';
  }

  const hpPercent = (enemyHP / maxHP) * 100;

  if (hpPercent > 75) {
    return 'bg4';
  }

  if (hpPercent > 50) {
    return 'bg3';
  }

  if (hpPercent >= 25) {
    return 'bg2';
  }

  return 'bg1';
}

// Berechnet eine stabile Drawer-Höhe mit Mobile-Fokus.
function getClosedDrawerHeight(screenHeight: number): number {
  const preferredHeight = screenHeight * 0.14;
  const minHeight = 80;
  const maxHeight = 140;
  return Math.max(minHeight, Math.min(preferredHeight, maxHeight));
}

// Berechnet den vertikalen Letterbox-Abstand (oben/unten) bei contain-Darstellung.
function getVerticalLetterboxInset(
  containerWidth: number,
  containerHeight: number,
  imageAspectRatio: number
): number {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return 0;
  }

  const containerAspectRatio = containerWidth / containerHeight;

  if (containerAspectRatio >= imageAspectRatio) {
    return 0;
  }

  const renderedImageHeight = containerWidth / imageAspectRatio;
  const remainingSpace = containerHeight - renderedImageHeight;
  return Math.max(0, remainingSpace / 2);
}

// Rendert die Startseite mit einem vollständig sichtbaren Hintergrundbild.
export default function HomeScreen() {
  const router = useRouter();
  const {
    habits,
    run,
    maxHP,
    isDevMode,
    startRun,
    advanceRunDayForDevelopment,
    toggleHabitForToday,
  } = useGame();
  const backgroundState = getBackgroundStateByEnemyHP(run.enemyHP, maxHP);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [enemyDamageEvent, setEnemyDamageEvent] = useState<DamageEvent | null>(null);
  const previousEnemyHPRef = useRef(run.enemyHP);
  const damageEventIdRef = useRef(0);
  const isFocused = useIsFocused();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const imageSource = getBackgroundImage(backgroundState);
  const effectiveWidth = viewportWidth > 0 ? viewportWidth : screenWidth;
  const effectiveHeight = viewportHeight > 0 ? viewportHeight : screenHeight;
  const verticalLetterboxInset = getVerticalLetterboxInset(
    effectiveWidth,
    effectiveHeight,
    BACKGROUND_ASPECT_RATIO
  );
  const headerMinimumHeight = verticalLetterboxInset;
  const closedDrawerHeight = Math.max(
    getClosedDrawerHeight(effectiveHeight),
    verticalLetterboxInset
  );
  const shouldPulseHabitButtons = habits.length === 0;

  // Öffnet das Menü über den rechten Header-Button.
  function handleHeaderRightPress() {
    router.push('/menu');
  }

  // Führt direkt zur Gewohnheiten-Seite, damit der Run vorbereitet werden kann.
  const handleGoToGoodHabits = useCallback(() => {
    router.push('/good-habits');
  }, [router]);

  // Aktualisiert die Viewport-Maße für korrekte Letterbox-Berechnung.
  const handleViewportLayout = useCallback((event: LayoutChangeEvent) => {
    setViewportWidth(event.nativeEvent.layout.width);
    setViewportHeight(event.nativeEvent.layout.height);
  }, []);

  // Löscht offene Damage-Events beim Verlassen der Seite.
  useEffect(() => {
    if (!isFocused) {
      setEnemyDamageEvent(null);
      previousEnemyHPRef.current = run.enemyHP;
    }
  }, [isFocused, run.enemyHP]);

  // Erzeugt ein Damage-Event, sobald die Gegner-HP sinkt.
  useEffect(() => {
    if (!isFocused) {
      previousEnemyHPRef.current = run.enemyHP;
      return;
    }

    const previousEnemyHP = previousEnemyHPRef.current;
    const damageAmount = previousEnemyHP - run.enemyHP;

    if (damageAmount > 0) {
      damageEventIdRef.current += 1;

      setEnemyDamageEvent({
        id: damageEventIdRef.current,
        amount: Math.round(damageAmount),
      });
    }

    previousEnemyHPRef.current = run.enemyHP;
  }, [isFocused, run.enemyHP]);

  return (
    <View style={styles.viewport} onLayout={handleViewportLayout}>
      <Image source={imageSource} style={styles.image} resizeMode="contain" />
      <ScreenHeader
        minimumHeight={headerMinimumHeight}
        onPressRight={handleHeaderRightPress}
        useLeftHomeImage
        pulseLeftHomeImage={shouldPulseHabitButtons}
        rightAccessibilityLabel="Menü öffnen"
        useRightGearImage
        isRunActive={run.isActive}
        playerHP={run.playerHP}
        enemyHP={run.enemyHP}
        maxHP={maxHP}
        runDayNumber={run.dayNumber}
      />
      <PigCanvasBox
        headerMinimumHeight={headerMinimumHeight}
        drawerClosedHeight={closedDrawerHeight}
        enemyDamageEvent={enemyDamageEvent}
      />
      <BottomDrawer
        isOpen={isDrawerOpen}
        onChangeOpen={setIsDrawerOpen}
        maxOpenHeight="40%"
        closedHeight={closedDrawerHeight}
        containerHeight={effectiveHeight}
        isRunActive={run.isActive}
        isDevMode={isDevMode}
        enemyHP={run.enemyHP}
        maxHP={maxHP}
        habits={habits}
        weeklyJokers={run.weeklyJokers}
        dailyProgress={run.dailyProgress}
        onStartRun={startRun}
        onOpenGoodHabits={handleGoToGoodHabits}
        onEndDayForDevelopment={advanceRunDayForDevelopment}
        onToggleHabitForToday={toggleHabitForToday}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? ({ height: '100vh' } as never) : {}),
  },
  image: {
    width: '100%',
    height: '100%',
    ...(Platform.OS === 'web' ? ({ objectFit: 'contain' } as never) : {}),
  },
});
