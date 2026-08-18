import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../../components/layout/Screen';
import { Header } from '../../../components/layout/Header';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { spacing } from '../../../theme/spacing';

export const EditProfileScreen: React.FC = () => {
  const [name, setName] = useState('John Doe');
  const [phone, setPhone] = useState('+8801700000000');

  return (
    <Screen scrollable>
      <Header title="Edit Profile" />
      <View style={styles.container}>
        <Input label="Full Name" value={name} onChangeText={setName} />
        <Input label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Button title="Save Profile" onPress={() => {}} style={styles.button} />
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
