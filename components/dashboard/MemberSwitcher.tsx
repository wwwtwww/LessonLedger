import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Text, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { Member } from '../../types';
import { COLORS } from '../../utils/colors';
import { triggerHaptic } from '../../utils/haptics';

interface MemberSwitcherProps {
  members: Member[];
  currentId: string;
  onSelect: (id: string) => void;
  onAddPress?: () => void;
  onLongPress?: (member: Member) => void;
}

const ANIM_CONFIG = {
  duration: 300,
  easing: Easing.out(Easing.ease),
};

export default function MemberSwitcher({ members, currentId, onSelect, onAddPress, onLongPress }: MemberSwitcherProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <SelectableItem
          isActive={currentId === 'all'}
          onPress={() => onSelect('all')}
          icon="🌍"
          name="全部"
        />

        {members.map((member) => (
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
          <TouchableOpacity 
            onPress={onAddPress} 
            style={styles.addButton} 
            activeOpacity={0.7}
          >
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
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withTiming(isActive ? 1.08 : 1, ANIM_CONFIG) },
      ],
      borderWidth: withTiming(isActive ? 2 : 0, ANIM_CONFIG),
      backgroundColor: withTiming(
        isActive ? 'rgba(99,102,241,0.08)' : '#FFFFFF', 
        ANIM_CONFIG
      ),
      borderColor: isActive ? (activeColor || COLORS.primary) : 'transparent',
    };
  });

  const handlePress = () => {
    triggerHaptic('switchMember');
    onPress();
  };

  const handleLongPress = () => {
    if (onLongPress) {
      triggerHaptic('switchMember');
      onLongPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.9}
      style={styles.itemContainer}
    >
      <Animated.View style={[styles.item, animatedStyle]}>
        <Text style={styles.emoji}>{icon}</Text>
      </Animated.View>
      <Text style={[styles.name, isActive && styles.activeName]} numberOfLines={1}>
        {name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 24,
    height: 100, // 为下方文字留出空间
  },
  container: {
    paddingHorizontal: 24,
    alignItems: 'flex-start',
    gap: 16,
  },
  itemContainer: {
    alignItems: 'center',
    width: 72,
  },
  item: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    // 默认背景色在 Animated.View 中动态控制
  },
  emoji: {
    fontSize: 32,
  },
  name: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  activeName: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  addButton: {
    width: 72,
    alignItems: 'center',
  },
  addIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addIcon: {
    fontSize: 32,
    color: COLORS.textSecondary,
    fontWeight: '200',
  },
});
