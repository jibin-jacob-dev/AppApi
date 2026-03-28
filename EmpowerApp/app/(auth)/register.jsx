import React, { useState, memo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar
} from 'react-native';
import { Link, router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import axios from 'axios';
import { Endpoints } from '../../constants/Endpoints';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const AuthInput = memo(({ icon, color, placeholder, value, onChangeText, theme, secure = false, isLast }) => (
  <View style={[styles.inputField, !isLast && { borderBottomWidth: 1.2, borderBottomColor: theme.border }]}>
    <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <TextInput
      style={[styles.input, { color: theme.text }]}
      placeholder={placeholder}
      placeholderTextColor={theme.icon}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secure}
      autoCapitalize="none"
      autoCorrect={false}
    />
  </View>
));

export default function RegisterScreen() {
  const { theme, isDark } = useTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(Endpoints.Register, {
        fullName,
        email,
        password
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Registration successful! Please login.');
        router.replace('/(auth)/login');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: theme.text }]}>Join Empower</Text>
          <Text style={[styles.subtitle, { color: theme.tint }]}>Start your fitness journey today</Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <AuthInput theme={theme} icon="person" color="#0078D4" placeholder="Full Name" value={fullName} onChangeText={setFullName} />
            <AuthInput theme={theme} icon="mail" color="#00A2AD" placeholder="Email Address" value={email} onChangeText={setEmail} />
            <AuthInput theme={theme} icon="lock-closed" color="#107C10" placeholder="Password" value={password} onChangeText={setPassword} secure />
            <AuthInput theme={theme} icon="shield-checkmark" color="#FF2D55" placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secure isLast />
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: theme.tint }]} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { color: theme.icon }]}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.footerLink, { color: theme.tint }]}>Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 40 },
  title: { fontSize: 34, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 18, marginBottom: 36, fontWeight: '700', letterSpacing: 0.5 },
  formCard: { borderRadius: 20, borderWidth: 1.5, overflow: 'hidden', marginBottom: 24 },
  inputField: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  input: { flex: 1, height: 40, fontSize: 16, fontWeight: '600' },
  primaryButton: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: 'white', fontSize: 18, fontWeight: '800' },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32, paddingBottom: 40 },
  footerText: { fontSize: 15 },
  footerLink: { fontSize: 15, fontWeight: '700' },
  errorText: { color: '#FF3B30', marginBottom: 20, fontWeight: '600', textAlign: 'center' }
});
