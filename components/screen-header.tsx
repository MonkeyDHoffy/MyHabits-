import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HPBar } from '@/components/hp-bar';
import { ThemedText } from '@/components/themed-text';

const HEADER_CONTENT_HEIGHT = 64;
const WOOD_IMAGE_ASPECT_RATIO = 1700 / 67;

type ScreenHeaderProps = {
  onPressLeft?: () => void;
  onPressRight?: () => void;
  leftAccessibilityLabel?: string;
  rightAccessibilityLabel?: string;
  showRightButton?: boolean;
  useLeftBackImage?: boolean;
  minimumHeight?: number;
  isRunActive?: boolean;
  enemyHP?: number;
  maxHP?: number;
  runDayNumber?: number;
};

// Erzeugt dynamische Styles für den oberen Safe-Area-Bereich.
function createInsetStyles(topInset: number, minimumHeight: number) {
  const baseHeaderHeight = topInset + HEADER_CONTENT_HEIGHT;
  const headerHeight = Math.max(baseHeaderHeight, minimumHeight);

  return StyleSheet.create({
    headerInset: {
      height: headerHeight,
      paddingTop: topInset,
    },
  });
}

// Platzhalter für die rechte Header-Aktion.
function handleRightButtonPress() {
  return;
}

// Rendert den oberen Header mit Holz-Hintergrund und konfigurierbaren Aktionen.
export function ScreenHeader({
  onPressLeft,
  onPressRight,
  leftAccessibilityLabel = 'Gute Gewohnheiten öffnen',
  rightAccessibilityLabel = 'Header Aktion',
  showRightButton = true,
  useLeftBackImage = false,
  minimumHeight = 0,
  isRunActive = false,
  enemyHP = 0,
  maxHP = 100,
  runDayNumber = 0,
}: ScreenHeaderProps) {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const insetStyles = useMemo(() => createInsetStyles(top, minimumHeight), [minimumHeight, top]);

  // Öffnet die Seite für gute Gewohnheiten/Vorsätze.
  const handleGoToGoodHabits = useCallback(() => {
    router.push('/good-habits');
  }, [router]);

  // Verwendet übergebene Linke-Aktion oder den Standard zur Good-Habits-Seite.
  const handleLeftButtonPress = onPressLeft ?? handleGoToGoodHabits;

  // Verwendet übergebene Rechte-Aktion oder den Platzhalter.
  const handleRightButtonAction = onPressRight ?? handleRightButtonPress;

  return (
    <View style={[styles.headerContainer, insetStyles.headerInset]}>
      <Image
        source={require('@/assets/background/wood.png')}
        resizeMode="cover"
        style={styles.headerBackgroundImage}
      />

      <View style={styles.headerContent}>
        <Pressable
          style={useLeftBackImage ? styles.backImageButton : styles.headerButton}
          onPress={handleLeftButtonPress}
          accessibilityRole="button"
          accessibilityLabel={leftAccessibilityLabel}
        >
          {useLeftBackImage ? (
            <Image
              source={require('@/assets/images/buttons/back.png')}
              style={styles.backButtonImage}
              resizeMode="contain"
            />
          ) : null}
        </Pressable>

        <View style={styles.centerArea}>
          {isRunActive ? (
            <View>
              <HPBar label="Schweinehund" current={enemyHP} max={maxHP} fillColor="#FF6B6B" />
              <ThemedText style={styles.dayCounter} lightColor="#FFFFFF" darkColor="#FFFFFF">
                {`Tag ${runDayNumber}`}
              </ThemedText>
            </View>
          ) : null}
        </View>

        {showRightButton ? (
          <Pressable
            style={styles.headerButton}
            onPress={handleRightButtonAction}
            accessibilityRole="button"
            accessibilityLabel={rightAccessibilityLabel}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    overflow: 'hidden',
    backgroundColor: '#2f2a23',
  },
  headerBackgroundImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    aspectRatio: WOOD_IMAGE_ASPECT_RATIO,
  },
  headerContent: {
    height: HEADER_CONTENT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  centerArea: {
    flex: 1,
    marginHorizontal: 12,
  },
  dayCounter: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    fontWeight: '700',
  },
  headerButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
  },
  backImageButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonImage: {
    width: 74,
    height: 74,
  },
});
