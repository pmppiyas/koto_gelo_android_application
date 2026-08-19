import React, { useState } from 'react';
import { Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, KeyboardAvoidingView, Button } from '../components/ui';
import { Logo } from '../components/common/Logo';
import { Loading } from '../components/common/Loading';
import { useAuth } from '../store/hooks';
import { isValidUsername, isValidPassword, isValidPhone } from '../utils/validation';

export interface RegisterScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToHome: () => void;
  onRegisterSuccess?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onNavigateToLogin,
  onNavigateToHome,
  onRegisterSuccess,
}) => {
  const { signup, isLoading, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleRegister = async () => {
    setValidationError('');
    clearError();

    if (!isValidUsername(username)) {
      setValidationError('Username must be at least 3 characters.');
      return;
    }
    if (phone && !isValidPhone(phone)) {
      setValidationError('Please enter a valid BD phone number (e.g. 017xxxxxxxx).');
      return;
    }
    if (!isValidPassword(password)) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    try {
      await signup({ 
        username, 
        password,
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      onRegisterSuccess?.();
    } catch (err) {}
  };

  const displayError = validationError || error;

  return (
    <SafeAreaView className="flex-1 bg-background relative">
      {isLoading && (
        <Loading
          isOverlay
          message="Creating your account..."
          subtitle="Setting up your personal finance workspace"
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
            <Text className="text-xl font-black text-foreground">Create Account</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">Start tracking your personal & mess expenses</Text>
          </View>

          {displayError ? (
            <View className="flex-row items-center gap-2 bg-rose-50 p-3 rounded-xl mb-3.5 border border-rose-200">
              <Feather name="alert-circle" size={15} color="#EF4444" />
              <Text className="text-xs text-destructive font-medium flex-1">{displayError}</Text>
            </View>
          ) : null}

          <View className="bg-card rounded-2xl p-5 border border-border shadow-xs gap-3">
            <View className="gap-1">
              <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Full Name (Optional)
              </Text>
              <View className="flex-row items-center bg-background border border-border rounded-xl px-3 h-11">
                <Feather name="user" size={15} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 text-sm text-foreground h-full"
                  placeholder="e.g. Tanvir Ahmed"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View className="gap-1">
              <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Username *
              </Text>
              <View className="flex-row items-center bg-background border border-border rounded-xl px-3 h-11">
                <Feather name="at-sign" size={15} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 text-sm text-foreground h-full"
                  placeholder="e.g. tanvir99"
                  placeholderTextColor="#94A3B8"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View className="gap-1">
              <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Phone Number (Optional)
              </Text>
              <View className="flex-row items-center bg-background border border-border rounded-xl px-3 h-11">
                <Feather name="phone" size={15} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 text-sm text-foreground h-full"
                  placeholder="017xxxxxxxx"
                  placeholderTextColor="#94A3B8"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View className="gap-1">
              <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Password *
              </Text>
              <View className="flex-row items-center bg-background border border-border rounded-xl px-3 h-11">
                <Feather name="lock" size={15} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 text-sm text-foreground h-full"
                  placeholder="Min 6 characters"
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
              onPress={handleRegister}
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </View>

          <View className="flex-row justify-center items-center mt-6 gap-1.5">
            <Text className="text-xs text-muted-foreground">Already have an account?</Text>
            <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7} className="py-1">
              <Text className="text-xs font-bold text-primary">Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
