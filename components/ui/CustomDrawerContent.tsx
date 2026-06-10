import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';  
import { COLORS } from '../../utils/colors';
import { useLanguage } from '../../contexts/LanguageContext';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { t } = useLanguage();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 60 }}>
        <View style={styles.header}>
           <Text style={styles.title}>{t.appTitle}</Text>
        </View>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary }
});
