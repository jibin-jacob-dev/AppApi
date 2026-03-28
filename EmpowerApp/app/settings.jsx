import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  useColorScheme, 
  Switch, 
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, mode, setMode, isDark } = useTheme();

  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const bioEnabled = await SecureStore.getItemAsync('biometricsEnabled');
      setBiometrics(bioEnabled === 'true');
      
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUserRole(userData.role || userData.Role);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const toggleBiometrics = async (value) => {
    if (value) {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        Alert.alert('Hardware Error', 'Your device does not support biometric authentication.');
        return;
      }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert('Setup Error', 'No biometric records found. Please set up FaceID/Fingerprint in your device settings.');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable Biometric Authentication',
        fallbackLabel: 'Enter Passcode',
      });
      if (result.success) {
        await SecureStore.setItemAsync('biometricsEnabled', 'true');
        setBiometrics(true);
      } else {
        setBiometrics(false);
      }
    } else {
      await SecureStore.setItemAsync('biometricsEnabled', 'false');
      setBiometrics(false);
    }
  };

  const ThemeOption = ({ title, value, icon, selected, onPress, isFirst, isLast }) => (
    <TouchableOpacity
      onPress={() => onPress(value)}
      style={[
        styles.themeOption,
        { backgroundColor: theme.surface, borderBottomColor: theme.border },
        selected && { backgroundColor: theme.tint + '15', borderColor: theme.tint },
        isFirst && { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
        isLast && { borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderBottomWidth: 0 },
      ]}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: selected ? theme.tint : theme.icon + '15' }]}>
          <Ionicons name={icon} size={20} color={selected ? 'white' : theme.text} />
        </View>
        <Text style={[styles.itemTitle, { color: theme.text }, selected && { fontWeight: '800' }]}>{title}</Text>
      </View>
      {selected && <Ionicons name="checkmark-circle" size={24} color={theme.tint} />}
    </TouchableOpacity>
  );

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
      >
        <Section title="APPEARANCE & THEME">
          <ThemeOption 
            isFirst
            title="System Sync" 
            value="system" 
            icon="sync" 
            selected={mode === 'system'} 
            onPress={setMode} 
          />
          <ThemeOption 
            title="Light Mode" 
            value="light" 
            icon="sunny" 
            selected={mode === 'light'} 
            onPress={setMode} 
          />
          <ThemeOption 
            isLast
            title="Dark Mode" 
            value="dark" 
            icon="moon" 
            selected={mode === 'dark'} 
            onPress={setMode} 
          />
        </Section>

        <Section title="NOTIFICATIONS">
          <TouchableOpacity 
            activeOpacity={1}
            style={[styles.item, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 16, borderBottomWidth: 0 }]}
          >
            <View style={styles.itemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FF950015' }]}>
                <Ionicons name="notifications" size={22} color="#FF9500" />
              </View>
              <View>
                <Text style={[styles.itemTitle, { color: theme.text }]}>Push Notifications</Text>
                <Text style={[styles.itemDesc, { color: theme.icon }]}>Alerts, sounds and previews</Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#767577', true: '#FF950080' }}
              thumbColor={Platform.OS === 'ios' ? undefined : (notifications ? '#FF9500' : '#f4f3f4')}
            />
          </TouchableOpacity>
        </Section>

        {userRole === 'Admin' && (
          <Section title="ADMINISTRATOR">
            <TouchableOpacity 
              style={[styles.item, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 16, borderBottomWidth: 0 }]}
              onPress={() => router.push('/admin/manage')}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: theme.tint + '15' }]}>
                  <Ionicons name="construct" size={22} color={theme.tint} />
                </View>
                <View>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>Admin Portal</Text>
                  <Text style={[styles.itemDesc, { color: theme.icon }]}>Manage trainings & content</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.icon} />
            </TouchableOpacity>
          </Section>
        )}

        <Section title="SECURITY & PRIVACY">
          <TouchableOpacity 
            activeOpacity={1}
            style={[styles.item, { backgroundColor: theme.surface, borderColor: theme.border, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomWidth: 1.2 }]}
          >
            <View style={styles.itemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#107C1015' }]}>
                <Ionicons name="finger-print" size={22} color="#107C10" />
              </View>
              <View>
                <Text style={[styles.itemTitle, { color: theme.text }]}>Biometric Login</Text>
                <Text style={[styles.itemDesc, { color: theme.icon }]}>FaceID / Fingerprint</Text>
              </View>
            </View>
            <Switch
              value={biometrics}
              onValueChange={toggleBiometrics}
              trackColor={{ false: '#767577', true: '#107C1080' }}
              thumbColor={Platform.OS === 'ios' ? undefined : (biometrics ? '#107C10' : '#f4f3f4')}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.item, { backgroundColor: theme.surface, borderColor: theme.border, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderBottomWidth: 0 }]}
            onPress={() => Alert.alert("Coming Soon", "Security features are being developed.")}
          >
            <View style={styles.itemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#00A2AD15' }]}>
                <Ionicons name="lock-closed" size={22} color="#00A2AD" />
              </View>
              <Text style={[styles.itemTitle, { color: theme.text }]}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.icon} />
          </TouchableOpacity>
        </Section>

        <Section title="SUPPORT">
          <TouchableOpacity 
            style={[styles.item, { backgroundColor: theme.surface, borderColor: theme.border, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomWidth: 1.2 }]}
            onPress={() => Alert.alert("Support", "Redirecting to help portal...")}
          >
            <View style={styles.itemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FF2D5515' }]}>
                <Ionicons name="help-circle" size={22} color="#FF2D55" />
              </View>
              <Text style={[styles.itemTitle, { color: theme.text }]}>Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.icon} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.item, { backgroundColor: theme.surface, borderColor: theme.border, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderBottomWidth: 0 }]}
            onPress={() => Alert.alert("Legal", "Displaying Terms...")}
          >
            <View style={styles.itemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#8E8E9315' }]}>
                <Ionicons name="document-text" size={22} color="#8E8E93" />
              </View>
              <Text style={[styles.itemTitle, { color: theme.text }]}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.icon} />
          </TouchableOpacity>
        </Section>

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => Alert.alert("Danger Zone", "Are you sure you want to delete your account? This action is permanent.")}
        >
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.brand, { color: theme.text }]}>EMPOWER FITNESS</Text>
          <Text style={[styles.version, { color: theme.icon }]}>Version 1.0.0 (Building #0428)</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const Section = ({ title, children }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.icon }]}>{title}</Text>
      <View style={[styles.sectionCard, { borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 64,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingTop: 8,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 6,
    opacity: 0.6,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1.2,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1.2,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  itemDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.7,
  },
  deleteButton: {
    marginTop: 40,
    marginHorizontal: 16,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FF3B3015',
    borderWidth: 1.5,
    borderColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    marginTop: 48,
    alignItems: 'center',
  },
  brand: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
    opacity: 0.8,
  },
  version: {
    fontSize: 12,
    fontWeight: '500',
  }
});
