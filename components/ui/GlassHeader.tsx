import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GlassHeaderProps {
  children?: React.ReactNode;
}

/**
 * 极简透明 Header 容器
 * 遵循 LESSONLEDGER_LAYOUT_SPEC.md 规范
 */
export default function GlassHeader({ children }: GlassHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>    
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 100,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 0, 
    height: 72, // 规范要求 72
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 430, // 规范要求最大内容宽度 430
  },
});
