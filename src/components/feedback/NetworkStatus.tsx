import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const NetworkStatus: React.FC = () => {
  const { isConnected } = useNetworkStatus();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.indicator,
          { backgroundColor: isConnected ? colors.success : colors.error },
        ]}
      />
      <Text style={styles.label}>{isConnected ? 'Online' : 'Offline'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  label: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
});
