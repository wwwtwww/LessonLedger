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
  const { t } = useLanguage();
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

    if (!courseName) {
      // Try to parse from text: [Member] Course -> ...
      const match = log.text.match(/\[(.*?)\] (.*?) ->/);
      if (match) {
        courseName = match[2];
        if (!member) {
           const foundMember = members.find(m => m.name === match[1]);
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
          <Text style={styles.timestamp}>{log.time}</Text>
        </View>
        <View style={styles.divider} />
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.sectionTitle}>{t.recentLogs}</Text>
      <View style={styles.listWrapper}>
        {logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyLogText}>{t.noLog}</Text>
          </View>
        ) : (
          logs.map((log, index) => renderLogItem(log, index))
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    // marginBottom removed to rely on parent's gap
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600', // SemiBold
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  listWrapper: {
  },
  logItem: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 13,
    fontWeight: '400', // Regular
    color: COLORS.textSecondary,
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: 56, // Start after avatar (40 width + 16 margin)
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyLogText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 14
  },
});

export default LogList;
