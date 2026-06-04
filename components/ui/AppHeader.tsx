import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';

const AppHeader: React.FC = () => {
  const { t, toggleLang } = useLanguage();

  return (
    <View style={styles.headerContainer}>
      {/* Language Switcher */}
      <View style={styles.langHeader}>
        <TouchableOpacity style={styles.langBtn} onPress={toggleLang}>
          <Text style={styles.langBtnText}>🌐 {t.switchLang}</Text>
        </TouchableOpacity>
      </View>

      {/* Title Section */}
      <Text style={styles.appTitle}>{t.title}</Text>
      <Text style={styles.appSubTitle}>{t.subTitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 0,
  },
  langHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
  },
  langBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 5,
  },
  appSubTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 0,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default AppHeader;
