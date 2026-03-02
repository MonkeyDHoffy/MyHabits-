import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HPBar } from '@/components/hp-bar';
import { ThemedText } from '@/components/themed-text';

const HEADER_CONTENT_HEIGHT = 64;

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
    <>
      <View style={[styles.headerContainer, { height: headerHeight, paddingTop: top }]}> 
        <Image
          source={require('@/assets/background/wood.png')}
          resizeMode="cover"
          style={styles.headerBackgroundImage}
        />

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
              <ThemedText style={styles.dayCounter} lightColor="#FFFFFF" darkColor="#FFFFFF">
                {`Tag ${runDayNumber}`}
              </ThemedText>
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
      </View>

      {isRunActive ? (
        <View style={[styles.enemyHPBarArea, { top: headerHeight }]}>
          <HPBar
            label="Schweinehund"
            current={enemyHP}
            max={maxHP}
            fillColor="#FF6B6B"
            variant="enemy"
          />
        </View>
      ) : null}
    </>
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
  enemyHPBarArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 19,
  },
  headerBackgroundImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
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
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
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
