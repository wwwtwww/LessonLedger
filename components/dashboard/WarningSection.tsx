import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../utils/colors';
import { ClassItem, Member } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';

interface WarningCardProps {
  item: ClassItem;
  member?: Member;
  onCheckIn?: (classId: string) => void;
  lang: string;
}

const WarningCard: React.FC<WarningCardProps> = ({ item, member, onCheckIn, lang }) => {
  const remaining = item.totalLessons - item.doneLessons;

  const handleCheckIn = () => {
    triggerHaptic('light');
    if (onCheckIn) {
      onCheckIn(item.id);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.leftContent}>
        <View style={[styles.iconContainer, { backgroundColor: member?.themeColor ? `${member.themeColor}15` : '#F1F5F9' }]}>
          <Text style={styles.iconText}>{member?.icon || '📚'}</Text>
        </View>
        <View style={styles.textGroup}>
          <Text style={styles.className} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.memberText} numberOfLines={1}>{member?.name || 'Member'}</Text>
        </View>
      </View>

      <View style={styles.rightContent}>
        <Text style={styles.remainingText}>
          {lang === 'zh-CN' ? `剩余 ${remaining} ${item.unitType === 'session' ? '次' : '课时'}` : `Remaining ${remaining}`}
        </Text>
        <TouchableOpacity style={styles.checkInBtn} onPress={handleCheckIn}>
          <Text style={styles.checkInBtnText}>{lang === 'zh-CN' ? '打卡' : 'Check In'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface WarningSectionProps {
  classes: ClassItem[];
  members: Member[];
  themeColor?: string;
  onCheckIn?: (classId: string) => void;
}

const WarningSection: React.FC<WarningSectionProps> = ({ classes, members, onCheckIn }) => {
  const { lang } = useLanguage();

  const warningClasses = classes.filter(c => (c.totalLessons - c.doneLessons) <= 3 && (c.totalLessons - c.doneLessons) > 0);

  if (warningClasses.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{lang === 'zh-CN' ? '预警课程 (剩余 < 3)' : 'Warning (< 3)'}</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>{lang === 'zh-CN' ? '查看全部预警 >' : 'View All >'}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.list}>
        {warningClasses.map((item) => {
          const member = members.find(m => m.id === item.memberId);
          return (
            <WarningCard 
              key={item.id} 
              item={item} 
              member={member} 
              onCheckIn={onCheckIn}
              lang={lang}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  viewAllText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  textGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  memberText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  remainingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  checkInBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  checkInBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default WarningSection;
