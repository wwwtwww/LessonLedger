import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { LogItem } from '../../types';

interface LogListProps {
  logs: LogItem[];
}

const LogList: React.FC<LogListProps> = ({ logs }) => {
  const { t } = useLanguage();

  return (
    <>
      <Text style={styles.sectionTitle}>{t.historyLog}</Text>
      <View style={styles.logContainer}>
        {logs.length === 0 ? (
          <Text style={styles.emptyLogText}>{t.noLog}</Text>
        ) : (
          logs.map(log => (
            <View key={log.id} style={styles.logTextRow}>
              <Text style={styles.logTime}>{log.time}</Text>
              <Text style={styles.logText}>✅ {log.text}</Text>
            </View>
          ))
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#334155', marginBottom: 10 },
  logContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  emptyLogText: { color: '#94A3B8', textAlign: 'center', fontSize: 12, paddingVertical: 10 },
  logTextRow: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between' },
  logTime: { fontSize: 11, color: '#94A3B8', width: 110 },
  logText: { fontSize: 13, fontWeight: '600', color: '#334155', flex: 1 }
});

export default LogList;