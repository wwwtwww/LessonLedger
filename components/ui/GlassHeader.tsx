import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
    // 为 Android 提供半透明回退背景，确保内容滚动时文字清晰
    backgroundColor: Platform.OS === 'android' ? hexToRGBA(COLORS.background, 0.9) : 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    alignItems: 'center', // 关键修复：强制父容器在水平方向居中其子元素
  },
  content: {
    paddingHorizontal: 20,
    height: 60, // 固定的内容高度，便于外部计算 OFFSET
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 600,
  },
});

