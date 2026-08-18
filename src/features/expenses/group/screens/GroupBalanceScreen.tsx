import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../../../../components/layout/Screen';
import { Header } from '../../../../components/layout/Header';
import { BalanceCard } from '../components/BalanceCard';
import { MemberBalanceList } from '../components/MemberBalanceList';
import { Loader } from '../../../../components/ui/Loader';
import { useGroupBalance } from '../hooks/useGroupBalance';
import { spacing } from '../../../../theme/spacing';

export const GroupBalanceScreen: React.FC<{ groupId?: string }> = ({
  groupId = 'default_group',
}) => {
  const { balanceSummary, loading } = useGroupBalance(groupId);

  return (
    <Screen scrollable>
      <Header title="Group Balance" />
      <View style={styles.container}>
        {loading && !balanceSummary ? (
          <Loader />
        ) : (
          <>
            <BalanceCard netBalance={balanceSummary?.balances[0]?.netBalance || 0} />
            <MemberBalanceList balances={balanceSummary?.balances || []} />
          </>
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
});
