import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, type ReactNode } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

import { APP_FRAME_CONFIG } from '@/constants/app-frame';

type AppFrameProps = {
  children: ReactNode;
};

const GRADIENT_START = { x: 0, y: 0 } as const;
const GRADIENT_END = { x: 0, y: 100 } as const;

function createDesktopHeightStyles(desktopContentHeight: number) {
  return StyleSheet.create({
    desktopAppContainerHeight: {
      height: desktopContentHeight,
    },
  });
}

export function AppFrame({ children }: AppFrameProps) {
  const { width, height } = useWindowDimensions();

  // Desktop-Frame nur im Web und erst ab dem definierten Breakpoint aktivieren.
  const isDesktopWeb =
    Platform.OS === 'web' && width >= APP_FRAME_CONFIG.desktopBreakpoint;

  // Auf Mobile bleibt alles bei Vollbreite/Vollhöhe ohne zusätzlichen Rahmen.
  if (!isDesktopWeb) {
    return <View style={styles.mobileContainer}>{children}</View>;
  }

  // Zielhöhe entspricht dem Handy-Seitenverhältnis der Referenzgrafiken.
  const targetDesktopHeight =
    APP_FRAME_CONFIG.desktopContentWidth * APP_FRAME_CONFIG.referencePhoneAspectRatio;

  // Sicherheit: Frame darf nie höher als der verfügbare Viewport minus Insets werden.
  const maxDesktopHeight = Math.max(
    320,
    height - APP_FRAME_CONFIG.desktopVerticalInset * 2
  );
  const desktopContentHeight = Math.min(targetDesktopHeight, maxDesktopHeight);
  const dynamicStyles = useMemo(
    () => createDesktopHeightStyles(desktopContentHeight),
    [desktopContentHeight]
  );

  return (
    <LinearGradient
      colors={APP_FRAME_CONFIG.desktopBackgroundGradientColors}
      start={GRADIENT_START}
      end={GRADIENT_END}
      style={styles.desktopBackground}>
      <View
        style={[
          styles.desktopAppContainer,
          styles.desktopAppContainerFixedWidth,
          dynamicStyles.desktopAppContainerHeight,
        ]}>
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
  },
  desktopBackground: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: APP_FRAME_CONFIG.desktopVerticalInset,
  },
  desktopAppContainer: {
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  desktopAppContainerFixedWidth: {
    maxWidth: APP_FRAME_CONFIG.desktopContentWidth,
  },
});
