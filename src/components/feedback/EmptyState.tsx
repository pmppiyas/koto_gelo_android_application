import React from 'react';
import { View, Text, Button } from '../ui';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionTitle,
  onAction,
  icon,
}) => {
  return (
    <View className="p-6 items-center justify-center">
      {icon ? <View className="mb-3">{icon}</View> : null}
      <Text className="text-base font-bold text-foreground text-center mb-1">{title}</Text>
      {description ? (
        <Text className="text-xs text-muted-foreground text-center leading-relaxed mb-4">
          {description}
        </Text>
      ) : null}
      {actionTitle && onAction ? (
        <Button
          variant="default"
          className="rounded-full px-5 py-2.5"
          onPress={onAction}
        >
          {actionTitle}
        </Button>
      ) : null}
    </View>
  );
};
