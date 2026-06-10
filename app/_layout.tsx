import { Tabs } from 'expo-router';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider, useLanguage } from "../contexts/LanguageContext";
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import { useEffect } from 'react';
import { initNetworkListener, useNetwork } from '../hooks/useNetwork';
import { syncQueue, SyncOperation } from '../utils/syncQueue';
import { supabase } from '../utils/supabase';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <BottomSheetModalProvider>
            <TabsWrapper />
          </BottomSheetModalProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function TabsWrapper() {
  const { t } = useLanguage();

  const executeSyncOp = async (op: SyncOperation): Promise<boolean> => {
    try {
      if (op.type === 'insert') {
        const { error } = await supabase.from(op.table).insert([op.payload]).select();
        return !error;
      } else if (op.type === 'update') {
        const { id, ...data } = op.payload;
        const { error } = await supabase.from(op.table).update(data).eq('id', id);
        return !error;
      } else if (op.type === 'delete') {
        const { id } = op.payload;
        const { error } = await supabase.from(op.table).delete().eq('id', id);
        return !error;
      }
      return false;
    } catch {
      return false;
    }
  };

  const { onNetworkChange } = useNetwork();

  useEffect(() => {
    initNetworkListener();
    const unsub = onNetworkChange((isConnected) => {
      if (isConnected) {
        syncQueue.flush(executeSyncOp);
      }
    });
    return unsub;
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: '#E2E8F0',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: t.tabHome,
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          tabBarLabel: t.tabCourses,
          tabBarIcon: ({ color }) => <Feather name="book" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: t.tabProfile,
          tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
