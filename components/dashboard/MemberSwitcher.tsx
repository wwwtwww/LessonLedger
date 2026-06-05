import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Member } from '../../types';
import { COLORS } from '../../utils/colors';

interface MemberSwitcherProps {
  members: Member[];
  currentId: string;
  onSelect: (id: string) => void;
  onAddPress?: () => void;
  onLongPress?: (member: Member) => void;
}

// 统一的 Spring 配置，让动画更清脆
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
};

export default function MemberSwitcher({ members, currentId, onSelect, onAddPress, onLongPress }: MemberSwitcherProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* 全部按钮也应用动画 */}
        <SelectableItem
          isActive={currentId === 'all'}
          onPress={() => onSelect('all')}
          icon="🌍"
          name="全部"
        />

        {members.map(member => (
          <SelectableItem
            key={member.id}
            isActive={currentId === member.id}
            onPress={() => onSelect(member.id)}
            onLongPress={() => onLongPress?.(member)}
            icon={member.icon}
            name={member.name}
            activeColor={member.themeColor}
          />
        ))}

        {onAddPress && (
          <TouchableOpacity onPress={onAddPress} style={styles.addButton} activeOpacity={0.7}>
            <View style={styles.addIconContainer}>
              <Text style={styles.addIcon}>+</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

interface SelectableItemProps {
  isActive: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  icon: string;
  name: string;
  activeColor?: string;
}

function SelectableItem({ isActive, onPress, onLongPress, icon, name, activeColor }: SelectableItemProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isActive ? 1.1 : 1, SPRING_CONFIG) }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <Animated.View style={[
        styles.item,
        isActive && { borderColor: activeColor || COLORS.primary },
        animatedStyle
      ]}>
        <Text style={styles.emoji}>{icon}</Text>
        <Text
          style={[styles.name, isActive && styles.activeName]}
          numberOfLines={1}
        >
          {name}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 12,
  },
  container: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  item: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
    // 增强阴影细腻度，更符合现代 iOS/Android 设计
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  activeItem: {
    borderColor: COLORS.primary,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textLight,
  },
  activeName: {
    color: COLORS.text,
    fontWeight: '700',
  },
  addButton: {
    marginLeft: 4,
  },
  addIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  addIcon: {
    fontSize: 24,
    color: COLORS.textLight,
    fontWeight: '300',
  },
});
