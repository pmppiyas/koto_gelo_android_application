import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../../../components/layout/Screen';
import { Header } from '../../../components/layout/Header';
import { GroupMemberList } from '../components/GroupMemberList';
import { Button } from '../../../components/ui/Button';
import { spacing } from '../../../theme/spacing';

export const GroupMembersScreen: React.FC = () => {
  const mockMembers = [
    { id: '1', userId: 'u1', name: 'John Doe', role: 'ADMIN' as const },
    { id: '2', userId: 'u2', name: 'Jane Smith', role: 'MEMBER' as const },
  ];

  return (
    <Screen scrollable>
      <Header title="Members" />
      <View style={styles.container}>
        <GroupMemberList members={mockMembers} />
        <Button
          title="Invite Member"
          onPress={() => {}}
          style={styles.button}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  button: {
    marginTop: spacing.lg,
  },
});
