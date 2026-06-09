import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from 'react-native-safe-area-context';    
import { LanguageProvider } from "../contexts/LanguageContext";       
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';      
import CustomDrawerContent from '../components/ui/CustomDrawerContent';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <BottomSheetModalProvider>
            <Drawer 
              drawerContent={(props) => <CustomDrawerContent {...props} />}
              screenOptions={{ 
                headerShown: false,
                drawerActiveBackgroundColor: 'rgba(99,102,241,0.08)',
                drawerActiveTintColor: COLORS.primary,
                drawerInactiveTintColor: COLORS.textSecondary,
                drawerStyle: { backgroundColor: COLORS.background, width: 280 }
              }}
            >
              <Drawer.Screen 
                name="index" 
                options={{ drawerLabel: '仪表盘 Dashboard', drawerIcon: ({color}) => <Feather name="home" size={24} color={color}/> }} 
              />
              <Drawer.Screen 
                name="courses" 
                options={{ drawerLabel: '课程 Courses', drawerIcon: ({color}) => <Feather name="book" size={24} color={color}/> }} 
              />
              <Drawer.Screen 
                name="members" 
                options={{ drawerLabel: '成员 Members', drawerIcon: ({color}) => <Feather name="users" size={24} color={color}/> }} 
              />
              <Drawer.Screen 
                name="logs" 
                options={{ drawerLabel: '打卡日志 Logs', drawerIcon: ({color}) => <Feather name="list" size={24} color={color}/> }} 
              />
            </Drawer>
          </BottomSheetModalProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
