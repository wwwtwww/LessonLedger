import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticType = 
  | 'tap' 
  | 'switchMember' 
  | 'cardPress' 
  | 'success' 
  | 'warning' 
  | 'error'
  | 'light' 
  | 'medium' 
  | 'heavy';

export const triggerHaptic = (type: HapticType = 'tap') => {
  if (Platform.OS === 'web') return;

  switch (type) {
    case 'tap':
    case 'light':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'switchMember':
    case 'medium':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'cardPress':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      break;
    case 'heavy':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'success':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'warning':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case 'error':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
  }
};
