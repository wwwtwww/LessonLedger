import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { COLORS } from '../../utils/colors';
import { triggerHaptic } from '../../utils/haptics';

interface AppHeaderProps {
  title?: string;
  themeColor?: string;
  onNotificationPress?: () => void;
  hasNotification?: boolean;
  rightComponent?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title = "LessonLedger",
  themeColor,
  onNotificationPress,
  hasNotification = false,
  rightComponent
}) => {
  const navigation = useNavigation();

  const handleMenuPress = () => {
    triggerHaptic('light');
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  return (
    <View style={styles.topBar}>
      <TouchableOpacity onPress={handleMenuPress} style={styles.iconBtn}>
        <Feather name="menu" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>

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
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
