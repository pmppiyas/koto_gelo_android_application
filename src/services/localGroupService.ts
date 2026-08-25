import { groupRepository } from './database/repositories/group.repository';
import { groupExpenseRepository, LocalGroupExpense } from './database/repositories/groupExpense.repository';
import { groupDepositRepository, LocalGroupDeposit } from './database/repositories/groupDeposit.repository';
import { invitationRepository, LocalInvitation } from './database/repositories/invitation.repository';
import { Group, GroupBalance, Settlement, GroupMember } from './groupService';

export const localGroupService = {
  // Groups
  async getStoredGroups(): Promise<Group[]> {
    return await groupRepository.getAll();
  },

  async getStoredGroupById(id: string): Promise<Group | null> {
    return await groupRepository.getById(id);
  },

  async setStoredGroups(groups: Group[]): Promise<void> {
    await groupRepository.saveAll(groups);
  },

  async saveGroupLocally(group: Group, syncStatus = 'pending'): Promise<void> {
    await groupRepository.save(group, syncStatus);
  },

  async deleteGroupLocally(id: string): Promise<void> {
    await groupRepository.delete(id);
  },

  // Group Expenses
  async getStoredGroupExpenses(groupId?: string): Promise<LocalGroupExpense[]> {
    return await groupExpenseRepository.getAll(groupId);
  },

  async setStoredGroupExpenses(expenses: any[]): Promise<void> {
    await groupExpenseRepository.saveAll(expenses);
  },

  async saveGroupExpenseLocally(expense: any, syncStatus = 'pending'): Promise<void> {
    await groupExpenseRepository.save(expense, syncStatus);
  },

  async deleteGroupExpenseLocally(id: string): Promise<void> {
    await groupExpenseRepository.delete(id);
  },

  // Group Deposits
  async getStoredGroupDeposits(groupId?: string): Promise<LocalGroupDeposit[]> {
    return await groupDepositRepository.getAll(groupId);
  },

  async setStoredGroupDeposits(deposits: any[]): Promise<void> {
    await groupDepositRepository.saveAll(deposits);
  },

  async saveGroupDepositLocally(deposit: any, syncStatus = 'pending'): Promise<void> {
    await groupDepositRepository.save(deposit, syncStatus);
  },

  async deleteGroupDepositLocally(id: string): Promise<void> {
    await groupDepositRepository.delete(id);
  },

  // Invitations
  async getStoredInvitations(groupId?: string): Promise<LocalInvitation[]> {
    return await invitationRepository.getAll(groupId);
  },

  async saveInvitationsLocally(invitations: any[]): Promise<void> {
    await invitationRepository.saveAll(invitations);
  },

  async clearAll(): Promise<void> {
    await groupRepository.clear();
    await groupExpenseRepository.clear();
    await groupDepositRepository.clear();
    await invitationRepository.clear();
  },

  // OFFLINE METRICS CALCULATIONS (Runs 100% locally from SQLite database)
  async calculateOfflineGroupBalance(groupId: string, currentUserId?: string): Promise<GroupBalance> {
    const group = await groupRepository.getById(groupId);
    const expenses = await groupExpenseRepository.getAll(groupId);
    const deposits = await groupDepositRepository.getAll(groupId);

    const members: GroupMember[] = group?.members || [];
    const memberMap = new Map<
      string,
      {
        userId: string;
        username: string;
        name?: string | null;
        totalDeposited: number;
        paid: number;
        owes: number;
        net: number;
      }
    >();

    // Initialize all known group members
    members.forEach((m) => {
      const u = m.user || (m as any);
      const mId = u.id || m.userId;
      memberMap.set(mId, {
        userId: mId,
        username: u.username || 'Member',
        name: u.name || u.username || 'Member',
        totalDeposited: 0,
        paid: 0,
        owes: 0,
        net: 0,
      });
    });

    // Sum deposits
    let totalDeposits = 0;
    deposits.forEach((dep) => {
      const amt = Number(dep.amount) || 0;
      totalDeposits += amt;
      const uId = dep.userId || (dep.user as any)?.id;
      if (uId) {
        if (!memberMap.has(uId)) {
          memberMap.set(uId, {
            userId: uId,
            username: dep.user?.username || 'Member',
            name: dep.user?.name || dep.user?.username || 'Member',
            totalDeposited: 0,
            paid: 0,
            owes: 0,
            net: 0,
          });
        }
        const item = memberMap.get(uId)!;
        item.totalDeposited += amt;
      }
    });

    // Calculate expense spending and shares
    let totalExpenses = 0;
    const memberCount = Math.max(1, memberMap.size);

    expenses.forEach((exp) => {
      const expAmt = Number(exp.amount) || 0;
      totalExpenses += expAmt;

      // Payer attribution
      const payerId = (exp as any).userId || exp.user?.id;
      if (payerId && memberMap.has(payerId)) {
        memberMap.get(payerId)!.paid += expAmt;
      }

      // Participant share calculation
      if (exp.participants && exp.participants.length > 0) {
        exp.participants.forEach((p: any) => {
          const pId = p.userId || p.user?.id;
          if (pId) {
            if (!memberMap.has(pId)) {
              memberMap.set(pId, {
                userId: pId,
                username: p.user?.username || 'Member',
                name: p.user?.name || p.user?.username || 'Member',
                totalDeposited: 0,
                paid: 0,
                owes: 0,
                net: 0,
              });
            }
            const share = Number(p.shareAmount) || expAmt / exp.participants.length;
            memberMap.get(pId)!.owes += share;
          }
        });
      } else {
        const equalShare = expAmt / memberCount;
        memberMap.forEach((item) => {
          item.owes += equalShare;
        });
      }
    });

    // Compute net balance for each member: totalDeposited + paid - owes
    memberMap.forEach((item) => {
      item.net = Math.round((item.totalDeposited + item.paid - item.owes) * 100) / 100;
    });

    const balances = Array.from(memberMap.values());
    const remainingFund = Math.round((totalDeposits - totalExpenses) * 100) / 100;

    const userRecord = currentUserId ? memberMap.get(currentUserId) : null;
    const yourDeposited = userRecord ? userRecord.totalDeposited : 0;
    const yourSpending = userRecord ? userRecord.paid : 0;
    const yourShare = userRecord ? userRecord.owes : 0;
    const netBalance = userRecord ? userRecord.net : 0;

    return {
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      totalDeposits: Math.round(totalDeposits * 100) / 100,
      remainingFund,
      totalMembers: memberMap.size,
      yourDeposited,
      yourSpending,
      yourShare: Math.round(yourShare * 100) / 100,
      netBalance,
      balances,
    };
  },

  async calculateOfflineGroupSummary(groupId: string, currentUserId?: string): Promise<any> {
    const group = await groupRepository.getById(groupId);
    const balance = await this.calculateOfflineGroupBalance(groupId, currentUserId);
    const expenses = await groupExpenseRepository.getAll(groupId);
    const deposits = await groupDepositRepository.getAll(groupId);

    const categoryMap = new Map<string, number>();
    expenses.forEach((exp) => {
      const cat = exp.category || 'Other';
      const amt = Number(exp.amount) || 0;
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + amt);
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
    }));

    return {
      groupId,
      groupName: group?.name || 'Group',
      totalDeposit: balance.totalDeposits || 0,
      totalExpense: balance.totalExpenses,
      remainingFund: balance.remainingFund || 0,
      totalExpenseCount: expenses.length,
      totalDepositCount: deposits.length,
      myTotalDeposited: balance.yourDeposited || 0,
      myTotalPaid: balance.yourSpending,
      myTotalContributed: (balance.yourDeposited || 0) + balance.yourSpending,
      myTotalShare: balance.yourShare,
      myNetBalance: balance.netBalance,
      categoryBreakdown,
    };
  },

  async calculateOfflineSettlements(groupId: string): Promise<Settlement[]> {
    const balance = await this.calculateOfflineGroupBalance(groupId);
    const balances = balance.balances || [];

    const debtors: { id: string; username: string; name?: string | null; amount: number }[] = [];
    const creditors: { id: string; username: string; name?: string | null; amount: number }[] = [];

    balances.forEach((b) => {
      if (b.net < -0.01) {
        debtors.push({
          id: b.userId,
          username: b.username,
          name: b.name,
          amount: Math.abs(b.net),
        });
      } else if (b.net > 0.01) {
        creditors.push({
          id: b.userId,
          username: b.username,
          name: b.name,
          amount: b.net,
        });
      }
    });

    const settlements: Settlement[] = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const settleAmount = Math.min(debtor.amount, creditor.amount);

      if (settleAmount > 0.01) {
        settlements.push({
          from: { id: debtor.id, username: debtor.username, name: debtor.name },
          to: { id: creditor.id, username: creditor.username, name: creditor.name },
          amount: Math.round(settleAmount * 100) / 100,
        });
      }

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;

      if (debtor.amount <= 0.01) dIdx++;
      if (creditor.amount <= 0.01) cIdx++;
    }

    return settlements;
  },

  async calculateOverallGroupSummary(currentUserId?: string): Promise<{
    totalGroupExpenses: number;
    totalDeposits: number;
    totalRemainingFund: number;
    totalMyShare: number;
    totalMyDeposited: number;
    totalMyNetBalance: number;
    groupCount: number;
  }> {
    const groups = await groupRepository.getAll();
    let totalGroupExpenses = 0;
    let totalDeposits = 0;
    let totalRemainingFund = 0;
    let totalMyShare = 0;
    let totalMyDeposited = 0;
    let totalMyNetBalance = 0;

    for (const g of groups) {
      const b = await this.calculateOfflineGroupBalance(g.id, currentUserId);
      totalGroupExpenses += b.totalExpenses;
      totalDeposits += b.totalDeposits;
      totalRemainingFund += b.remainingFund;
      totalMyShare += b.yourShare;
      totalMyDeposited += b.yourDeposited;
      totalMyNetBalance += b.netBalance;
    }

    return {
      totalGroupExpenses: Math.round(totalGroupExpenses * 100) / 100,
      totalDeposits: Math.round(totalDeposits * 100) / 100,
      totalRemainingFund: Math.round(totalRemainingFund * 100) / 100,
      totalMyShare: Math.round(totalMyShare * 100) / 100,
      totalMyDeposited: Math.round(totalMyDeposited * 100) / 100,
      totalMyNetBalance: Math.round(totalMyNetBalance * 100) / 100,
      groupCount: groups.length,
    };
  },
};
