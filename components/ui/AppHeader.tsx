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
      {/* 左侧：极简标题，单行排版 */}
      <View style={styles.titleGroup}>
        <Text style={[styles.appTitle, themeColor ? { color: themeColor } : null]}>
          {t.title}
        </Text>
      </View>

      {/* 右侧：语言切换按钮 (纯线性极简风格) */}
      <TouchableOpacity
        style={[styles.langBtn, themeColor ? { borderColor: themeColor } : null]}     
        onPress={toggleLang}
      >
        <Text style={styles.langBtnText}>🌐 {t.switchLang}</Text>
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
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
});

export default AppHeader;
