import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
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

const ANIMATION_DURATION = 300;
const ANIMATION_EASING = Easing.out(Easing.ease);

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
          isFirst
        />

        {members.map((member) => (
          <SelectableItem
            key={member.id}
            isActive={currentId === member.id}
            onPress={() => onSelect(member.id)}
            onLongPress={() => onLongPress?.(member)}
            icon={member.icon}
            name={member.name}
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
  isFirst?: boolean;
}

function SelectableItem({ isActive, onPress, onLongPress, icon, name, isFirst }: SelectableItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          scale: withTiming(isActive ? 1.08 : 1, { 
            duration: ANIMATION_DURATION,
            easing: ANIMATION_EASING
          }) 
        },
      ],
      borderWidth: withTiming(isActive ? 2 : 0, {
        duration: ANIMATION_DURATION,
        easing: ANIMATION_EASING
      }),
      borderColor: isActive ? COLORS.primary : 'transparent',
      backgroundColor: withTiming(isActive ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 1)', {
        duration: ANIMATION_DURATION,
        easing: ANIMATION_EASING
      }),
    };
  });

  const handlePress = () => {
    triggerHaptic('light');
    onPress();
  };

  const handleLongPress = () => {
    if (onLongPress) {
      triggerHaptic('light');
      onLongPress();
    }
  };

  return (
    <Animated.View style={[
      styles.item,
      !isFirst && { marginLeft: 16 },
      animatedStyle
    ]}>
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.9}
        style={styles.touchable}
      >
        <Text style={styles.emoji}>{icon}</Text>
        <Text
          style={[styles.name, isActive && styles.activeName]}
          numberOfLines={1}
        >
          {name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 24,
    height: 88,
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  touchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  item: {
    width: 72,
    height: 72,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  emoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textLight,
  },
  activeName: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  addButton: {
    marginLeft: 16,
  },
  addIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  addIcon: {
    fontSize: 28,
    color: COLORS.textLight,
    fontWeight: '300',
  },
});
