import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from "react-native-gesture-handler"; 
import { SafeAreaProvider } from 'react-native-safe-area-context';     
import { LanguageProvider, useLanguage } from "../contexts/LanguageContext";        
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';       
import CustomDrawerContent from '../components/ui/CustomDrawerContent';
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
            <DrawerWrapper />
          </BottomSheetModalProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function DrawerWrapper() {
  const { t } = useLanguage();

  // 队列执行器：将离线操作同步回 Supabase
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

  // 初始化网络监听，联网时自动回放队列
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
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerType: 'front' as const,
        headerShown: false,
        drawerActiveBackgroundColor: 'rgba(99,102,241,0.08)',
        drawerActiveTintColor: COLORS.primary,
        drawerInactiveTintColor: COLORS.textSecondary,
        drawerStyle: { backgroundColor: COLORS.background, width: 280 }
      }}
    >
      <Drawer.Screen
        name="index"
        options={{ 
          drawerLabel: t.dashboard, 
          drawerIcon: ({color}) => <Feather name="home" size={24} color={color}/> 
        }}
      />
      <Drawer.Screen
        name="courses"
        options={{ 
          drawerLabel: t.courses, 
          drawerIcon: ({color}) => <Feather name="book" size={24} color={color}/> 
        }}
      />
      <Drawer.Screen
        name="members"
        options={{ 
          drawerLabel: t.members, 
          drawerIcon: ({color}) => <Feather name="users" size={24} color={color}/> 
        }}
      />
      <Drawer.Screen
        name="logs"
        options={{ 
          drawerLabel: t.logs, 
          drawerIcon: ({color}) => <Feather name="list" size={24} color={color}/> 
        }}
      />
    </Drawer>
  );
}
