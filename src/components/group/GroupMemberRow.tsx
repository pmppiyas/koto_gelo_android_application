import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/spacing';

interface GroupMemberRowProps {
  name: string;
  username: string;
  role: 'ADMIN' | 'MEMBER';
  isYou: boolean;
  netBalance?: number;
}

export const GroupMemberRow: React.FC<GroupMemberRowProps> = ({
  name,
  username,
  role,
  isYou,
  netBalance,
}) => {
  const initial = name.charAt(0).toUpperCase();
  const isPositive = netBalance !== undefined && netBalance > 0;
  const isNegative = netBalance !== undefined && netBalance < 0;

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {name}
            {isYou && ' (You)'}
          </Text>
          {role === 'ADMIN' && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Admin</Text>
            </View>
          )}
        </View>
        <Text style={styles.username}>@{username}</Text>
      </View>

      {netBalance !== undefined && netBalance !== 0 && (
        <View style={styles.right}>
          <Text
            style={[
              styles.balanceAmount,
              { color: isPositive ? colors.secondary : colors.danger },
            ]}
          >
            ৳{Math.abs(netBalance)}
          </Text>
          <Text style={styles.balanceLabel}>
            {isNegative ? 'owes' : 'gets back'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.sm,
    fontWeight: 'bold',
    color: colors.primary,
  },
  center: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: typography.sm,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginLeft: 6,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  username: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: typography.sm,
    fontWeight: 'bold',
  },
  balanceLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
});
