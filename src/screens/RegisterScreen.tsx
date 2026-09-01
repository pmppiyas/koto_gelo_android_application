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
import {
  isValidUsername,
  isValidPassword,
  isValidPhone,
} from '../utils/validation';

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
  const { signup, isLoading: authLoading, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  const isLoading = authLoading || localLoading;

  const handleRegister = async () => {
    setValidationError('');
    clearError();

    if (!isValidUsername(username)) {
      setValidationError('Username must be at least 3 characters.');
      return;
    }
    if (phone && !isValidPhone(phone)) {
      setValidationError(
        'Please enter a valid BD phone number (e.g. 017xxxxxxxx).',
      );
      return;
    }
    if (!isValidPassword(password)) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLocalLoading(true);
      await signup({
        username,
        password,
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setShowSuccess(true);
    } catch {
      setLocalLoading(false);
    }
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
                Create Account
              </Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                Start tracking your personal & mess expenses
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

            <View className="bg-card rounded-2xl p-4 border border-border shadow-xs gap-2.5">
              <View className="gap-1">
                <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Full Name (Optional)
                </Text>
                <View className="flex-row items-center bg-background border border-border rounded-xl px-3 h-10">
                  <Feather
                    name="user"
                    size={15}
                    color="#94A3B8"
                    style={{ marginRight: 8 }}
                  />
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
                <View className="flex-row items-center bg-background border border-border rounded-xl px-3 h-10">
                  <Feather
                    name="at-sign"
                    size={15}
                    color="#94A3B8"
                    style={{ marginRight: 8 }}
                  />
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
                <View className="flex-row items-center bg-background border border-border rounded-xl px-3 h-10">
                  <Feather
                    name="phone"
                    size={15}
                    color="#94A3B8"
                    style={{ marginRight: 8 }}
                  />
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
                <View className="flex-row items-center bg-background border border-border rounded-xl px-3 h-10">
                  <Feather
                    name="lock"
                    size={15}
                    color="#94A3B8"
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    className="flex-1 text-sm text-foreground h-full"
                    placeholder="Min 6 characters"
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
                onPress={handleRegister}
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </View>

            <View className="flex-row justify-center items-center mt-4 gap-1.5">
              <Text className="text-xs text-muted-foreground">
                Already have an account?
              </Text>
              <TouchableOpacity
                onPress={onNavigateToLogin}
                activeOpacity={0.7}
                className="py-1"
              >
                <Text className="text-xs font-bold text-primary">Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={showSuccess}
        title="Account Created!"
        subtitle={`Welcome to KotoGelo, @${username}`}
        type="DEFAULT"
        autoDismissMs={1400}
        onDismiss={() => {
          setShowSuccess(false);
          onRegisterSuccess?.();
          onNavigateToHome?.();
        }}
      />
    </SafeAreaView>
  );
};
