import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  StatusBar,
  FlatList,
  Platform,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../../constants/Colors';
import { Endpoints } from '../../constants/Endpoints';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [user, setUser] = useState(null);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (userDataStr) {
        try {
          setUser(JSON.parse(userDataStr));
        } catch (e) {
          console.error("Failed to parse local user data", e);
        }
      }

      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        setLoading(false);
        router.replace('/(auth)/login');
        return;
      }

      const response = await axios.get(Endpoints.Trainings, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000 // 10s timeout
      });
      
      if (response.data && Array.isArray(response.data)) {
        setTrainings(response.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Home load error:', error);
      if (error.response?.status === 401) {
        await SecureStore.deleteItemAsync('userToken');
        router.replace('/(auth)/login');
      } else {
        // Show developer alert for connection issues
        const msg = error.response?.data?.message || error.message || "Network Error";
        Alert.alert("Connection Issue", `Could not reach Empower API: ${msg}\n\nCheck if server is running at ${Endpoints.Trainings}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, label, value, color }) => (
    <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.icon }]}>{label}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.icon }]}>Good Morning,</Text>
            <Text style={[styles.userName, { color: theme.text }]}>{user?.fullName || 'Athlete'} 👋</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <Image 
              source={{ uri: user?.profileImageUrl || 'https://via.placeholder.com/100' }} 
              style={[styles.profilePic, { borderColor: theme.border }]} 
            />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard icon="flame" label="Calories" value="450" color="#FF3B30" />
          <StatCard icon="timer" label="Minutes" value="32" color="#FF9500" />
          <StatCard icon="fitness" label="Workouts" value="4" color="#107C10" />
        </View>

        {/* Featured Section */}
        <SectionHeader title="Featured Workouts" onSeeAll={() => router.push('/(tabs)/trainings')} />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.featuredContent}
        >
          {loading ? (
            <ActivityIndicator color={theme.tint} style={{ marginLeft: 20 }} />
          ) : (
            trainings.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.trainingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => Alert.alert("Coming Soon", "Video player integration in progress.")}
              >
                <Image source={{ uri: item.thumbnailUrl }} style={styles.trainingThumb} />
                <View style={styles.trainingInfo}>
                  <Text style={[styles.trainingTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                  <Text style={[styles.trainingMeta, { color: theme.icon }]}>{item.category} • {item.durationMinutes}m</Text>
                </View>
                <View style={[styles.difficultyBadge, { backgroundColor: getDiffColor(item.difficulty) + '20' }]}>
                  <Text style={[styles.difficultyText, { color: getDiffColor(item.difficulty) }]}>{item.difficulty}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Quick Actions Card-Pattern */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.cardContainer}>
           <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <ActionItem icon="body" title="Daily Warmup" desc="Start your 10-min prep" color="#0078D4" />
              <ActionItem icon="nutrition" title="Nutrient Log" desc="Track your intake" color="#E81123" />
              <ActionItem icon="calendar" title="Plan Coach" desc="View your weekly schedule" color="#00A2AD" isLast />
           </View>
        </View>

      </ScrollView>
    </View>
  );
}

const SectionHeader = ({ title, onSeeAll }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={[styles.seeAll, { color: theme.tint }]}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const ActionItem = ({ icon, title, desc, color, isLast }) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity style={[styles.actionItem, !isLast && { borderBottomWidth: 1.2, borderBottomColor: theme.border }]}>
      <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.actionTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.actionDesc, { color: theme.icon }]}>{desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.icon} />
    </TouchableOpacity>
  );
}

const getDiffColor = (d) => {
  if (d === 'Beginner') return '#107C10';
  if (d === 'Intermediate') return '#FF9500';
  return '#FF3B30';
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 20 
  },
  greeting: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  userName: { fontSize: 28, fontWeight: '800' },
  profilePic: { width: 54, height: 54, borderRadius: 27, borderWidth: 2 },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    marginTop: 10 
  },
  statCard: { 
    flex: 1, 
    borderRadius: 20, 
    borderWidth: 1.5, 
    padding: 16, 
    marginHorizontal: 4, 
    alignItems: 'center' 
  },
  statIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end', 
    paddingHorizontal: 20, 
    marginTop: 32, 
    marginBottom: 16 
  },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  seeAll: { fontSize: 14, fontWeight: '700' },
  featuredContent: { paddingLeft: 20, paddingRight: 20 },
  trainingCard: { 
    width: 260, 
    borderRadius: 20, 
    borderWidth: 1.5, 
    padding: 12, 
    marginRight: 16 
  },
  trainingThumb: { width: '100%', aspectRatio: 16/9, borderRadius: 12, marginBottom: 12 },
  trainingInfo: { marginBottom: 8 },
  trainingTitle: { fontSize: 16, fontWeight: '800' },
  trainingMeta: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  difficultyBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  difficultyText: { fontSize: 11, fontWeight: '800' },
  cardContainer: { paddingHorizontal: 20 },
  sectionCard: { borderRadius: 20, borderWidth: 1.5, overflow: 'hidden' },
  actionItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  actionIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  actionTitle: { fontSize: 16, fontWeight: '700' },
  actionDesc: { fontSize: 12, fontWeight: '500', marginTop: 2 }
});
