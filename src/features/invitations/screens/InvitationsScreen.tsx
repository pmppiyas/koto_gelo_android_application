import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Screen } from '../../../components/layout/Screen';
import { Header } from '../../../components/layout/Header';
import { InvitationCard } from '../components/InvitationCard';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { Loader } from '../../../components/ui/Loader';
import { useInvitations } from '../hooks/useInvitations';
import { spacing } from '../../../theme/spacing';

export const InvitationsScreen: React.FC = () => {
  const { invitations, loading, refresh, acceptInvitation, rejectInvitation } = useInvitations();

  return (
    <Screen>
      <Header title="Invitations" />
      <View style={styles.container}>
        {loading && !invitations.length ? (
          <Loader />
        ) : (
          <FlatList
            data={invitations}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <InvitationCard
                invitation={item}
                onAccept={() => acceptInvitation(item.id)}
                onReject={() => rejectInvitation(item.id)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                title="No Pending Invitations"
                description="When someone invites you to a group, it will show up here"
              />
            }
            onRefresh={refresh}
            refreshing={loading}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
});
