import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../../components/layout/Screen';
import { Header } from '../../../components/layout/Header';
import { Input } from '../../../components/ui/Input';
import { TextArea } from '../../../components/ui/TextArea';
import { Button } from '../../../components/ui/Button';
import { useGroups } from '../hooks/useGroups';
import { validateCreateGroup } from '../schemas/createGroup.schema';
import { spacing } from '../../../theme/spacing';

export const CreateGroupScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addGroup, loading } = useGroups();

  const handleSave = async () => {
    const validation = validateCreateGroup({ name });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});

    try {
      await addGroup({
        name,
        description,
        currency: 'BDT',
        type: 'OTHER',
      });
    } catch (e) {}
  };

  return (
    <Screen scrollable>
      <Header title="Create Group" />
      <View style={styles.container}>
        <Input
          label="Group Name"
          placeholder="e.g. Goa Trip 2026"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />
        <TextArea
          label="Description (Optional)"
          placeholder="What is this group for?"
          value={description}
          onChangeText={setDescription}
        />
        <Button
          title="Create Group"
          onPress={handleSave}
          loading={loading}
          style={styles.button}
        />
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
