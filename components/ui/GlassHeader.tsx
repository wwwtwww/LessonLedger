import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/colors';

interface GlassHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
}

export default function GlassHeader({ title, rightElement }: GlassHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {rightElement}
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
    backgroundColor: Platform.OS === 'android' ? 'rgba(248, 250, 252, 0.9)' : 'transparent',
  },
  content: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
});
