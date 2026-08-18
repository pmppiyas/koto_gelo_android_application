import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TextInput, TouchableOpacity, FlatList, ListRenderItem } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius, typography, BOTTOM_TAB_HEIGHT } from '../constants/spacing';
import { demoTransactions } from '../data/demoData';
import { Transaction } from '../types/transaction';

export interface TransactionsScreenProps {}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = () => {
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Income' | 'Expense'>('All');

  const filteredTransactions = useMemo(() => {
    return demoTransactions.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchText.toLowerCase()) || 
                            item.category.toLowerCase().includes(searchText.toLowerCase());
      
      let matchesFilter = true;
      if (activeFilter === 'Income') {
        matchesFilter = item.type === 'income';
      } else if (activeFilter === 'Expense') {
        matchesFilter = item.type === 'expense';
      }

      return matchesSearch && matchesFilter;
    });
  }, [searchText, activeFilter]);

  const renderFilterTab = (title: 'All' | 'Income' | 'Expense') => {
    const isActive = activeFilter === title;
    return (
      <TouchableOpacity
        style={[styles.filterTab, isActive ? styles.filterTabActive : styles.filterTabInactive]}
        onPress={() => setActiveFilter(title)}
        activeOpacity={0.7}
      >
        <Text style={[styles.filterTabText, isActive ? styles.filterTabTextActive : styles.filterTabTextInactive]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTransactionItem: ListRenderItem<Transaction> = ({ item }) => {
    const isIncome = item.type === 'income';
    
    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionItemLeft}>
          <View style={[styles.iconBadge, { backgroundColor: isIncome ? colors.secondaryLight : colors.dangerLight }]}>
            <Feather 
              name={item.icon || 'more-horizontal'} 
              size={20} 
              color={isIncome ? colors.secondary : colors.danger} 
            />
          </View>
          <View style={styles.transactionItemCenter}>
            <Text style={styles.transactionTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.transactionDate}>{item.date}</Text>
          </View>
        </View>
        <Text style={[styles.transactionAmount, { color: isIncome ? colors.secondary : colors.textPrimary }]}>
          {isIncome ? '+' : '-'}৳{Math.abs(item.amount).toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Transactions</Text>
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={styles.filterContainer}>
          {renderFilterTab('All')}
          {renderFilterTab('Income')}
          {renderFilterTab('Expense')}
        </View>

        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: typography.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: typography.md,
    color: colors.textPrimary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabInactive: {
    backgroundColor: colors.borderLight,
  },
  filterTabText: {
    fontSize: typography.sm,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterTabTextInactive: {
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: BOTTOM_TAB_HEIGHT + spacing.lg,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  transactionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  transactionItemCenter: {
    flex: 1,
    paddingRight: spacing.md,
  },
  transactionTitle: {
    fontSize: typography.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  transactionAmount: {
    fontSize: typography.md,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.md,
    color: colors.textMuted,
  },
});
