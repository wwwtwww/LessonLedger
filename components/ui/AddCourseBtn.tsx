import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';

interface AddCourseBtnProps {
  onPress: () => void;
  color?: string;
}

const AddCourseBtn: React.FC<AddCourseBtnProps> = ({ onPress, color }) => {
  const { t } = useLanguage();

  return (
    <TouchableOpacity 
      style={[styles.addCourseBtn, color ? { backgroundColor: color } : null]} 
      onPress={onPress}
    >
      <Text style={styles.addCourseBtnText}>+ {t.addCourse}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  addCourseBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  addCourseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default AddCourseBtn;
