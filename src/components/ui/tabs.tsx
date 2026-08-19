import React, { createContext, useContext } from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { cn } from '../../lib/utils';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType>({
  value: '',
  onValueChange: () => {},
});

export const Tabs: React.FC<{
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}> = ({ value, onValueChange, children, className, style }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <View style={cn('flex-1 flex-col', className, style)}>{children}</View>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}> = ({ children, className, style }) => {
  return (
    <View
      style={cn(
        'flex-row items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1',
        className,
        style
      )}
    >
      {children}
    </View>
  );
};

export const TabsTrigger: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
}> = ({ value, children, className, textClassName }) => {
  const context = useContext(TabsContext);
  const isActive = context.value === value;

  return (
    <TouchableOpacity
      style={cn(
        'flex-1 py-2 px-3 items-center justify-center rounded-lg transition-all',
        isActive ? 'bg-white shadow-sm border border-slate-200' : 'bg-transparent',
        className
      )}
      onPress={() => context.onValueChange(value)}
      activeOpacity={0.7}
    >
      {typeof children === 'string' ? (
        <Text
          style={cn(
            'text-xs',
            isActive ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium',
            textClassName
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

export const TabsContent: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}> = ({ value, children, className, style }) => {
  const context = useContext(TabsContext);
  if (context.value !== value) return null;

  return <View style={cn('flex-1 pt-2', className, style)}>{children}</View>;
};
