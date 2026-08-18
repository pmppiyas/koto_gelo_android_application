export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  PersonalExpenses: undefined;
  Groups: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  CreatePersonalExpense: undefined;
  EditPersonalExpense: { id: string };
  PersonalExpenseDetails: { id: string };
  CreateGroup: undefined;
  EditGroup: { groupId: string };
  GroupDetails: { groupId: string };
  GroupMembers: { groupId: string };
  GroupExpenses: { groupId: string };
  CreateGroupExpense: { groupId: string };
  EditGroupExpense: { groupId: string; expenseId: string };
  GroupExpenseDetails: { groupId: string; expenseId: string };
  GroupBalance: { groupId: string };
  Settlement: { groupId: string };
  Invitations: undefined;
  InvitationDetails: { invitationId: string };
  EditProfile: undefined;
  Settings: undefined;
  Notifications: undefined;
};
