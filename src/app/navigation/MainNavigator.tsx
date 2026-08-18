import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TabNavigator } from './TabNavigator';

export const MainNavigator: React.FC = () => {
  return (
    <View style={styles.container}>
      <TabNavigator />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
