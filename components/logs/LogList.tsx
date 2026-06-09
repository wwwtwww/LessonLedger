import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext'; 
import { LogItem } from '../../types';
import { COLORS } from '../../utils/colors';

interface LogListProps {
  logs: LogItem[];
}

const LogList: React.FC<LogListProps> = ({ logs }) => {       
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t.historyLog}</Text> 
      <View style={styles.listWrapper}>
        {logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyLogText}>{t.noLog}</Text>  
          </View>
        ) : (
          logs.map((log, index) => (
            <View 
              key={log.id} 
              style={[
                styles.logRow, 
                index === logs.length - 1 && { borderBottomWidth: 0 }
              ]}
            >     
              <View style={styles.timeColumn}>
                <Text style={styles.logDate}>{log.time.split(' ')[0].substring(5)}</Text>
                <Text style={styles.logTime}>{log.time.split(' ')[1]?.substring(0, 5)}</Text>
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.logText}>✅ {log.text}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 16,
    marginLeft: 4
  },
  listWrapper: {
    // No background card here, just linear on background
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
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  timeColumn: {
    width: 60,
    marginRight: 16,
    alignItems: 'flex-start',
  },
  logDate: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  logTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  logText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    lineHeight: 20,
  }
  });

export default LogList;
