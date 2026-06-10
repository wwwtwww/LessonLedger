import React from 'react';
import { StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useLanguage } from '../../contexts/LanguageContext';
import { Member } from '../../types';
import { log } from '../../utils/logger';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface AnimatedTabProps {
  isSelected: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  text: React.ReactNode;
  themeColor: string;
  defaultBgColor: string;
}

const AnimatedTab: React.FC<AnimatedTabProps> = ({ isSelected, onPress, onLongPress, text, themeColor, defaultBgColor }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(isSelected ? themeColor : defaultBgColor, { duration: 200 }),
      borderColor: withTiming(isSelected ? 'transparent' : '#E2E8F0', { duration: 200 }),
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      color: withTiming(isSelected ? '#FFFFFF' : '#64748B', { duration: 200 }),
    };
  });

  return (
    <AnimatedTouchableOpacity 
      style={[styles.memberTab, animatedStyle]} 
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Animated.Text style={[styles.memberTabText, textAnimatedStyle]}>
        {text}
      </Animated.Text>
    </AnimatedTouchableOpacity>
  );
};

interface MemberTabsProps {
  members: Member[];
  currentMemberId: string;
  onSelectMember: (id: string) => void;
  onAddMemberPress: () => void;
  onLongPressMember?: (member: Member) => void;
}

const MemberTabs: React.FC<MemberTabsProps> = ({
  members,
  currentMemberId,
  onSelectMember,
  onAddMemberPress,
  onLongPressMember,
}) => {
  const { t } = useLanguage();

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      style={styles.memberSelectorRow}
    >
      <AnimatedTab 
        isSelected={currentMemberId === 'all'}
        onPress={() => onSelectMember('all')}
        text={t.allMembers}
        themeColor="#0F172A"
        defaultBgColor="#FFFFFF"
      />
      {members.map(m => (
        <AnimatedTab 
          key={m.id}
          isSelected={currentMemberId === m.id}
          onPress={() => onSelectMember(m.id)}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onLongPressMember?.(m);
          }}
          text={`${m.icon} ${m.name}`}
          themeColor={m.themeColor}
          defaultBgColor="#FFFFFF"
        />
      ))}
      <TouchableOpacity 
        style={[styles.memberTab, styles.addMemberTab]} 
        onPress={() => {
          log.info('MemberTabs', 'Add Member pressed');
          onAddMemberPress();
        }}
      >
        <Text style={styles.addMemberTabText}>+ {t.addMember}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  memberSelectorRow: { flexDirection: 'row', marginBottom: 15, paddingBottom: 5 },
  memberTab: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginRight: 8, 
    height: 38 
  },
  memberTabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  addMemberTab: { borderStyle: 'dashed', backgroundColor: 'transparent' },
  addMemberTabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
});

export default MemberTabs;