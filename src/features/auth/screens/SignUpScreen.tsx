import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Screen } from '../../../components/layout/Screen';
import { AuthHeader } from '../components/AuthHeader';
import { Input } from '../../../components/ui/Input';
import { PasswordInput } from '../components/PasswordInput';
import { Button } from '../../../components/ui/Button';
import { ErrorMessage } from '../../../components/feedback/ErrorMessage';
import { useAuth } from '../hooks/useAuth';
import { validateSignUpForm } from '../schemas/signup.schema';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

export interface SignUpScreenProps {
  onNavigateToSignIn?: () => void;
  onSignUpSuccess?: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onNavigateToSignIn,
  onSignUpSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signup, loading, error, setError } = useAuth();

  const handleSignUp = async () => {
    const validation = validateSignUpForm({ username, email, phone, password });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    try {
      await signup({
        username,
        email: email || undefined,
        phone: phone || undefined,
        password,
      });
      onSignUpSuccess?.();
    } catch (e) {}
  };

  return (
    <Screen scrollable style={styles.container}>
      <AuthHeader
        title="Create Account"
        subtitle="Sign up to manage group and personal expenses"
      />

      {error ? <ErrorMessage message={error} onRetry={() => setError(null)} /> : null}

      <Input
        label="Username *"
        placeholder="e.g. john_doe"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        error={errors.username}
      />

      <Input
        label="Email (Optional)"
        placeholder="john@example.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        error={errors.email}
      />

      <Input
        label="Phone Number (Optional)"
        placeholder="+8801700000000"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        error={errors.phone}
      />

      <PasswordInput
        label="Password *"
        placeholder="At least 8 characters"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
      />

      <Button
        title="Sign Up"
        onPress={handleSignUp}
        loading={loading}
        style={styles.button}
      />

      {onNavigateToSignIn ? (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={onNavigateToSignIn}>
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    justifyContent: 'center',
  },
  button: {
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  linkText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.primary,
  },
});
