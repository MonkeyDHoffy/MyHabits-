import { useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    ImageBackground,
    Pressable,
    StyleSheet,
    useWindowDimensions,
} from 'react-native';

type DrawerHeightValue = number | `${number}%`;

type BottomDrawerProps = {
  isOpen: boolean;
  onChangeOpen: (nextOpenState: boolean) => void;
  maxOpenHeight: DrawerHeightValue;
  closedHeight: number;
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

// Rendert einen wiederverwendbaren Drawer am unteren Rand des Screens.
export function BottomDrawer({
  isOpen,
  onChangeOpen,
  maxOpenHeight,
  closedHeight,
}: BottomDrawerProps) {
  const { height: screenHeight } = useWindowDimensions();
  const animatedHeight = useRef(new Animated.Value(closedHeight)).current;

  const openHeight = useMemo(() => {
    const desiredHeight = resolveOpenHeight(maxOpenHeight, screenHeight);
    const maximumHeight = screenHeight * 0.9;
    return Math.min(desiredHeight, maximumHeight);
  }, [maxOpenHeight, screenHeight]);

  useEffect(() => {
    const targetHeight = isOpen ? openHeight : closedHeight;

    Animated.timing(animatedHeight, {
      toValue: targetHeight,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [animatedHeight, closedHeight, isOpen, openHeight]);

  // Wechselt zwischen geöffnetem und geschlossenem Zustand.
  function handleToggleDrawer() {
    onChangeOpen(!isOpen);
  }

  return (
    <Animated.View style={[styles.container, { height: animatedHeight }]}>
      <ImageBackground
        source={require('@/assets/background/wood.png')}
        style={styles.background}
        imageStyle={styles.backgroundImage}
        resizeMode="cover">
        <Pressable
          style={styles.touchArea}
          onPress={handleToggleDrawer}
          accessibilityRole="button"
        />
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
  touchArea: {
    flex: 1,
  },
});