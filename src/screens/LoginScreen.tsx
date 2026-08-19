import React, { useState } from 'react';
import { Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, KeyboardAvoidingView, Button } from '../components/ui';
import { Logo } from '../components/common/Logo';
import { Loading } from '../components/common/Loading';
import { useAuth } from '../store/hooks';
import { isValidUsername, isValidPassword } from '../utils/validation';

export interface LoginScreenProps {
  onNavigateToRegister: () => void;
  onNavigateToHome: () => void;
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateToRegister,
  onNavigateToHome,
  onLoginSuccess,
}) => {
  const { signin, isLoading, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleLogin = async () => {
    setValidationError('');
    clearError();

    if (!isValidUsername(username)) {
      setValidationError('Please enter a valid username (min 3 chars).');
      return;
    }
    if (!isValidPassword(password)) {
      setValidationError('Please enter a valid password (min 6 chars).');
      return;
    }

    try {
      await signin({ username, password });
      onLoginSuccess?.();
    } catch (err) {}
  };

  const displayError = validationError || error;

  return (
    <SafeAreaView className="flex-1 bg-background relative">
      {isLoading && (
        <Loading
          isOverlay
          message="Signing into your account..."
          subtitle="Verifying credentials & syncing your data"
        />
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="px-6 py-4 justify-center min-h-full max-w-[420px] self-center w-full" showsVerticalScrollIndicator={false}>
          <TouchableOpacity className="flex-row items-center gap-1.5 self-start mb-4 py-1" onPress={onNavigateToHome}>
            <Feather name="arrow-left" size={16} color="#64748B" />
            <Text className="text-xs font-semibold text-muted-foreground">Back to Home</Text>
          </TouchableOpacity>

          <View className="items-center mb-5">
            <Logo size="sm" showSubtitle={false} className="mb-2.5" />
            <Text className="text-xl font-black text-foreground">Welcome Back</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">Sign in to your account</Text>
          </View>

          {displayError ? (
            <View className="flex-row items-center gap-2 bg-rose-50 p-3 rounded-xl mb-3.5 border border-rose-200">
              <Feather name="alert-circle" size={15} color="#EF4444" />
              <Text className="text-xs text-destructive font-medium flex-1">{displayError}</Text>
            </View>
          ) : null}

          <View className="bg-card rounded-2xl p-5 border border-border shadow-xs gap-3.5">
            <View className="gap-1">
              <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Username
              </Text>
              <View className="flex-row items-center bg-background border border-border rounded-xl px-3 h-11">
                <Feather name="user" size={15} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 text-sm text-foreground h-full"
                  placeholder="Enter username"
                  placeholderTextColor="#94A3B8"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View className="gap-1">
              <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Password
              </Text>
              <View className="flex-row items-center bg-background border border-border rounded-xl px-3 h-11">
                <Feather name="lock" size={15} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 text-sm text-foreground h-full"
                  placeholder="Enter password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7} className="p-1">
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={15} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            <Button
              variant="default"
              className="w-full py-3 rounded-xl mt-1.5 bg-primary"
              textClassName="text-white font-bold text-xs"
              onPress={handleLogin}
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </View>

          <View className="flex-row justify-center items-center mt-6 gap-1.5">
            <Text className="text-xs text-muted-foreground">Don't have an account?</Text>
            <TouchableOpacity onPress={onNavigateToRegister} activeOpacity={0.7} className="py-1">
              <Text className="text-xs font-bold text-primary">Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
