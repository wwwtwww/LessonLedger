import React, { useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface GlassHeaderProps {
  children?: React.ReactNode;
}

export const GLASS_HEADER_HEIGHT = 64;

/**
 * GlassHeader Component
 *
 * - Native: position absolute, floats over scroll content (with BlurView)
 * - Web: position relative, in normal flow (no paddingTop hack needed), subtle border bottom
 * - Height unified to 64px
 */
export default function GlassHeader({ children }: GlassHeaderProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {Platform.OS !== 'web' && (
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
      )}
      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
}

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  container: {
    ...(isWeb
      ? {
          position: 'relative' as const,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(226,232,240,0.8)',
          backgroundColor: 'rgba(255,255,255,0.97)',
        }
      : {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          elevation: 0,
          shadowColor: 'transparent',
        }),
    height: GLASS_HEADER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: 24,
    height: GLASS_HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 860,
    alignSelf: 'center',
  },
});
