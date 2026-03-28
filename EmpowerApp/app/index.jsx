import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [target, setTarget] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        console.log("Checking token in SecureStore...");
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          console.log("Token found, heading to home.");
          setTarget('/(tabs)/home');
        } else {
          console.log("No token, heading to login.");
          setTarget('/(auth)/login');
        }
      } catch (e) {
        console.error("SecureStore error:", e);
        setTarget('/(auth)/login');
      } finally {
        setIsReady(true);
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (isReady && target) {
      // Manual delay to ensure layout is mounted
      const timer = setTimeout(() => {
        router.replace(target);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isReady, target]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#E5A912" />
      <Text style={styles.text}>Initializing Empower...</Text>
      {!isReady && <Text style={styles.subText}>Checking secure session...</Text>}
      {isReady && <Text style={styles.subText}>Redirecting...</Text>}
      
      {/* Fallback button if redirect fails */}
      {isReady && target && (
        <TouchableOpacity style={styles.btn} onPress={() => router.replace(target)}>
          <Text style={styles.btnText}>Click here if stuck</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#151718' },
  text: { color: 'white', marginTop: 20, fontSize: 18, fontWeight: 'bold' },
  subText: { color: '#9BA1A6', marginTop: 10, fontSize: 14 },
  btn: { marginTop: 30, padding: 15, backgroundColor: '#E5A912', borderRadius: 10 },
  btnText: { color: 'white', fontWeight: 'bold' }
});
