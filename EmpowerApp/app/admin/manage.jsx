import React, { useState, useEffect, memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  StatusBar,
  Image
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../../constants/Colors';
import { Endpoints } from '../../constants/Endpoints';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

// Define renderItem outside to prevent re-creation on parent re-render
const TrainingItem = memo(({ item, theme, onEdit, onDelete }) => (
  <View style={[styles.itemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
    <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
    <View style={styles.itemInfo}>
      <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
      <Text style={[styles.itemMeta, { color: theme.icon }]}>{item.category} • {item.durationMinutes}m • {item.difficulty}</Text>
    </View>
    <View style={styles.actions}>
      <TouchableOpacity 
        style={[styles.actionBtn, { backgroundColor: theme.tint + '15' }]} 
        onPress={() => onEdit(item.id)}
      >
        <Ionicons name="create-outline" size={20} color={theme.tint} />
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.actionBtn, { backgroundColor: '#FF3B3015' }]} 
        onPress={() => onDelete(item.id, item.title)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  </View>
));

export default function AdminManageScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await axios.get(Endpoints.Trainings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrainings(response.data);
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Could not fetch content list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (id, title) => {
    Alert.alert(
      "Delete Training",
      `Are you sure you want to delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('userToken');
              await axios.delete(`${Endpoints.Trainings}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setTrainings(prev => prev.filter(t => t.id !== id));
            } catch (err) {
              Alert.alert('Error', 'Failed to delete item');
            }
          }
        }
      ]
    );
  };

  const handleEdit = (id) => {
    router.push({ pathname: '/admin/training-editor', params: { id } });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Manage Content</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.tint }]}
          onPress={() => router.push('/admin/training-editor')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.activeTab, { borderBottomColor: theme.tint }]}>
          <Text style={[styles.tabText, styles.activeTabText, { color: theme.text }]}>Trainings</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tab} 
          onPress={() => Alert.alert("Coming Soon", "Products management will be enabled in next update.")}
        >
          <Text style={[styles.tabText, { color: theme.icon }]}>Products</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={theme.tint} />
      ) : (
        <FlatList
          data={trainings}
          renderItem={({ item }) => (
            <TrainingItem 
              item={item} 
              theme={theme} 
              onEdit={handleEdit} 
              onDelete={handleDelete} 
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.list, { paddingBottom: 40 + insets.bottom }]}
          onRefresh={fetchTrainings}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cloud-offline-outline" size={60} color={theme.icon} />
              <Text style={[styles.emptyText, { color: theme.icon }]}>No content found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  addButton: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 24 },
  tab: { paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: {},
  tabText: { fontSize: 15, fontWeight: '700' },
  activeTabText: { fontWeight: '800' },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  itemCard: { flexDirection: 'row', borderRadius: 16, borderWidth: 1.5, padding: 10, marginBottom: 12, alignItems: 'center' },
  thumbnail: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#eee' },
  itemInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  itemMeta: { fontSize: 12, fontWeight: '600', opacity: 0.7 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, marginTop: 100, alignItems: 'center', justifyContent: 'center', opacity: 0.5 },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 12 }
});
