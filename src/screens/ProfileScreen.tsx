import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Button } from '../components/ui';
import { useAuth } from '../store/hooks';
import { appConfig } from '../config/appConfig';
import { BOTTOM_TAB_HEIGHT, spacing } from '../constants/spacing';

export interface ProfileScreenProps {
  onNavigateToHome: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigateToHome }) => {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineEnabled, setOfflineEnabled] = useState(true);

  const handleLogout = async () => {
    await logout();
    onNavigateToHome();
  };

  const displayName = user?.name || user?.username || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-4"
        contentContainerStyle={{ paddingBottom: BOTTOM_TAB_HEIGHT + spacing.sm }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-card rounded-3xl p-6 items-center border border-border shadow-sm">
          <View className="w-20 h-20 rounded-full bg-primary-light border-2 border-primary items-center justify-center mb-3">
            <Text className="text-3xl font-extrabold text-primary">{initial}</Text>
          </View>
          <Text className="text-xl font-bold text-foreground">{displayName}</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">@{user?.username}</Text>
          {user?.phone ? (
            <View className="flex-row items-center gap-1.5 mt-2 bg-muted px-3 py-1 rounded-full">
              <Feather name="phone" size={12} color="#64748B" />
              <Text className="text-xs text-muted-foreground">{user.phone}</Text>
            </View>
          ) : null}
        </View>

        <View className="gap-2">
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
            PREFERENCES
          </Text>
          <View className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center">
                  <Feather name="bell" size={16} color="#2563EB" />
                </View>
                <Text className="text-sm font-semibold text-foreground">Notifications</Text>
              </View>
              <TouchableOpacity
                className={`w-11 h-6 rounded-full p-0.5 justify-center ${
                  notificationsEnabled ? 'bg-primary items-end' : 'bg-muted items-start'
                }`}
                onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                activeOpacity={0.8}
              >
                <View className="w-5 h-5 rounded-full bg-white shadow-sm" />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-lg bg-emerald-50 items-center justify-center">
                  <Feather name="cloud-off" size={16} color="#10B981" />
                </View>
                <Text className="text-sm font-semibold text-foreground">Offline Mode Sync</Text>
              </View>
              <TouchableOpacity
                className={`w-11 h-6 rounded-full p-0.5 justify-center ${
                  offlineEnabled ? 'bg-emerald-600 items-end' : 'bg-muted items-start'
                }`}
                onPress={() => setOfflineEnabled(!offlineEnabled)}
                activeOpacity={0.8}
              >
                <View className="w-5 h-5 rounded-full bg-white shadow-sm" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
            ABOUT & SUPPORT
          </Text>
          <View className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-border" activeOpacity={0.7}>
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-lg bg-purple-50 items-center justify-center">
                  <Feather name="help-circle" size={16} color="#8B5CF6" />
                </View>
                <Text className="text-sm font-semibold text-foreground">Help & FAQ</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between p-4" activeOpacity={0.7}>
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-lg bg-slate-100 items-center justify-center">
                  <Feather name="info" size={16} color="#64748B" />
                </View>
                <Text className="text-sm font-semibold text-foreground">App Version</Text>
              </View>
              <Text className="text-xs font-bold text-muted-foreground">{appConfig.version || 'v1.0.0'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Button
          variant="destructive"
          className="w-full py-3.5 rounded-2xl mt-2"
          onPress={handleLogout}
        >
          Log Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};
