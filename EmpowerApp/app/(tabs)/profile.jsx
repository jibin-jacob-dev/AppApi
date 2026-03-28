import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Image,
  Platform,
  StatusBar
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/Colors';
import { Endpoints } from '../../constants/Endpoints';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* 
  CRITICAL: Sub-components MUST be defined outside the main functional component
  to prevent losing focus during re-renders.
*/

const SectionTitle = memo(({ title, theme }) => (
  <Text style={[styles.sectionTitle, { color: theme.icon }]}>{title}</Text>
));

const GroupField = memo(({ icon, label, value, onChangeText, color, theme, editable = true, isLast, keyboardType = 'default' }) => (
  <View style={[styles.fieldRow, !isLast && { borderBottomWidth: 1.2, borderBottomColor: theme.border }]}>
    <View style={[styles.fieldIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.fieldLabel, { color: theme.icon }]}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { color: editable ? theme.text : theme.icon }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={theme.icon}
        editable={editable}
        keyboardType={keyboardType}
        autoCorrect={false}
      />
    </View>
  </View>
));

const MenuBtn = memo(({ icon, title, onPress, color, theme, isLast }) => (
  <TouchableOpacity 
    style={[styles.fieldRow, !isLast && { borderBottomWidth: 1.2, borderBottomColor: theme.border }]} 
    onPress={onPress}
  >
    <View style={[styles.fieldIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={[styles.menuText, { color: theme.text }]}>{title}</Text>
    <Ionicons name="chevron-forward" size={18} color={theme.icon} />
  </TouchableOpacity>
));

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    phoneNumber: '',
    heightCm: '',
    weightKg: '',
    gender: '',
    dateOfBirth: ''
  });

  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }

      const response = await axios.get(Endpoints.Profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userData = response.data;
      setUser(userData);
      const mappedData = {
        fullName: userData.fullName || userData.FullName || '',
        email: userData.email || userData.Email || '',
        address: userData.address || userData.Address || '',
        phoneNumber: userData.phoneNumber || userData.PhoneNumber || '',
        heightCm: (userData.heightCm || userData.HeightCm)?.toString() || '',
        weightKg: (userData.weightKg || userData.WeightKg)?.toString() || '',
        gender: userData.gender || userData.Gender || 'Male',
        dateOfBirth: (userData.dateOfBirth || userData.DateOfBirth)?.split('T')[0] || ''
      };
      
      setFormData(mappedData);
      setInitialData(mappedData);
      
      if (mappedData.dateOfBirth) {
        setDate(new Date(mappedData.dateOfBirth));
      }
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Could not fetch profile details');
    } finally {
      setLoading(false);
    }
  };

  const isDirty = useMemo(() => {
    if (!initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const payload = {
        FullName: formData.fullName,
        Email: formData.email,
        Address: formData.address,
        PhoneNumber: formData.phoneNumber,
        HeightCm: formData.heightCm ? parseFloat(formData.heightCm) : null,
        WeightKg: formData.weightKg ? parseFloat(formData.weightKg) : null,
        Gender: formData.gender,
        DateOfBirth: formData.dateOfBirth || null
      };

      await axios.put(Endpoints.Profile, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setInitialData(formData);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData({ ...formData, dateOfBirth: formattedDate });
    }
  };

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permissions are required.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
       Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const uploadImage = async (uri) => {
    setUploadingImage(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const fd = new FormData();
      fd.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      });
      const response = await axios.post(Endpoints.UploadImage, fd, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      setUser({ ...user, profileImageUrl: response.data.imageUrl });
    } catch (error) {
      Alert.alert('Upload Failed', 'Could not save the image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('userToken');
          await SecureStore.deleteItemAsync('userData');
          router.replace('/(auth)/login');
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.customHeader}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Profile</Text>
        {isDirty && (
          <TouchableOpacity 
            style={[styles.saveBadge, { backgroundColor: theme.tint }]}
            onPress={handleUpdate}
            disabled={updating}
          >
            {updating ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.saveBadgeText}>SAVE</Text>}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleImagePick}>
            <Image 
               source={{ uri: user?.profileImageUrl || 'https://via.placeholder.com/150' }} 
               style={[styles.avatar, { borderColor: theme.tint }]} 
            />
            <View style={[styles.cameraBadge, { backgroundColor: theme.tint }]}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
            {uploadingImage && <View style={styles.avatarOverlay}><ActivityIndicator color="white" /></View>}
          </TouchableOpacity>
          <Text style={[styles.userName, { color: theme.text }]}>{user?.fullName || 'User'}</Text>
          <Text style={[styles.userRole, { color: theme.tint }]}>{(user?.role || 'CLIENT').toUpperCase()}</Text>
        </View>

        <SectionTitle title="PERSONAL INFORMATION" theme={theme} />
        <View style={styles.cardWrapper}>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <GroupField theme={theme} icon="person" label="Full Name" value={formData.fullName} onChangeText={(t) => setFormData(prev => ({...prev, fullName: t}))} color="#0078D4" />
            <GroupField theme={theme} icon="mail" label="Email" value={formData.email} editable={false} color="#00A2AD" />
            <GroupField theme={theme} icon="call" label="Phone" value={formData.phoneNumber} onChangeText={(t) => setFormData(prev => ({...prev, phoneNumber: t}))} color="#107C10" keyboardType="phone-pad" />
            <GroupField theme={theme} icon="location" label="Address" value={formData.address} onChangeText={(t) => setFormData(prev => ({...prev, address: t}))} color="#D83B01" isLast />
          </View>
        </View>

        <SectionTitle title="BODY METRICS" theme={theme} />
        <View style={styles.cardWrapper}>
           <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
             <View style={{ flexDirection: 'row' }}>
               <View style={{ flex: 1 }}><GroupField theme={theme} icon="resize" label="Height (cm)" value={formData.heightCm} onChangeText={(t) => setFormData(prev => ({...prev, heightCm: t}))} color="#5856D6" keyboardType="numeric" /></View>
               <View style={{ width: 1.2, backgroundColor: theme.border }} />
               <View style={{ flex: 1 }}><GroupField theme={theme} icon="barbell" label="Weight (kg)" value={formData.weightKg} onChangeText={(t) => setFormData(prev => ({...prev, weightKg: t}))} color="#FF2D55" keyboardType="numeric" /></View>
             </View>
             <TouchableOpacity style={styles.fieldRow} onPress={() => setShowDatePicker(true)}>
                <View style={[styles.fieldIcon, { backgroundColor: '#E8112315' }]}><Ionicons name="calendar" size={18} color="#E81123" /></View>
                <View style={{ flex: 1 }}>
                   <Text style={[styles.fieldLabel, { color: theme.icon }]}>Date of Birth</Text>
                   <Text style={[styles.fieldValue, { color: theme.text }]}>{formData.dateOfBirth || "Not set"}</Text>
                </View>
             </TouchableOpacity>
           </View>
        </View>

        <SectionTitle title="ACCOUNT" theme={theme} />
        <View style={styles.cardWrapper}>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MenuBtn theme={theme} icon="settings" title="Settings" onPress={() => router.push('/settings')} color={theme.tint} />
            <MenuBtn theme={theme} icon="log-out" title="Sign Out" onPress={handleLogout} color="#FF3B30" isLast />
          </View>
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  customHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  saveBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, elevation: 3 },
  saveBadgeText: { color: 'white', fontWeight: '800', fontSize: 12 },
  avatarSection: { alignItems: 'center', paddingVertical: 20 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3 },
  cameraBadge: { position: 'absolute', bottom: 4, right: 4, width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white' },
  avatarOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 60, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 24, fontWeight: '800', marginTop: 12 },
  userRole: { fontSize: 13, fontWeight: '700', marginTop: 4, letterSpacing: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5, marginLeft: 26, marginTop: 24, marginBottom: 10, opacity: 0.7 },
  cardWrapper: { paddingHorizontal: 20 },
  card: { borderRadius: 20, borderWidth: 1.5, overflow: 'hidden' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  fieldIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  fieldInput: { fontSize: 16, fontWeight: '600', minHeight: 24, padding: 0 },
  fieldValue: { fontSize: 16, fontWeight: '600' },
  menuText: { flex: 1, fontSize: 16, fontWeight: '700' }
});
