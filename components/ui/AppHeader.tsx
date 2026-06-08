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
      {/* 左侧：标题与副标题 */}
      <View style={styles.titleGroup}>
        <Text style={styles.appTitle}>{t.title}</Text>
        <Text style={[styles.appSubTitle, themeColor ? { color: themeColor } : null]}>
          {t.subTitle}
        </Text>
      </View>

      {/* 右侧：语言切换按钮 */}
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
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'left',
  },
  appSubTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textLight,
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  langBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default AppHeader;
