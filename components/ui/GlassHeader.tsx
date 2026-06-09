import React from 'react';
import { StyleSheet, View } from 'react-native';

interface GlassHeaderProps {
  children?: React.ReactNode;
}

export default function GlassHeader({ children }: GlassHeaderProps) {
  return (
    <View style={styles.container}>    
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
    height: 72, // 容器高度严格为 72
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    height: 72, // 内容高度严格为 72
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 600,
  },
});

