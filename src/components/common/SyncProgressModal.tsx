import React from 'react';
import { Modal, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { View, Text } from '../ui';
import { SyncProgressState } from '../../services/expenseSyncService';

export interface SyncProgressModalProps {
  visible: boolean;
  progress: SyncProgressState | null;
  title?: string;
}

const DEFAULT_STEPS = [
  { id: 1, name: 'Account Authenticated', desc: 'Credentials verified securely' },
  { id: 2, name: 'Local Database Prepared', desc: 'Clearing stale cache & initializing SQLite' },
  { id: 3, name: 'Personal Expenses Synced', desc: 'Downloading transactions from cloud' },
  { id: 4, name: 'Groups & Balances Synced', desc: 'Downloading split records & group funds' },
  { id: 5, name: 'Workspace Ready', desc: 'Finalizing setup & launching dashboard' },
];

export const SyncProgressModal: React.FC<SyncProgressModalProps> = ({
  visible,
  progress,
  title = 'Setting Up Your Workspace',
}) => {
  const [lastProgress, setLastProgress] = React.useState<SyncProgressState | null>(null);

  React.useEffect(() => {
    if (progress) {
      setLastProgress(prev => {
        if (!prev) return progress;
        return {
          currentStep: Math.max(prev.currentStep, progress.currentStep),
          totalSteps: 5,
          stepName: progress.stepName,
          detail: progress.detail,
          percentage: Math.max(prev.percentage, progress.percentage),
        };
      });
    }
  }, [progress]);

  const activeProgress = progress || lastProgress;
  const currentStep = activeProgress?.currentStep || 1;
  const percentage = activeProgress?.percentage || 15;
  const isAllComplete = percentage >= 100 || (currentStep >= 5 && activeProgress?.percentage === 100);
  const currentDetail = isAllComplete
    ? 'All done! Launching your dashboard...'
    : activeProgress?.detail || 'Preparing offline database...';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-slate-950/80 items-center justify-center px-4">
        <View className="w-full max-w-[390px] bg-card rounded-3xl p-6 border border-border shadow-2xl gap-4">
          
          {/* Header Banner */}
          <View className="items-center">
            <View
              className={`w-14 h-14 rounded-2xl items-center justify-center mb-3 shadow-xs border ${
                isAllComplete
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-indigo-50 border-indigo-200'
              }`}
            >
              <Feather
                name={isAllComplete ? 'check-circle' : 'cloud-lightning'}
                size={26}
                color={isAllComplete ? '#059669' : '#4F46E5'}
              />
            </View>
            <Text className="text-lg font-black text-foreground text-center">
              {isAllComplete ? 'Workspace Ready!' : title}
            </Text>
            <Text className="text-xs text-muted-foreground text-center mt-0.5 px-2" numberOfLines={2}>
              {currentDetail}
            </Text>
          </View>

          {/* Dynamic Content: 5-Step Checklist while syncing vs Big Green Check when done */}
          {!isAllComplete ? (
            <>
              {/* Glowing Animated Progress Bar */}
              <View className="gap-1.5 py-1">
                <View className="flex-row justify-between items-center px-1">
                  <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Sync Progress
                  </Text>
                  <Text className="text-xs font-black text-primary">
                    {Math.round(percentage)}%
                  </Text>
                </View>
                <View className="h-2.5 w-full bg-muted rounded-full overflow-hidden p-0.5 border border-border/40">
                  <View
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(100, Math.max(8, percentage))}%` }}
                  />
                </View>
              </View>

              {/* 5-Step Checklist */}
              <View className="gap-2 bg-muted/40 p-3.5 rounded-2xl border border-border/60">
                {DEFAULT_STEPS.map((step) => {
                  const isCompleted = currentStep > step.id;
                  const isActive = currentStep === step.id;

                  return (
                    <View
                      key={step.id}
                      className={`flex-row items-center gap-3 p-2 rounded-xl transition-all ${
                        isActive
                          ? 'bg-primary-light border border-indigo-200 shadow-2xs'
                          : 'bg-transparent'
                      }`}
                    >
                      {/* Status Icon */}
                      <View
                        className={`w-6 h-6 rounded-full items-center justify-center ${
                          isCompleted
                            ? 'bg-emerald-500 shadow-2xs'
                            : isActive
                            ? 'bg-primary shadow-2xs'
                            : 'bg-slate-200 border border-slate-300'
                        }`}
                      >
                        {isCompleted ? (
                          <Feather name="check" size={13} color="#FFFFFF" />
                        ) : isActive ? (
                          <ActivityIndicator size="small" color="#FFFFFF" style={{ transform: [{ scale: 0.65 }] }} />
                        ) : (
                          <Text className="text-[10px] font-bold text-slate-500">
                            {step.id}
                          </Text>
                        )}
                      </View>

                      {/* Step Description */}
                      <View className="flex-1">
                        <Text
                          className={`text-xs ${
                            isCompleted
                              ? 'font-bold text-emerald-800'
                              : isActive
                              ? 'font-extrabold text-primary'
                              : 'font-semibold text-muted-foreground'
                          }`}
                          numberOfLines={1}
                        >
                          {step.name}
                        </Text>
                        {isActive && (
                          <Text className="text-[10px] text-indigo-600 font-medium" numberOfLines={1}>
                            {step.desc}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              <View className="items-center justify-center pt-1">
                <Text className="text-[11px] text-muted-foreground font-medium text-center">
                  Please wait while we prepare your offline database...
                </Text>
              </View>
            </>
          ) : (
            /* Big Celebratory Green Tick Card */
            <View className="items-center justify-center py-6 px-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl gap-3">
              <View className="w-20 h-20 rounded-full bg-emerald-500 items-center justify-center shadow-lg border-4 border-emerald-200">
                <Feather name="check" size={44} color="#FFFFFF" />
              </View>
              <Text className="text-base font-black text-emerald-900 text-center">
                All Steps Completed!
              </Text>
              <Text className="text-xs font-semibold text-emerald-700 text-center">
                Database synced successfully • Launching dashboard...
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
