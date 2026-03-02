import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Image, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HPBar } from '@/components/hp-bar';
import { ThemedText } from '@/components/themed-text';

const HEADER_CONTENT_HEIGHT = 64;
const HEADER_HP_BAR_HEIGHT = 28;
const HEADER_BOTTOM_RADIUS = 9;

type ScreenHeaderProps = {
  onPressLeft?: () => void;
  onPressRight?: () => void;
  leftAccessibilityLabel?: string;
  rightAccessibilityLabel?: string;
  showRightButton?: boolean;
  useLeftBackImage?: boolean;
  useLeftHomeImage?: boolean;
  pulseLeftHomeImage?: boolean;
  useRightGearImage?: boolean;
  minimumHeight?: number;
  isRunActive?: boolean;
  playerHP?: number;
  enemyHP?: number;
  maxHP?: number;
  runDayNumber?: number;
};

// Rendert den oberen Header mit Holz-Hintergrund und konfigurierbaren Aktionen.
export function ScreenHeader({
  onPressLeft,
  onPressRight,
  leftAccessibilityLabel = 'Gute Gewohnheiten öffnen',
  rightAccessibilityLabel = 'Header Aktion',
  showRightButton = true,
  useLeftBackImage = false,
  useLeftHomeImage = false,
  pulseLeftHomeImage = false,
  useRightGearImage = false,
  minimumHeight = 0,
  isRunActive = false,
  playerHP = 0,
  enemyHP = 0,
  maxHP = 100,
  runDayNumber = 0,
}: ScreenHeaderProps) {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const headerHeight = useMemo(() => {
    const baseHeaderHeight = top + HEADER_CONTENT_HEIGHT;
    return Math.max(baseHeaderHeight, minimumHeight);
  }, [minimumHeight, top]);
  const leftPulseScale = useRef(new Animated.Value(1)).current;

  // Lässt den linken Home-Button pulsieren, solange der Zustand aktiv ist.
  useEffect(() => {
    if (!useLeftHomeImage || !pulseLeftHomeImage) {
      leftPulseScale.stopAnimation();
      leftPulseScale.setValue(1);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(leftPulseScale, {
          toValue: 1.12,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(leftPulseScale, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
      leftPulseScale.stopAnimation();
      leftPulseScale.setValue(1);
    };
  }, [leftPulseScale, pulseLeftHomeImage, useLeftHomeImage]);

  // Öffnet die Seite für gute Gewohnheiten/Vorsätze.
  const handleGoToGoodHabits = useCallback(() => {
    router.push('/good-habits');
  }, [router]);

  // Verwendet übergebene Linke-Aktion oder den Standard zur Good-Habits-Seite.
  const handleLeftButtonPress = onPressLeft ?? handleGoToGoodHabits;

  return (
    <View style={[styles.headerStack, { height: headerHeight + HEADER_HP_BAR_HEIGHT }]}> 
      <ImageBackground
        source={require('@/assets/background/wood.png')}
        resizeMode="cover"
        style={[styles.headerTopSection, { height: headerHeight, paddingTop: top }]}
        imageStyle={styles.headerTopBackgroundImage}
      >
        <View style={styles.headerContent}>
          <Animated.View style={useLeftHomeImage ? { transform: [{ scale: leftPulseScale }] } : undefined}>
            <Pressable
              style={
                useLeftBackImage
                  ? styles.backImageButton
                  : useLeftHomeImage
                    ? styles.leftHomeImageButton
                    : styles.headerButton
              }
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
              ) : useLeftHomeImage ? (
                <Image
                  source={require('@/assets/images/buttons/0d6c27d6-40e7-4ad5-9111-906ea77465fa.png')}
                  style={styles.leftHomeImage}
                  resizeMode="contain"
                />
              ) : null}
            </Pressable>
          </Animated.View>

          <View style={styles.centerArea}>
            {isRunActive ? (
              <View style={styles.dayCounterBadge}>
                <ThemedText style={styles.dayCounter} lightColor="#F3D98A" darkColor="#F3D98A">
                  {`TAG ${runDayNumber}`}
                </ThemedText>
              </View>
            ) : null}
          </View>

          {showRightButton ? (
            <Pressable
              style={useRightGearImage ? styles.rightImageButton : styles.headerButton}
              onPress={onPressRight}
              accessibilityRole="button"
              accessibilityLabel={rightAccessibilityLabel}
            >
              {useRightGearImage ? (
                <Image
                  source={require('@/assets/images/buttons/gear.png')}
                  style={styles.rightGearImage}
                  resizeMode="contain"
                />
              ) : null}
            </Pressable>
          ) : null}
        </View>
      </ImageBackground>

      <View style={styles.enemyHPBarArea}>
        <HPBar
          label="Spieler"
          current={playerHP}
          max={maxHP}
          fillColor="#57E389"
          variant="player"
          showValue={isRunActive}
          flatTopCorners
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerStack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  enemyHPBarArea: {
    width: '100%',
  },
  headerTopSection: {
    width: '100%',
    borderBottomLeftRadius: HEADER_BOTTOM_RADIUS,
    borderBottomRightRadius: HEADER_BOTTOM_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#2f2a23',
  },
  headerTopBackgroundImage: {
    borderBottomLeftRadius: HEADER_BOTTOM_RADIUS,
    borderBottomRightRadius: HEADER_BOTTOM_RADIUS,
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
  dayCounterBadge: {
    alignSelf: 'center',
    minWidth: 118,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8B75A',
    backgroundColor: 'rgb(24, 58, 41)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCounter: {
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(90, 18, 28, 0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
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
  leftHomeImageButton: {
    width: 84,
    height: 84,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightImageButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonImage: {
    width: 74,
    height: 74,
  },
  leftHomeImage: {
    width: 84,
    height: 84,
  },
  rightGearImage: {
    width: 56,
    height: 56,
  },
});
