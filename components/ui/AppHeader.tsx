import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../utils/colors';

interface AppHeaderProps {
  themeColor?: string;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  hasNotification?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  themeColor,
  onMenuPress,
  onNotificationPress,
  hasNotification = true
}) => {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity onPress={onMenuPress} style={styles.iconBtn}>
        <Feather name="menu" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <Text style={[styles.appTitle, themeColor ? { color: themeColor } : null]}>
        LessonLedger
      </Text>

      <TouchableOpacity onPress={onNotificationPress} style={styles.iconBtn}>
        <View>
          <Feather name="bell" size={24} color={COLORS.textPrimary} />
          {hasNotification && <View style={styles.redDot} />}
        </View>
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
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  redDot: {
    position: 'absolute',
    top: 0,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});

export default AppHeader;
