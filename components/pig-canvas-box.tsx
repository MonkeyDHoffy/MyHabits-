import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HEADER_CONTENT_HEIGHT = 64;

type PigCanvasBoxProps = {
  headerMinimumHeight: number;
  drawerClosedHeight: number;
};

// Berechnet den oberen Abstand, damit die Canvas unter dem Header liegt.
function getCanvasTopOffset(topInset: number, headerMinimumHeight: number): number {
  const defaultHeaderHeight = topInset + HEADER_CONTENT_HEIGHT;
  return Math.max(defaultHeaderHeight, headerMinimumHeight);
}

// Rendert eine transparente Canvas-Box für Gegner-Sprites.
export function PigCanvasBox({ headerMinimumHeight, drawerClosedHeight }: PigCanvasBoxProps) {
  const { top: topInset } = useSafeAreaInsets();
  const topOffset = getCanvasTopOffset(topInset, headerMinimumHeight);

  return (
    <View style={[styles.canvasBox, { top: topOffset, bottom: drawerClosedHeight }]} pointerEvents="none">
      <Image
        source={require('@/assets/images/pigpics/pigone.png')}
        resizeMode="contain"
        style={styles.pigSprite}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  canvasBox: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderWidth: 2,
    borderColor: '#ff000000',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  pigSprite: {
    width: '70%',
    height: '70%',
  },
});
