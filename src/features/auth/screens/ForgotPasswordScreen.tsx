import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Screen } from '../../../components/layout/Screen';
import { AuthHeader } from '../components/AuthHeader';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { ErrorMessage } from '../../../components/feedback/ErrorMessage';
import { authApi } from '../api/auth.api';
import { isValidEmail } from '../../../utils/validation';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';

export const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      setError('Please enter a valid email');
      return;
    }
    setError(null);
    try {
      setLoading(true);
      await authApi.forgotPassword(email);
      setIsSuccess(true);
    } catch (e: any) {
      setError(e.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable style={styles.container}>
      <AuthHeader
        title="Reset Password"
        subtitle="Enter your email to receive recovery instructions"
      />
      {error ? <ErrorMessage message={error} /> : null}
      {isSuccess ? (
        <Text style={styles.successText}>Password reset instructions sent to your email.</Text>
      ) : null}

      <Input
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Button
        title="Send Instructions"
        onPress={handleSubmit}
        loading={loading}
        style={styles.button}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  button: {
    marginTop: spacing.md,
  },
  successText: {
    color: colors.success,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
