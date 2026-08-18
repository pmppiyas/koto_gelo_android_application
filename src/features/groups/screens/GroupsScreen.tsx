import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Screen } from '../../../components/layout/Screen';
import { Header } from '../../../components/layout/Header';
import { GroupCard } from '../components/GroupCard';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { Loader } from '../../../components/ui/Loader';
import { useGroups } from '../hooks/useGroups';
import { spacing } from '../../../theme/spacing';

export const GroupsScreen: React.FC = () => {
  const { groups, loading, refresh } = useGroups();

  return (
    <Screen>
      <Header title="Groups" />
      <View style={styles.container}>
        {loading && !groups.length ? (
          <Loader />
        ) : (
          <FlatList
            data={groups}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <GroupCard group={item} />}
            ListEmptyComponent={
              <EmptyState
                title="No Groups Yet"
                description="Create a group to split expenses with friends or family"
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
