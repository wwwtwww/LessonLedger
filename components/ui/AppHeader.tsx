import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';

const AppHeader: React.FC = () => {
  const { t, toggleLang } = useLanguage();

  return (
    <View style={styles.topBar}>
      {/* 左侧：标题与副标题 */}
      <View style={styles.titleGroup}>
        <Text style={styles.appTitle}>{t.title}</Text>
        <Text style={styles.appSubTitle}>{t.subTitle}</Text>
      </View>

      {/* 右侧：语言切换按钮 */}
      <TouchableOpacity style={styles.langBtn} onPress={toggleLang}>
        <Text style={styles.langBtnText}>🌐 {t.switchLang}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  titleGroup: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'left',
  },
  appSubTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  langBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
});

export default AppHeader;
