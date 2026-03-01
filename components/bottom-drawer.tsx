import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
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
  playerHP: number;
  maxHP: number;
  habits: HabitItem[];
  weeklyJokers: Record<string, number>;
  dailyProgress: RunDailyProgress;
  onStartRun: () => void;
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

// Liefert den Lesetext für den Habit-Typ.
function getHabitTypeLabel(type: HabitItem['type']): string {
  return type === 'good' ? 'gut' : 'schlecht';
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
          <ThemedText style={styles.habitTitle} lightColor="#FFFFFF" darkColor="#FFFFFF">
            {habit.title}
          </ThemedText>
          <ThemedText style={styles.habitMeta} lightColor="#ECECEC" darkColor="#ECECEC">
            {`${habit.targetPerWeek}x/Woche · ${getHabitTypeLabel(habit.type)}`}
          </ThemedText>
          <ThemedText style={styles.habitMeta} lightColor="#E8E8E8" darkColor="#E8E8E8">
            {`Joker: ${jokerCount}`}
          </ThemedText>
        </View>
      </Pressable>

      <ThemedText style={styles.streakText} lightColor="#F0F0F0" darkColor="#F0F0F0">
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
  playerHP,
  maxHP,
  habits,
  weeklyJokers,
  dailyProgress,
  onStartRun,
  onEndDayForDevelopment,
  onToggleHabitForToday,
}: BottomDrawerProps) {
  const { height: screenHeight } = useWindowDimensions();
  const referenceHeight = containerHeight ?? screenHeight;
  const openHeight = useDrawerOpenHeight(maxOpenHeight, referenceHeight);
  const animatedHeight = useAnimatedDrawerHeight(isOpen, openHeight, closedHeight);
  const handleToggleDrawer = useToggleDrawer(isOpen, onChangeOpen);

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
      <ImageBackground
        source={require('@/assets/background/wood.png')}
        style={styles.background}
        imageStyle={styles.backgroundImage}
        resizeMode="cover">
        <Pressable style={styles.toggleArea} onPress={handleToggleDrawer} accessibilityRole="button">
          <View style={styles.toggleIndicator} />
        </Pressable>

        <View style={styles.contentArea}>
          <HPBar label="Spieler" current={playerHP} max={maxHP} fillColor="#57E389" />

          {isOpen ? (
            <View style={styles.expandedContent}>
              {!isRunActive ? (
                <Pressable
                  style={[styles.startRunButton, styles.startRunButtonStart]}
                  onPress={handleStartRunPress}
                  accessibilityRole="button"
                  accessibilityLabel="Run starten">
                  <ThemedText style={[styles.startRunText, styles.startRunTextStart]}>
                    Run starten
                  </ThemedText>
                </Pressable>
              ) : null}

              {isRunActive ? (
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
                  <ThemedText style={styles.emptyText} lightColor="#FFFFFF" darkColor="#FFFFFF">
                    Lege zuerst Gewohnheiten an.
                  </ThemedText>
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
    overflow: 'hidden',
  },
  background: {
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    resizeMode: 'cover',
  },
  toggleArea: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIndicator: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 36,
    paddingBottom: 10,
  },
  expandedContent: {
    flex: 1,
    marginTop: 10,
  },
  startRunButton: {
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  startRunButtonStart: {
    backgroundColor: '#FFFFFF',
  },
  startRunText: {
    fontWeight: '700',
  },
  startRunTextStart: {
    color: '#1E3B2F',
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.16)',
  },
  habitMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  checkboxBase: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
  },
  checkboxActive: {
    backgroundColor: '#57E389',
    borderColor: '#57E389',
  },
  checkboxInactive: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.45)',
  },
  checkboxText: {
    color: '#153428',
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '800',
  },
  habitTextArea: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  habitMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
  streakText: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
  },
});