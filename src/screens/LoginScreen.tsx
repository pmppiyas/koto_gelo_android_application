import React, { useState } from 'react';
import { Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Button,
} from '../components/ui';
import { Logo } from '../components/common/Logo';
import { SuccessModal } from '../components/common/SuccessModal';
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
  const [showSuccess, setShowSuccess] = useState(false);

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
      setShowSuccess(true);
    } catch {}
  };

  const displayError = validationError || error;

  return (
    <SafeAreaView className="flex-1 bg-background relative">

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          contentContainerClassName="px-4 py-2 justify-center flex-grow w-full"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-[420px] self-center">
            <View className="items-center mb-3">
              <Logo size="sm" showSubtitle={false} className="mb-2" />
              <Text className="text-xl font-black text-foreground">
                Welcome Back
              </Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                Sign in to your account
              </Text>
            </View>

            {displayError ? (
              <View className="flex-row items-center gap-2 bg-rose-50 p-2.5 rounded-xl mb-3 border border-rose-200">
                <Feather name="alert-circle" size={15} color="#EF4444" />
                <Text className="text-xs text-destructive font-medium flex-1">
                  {displayError}
                </Text>
              </View>
            ) : null}

            <View className="bg-card rounded-2xl p-4 border border-border shadow-xs gap-3">
              <View className="gap-1">
                <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Username
                </Text>
                <View className="flex-row items-center bg-background border border-border rounded-xl px-3 h-11">
                  <Feather
                    name="user"
                    size={15}
                    color="#94A3B8"
                    style={{ marginRight: 8 }}
                  />
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
                  <Feather
                    name="lock"
                    size={15}
                    color="#94A3B8"
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    className="flex-1 text-sm text-foreground h-full"
                    placeholder="Enter password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                    className="p-1"
                  >
                    <Feather
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={15}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <Button
                variant="default"
                className="w-full py-3 rounded-xl mt-1 bg-primary"
                textClassName="text-white font-bold text-sm"
                onPress={handleLogin}
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </View>

            <View className="flex-row justify-center items-center mt-4 gap-1.5">
              <Text className="text-xs text-muted-foreground">
                Don't have an account?
              </Text>
              <TouchableOpacity
                onPress={onNavigateToRegister}
                activeOpacity={0.7}
                className="py-1"
              >
                <Text className="text-xs font-bold text-primary">Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={showSuccess}
        title="Welcome Back!"
        subtitle={`Signed in as @${username}`}
        type="DEFAULT"
        autoDismissMs={1400}
        onDismiss={() => {
          setShowSuccess(false);
          onLoginSuccess?.();
          onNavigateToHome?.();
        }}
      />
    </SafeAreaView>
  );
};
