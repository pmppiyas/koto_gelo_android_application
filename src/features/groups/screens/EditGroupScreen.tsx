import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../../components/layout/Screen';
import { Header } from '../../../components/layout/Header';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { spacing } from '../../../theme/spacing';

export const EditGroupScreen: React.FC = () => {
  const [name, setName] = useState('');

  return (
    <Screen scrollable>
      <Header title="Edit Group" />
      <View style={styles.container}>
        <Input label="Group Name" value={name} onChangeText={setName} />
        <Button title="Save Changes" onPress={() => {}} style={styles.button} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  button: {
    marginTop: spacing.md,
  },
});
