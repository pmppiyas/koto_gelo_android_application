import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SignInScreen } from '../../features/auth/screens/SignInScreen';
import { SignUpScreen } from '../../features/auth/screens/SignUpScreen';

export const AuthNavigator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'SignIn' | 'SignUp'>('SignIn');

  return (
    <View style={styles.container}>
      {currentScreen === 'SignIn' ? (
        <SignInScreen onNavigateToSignUp={() => setCurrentScreen('SignUp')} />
      ) : (
        <SignUpScreen onNavigateToSignIn={() => setCurrentScreen('SignIn')} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
