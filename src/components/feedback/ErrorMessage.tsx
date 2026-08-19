import React from 'react';
import { View, Text, Button } from '../ui';

export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <View className="p-4 bg-destructive/10 rounded-2xl border border-destructive/20 items-center justify-center m-4">
      <Text className="text-xs font-semibold text-destructive text-center mb-2 leading-relaxed">
        {message}
      </Text>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="rounded-full px-4 py-1.5"
          onPress={onRetry}
        >
          Retry
        </Button>
      )}
    </View>
  );
};
