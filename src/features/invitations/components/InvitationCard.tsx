import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Invitation } from '../types/invitation.types';
import { Card } from '../../../components/ui/Card';
import { InvitationStatus } from './InvitationStatus';
import { Button } from '../../../components/ui/Button';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { colors } from '../../../theme/colors';

export interface InvitationCardProps {
  invitation: Invitation;
  onAccept?: () => void;
  onReject?: () => void;
  onPress?: () => void;
}

export const InvitationCard: React.FC<InvitationCardProps> = ({
  invitation,
  onAccept,
  onReject,
  onPress,
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.groupName}>{invitation.groupName}</Text>
          <InvitationStatus status={invitation.status} />
        </View>
        <Text style={styles.inviter}>Invited by {invitation.inviterName}</Text>

        {invitation.status === 'PENDING' && (onAccept || onReject) ? (
          <View style={styles.actions}>
            {onReject ? (
              <Button
                title="Decline"
                variant="outline"
                size="sm"
                onPress={onReject}
                style={styles.actionBtn}
              />
            ) : null}
            {onAccept ? (
              <Button
                title="Accept"
                size="sm"
                onPress={onAccept}
                style={styles.actionBtn}
              />
            ) : null}
          </View>
        ) : null}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  groupName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  inviter: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    minWidth: 80,
  },
});
