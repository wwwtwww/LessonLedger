import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../utils/colors';
import { triggerHaptic } from '../../utils/haptics';

interface AppHeaderProps {
  title?: string;
  themeColor?: string;
  onNotificationPress?: () => void;
  hasNotification?: boolean;
  rightComponent?: React.ReactNode;
  showBack?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title = "LessonLedger",
  themeColor,
  onNotificationPress,
  hasNotification = false,
  rightComponent,
  showBack = false,
}) => {
  const router = useRouter();

  const handleBackPress = () => {
    triggerHaptic('light');
    router.back();
  };

  return (
    <View style={styles.topBar}>
      <View style={styles.iconBtn}>
        {showBack && (
          <TouchableOpacity onPress={handleBackPress}>
            <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.appTitle, themeColor ? { color: themeColor } : null]} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.rightContainer}>
        {rightComponent ? (
          rightComponent
        ) : (
          onNotificationPress && (
            <TouchableOpacity onPress={onNotificationPress} style={styles.iconBtn}>
              <View>
                <Feather name="bell" size={24} color={COLORS.textPrimary} />
                {hasNotification && <View style={styles.redDot} />}
              </View>
            </TouchableOpacity>
          )
        )}
      </View>
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
