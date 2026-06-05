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

export default function MemberSwitcher({ members, currentId, onSelect, onAddPress, onLongPress }: MemberSwitcherProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.container}
      >
        <TouchableOpacity 
          onPress={() => onSelect('all')}
          activeOpacity={0.7}
        >
          <View style={[
            styles.item, 
            currentId === 'all' && styles.activeItem
          ]}>
            <Text style={styles.emoji}>🌍</Text>
            <Text style={[styles.name, currentId === 'all' && styles.activeName]}>全部</Text>
          </View>
        </TouchableOpacity>
        
        {members.map(member => (
          <MemberItem 
            key={member.id} 
            member={member} 
            isActive={currentId === member.id} 
            onPress={() => onSelect(member.id)} 
            onLongPress={() => onLongPress?.(member)}
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

function MemberItem({ member, isActive, onPress, onLongPress }: { 
  member: Member; 
  isActive: boolean; 
  onPress: () => void; 
  onLongPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isActive ? 1.1 : 1) }],
  }));

  return (
    <TouchableOpacity 
      onPress={onPress} 
      onLongPress={onLongPress} 
      activeOpacity={0.8}
    >
      <Animated.View style={[
        styles.item, 
        isActive && { borderColor: member.themeColor || COLORS.primary }, 
        animatedStyle
      ]}>
        <Text style={styles.emoji}>{member.icon}</Text>
        <Text 
          style={[styles.name, isActive && styles.activeName]} 
          numberOfLines={1}
        >
          {member.name}
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
    minWidth: 70,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.textLight,
  },
  addIcon: {
    fontSize: 24,
    color: COLORS.textLight,
    fontWeight: '300',
  },
});
