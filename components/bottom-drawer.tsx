import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { HPBar } from '@/components/hp-bar';
import { ThemedText } from '@/components/themed-text';
import { type HabitItem, type RunDailyProgress } from '@/context/game-context';

type DrawerHeightValue = number | `${number}%`;

const MAX_OPEN_SCREEN_RATIO = 1;
const DRAWER_ANIMATION_DURATION_MS = 220;

type BottomDrawerProps = {
  isOpen: boolean;
  onChangeOpen: (nextOpenState: boolean) => void;
  maxOpenHeight: DrawerHeightValue;
  closedHeight: number;
  containerHeight?: number;
  isRunActive: boolean;
  isDevMode: boolean;
  enemyHP: number;
  maxHP: number;
  habits: HabitItem[];
  weeklyJokers: Record<string, number>;
  dailyProgress: RunDailyProgress;
  onStartRun: () => void;
  onOpenGoodHabits: () => void;
  onEndDayForDevelopment: () => void;
  onToggleHabitForToday: (habitId: string) => void;
};

type HabitRowProps = {
  habit: HabitItem;
  weeklyJokers: Record<string, number>;
  dailyProgress: RunDailyProgress;
  isRunActive: boolean;
  onToggleHabitForToday: (habitId: string) => void;
};

// Wandelt Prozentwerte wie "40%" in Pixel auf Basis der Bildschirmhöhe um.
function resolvePercentHeight(percentValue: `${number}%`, screenHeight: number): number {
  const numericValue = Number(percentValue.replace('%', ''));
  return (numericValue / 100) * screenHeight;
}

// Liefert die Zielhöhe für den geöffneten Zustand in Pixeln.
function resolveOpenHeight(maxOpenHeight: DrawerHeightValue, screenHeight: number): number {
  if (typeof maxOpenHeight === 'number') {
    return maxOpenHeight;
  }

  return resolvePercentHeight(maxOpenHeight, screenHeight);
}

// Begrenzt die maximale Drawer-Höhe auf einen sicheren Anteil des Screens.
function limitOpenHeight(openHeight: number, screenHeight: number): number {
  const maxAllowedHeight = screenHeight * MAX_OPEN_SCREEN_RATIO;
  return Math.min(openHeight, maxAllowedHeight);
}

// Berechnet die endgültige Höhe für den geöffneten Drawer.
function getFinalOpenHeight(maxOpenHeight: DrawerHeightValue, screenHeight: number): number {
  const resolvedOpenHeight = resolveOpenHeight(maxOpenHeight, screenHeight);
  return limitOpenHeight(resolvedOpenHeight, screenHeight);
}

// Liefert die Zielhöhe je nach Drawer-Zustand.
function getTargetHeight(isOpen: boolean, openHeight: number, closedHeight: number): number {
  return isOpen ? openHeight : closedHeight;
}

// Startet die Höhenanimation auf den Zielwert.
function animateHeight(animatedHeight: Animated.Value, targetHeight: number): void {
  Animated.timing(animatedHeight, {
    toValue: targetHeight,
    duration: DRAWER_ANIMATION_DURATION_MS,
    useNativeDriver: false,
  }).start();
}

// Berechnet die geöffnete Drawer-Höhe mit Memoisierung.
function useDrawerOpenHeight(maxOpenHeight: DrawerHeightValue, screenHeight: number): number {
  return useMemo(() => {
    return getFinalOpenHeight(maxOpenHeight, screenHeight);
  }, [maxOpenHeight, screenHeight]);
}

// Verwaltet die animierte Drawer-Höhe basierend auf offen/geschlossen.
function useAnimatedDrawerHeight(isOpen: boolean, openHeight: number, closedHeight: number) {
  const animatedHeight = useRef(new Animated.Value(closedHeight)).current;

  useEffect(() => {
    const targetHeight = getTargetHeight(isOpen, openHeight, closedHeight);
    animateHeight(animatedHeight, targetHeight);
  }, [animatedHeight, closedHeight, isOpen, openHeight]);

  return animatedHeight;
}

// Liefert eine stabile Callback-Funktion zum Umschalten des Drawers.
function useToggleDrawer(isOpen: boolean, onChangeOpen: (nextOpenState: boolean) => void) {
  return useCallback(() => {
    onChangeOpen(!isOpen);
  }, [isOpen, onChangeOpen]);
}

// Prüft, ob eine Gewohnheit heute als erledigt markiert wurde.
function isHabitCompletedToday(progress: RunDailyProgress, habitId: string): boolean {
  return progress[habitId]?.completedToday ?? false;
}

// Rendert eine Zeile für eine Gewohnheit mit Toggle und Streak-Werten.
function HabitRow({
  habit,
  weeklyJokers,
  dailyProgress,
  isRunActive,
  onToggleHabitForToday,
}: HabitRowProps) {
  const isCompleted = isHabitCompletedToday(dailyProgress, habit.id);
  const jokerCount = weeklyJokers[habit.id] ?? 0;
  const handleToggleHabit = useCallback(() => {
    onToggleHabitForToday(habit.id);
  }, [habit.id, onToggleHabitForToday]);

  return (
    <View style={styles.habitRow}>
      <Pressable
        style={styles.habitMain}
        onPress={handleToggleHabit}
        disabled={!isRunActive}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isCompleted }}
        accessibilityLabel={`${habit.title} heute erledigt`}>
        <View style={[styles.checkboxBase, isCompleted ? styles.checkboxActive : styles.checkboxInactive]}>
          <ThemedText style={styles.checkboxText}>{isCompleted ? '✓' : ''}</ThemedText>
        </View>

        <View style={styles.habitTextArea}>
          <ThemedText style={styles.habitTitle} lightColor="#F6F9EF" darkColor="#F6F9EF">
            {habit.title}
          </ThemedText>
          <ThemedText style={styles.habitMeta} lightColor="#E8CF74" darkColor="#E8CF74">
            {`Joker: ${jokerCount}`}
          </ThemedText>
        </View>
      </Pressable>

      <ThemedText style={styles.streakText} lightColor="#DDE9C9" darkColor="#DDE9C9">
        {`+${habit.positiveStreak} / -${habit.negativeStreak}`}
      </ThemedText>
    </View>
  );
}

// Rendert einen wiederverwendbaren Drawer am unteren Rand des Screens.
export function BottomDrawer({
  isOpen,
  onChangeOpen,
  maxOpenHeight,
  closedHeight,
  containerHeight,
  isRunActive,
  isDevMode,
  enemyHP,
  maxHP,
  habits,
  weeklyJokers,
  dailyProgress,
  onStartRun,
  onOpenGoodHabits,
  onEndDayForDevelopment,
  onToggleHabitForToday,
}: BottomDrawerProps) {
  const { height: screenHeight } = useWindowDimensions();
  const referenceHeight = containerHeight ?? screenHeight;
  const openHeight = useDrawerOpenHeight(maxOpenHeight, referenceHeight);
  const animatedHeight = useAnimatedDrawerHeight(isOpen, openHeight, closedHeight);
  const handleToggleDrawer = useToggleDrawer(isOpen, onChangeOpen);
  const createHabitPulseScale = useRef(new Animated.Value(1)).current;
  const startRunPulseScale = useRef(new Animated.Value(1)).current;
  const drawerHandlePulseScale = useRef(new Animated.Value(1)).current;
  const shouldPulseCreateHabitButton = isOpen && habits.length === 0;
  const shouldPulseStartRunButton = isOpen && !isRunActive && habits.length > 0;
  const shouldPulseDrawerHandle = !isOpen;

  // Lässt den Gewohnheiten-Button sanft pulsieren, solange keine Habits existieren.
  useEffect(() => {
    if (!shouldPulseCreateHabitButton) {
      createHabitPulseScale.stopAnimation();
      createHabitPulseScale.setValue(1);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(createHabitPulseScale, {
          toValue: 1.12,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(createHabitPulseScale, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
      createHabitPulseScale.stopAnimation();
      createHabitPulseScale.setValue(1);
    };
  }, [createHabitPulseScale, shouldPulseCreateHabitButton]);

  // Lässt den Start-Button sanft pulsieren, solange ein Run gestartet werden kann.
  useEffect(() => {
    if (!shouldPulseStartRunButton) {
      startRunPulseScale.stopAnimation();
      startRunPulseScale.setValue(1);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(startRunPulseScale, {
          toValue: 1.1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(startRunPulseScale, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
      startRunPulseScale.stopAnimation();
      startRunPulseScale.setValue(1);
    };
  }, [shouldPulseStartRunButton, startRunPulseScale]);

  // Lässt den Pyramid-Handle pulsieren, solange der Drawer geschlossen ist.
  useEffect(() => {
    if (!shouldPulseDrawerHandle) {
      drawerHandlePulseScale.stopAnimation();
      drawerHandlePulseScale.setValue(1);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(drawerHandlePulseScale, {
          toValue: 1.1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(drawerHandlePulseScale, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
      drawerHandlePulseScale.stopAnimation();
      drawerHandlePulseScale.setValue(1);
    };
  }, [drawerHandlePulseScale, shouldPulseDrawerHandle]);

  // Startet einen neuen Run aus dem Drawer.
  function handleStartRunPress() {
    onStartRun();
  }

  // Rendert eine einzelne Habit-Zeile in der Scroll-Liste.
  const renderHabitRow = useCallback(
    (habit: HabitItem) => {
      return (
        <HabitRow
          key={habit.id}
          habit={habit}
          weeklyJokers={weeklyJokers}
          dailyProgress={dailyProgress}
          isRunActive={isRunActive}
          onToggleHabitForToday={onToggleHabitForToday}
        />
      );
    },
    [dailyProgress, isRunActive, onToggleHabitForToday, weeklyJokers]
  );

  return (
    <Animated.View style={[styles.container, { height: animatedHeight }]}>
      <View style={styles.playerHPFloating} pointerEvents="none">
        <HPBar
          label="Schweinehund"
          current={enemyHP}
          max={maxHP}
          fillColor="#FF6B6B"
          variant="enemy"
          showValue={isRunActive}
          flatBottomCorners
        />
      </View>

      <Pressable style={styles.toggleArea} onPress={handleToggleDrawer} accessibilityRole="button">
        <Animated.View
          style={{
            transform: [{ scale: drawerHandlePulseScale }, { rotate: isOpen ? '180deg' : '0deg' }],
          }}>
          <Image
            source={require('@/assets/images/buttons/pyramid.png')}
            style={styles.togglePyramid}
            resizeMode="contain"
          />
        </Animated.View>
      </Pressable>

      <ImageBackground
        source={require('@/assets/background/wood.png')}
        style={styles.background}
        imageStyle={styles.backgroundImage}
        resizeMode="cover">
        <View style={styles.contentArea}>
          {isOpen ? (
            <View style={styles.expandedContent}>
              {!isRunActive && habits.length > 0 ? (
                <Animated.View
                  style={[
                    styles.startRunPulseWrapper,
                    { transform: [{ scale: startRunPulseScale }] },
                  ]}
                >
                  <Pressable
                    style={styles.startRunImageButton}
                    onPress={handleStartRunPress}
                    accessibilityRole="button"
                    accessibilityLabel="Run starten">
                    <Image
                      source={require('@/assets/images/buttons/start.png')}
                      style={styles.startRunImage}
                      resizeMode="contain"
                    />
                  </Pressable>
                </Animated.View>
              ) : null}

              {isRunActive && isDevMode ? (
                <Pressable
                  style={styles.endDayButton}
                  onPress={onEndDayForDevelopment}
                  accessibilityRole="button"
                  accessibilityLabel="Tagesabschluss für Entwicklung ausführen">
                  <ThemedText style={styles.endDayText}>Tagesabschluss (Dev)</ThemedText>
                </Pressable>
              ) : null}

              <ScrollView style={styles.habitList} contentContainerStyle={styles.habitListContent}>
                {habits.map(renderHabitRow)}

                {habits.length === 0 ? (
                  <View style={styles.emptyStateArea}>
                    <Animated.View
                      style={[
                        styles.createHabitPulseWrapper,
                        { transform: [{ scale: createHabitPulseScale }] },
                      ]}
                    >
                      <Pressable
                        style={styles.createHabitImageButton}
                        onPress={onOpenGoodHabits}
                        accessibilityRole="button"
                        accessibilityLabel="Gewohnheiten erstellen"
                      >
                        <Image
                          source={require('@/assets/images/buttons/0d6c27d6-40e7-4ad5-9111-906ea77465fa.png')}
                          style={styles.createHabitImage}
                          resizeMode="contain"
                        />
                      </Pressable>
                    </Animated.View>
                  </View>
                ) : null}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    overflow: 'visible',
  },
  playerHPFloating: {
    position: 'absolute',
    top: -18,
    left: 0,
    right: 0,
    zIndex: 15,
  },
  background: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  backgroundImage: {
    resizeMode: 'cover',
  },
  toggleArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    elevation: 40,
  },
  togglePyramid: {
    width: 104,
    height: 40,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 36,
    paddingTop: 44,
    paddingBottom: 10,
  },
  expandedContent: {
    flex: 1,
    marginTop: 10,
  },
  startRunPulseWrapper: {
    marginBottom: 10,
    alignItems: 'center',
  },
  startRunImageButton: {
    width: 168,
    height: 168,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startRunImage: {
    width: 168,
    height: 168,
  },
  endDayButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  endDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  habitList: {
    flex: 1,
  },
  habitListContent: {
    paddingBottom: 10,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(18, 57, 39, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(227, 194, 94, 0.45)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(227, 194, 94, 0.35)',
  },
  habitMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  checkboxBase: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
  },
  checkboxActive: {
    backgroundColor: '#7FD57D',
    borderColor: '#AEDD86',
  },
  checkboxInactive: {
    backgroundColor: 'rgba(15, 45, 31, 0.88)',
    borderColor: 'rgba(227, 194, 94, 0.72)',
  },
  checkboxText: {
    color: '#143524',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '800',
  },
  habitTextArea: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  habitMeta: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  streakText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  emptyStateArea: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  createHabitPulseWrapper: {
    marginTop: 8,
  },
  createHabitImageButton: {
    width: 84,
    height: 84,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createHabitImage: {
    width: 84,
    height: 84,
  },
});