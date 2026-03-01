import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export type InfoboxAction = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

type InfoboxProps = {
  visible: boolean;
  title: string;
  message?: string;
  actions: InfoboxAction[];
  onRequestClose?: () => void;
  children?: ReactNode;
};

const ANIMATION_DURATION_MS = 180;

// Liefert die Button-Styles abhängig vom Varianten-Typ.
function getActionStyles(variant: InfoboxAction['variant']) {
  if (variant === 'secondary') {
    return {
      buttonStyle: styles.secondaryButton,
      textStyle: styles.secondaryButtonText,
    };
  }

  return {
    buttonStyle: styles.primaryButton,
    textStyle: styles.primaryButtonText,
  };
}

// Rendert eine einblendbare Infobox mit frei konfigurierbaren Inhalten.
export function Infobox({
  visible,
  title,
  message,
  actions,
  onRequestClose,
  children,
}: InfoboxProps) {
  const animatedTranslateY = useRef(new Animated.Value(24)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedTranslateY, {
        toValue: visible ? 0 : 24,
        duration: ANIMATION_DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(animatedOpacity, {
        toValue: visible ? 1 : 0,
        duration: ANIMATION_DURATION_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animatedOpacity, animatedTranslateY, visible]);

  const containerStyle = useMemo(() => {
    return {
      opacity: animatedOpacity,
      transform: [{ translateY: animatedTranslateY }],
    };
  }, [animatedOpacity, animatedTranslateY]);

  return (
    <Animated.View
      style={[styles.overlay, containerStyle]}
      pointerEvents={visible ? 'auto' : 'none'}>
      <Pressable style={styles.backdrop} onPress={onRequestClose} />

      <View style={styles.box}>
        <ThemedText type="defaultSemiBold" style={styles.title} lightColor="#FFFFFF" darkColor="#FFFFFF">
          {title}
        </ThemedText>

        {message ? (
          <ThemedText style={styles.message} lightColor="#F2F2F2" darkColor="#F2F2F2">
            {message}
          </ThemedText>
        ) : null}

        {children}

        <View style={styles.actionsRow}>
          {actions.map((action) => {
            const actionStyles = getActionStyles(action.variant);

            return (
              <Pressable
                key={action.label}
                style={[styles.actionButton, actionStyles.buttonStyle]}
                onPress={action.onPress}
                accessibilityRole="button"
                accessibilityLabel={action.label}>
                <ThemedText style={actionStyles.textStyle}>{action.label}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  box: {
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(11, 33, 24, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  title: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  message: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  actionsRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  primaryButtonText: {
    color: '#19352A',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
});
