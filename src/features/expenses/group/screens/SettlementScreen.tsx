import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Screen } from '../../../../components/layout/Screen';
import { Header } from '../../../../components/layout/Header';
import { SettlementCard } from '../components/SettlementCard';
import { EmptyState } from '../../../../components/feedback/EmptyState';
import { Loader } from '../../../../components/ui/Loader';
import { useSettlement } from '../hooks/useSettlement';
import { spacing } from '../../../../theme/spacing';

export const SettlementScreen: React.FC<{ groupId?: string }> = ({
  groupId = 'default_group',
}) => {
  const { settlements, loading, refresh } = useSettlement(groupId);

  return (
    <Screen>
      <Header title="Settlements" />
      <View style={styles.container}>
        {loading && !settlements.length ? (
          <Loader />
        ) : (
          <FlatList
            data={settlements}
            keyExtractor={(item, index) => `${item.fromUserId}-${item.toUserId}-${index}`}
            renderItem={({ item }) => <SettlementCard settlement={item} onSettle={() => {}} />}
            ListEmptyComponent={
              <EmptyState
                title="All Settled Up!"
                description="No pending balances to settle in this group."
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
