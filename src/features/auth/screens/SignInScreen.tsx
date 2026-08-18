import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Screen } from '../../../components/layout/Screen';
import { AuthHeader } from '../components/AuthHeader';
import { Input } from '../../../components/ui/Input';
import { PasswordInput } from '../components/PasswordInput';
import { Button } from '../../../components/ui/Button';
import { ErrorMessage } from '../../../components/feedback/ErrorMessage';
import { useAuth } from '../hooks/useAuth';
import { validateSignInForm } from '../schemas/signin.schema';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

export interface SignInScreenProps {
  onNavigateToSignUp?: () => void;
  onSignInSuccess?: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onNavigateToSignUp,
  onSignInSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signin, loading, error, setError } = useAuth();

  const handleSignIn = async () => {
    const validation = validateSignInForm({ username, password });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    try {
      await signin({ username, password });
      onSignInSuccess?.();
    } catch (e) {}
  };

  return (
    <Screen scrollable style={styles.container}>
      <AuthHeader
        title="Welcome Back"
        subtitle="Sign in to your KotoGelo account"
      />

      {error ? <ErrorMessage message={error} onRetry={() => setError(null)} /> : null}

      <Input
        label="Username"
        placeholder="e.g. john_doe"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        error={errors.username}
      />

      <PasswordInput
        label="Password"
        placeholder="At least 8 characters"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
      />

      <Button
        title="Sign In"
        onPress={handleSignIn}
        loading={loading}
        style={styles.button}
      />

      {onNavigateToSignUp ? (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={onNavigateToSignUp}>
            <Text style={styles.linkText}>Sign Up</Text>
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
