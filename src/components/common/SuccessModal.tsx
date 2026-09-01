import React, { useEffect, useRef } from 'react';
import { Modal, Animated, Easing, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface SuccessModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  amount?: string | number;
  amountPrefix?: '+' | '-' | '';
  type?: 'DEPOSIT' | 'EXPENSE' | 'SETTLE' | 'DEFAULT';
  autoDismissMs?: number;
  onDismiss: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  title,
  subtitle,
  amount,
  amountPrefix = '',
  type = 'DEFAULT',
  autoDismissMs = 2500,
  onDismiss,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const checkScaleAnim = useRef(new Animated.Value(0)).current;
  const rippleScaleAnim = useRef(new Animated.Value(0.8)).current;
  const rippleOpacityAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (visible) {
      // Reset animations
      scaleAnim.setValue(0.4);
      opacityAnim.setValue(0);
      checkScaleAnim.setValue(0);
      rippleScaleAnim.setValue(0.8);
      rippleOpacityAnim.setValue(0.7);

      // Card Pop Animation
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();

      // Checkmark Scale Bounce
      Animated.sequence([
        Animated.delay(100),
        Animated.spring(checkScaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();

      // Ripple Wave Pulse
      Animated.loop(
        Animated.parallel([
          Animated.timing(rippleScaleAnim, {
            toValue: 1.6,
            duration: 1200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacityAnim, {
            toValue: 0,
            duration: 1200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Auto Dismiss Timer
      if (autoDismissMs > 0) {
        timer = setTimeout(() => {
          handleClose();
        }, autoDismissMs);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const isDeposit = type === 'DEPOSIT';
  const isExpense = type === 'EXPENSE';
  const isSettle = type === 'SETTLE';

  // Match App Theme: Premium Brand Blue / Indigo
  const iconBgHex = '#2563EB'; // Theme Blue (Matches Logo & Brand)
  const rippleBgHex = 'rgba(37, 99, 235, 0.25)';
  const badgeBgHex = '#EFF6FF';
  const badgeBorderHex = '#BFDBFE';
  const badgeTextHex = '#1D4ED8';
  const buttonBgHex = '#2563EB';

  const formattedAmount =
    amount !== undefined && amount !== null && amount !== ''
      ? `${amountPrefix}৳${Number(amount).toLocaleString('en-US')}`
      : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: opacityAnim },
        ]}
      >
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Animated Center Check Circle with Ripple */}
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.ripple,
                {
                  backgroundColor: rippleBgHex,
                  transform: [{ scale: rippleScaleAnim }],
                  opacity: rippleOpacityAnim,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.checkCircle,
                {
                  backgroundColor: iconBgHex,
                  transform: [{ scale: checkScaleAnim }],
                },
              ]}
            >
              <Feather name="check" size={32} color="#FFFFFF" strokeWidth={3} />
            </Animated.View>
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? (
            <Text style={styles.subtitle}>{subtitle}</Text>
          ) : null}

          {/* Optional Amount Badge */}
          {formattedAmount ? (
            <View
              style={[
                styles.amountBadge,
                {
                  backgroundColor: badgeBgHex,
                  borderColor: badgeBorderHex,
                },
              ]}
            >
              <Text style={[styles.amountText, { color: badgeTextHex }]}>
                {formattedAmount}
              </Text>
            </View>
          ) : (
            <View style={{ height: 8 }} />
          )}

          {/* Done / OK Action Button */}
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: buttonBgHex }]}
            onPress={handleClose}
            activeOpacity={0.85}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 999999,
  },
  card: {
    width: '100%',
    maxWidth: 290,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 25,
  },
  iconContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  ripple: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  amountBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  doneButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  doneButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
