import React from 'react';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from '../ui/core';

export interface MemberBalanceItem {
  userId: string;
  username?: string;
  name?: string | null;
  user?: {
    id: string;
    username: string;
    name?: string | null;
    avatarUrl?: string | null;
  };
  totalDeposited?: number;
  totalPaid?: number;
  totalShare?: number;
  netBalance?: number;
  paid?: number;
  owes?: number;
  net?: number;
}

export interface GroupBalanceSummaryProps {
  totalExpenses: number;
  totalDeposits?: number;
  remainingFund?: number;
  yourDeposited?: number;
  yourSpending?: number;
  yourShare?: number;
  netBalance?: number;
  totalMembers: number;
  balances?: MemberBalanceItem[];
  onAddDeposit?: () => void;
}

export const GroupBalanceSummary: React.FC<GroupBalanceSummaryProps> = ({
  totalExpenses,
  totalDeposits = 0,
  remainingFund = 0,
  yourDeposited = 0,
  yourSpending = 0,
  yourShare = 0,
  netBalance = 0,
  totalMembers,
  balances = [],
  onAddDeposit,
}) => {
  const isNetPositive = netBalance > 0;
  const isNetZero = netBalance === 0;

  return (
    <View className="gap-4 mb-4">
      {/* Luxury Hero Card (Matching Dashboard BalanceCard styling) */}
      <View className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View
              className={`w-2 h-2 rounded-full ${
                remainingFund >= 0 ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <Text className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
              Group Balance
            </Text>
          </View>
          <View className="bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
            <Text className="text-[11px] font-bold text-indigo-300">BDT</Text>
          </View>
        </View>

        <Text
          className={`text-3xl font-black tracking-tight mt-1 mb-5 ${
            remainingFund >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {remainingFund >= 0 ? '+' : '-'} ৳
          {Math.abs(remainingFund).toLocaleString('en-US')}
        </Text>

        <View className="flex-row items-center gap-3">
          {/* You Deposited Sub-card */}
          <View className="flex-1 bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60">
            <View className="flex-row items-center gap-1.5 mb-1">
              <Feather name="arrow-down-left" size={13} color="#34D399" />
              <Text className="text-[11px] text-slate-400 font-medium">You Deposited</Text>
            </View>
            <Text className="text-sm font-extrabold text-emerald-400">
              +৳{(yourDeposited + yourSpending).toLocaleString('en-US')}
            </Text>
          </View>

          {/* Your Balance / You need to pay Sub-card */}
          <View className="flex-1 bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60">
            <View className="flex-row items-center gap-1.5 mb-1">
              <Feather
                name={isNetPositive || isNetZero ? 'arrow-down-left' : 'arrow-up-right'}
                size={13}
                color={isNetPositive || isNetZero ? '#34D399' : '#FB7185'}
              />
              <Text className="text-[11px] text-slate-400 font-medium">
                {isNetPositive || isNetZero ? 'Your Balance' : 'You need to pay'}
              </Text>
            </View>
            <Text
              className={`text-sm font-extrabold ${
                isNetPositive || isNetZero ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isNetPositive || isNetZero ? '+' : '-'}৳{Math.abs(Math.round(netBalance)).toLocaleString('en-US')}
            </Text>
          </View>
        </View>
      </View>

      {/* Summary 3-Card Row (Matching Personal Dashboard SummaryCard) */}
      <View className="flex-row gap-2.5">
        <View className="flex-1 bg-card border border-border rounded-2xl p-3.5 shadow-sm">
          <View className="w-8 h-8 rounded-xl bg-emerald-50 items-center justify-center mb-2">
            <Feather name="arrow-down-left" size={15} color="#059669" />
          </View>
          <Text className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
            Deposits
          </Text>
          <Text className="text-sm font-black text-foreground">
            ৳{totalDeposits.toLocaleString('en-US')}
          </Text>
        </View>

        <View className="flex-1 bg-card border border-border rounded-2xl p-3.5 shadow-sm">
          <View className="w-8 h-8 rounded-xl bg-rose-50 items-center justify-center mb-2">
            <Feather name="arrow-up-right" size={15} color="#E11D48" />
          </View>
          <Text className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
            Expense
          </Text>
          <Text className="text-sm font-black text-foreground">
            ৳{totalExpenses.toLocaleString('en-US')}
          </Text>
        </View>

        <View className="flex-1 bg-card border border-border rounded-2xl p-3.5 shadow-sm">
          <View className="w-8 h-8 rounded-xl bg-amber-50 items-center justify-center mb-2">
            <Feather name="shield" size={15} color="#D97706" />
          </View>
          <Text className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
            Fund
          </Text>
          <Text className="text-sm font-black text-foreground">
            ৳{remainingFund.toLocaleString('en-US')}
          </Text>
        </View>
      </View>

      {/* Your Personal Status Card */}
      <View className="bg-card p-4 rounded-2xl border border-border shadow-sm gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <View className="w-10 h-10 rounded-xl bg-primary-light border border-indigo-100 items-center justify-center">
              <Feather name="user" size={18} color="#4F46E5" />
            </View>
            <View>
              <Text className="text-sm font-bold text-foreground">Your Balance Status</Text>
              <Text className="text-xs text-muted-foreground">Personal summary in this group</Text>
            </View>
          </View>
          <View
            className={`px-3 py-1 rounded-full ${
              isNetZero
                ? 'bg-slate-100 border border-slate-200'
                : isNetPositive
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-rose-50 border border-rose-200'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                isNetZero
                  ? 'text-slate-600'
                  : isNetPositive
                  ? 'text-emerald-700'
                  : 'text-destructive'
              }`}
            >
              {isNetZero
                ? 'Settled'
                : isNetPositive
                ? `+৳${netBalance.toLocaleString()} (Refund Due)`
                : `-৳${Math.abs(netBalance).toLocaleString()} (To Pay)`}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between pt-3 border-t border-border">
          <View>
            <Text className="text-[11px] text-muted-foreground font-medium">You Deposited</Text>
            <Text className="text-sm font-extrabold text-emerald-600 mt-0.5">
              ৳{yourDeposited.toLocaleString()}
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-[11px] text-muted-foreground font-medium">Your Share</Text>
            <Text className="text-sm font-extrabold text-foreground mt-0.5">
              ৳{yourShare.toLocaleString()}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-[11px] text-muted-foreground font-medium">You Paid (Expenses)</Text>
            <Text className="text-sm font-extrabold text-primary mt-0.5">
              ৳{yourSpending.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Member Collections & Deposits Breakdown */}
      {balances && balances.length > 0 && (
        <View className="bg-card rounded-2xl p-4 border border-border shadow-sm gap-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-bold text-foreground">
                Member Collections & Deposits
              </Text>
              <Text className="text-xs text-muted-foreground">
                Breakdown across {balances.length} {balances.length === 1 ? 'member' : 'members'}
              </Text>
            </View>
            {onAddDeposit && (
              <TouchableOpacity
                className="flex-row items-center gap-1.5 bg-primary-light border border-indigo-200 px-3 py-1.5 rounded-full shadow-xs"
                onPress={onAddDeposit}
                activeOpacity={0.8}
              >
                <Feather name="plus" size={13} color="#4F46E5" />
                <Text className="text-xs font-bold text-primary">Add Deposit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="gap-2.5 pt-1">
            {balances.map((item, idx) => {
              const name =
                item.user?.name ||
                item.name ||
                item.user?.username ||
                item.username ||
                `Member ${idx + 1}`;
              const initial = name.charAt(0).toUpperCase();
              const deposited = item.totalDeposited ?? 0;
              const paid = item.totalPaid ?? item.paid ?? 0;
              const share = item.totalShare ?? item.owes ?? 0;
              const net = item.netBalance ?? item.net ?? ((deposited + paid) - share);
              const isPositive = net > 0;
              const isZero = Math.abs(net) < 0.01;

              return (
                <View
                  key={`${item.userId || 'mb'}_${idx}`}
                  className="flex-row items-center justify-between bg-muted/40 p-3.5 rounded-2xl border border-border/60"
                >
                  <View className="flex-row items-center gap-3 flex-1 pr-2">
                    <View className="w-10 h-10 rounded-full bg-primary-light border border-indigo-100 items-center justify-center shadow-xs">
                      <Text className="text-sm font-bold text-primary">{initial}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-foreground" numberOfLines={1}>
                        {name}
                      </Text>
                      <Text className="text-[11px] text-muted-foreground mt-0.5">
                        Expense share: ৳{share.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end gap-1">
                    <Text className="text-xs font-black text-emerald-600">
                      +৳{deposited.toLocaleString()} deposited
                    </Text>
                    <View
                      className={`px-2.5 py-0.5 rounded-full border ${
                        isZero
                          ? 'bg-slate-100 border-slate-200'
                          : isPositive
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-rose-50 border-rose-200'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          isZero
                            ? 'text-slate-600'
                            : isPositive
                            ? 'text-emerald-700'
                            : 'text-destructive'
                        }`}
                      >
                        {isZero
                          ? 'Settled'
                          : isPositive
                          ? `+৳${net.toLocaleString()} to receive`
                          : `-৳${Math.abs(net).toLocaleString()} to pay`}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};
