import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { LogItem, ClassItem, Member } from '../../types';
import { COLORS } from '../../utils/colors';

interface LogListProps {
  logs: LogItem[];
  classes: ClassItem[];
  members: Member[];
}

const LogList: React.FC<LogListProps> = ({ logs, classes, members }) => {
  const { lang } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const renderLogItem = (log: LogItem, index: number) => {
    const classItem = classes.find(c => c.id === log.classId);
    const member = members.find(m => m.id === classItem?.memberId);      

    // Fallback parsing if classId lookup fails
    let avatar = member?.icon || '📝';
    let courseName = classItem?.name;
    let memberName = member?.name;

    if (!courseName) {
      const match = log.text.match(/\[(.*?)\] (.*?) ->/);
      if (match) {
        memberName = match[1];
        courseName = match[2];
        if (!member) {
           const foundMember = members.find(m => m.name === memberName);
           if (foundMember) avatar = foundMember.icon;
        }
      } else {
        courseName = log.text;
      }
    }

    return (
      <View key={log.id} style={styles.logItem}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{avatar}</Text>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.courseName} numberOfLines={1}>{courseName}</Text>
          <Text style={styles.subText}>{memberName || 'Member'} · {log.time}</Text>
        </View>
        <View style={styles.rightContainer}>
          <Text style={styles.changeText}>-1 {lang === 'zh-CN' ? '课时' : 'Session'}</Text>
          {classItem && (
             <Text style={styles.subText}>{lang === 'zh-CN' ? `剩余 ${classItem.totalLessons - classItem.doneLessons}` : `Remaining ${classItem.totalLessons - classItem.doneLessons}`}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.sectionTitle}>{lang === 'zh-CN' ? '近期打卡' : 'Recent Logs'}</Text>
      <View style={styles.listWrapper}>
        {logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyLogText}>{lang === 'zh-CN' ? '暂无打卡记录' : 'No recent logs'}</Text>
          </View>
        ) : (
          logs.slice(0, 5).map((log, index) => renderLogItem(log, index))
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  listWrapper: {
    gap: 16,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyLogText: {
    color: COLORS.textSecondary,
    fontSize: 14
  },
});

export default LogList;
