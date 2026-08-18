import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Input, InputProps } from '../../../components/ui/Input';
import { colors } from '../../../theme/colors';

export const PasswordInput: React.FC<InputProps> = (props) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      secureTextEntry={!showPassword}
      rightIcon={
        <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
          <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      }
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  toggleText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
