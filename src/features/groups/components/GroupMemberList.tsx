import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GroupMember } from '../types/group.types';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

export interface GroupMemberListProps {
  members: GroupMember[];
}

export const GroupMemberList: React.FC<GroupMemberListProps> = ({ members }) => {
  return (
    <View style={styles.container}>
      {members.map(m => (
        <View key={m.id} style={styles.row}>
          <Avatar name={m.name} source={m.avatarUrl} size={36} />
          <View style={styles.details}>
            <Text style={styles.name}>{m.name}</Text>
            {m.email ? <Text style={styles.email}>{m.email}</Text> : null}
          </View>
          {m.role === 'ADMIN' ? <Badge label="Admin" variant="primary" /> : null}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  details: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  name: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.text,
  },
  email: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
});
