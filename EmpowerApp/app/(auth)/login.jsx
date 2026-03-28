import React, { useState, useEffect, memo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Link, router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Endpoints } from '../../constants/Endpoints';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

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

export default function LoginScreen() {
  const { theme, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const isEnabled = await SecureStore.getItemAsync('biometricsEnabled');
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const savedEmail = await SecureStore.getItemAsync('savedEmail');
      
      if (isEnabled === 'true' && compatible && enrolled && savedEmail) {
        setIsBiometricAvailable(true);
      }
    } catch (e) {
      console.error('Failed to check bio status:', e);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login to Empower Fitness',
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        setLoading(true);
        const savedEmail = await SecureStore.getItemAsync('savedEmail');
        const savedPassword = await SecureStore.getItemAsync('savedPassword');

        if (savedEmail && savedPassword) {
           try {
              const response = await axios.post(Endpoints.Login, { email: savedEmail, password: savedPassword });
              if (response.data.token) {
                await SecureStore.setItemAsync('userToken', response.data.token);
                await SecureStore.setItemAsync('userData', JSON.stringify(response.data.user));
                router.replace('/(tabs)/home');
              }
           } catch (apiError) {
              setLoading(false);
              Alert.alert('Session Expired', 'Please login with your password again.');
           }
        } else {
          setLoading(false);
          Alert.alert('Configuration Error', 'Credentials not found. Please log in manually once.');
        }
      }
    } catch (e) {
      console.error('Biometric error:', e);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.post(Endpoints.Login, { email, password });
      
      if (response.data.token) {
        await SecureStore.setItemAsync('userToken', response.data.token);
        await SecureStore.setItemAsync('userData', JSON.stringify(response.data.user));
        
        const bioEnabled = await SecureStore.getItemAsync('biometricsEnabled');
        if (bioEnabled === 'true') {
           await SecureStore.setItemAsync('savedEmail', email);
           await SecureStore.setItemAsync('savedPassword', password);
        }

        router.replace('/(tabs)/home');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: theme.tint }]}>Empower Fitness Studio</Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Form Card Group */}
          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <AuthInput 
              theme={theme}
              icon="mail" 
              color="#0078D4" 
              placeholder="Email Address" 
              value={email} 
              onChangeText={setEmail} 
            />
            <AuthInput 
              theme={theme}
              icon="lock-closed" 
              color="#107C10" 
              placeholder="Password" 
              value={password} 
              onChangeText={setPassword} 
              secure 
              isLast 
            />
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: theme.tint }]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading && !isBiometricAvailable ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {isBiometricAvailable && (
            <TouchableOpacity 
              style={[styles.bioButton, { borderColor: theme.tint, backgroundColor: theme.surface }]} 
              onPress={handleBiometricLogin}
              disabled={loading}
            >
              {loading ? (
                 <ActivityIndicator color={theme.tint} />
              ) : (
                <>
                  <Ionicons name="finger-print" size={26} color={theme.tint} />
                  <Text style={[styles.bioButtonText, { color: theme.text }]}>Login with Biometrics</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { color: theme.icon }]}>Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={[styles.footerLink, { color: theme.tint }]}>Register</Text>
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
  content: { padding: 24, paddingVertical: 60, justifyContent: 'center', flexGrow: 1 },
  header: { marginBottom: 32 },
  title: { fontSize: 34, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  formCard: { borderRadius: 20, borderWidth: 1.5, overflow: 'hidden', marginBottom: 24 },
  inputField: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  input: { flex: 1, height: 40, fontSize: 16, fontWeight: '600' },
  primaryButton: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  primaryButtonText: { color: 'white', fontSize: 18, fontWeight: '800' },
  bioButton: { flexDirection: 'row', height: 56, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 12 },
  bioButtonText: { fontSize: 15, fontWeight: '700' },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { fontSize: 15 },
  footerLink: { fontSize: 15, fontWeight: 'bold' },
  errorText: { color: '#FF3B30', marginBottom: 20, fontWeight: '600', textAlign: 'center' }
});
