import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';

interface SwipeableItemProps {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}

const SwipeableItem: React.FC<SwipeableItemProps> = ({ children, onEdit, onDelete }) => {
  const { t } = useLanguage();
  const swipeableRef = useRef<Swipeable>(null);

  const handleEdit = useCallback(() => {
    triggerHaptic('light');
    swipeableRef.current?.close();
    onEdit();
  }, [onEdit]);

  const handleDelete = useCallback(() => {
    triggerHaptic('medium');
    swipeableRef.current?.close();
    onDelete();
  }, [onDelete]);

  const renderRightActions = useCallback(
    (
      _progress: Animated.AnimatedInterpolation<number>,
      dragX: Animated.AnimatedInterpolation<number>
    ) => {
      const trans = dragX.interpolate({
        inputRange: [-160, 0],
        outputRange: [0, 160],
      });

      return (
        <View style={styles.rightActionsContainer}>
          <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={handleEdit}
              accessibilityRole="button"
              accessibilityLabel={t.edit}
            >
              <MaterialCommunityIcons name="pencil" size={24} color="#FFF" />
              <Text style={styles.actionText}>{t.edit}</Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
              accessibilityRole="button"
              accessibilityLabel={t.delete}
            >
              <MaterialCommunityIcons name="trash-can" size={24} color="#FFF" />
              <Text style={styles.actionText}>{t.delete}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    },
    [handleEdit, handleDelete, t.edit, t.delete]
  );

  const onSwipeableWillOpen = useCallback(() => {
    triggerHaptic('light');
  }, []);

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={onSwipeableWillOpen}
      friction={2}
      rightThreshold={40}
    >
      {children}
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  rightActionsContainer: {
    flexDirection: 'row',
    width: 160,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default SwipeableItem;
