import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
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

/**
 * 物理动效配置
 * Damping: 20, Stiffness: 180
 */
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 180,
  mass: 1,
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
        { scale: withSpring(isActive ? 1.08 : 1, SPRING_CONFIG) },
      ],
      borderWidth: withSpring(isActive ? 2 : 0, SPRING_CONFIG),
      backgroundColor: withSpring(
        isActive ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,1)',
        SPRING_CONFIG
      ),
      borderColor: withSpring(
        isActive ? (activeColor || COLORS.primary) : 'transparent',
        SPRING_CONFIG
      ),
    };
  });

  const handlePress = () => {
    // 切换成员时触发 medium impact
    triggerHaptic('switchMember');
    onPress();
  };

  const handleLongPress = () => {
    if (onLongPress) {
      triggerHaptic('medium');
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
        <Text style={[styles.name, isActive && styles.activeName]} numberOfLines={1}>
          {name}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 88,
  },
  container: {
    paddingRight: 24,
    alignItems: 'center', // 垂直居中确保缩放时不被裁剪
    gap: 16,
  },
  itemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 88,
  },
  item: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  name: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeName: {
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  addButton: {
    width: 72,
    height: 88,
    justifyContent: 'center',
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
