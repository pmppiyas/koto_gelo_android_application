import React from 'react';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from '../ui/core';
import { EXPENSE_CATEGORIES } from '../../constants/expense';
import { categoryIconMap } from '../../data/demoData';

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category?: string;
  subcategory?: string | null;
  date?: string;
  type?: 'expense' | 'income' | 'settlement' | string;
  emoji?: string;
  icon?: string;
  groupName?: string | null;
  groupId?: string | null;
  paidByName?: string | null;
  participantCount?: number;
  syncStatus?: 'synced' | 'pending' | 'failed' | string;
  localId?: string;
  isYou?: boolean;
}

export interface ExpenseTableCardProps {
  title?: string;
  subtitle?: string;
  badge?: string | number;
  badgeColor?: string;
  transactions?: ExpenseItem[] | any[];
  newlyAddedId?: string | null;
  onSeeAll?: () => void;
  seeAllText?: string;
  onItemPress?: (item: any) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  onAddExpense?: () => void;
  className?: string;
  showHeader?: boolean;
}

export const ExpenseTableCard: React.FC<ExpenseTableCardProps> = ({
  title = 'Recent Expenses',
  subtitle,
  badge,
  transactions = [],
  newlyAddedId,
  onSeeAll,
  seeAllText = 'See All',
  onItemPress,
  emptyTitle = 'No Expenses Recorded Yet',
  emptySubtitle = 'Tap "+ Add Expense" above to log your first spend.',
  onAddExpense,
  className = '',
  showHeader = true,
}) => {
  return (
    <View
      className={`bg-card rounded-2xl border border-border p-4 shadow-sm mb-2 ${className}`}
    >
      {/* Top Header */}
      {showHeader && (
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center gap-2 flex-1 mr-2">
            <View>
              <Text
                className="text-base font-bold text-foreground"
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text className="text-xs text-muted-foreground mt-0.5">
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {badge !== undefined && badge !== null && (
              <View className="bg-primary-light px-2 py-0.5 rounded-full border border-indigo-200">
                <Text className="text-[10px] font-bold text-primary">
                  {badge}
                </Text>
              </View>
            )}
          </View>

          {onSeeAll && (
            <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
              <Text className="text-xs text-primary font-bold">
                {seeAllText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* List Content or Empty State */}
      {transactions.length === 0 ? (
        <View className="py-8 items-center justify-center">
          <View className="w-12 h-12 rounded-full bg-primary-light items-center justify-center mb-2 shadow-2xs">
            <Feather name="credit-card" size={22} color="#4F46E5" />
          </View>
          <Text className="text-sm font-bold text-foreground mb-0.5 text-center">
            {emptyTitle}
          </Text>
          <Text className="text-xs text-muted-foreground text-center px-4 leading-relaxed">
            {emptySubtitle}
          </Text>
          {onAddExpense && (
            <TouchableOpacity
              onPress={onAddExpense}
              className="mt-3 flex-row items-center gap-1.5 bg-primary px-3.5 py-1.5 rounded-full shadow-xs"
              activeOpacity={0.8}
            >
              <Feather name="plus" size={14} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">Add Expense</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View>
          {transactions.map((item, index) => {
            const isLast = index === transactions.length - 1;
            const isNewlyAdded =
              !!newlyAddedId &&
              (item.id === newlyAddedId ||
                item.localId === newlyAddedId ||
                (item as any)._id === newlyAddedId);

            const cat = item.category || 'Other';
            const catDef = EXPENSE_CATEGORIES.find(
              c =>
                c.name.toLowerCase() === cat.toLowerCase() ||
                c.slug.toLowerCase() === cat.toLowerCase(),
            );
            const emoji = item.emoji || (catDef ? catDef.emoji : null);
            const iconName = item.icon || categoryIconMap[cat] || 'credit-card';

            const isIncome = item.type === 'income';
            const isSettlement = item.type === 'settlement';

            let bgClass = isIncome
              ? 'bg-emerald-50'
              : isSettlement
              ? 'bg-amber-50'
              : 'bg-rose-50';

            let amountColor = isIncome
              ? 'text-emerald-600'
              : isSettlement
              ? 'text-amber-600'
              : 'text-foreground';

            let amountPrefix = isIncome ? '+' : isSettlement ? '+' : '-';

            const Wrapper = onItemPress ? TouchableOpacity : View;

            return (
              <React.Fragment
                key={`${item.localId || item.id || 'exp'}_${index}`}
              >
                <Wrapper
                  onPress={onItemPress ? () => onItemPress(item) : undefined}
                  activeOpacity={onItemPress ? 0.7 : 1}
                  className="flex-row justify-between items-center py-2.5 px-2 rounded-xl bg-transparent border border-transparent"
                >
                  {/* Left: Icon / Emoji */}
                  <View className="flex-row items-center flex-1 pr-3">
                    <View
                      className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${bgClass}`}
                    >
                      {emoji ? (
                        <Text className="text-lg">{emoji}</Text>
                      ) : (
                        <Feather
                          name={iconName as any}
                          size={18}
                          color={
                            isIncome
                              ? '#10B981'
                              : isSettlement
                              ? '#F59E0B'
                              : '#EF4444'
                          }
                        />
                      )}
                    </View>

                    {/* Center: Title & Subtitle */}
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5 flex-wrap">
                        <Text
                          className="text-sm font-bold text-foreground"
                          numberOfLines={1}
                        >
                          {item.title ||
                            item.subcategory ||
                            item.category ||
                            'Expense'}
                        </Text>
                        {isNewlyAdded && (
                          <View className="flex-row items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 ">
                            <Text className="text-[4px] font-bold text-amber-700">
                              NEW
                            </Text>
                          </View>
                        )}
                        {item.syncStatus === 'pending' && !isNewlyAdded && (
                          <Feather name="clock" size={11} color="#D97706" />
                        )}
                      </View>
                      <Text
                        className="text-xs text-muted-foreground mt-0.5"
                        numberOfLines={1}
                      >
                        {item.groupName ? `${item.groupName} • ` : ''}
                        {item.paidByName
                          ? `${item.paidByName.startsWith('Group Fund') || item.paidByName.startsWith('From Fund') ? item.paidByName : `Paid by ${item.paidByName}`} • `
                          : ''}
                        {item.date}
                      </Text>
                    </View>
                  </View>

                  {/* Right: Amount & Category */}
                  <View className="items-end">
                    <Text
                      className={`text-sm font-extrabold mb-0.5 ${amountColor}`}
                    >
                      {amountPrefix}৳
                      {Number(item.amount || 0).toLocaleString('en-US')}
                    </Text>
                    <Text className="text-xs text-muted-foreground capitalize">
                      {item.category || item.type || 'Expense'}
                    </Text>
                  </View>
                </Wrapper>
                {!isLast && <View className="h-[1px] bg-[#E2E8F0] mx-2" />}
              </React.Fragment>
            );
          })}
        </View>
      )}
    </View>
  );
};
