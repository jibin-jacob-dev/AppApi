import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  StatusBar,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/Colors';
import { Endpoints } from '../../constants/Endpoints';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

export default function TrainingEditorScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    category: 'Strength',
    durationMinutes: '',
    difficulty: 'Intermediate'
  });

  useEffect(() => {
    if (isEditing) {
      fetchTraining();
    }
  }, [id]);

  const fetchTraining = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await axios.get(`${Endpoints.Trainings}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;
      setFormData({
        title: data.title,
        description: data.description,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl,
        category: data.category,
        durationMinutes: data.durationMinutes.toString(),
        difficulty: data.difficulty
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  const handlePickThumbnail = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Denied', 'We need access.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.6,
      });

      if (!result.canceled) {
        uploadThumbnail(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Picker failed');
    }
  };

  const uploadThumbnail = async (uri) => {
    setUploadingThumb(true);
    try {
       const token = await SecureStore.getItemAsync('userToken');
       const form = new FormData();
       form.append('file', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          name: 'thumb.jpg',
          type: 'image/jpeg'
       });
       const response = await axios.post(Endpoints.UploadImage, form, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
       });
       setFormData({ ...formData, thumbnailUrl: response.data.imageUrl });
    } catch (err) {
       Alert.alert('Error', 'Image upload failed');
    } finally {
       setUploadingThumb(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.videoUrl) {
      Alert.alert('Error', 'Please fill required fields (Title & Video URL)');
      return;
    }

    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const payload = {
        ...formData,
        durationMinutes: parseInt(formData.durationMinutes) || 0
      };

      if (isEditing) {
        await axios.put(`${Endpoints.Trainings}/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(Endpoints.Trainings, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      Alert.alert("Success", "Content saved successfully!");
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {isEditing ? 'Editing Video' : 'Add New Workout'}
          </Text>
          <TouchableOpacity 
             style={[styles.saveBtn, { backgroundColor: theme.tint }]} 
             onPress={handleSave}
             disabled={saving}
          >
             {saving ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.saveBtnText}>PUBLISH</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={[styles.label, { color: theme.text }]}>Thumbnail Cover</Text>
          <TouchableOpacity 
            style={[styles.thumbPicker, { backgroundColor: theme.surface, borderColor: theme.border }]} 
            onPress={handlePickThumbnail}
            disabled={uploadingThumb}
          >
            {formData.thumbnailUrl ? (
              <Image source={{ uri: formData.thumbnailUrl }} style={styles.thumbPreview} />
            ) : (
              <View style={styles.thumbPlaceholder}>
                <Ionicons name="image-outline" size={40} color={theme.icon} />
                <Text style={[styles.thumbText, { color: theme.icon }]}>Upload 16:9 Thumbnail</Text>
              </View>
            )}
            {uploadingThumb && (
              <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                <ActivityIndicator color="white" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Workout Title</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={formData.title}
              onChangeText={t => setFormData({...formData, title: t})}
              placeholder="e.g. Morning Yoga for Energy"
              placeholderTextColor={theme.icon}
            />
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.label, { color: theme.text }]}>Duration (min)</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                value={formData.durationMinutes}
                onChangeText={t => setFormData({...formData, durationMinutes: t})}
                keyboardType="numeric"
                placeholder="20"
                placeholderTextColor={theme.icon}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.label, { color: theme.text }]}>Difficulty</Text>
              <View style={[styles.dropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                 <TextInput 
                    style={[styles.input, { borderBottomWidth: 0, color: theme.text }]}
                    value={formData.difficulty}
                    onChangeText={t => setFormData({...formData, difficulty: t})}
                    placeholder="Beginner"
                    placeholderTextColor={theme.icon}
                 />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Video URL (Vimeo/YT/Direct)</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={formData.videoUrl}
              onChangeText={t => setFormData({...formData, videoUrl: t})}
              placeholder="https://..."
              placeholderTextColor={theme.icon}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Workout Description</Text>
            <TextInput 
              style={[styles.input, styles.textArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={formData.description}
              onChangeText={t => setFormData({...formData, description: t})}
              placeholder="Explain the workout flow..."
              placeholderTextColor={theme.icon}
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  saveBtn: {
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },
  scroll: { padding: 20 },
  label: { fontSize: 15, fontWeight: '700', marginBottom: 10, marginLeft: 2 },
  thumbPicker: {
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: 24,
    overflow: 'hidden',
  },
  thumbPreview: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  thumbText: { marginTop: 10, fontWeight: '600', fontSize: 13, opacity: 0.8 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  inputGroup: { marginBottom: 20 },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  textArea: { height: 120, paddingTop: 16, textAlignVertical: 'top' },
  row: { flexDirection: 'row', marginBottom: 20 },
  dropdown: { borderRadius: 16, borderWidth: 1.5 }
});
