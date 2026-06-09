import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface GlassHeaderProps {
  children?: React.ReactNode;
}

/**
 * GlassHeader Component
 * 
 * A header component with a glassmorphism effect (blur + translucency).
 * Features:
 * - 72px fixed height
 * - 60 intensity blur effect
 * - 200ms fade-in animation on mount
 * - Platform-optimized translucent background
 */
export default function GlassHeader({ children }: GlassHeaderProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    // 注入挂载动画：200ms 淡入
    opacity.value = withTiming(1, { duration: 200 });
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* 视觉还原：BlurView 模糊强度锁定为 60 */}
      <BlurView 
        intensity={60} 
        tint="light" 
        style={StyleSheet.absoluteFill} 
      />
      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10, // 严格遵循 Z-index 10
    height: 72, // 高度锁定为 72px
    // 视觉还原：背景设置为 rgba(255,255,255,0.3)
    // Android 端回退：若 Blur 不支持，此背景色也能提供基本的得体视觉
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // 样式清理：移除 Shadow, Border 等
    elevation: 0,
    shadowColor: 'transparent',
    borderBottomWidth: 0,
  },
  content: {
    paddingHorizontal: 24,
    height: 72, // 内容高度锁定为 72px
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 430,
  },
});
