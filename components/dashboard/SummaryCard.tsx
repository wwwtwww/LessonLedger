import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  interpolate
} from 'react-native-reanimated';
import { COLORS } from '../../utils/colors';

interface SummaryCardProps {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
  onPress?: () => void;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ 
  icon, 
  value, 
  label, 
  color = COLORS.textPrimary,
  onPress 
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withTiming(1.02, { duration: 120 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 120 });
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={styles.pressable}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        <Text style={styles.icon}>{icon}</Text>
        
        <View style={styles.valueContainer}>
          <Text 
            style={[styles.value, { color }]} 
            numberOfLines={1} 
            adjustsFontSizeToFit
          >
            {value}
          </Text>
        </View>

        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    overflow: 'visible',
  },
  card: {
    width: '100%',
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    // Shadow system: y:8, blur:30, color: rgba(0,0,0,0.08)
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 15, 
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    justifyContent: 'space-between',
  },
  icon: {
    fontSize: 24,
    lineHeight: 24,
  },
  valueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '400',
    color: COLORS.textSecondary || '#64748B',
  },
});

export default SummaryCard;
