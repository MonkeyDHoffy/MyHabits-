import { useState } from 'react';
import { Image, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import { BottomDrawer } from '@/components/bottom-drawer';

type BackgroundState = 'bg1' | 'bg2' | 'bg3' | 'bg4';

const backgroundImages: Record<BackgroundState, number> = {
  bg1: require('@/assets/background/bg1.png'),
  bg2: require('@/assets/background/bg2.png'),
  bg3: require('@/assets/background/bg3.png'),
  bg4: require('@/assets/background/bg4.png'),
};

// Liefert das passende Bild auf Basis des aktuellen Hintergrund-Status.
function getBackgroundImage(backgroundState: BackgroundState): number {
  return backgroundImages[backgroundState];
}

// Berechnet eine stabile Drawer-Höhe mit Mobile-Fokus.
function getClosedDrawerHeight(screenHeight: number): number {
  const preferredHeight = screenHeight * 0.14;
  const minHeight = 80;
  const maxHeight = 140;
  return Math.max(minHeight, Math.min(preferredHeight, maxHeight));
}

// Rendert die Startseite mit einem vollständig sichtbaren Hintergrundbild.
export default function HomeScreen() {
  const [backgroundState] = useState<BackgroundState>('bg4');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { height: screenHeight } = useWindowDimensions();

  const imageSource = getBackgroundImage(backgroundState);
  const closedDrawerHeight = getClosedDrawerHeight(screenHeight);

  return (
    <View style={styles.viewport}>
      <Image source={imageSource} style={styles.image} resizeMode="contain" />
      <BottomDrawer
        isOpen={isDrawerOpen}
        onChangeOpen={setIsDrawerOpen}
        maxOpenHeight="40%"
        closedHeight={closedDrawerHeight}
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
