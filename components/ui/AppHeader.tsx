import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { COLORS } from '../../utils/colors';

interface AppHeaderProps {
  themeColor?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ themeColor }) => {
  const { t, toggleLang } = useLanguage();

  return (
    <View style={styles.topBar}>
      {/* 左侧：Logo (Title) */}
      <View style={styles.titleGroup}>
        <Text style={[styles.appTitle, themeColor ? { color: themeColor } : null]}>
          {t.title}
        </Text>
      </View>

      {/* 右侧：语言切换按钮 (极简风格) */}
      <TouchableOpacity
        style={styles.langBtn}     
        onPress={toggleLang}
      >
        <Text style={styles.langBtnText}>
          {t.switchLang.toUpperCase()}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 32, // 规范要求 Page Title 32
    fontWeight: '700', // Bold
    color: COLORS.text,
    letterSpacing: -1,
  },
  langBtn: {
    paddingVertical: 8,
  },
  langBtnText: {
    fontSize: 15, // 规范 Body 15
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default AppHeader;
