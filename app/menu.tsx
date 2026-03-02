import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { useGame } from '@/context/game-context';

const MENU_GRADIENT_COLORS = ['#091d16', '#1a3e2c', '#4a1b20', '#a8862e'] as const;
const MENU_GRADIENT_START = { x: 0, y: 0 } as const;
const MENU_GRADIENT_END = { x: 1, y: 1 } as const;

// Rendert die Menü-Seite mit zentralen Unterpunkten.
export default function MenuScreen() {
  const router = useRouter();
  const { run, maxHP, startRun, endRun, isDevMode, toggleDevMode } = useGame();

  // Führt zur vorherigen Seite zurück.
  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  // Zeigt den Platzhalter für Statistik.
  const handleOpenStatistics = useCallback(() => {
    Alert.alert('Statistik', 'Statistik kommt als nächstes.');
  }, []);

  // Zeigt den Platzhalter für Einstellungen.
  const handleOpenSettings = useCallback(() => {
    Alert.alert('Einstellungen', 'Einstellungen kommen als nächstes.');
  }, []);

  // Startet einen neuen Run und geht zurück.
  const handleStartRun = useCallback(() => {
    if (run.isActive) {
      Alert.alert('Run starten', 'Es läuft bereits ein aktiver Run.');
      return;
    }

    startRun();
    router.back();
  }, [router, run.isActive, startRun]);

  // Beendet den aktiven Run und geht zurück.
  const handleEndRun = useCallback(() => {
    if (!run.isActive) {
      Alert.alert('Run beenden', 'Aktuell läuft kein Run.');
      return;
    }

    endRun();
    router.back();
  }, [endRun, router, run.isActive]);

  // Schaltet den Dev-Modus für Debug-Funktionen um.
  const handleToggleDevMode = useCallback(() => {
    toggleDevMode();
  }, [toggleDevMode]);

  return (
    <LinearGradient
      colors={MENU_GRADIENT_COLORS}
      start={MENU_GRADIENT_START}
      end={MENU_GRADIENT_END}
      style={styles.container}>
      <ScreenHeader
        onPressLeft={handleGoBack}
        leftAccessibilityLabel="Zurück"
        showRightButton={false}
        useLeftBackImage
        isRunActive={run.isActive}
        playerHP={run.playerHP}
        maxHP={maxHP}
      />

      <View style={styles.contentArea}>
        <ThemedText type="title" lightColor="#E8CF74" darkColor="#E8CF74" style={styles.menuTitle}>
          Menü
        </ThemedText>

        <Pressable style={styles.menuButton} onPress={handleOpenStatistics} accessibilityRole="button">
          <ThemedText style={styles.menuButtonText}>Statistik</ThemedText>
        </Pressable>

        <Pressable style={styles.menuButton} onPress={handleOpenSettings} accessibilityRole="button">
          <ThemedText style={styles.menuButtonText}>Einstellungen</ThemedText>
        </Pressable>

        <Pressable style={styles.menuButton} onPress={handleStartRun} accessibilityRole="button">
          <ThemedText style={styles.menuButtonText}>Run starten</ThemedText>
        </Pressable>

        <Pressable style={styles.menuButton} onPress={handleEndRun} accessibilityRole="button">
          <ThemedText style={styles.menuButtonText}>Run beenden</ThemedText>
        </Pressable>

        <Pressable style={styles.menuButton} onPress={handleToggleDevMode} accessibilityRole="button">
          <ThemedText style={styles.menuButtonText}>
            {`Dev Modus: ${isDevMode ? 'AN' : 'AUS'}`}
          </ThemedText>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
    paddingTop: 132,
    paddingHorizontal: 16,
  },
  menuTitle: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  menuButton: {
    marginTop: 12,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 40, 29, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(216, 183, 90, 0.58)',
  },
  menuButtonText: {
    color: '#E8CF74',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
});
