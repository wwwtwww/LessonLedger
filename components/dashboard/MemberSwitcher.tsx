import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
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

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 120,
};

export default function MemberSwitcher({ members, currentId, onSelect, onAddPress, onLongPress }: MemberSwitcherProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
        clipChildren={false}
      >
        <SelectableItem
          isActive={currentId === 'all'}
          onPress={() => onSelect('all')}
          icon="🌍"
          name="全部"
          isFirst
        />

        {members.map((member, index) => (
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
            style={[styles.addButton, { marginLeft: -12 }]} 
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
  isFirst?: boolean;
}

function SelectableItem({ isActive, onPress, onLongPress, icon, name, activeColor, isFirst }: SelectableItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withSpring(isActive ? 1.05 : 1, SPRING_CONFIG) },
        { translateY: withSpring(isActive ? -4 : 0, SPRING_CONFIG) },
      ],
      zIndex: isActive ? 10 : 1,
    };
  });

  const handlePress = () => {
    triggerHaptic('impactLight');
    onPress();
  };

  const handleLongPress = () => {
    if (onLongPress) {
      triggerHaptic('selection');
      onLongPress();
    }
  };

  return (
    <Animated.View style={[
      styles.itemWrapper,
      !isFirst && { marginLeft: -12 },
      animatedStyle
    ]}>
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.9}
        style={styles.touchable}
      >
        <BlurView
          intensity={isActive ? 90 : 60}
          tint="light"
          style={[
            styles.item,
            { borderColor: isActive ? (activeColor || COLORS.primary) : 'transparent' }
          ]}
        >
          <Text style={styles.emoji}>{icon}</Text>
          <Text
            style={[styles.name, isActive && styles.activeName]}
            numberOfLines={1}
          >
            {name}
          </Text>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
    overflow: 'visible',
  },
  container: {
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingBottom: 8, // 为 translateY 提供空间
  },
  itemWrapper: {
    // 移除所有阴影以遵循极简规范
  },
  touchable: {
    borderRadius: 24,
  },
  item: {
    width: 86,
    height: 100,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  emoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  activeName: {
    color: COLORS.text,
    fontWeight: '700',
  },

  addButton: {
    zIndex: 0,
  },
  addIconContainer: {
    width: 60,
    height: 100,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  addIcon: {
    fontSize: 32,
    color: COLORS.textLight,
    fontWeight: '200',
  },
});
