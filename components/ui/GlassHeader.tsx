import React from 'react';
import { StyleSheet, View, Platform, StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/colors';

interface GlassHeaderProps {
  children?: React.ReactNode;
}

/**
 * 将 Hex 颜色转换为 rgba
 */
const hexToRGBA = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function GlassHeader({ children }: GlassHeaderProps) {
  const insets = useSafeAreaInsets();
  
  // 在 Android 上，我们通常依靠 StatusBar.currentHeight
  // 如果在 SafeAreaView 中使用，且该 SafeAreaView 已经处理了 paddingTop，
  // 这里的 absolute 定位组件需要小心处理偏移。
  // 理想情况下，GlassHeader 应该处理自己的安全区域，而外部不需要再加 paddingTop。
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : insets.top;

  return (
    <View style={[styles.container, { paddingTop }]}>
      <BlurView 
        intensity={Platform.OS === 'ios' ? 80 : 100} 
        tint="light" 
        style={StyleSheet.absoluteFill} 
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    // 为 Android 提供半透明回退背景
    backgroundColor: Platform.OS === 'android' ? hexToRGBA(COLORS.background, 0.85) : 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // 默认居中，但子组件可以覆盖
  },
});
