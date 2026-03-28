import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function TrainingsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
           <Text style={[styles.title, { color: theme.text }]}>Trainings</Text>
           <Text style={[styles.subtitle, { color: theme.icon }]}>Explore our workout library</Text>
        </View>

        <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="play-circle-outline" size={60} color={theme.tint} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Workouts are being loaded</Text>
          <Text style={[styles.emptyDesc, { color: theme.icon }]}>Please check the Home dashboard for featured workout videos.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  header: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  emptyCard: { 
    borderRadius: 24, 
    borderWidth: 1.5, 
    padding: 40, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 20
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 20 },
  emptyDesc: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginTop: 10, lineHeight: 20 }
});
