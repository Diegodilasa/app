import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { authAPI, userAPI } from '../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const { email, isOnboarded, setEmail, setOnboarded, loadAuth } = useAuthStore();
  const [inputEmail, setInputEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    await loadAuth();
    setInitialLoading(false);
    
    // If already logged in, navigate
    const storedEmail = useAuthStore.getState().email;
    const storedOnboarded = useAuthStore.getState().isOnboarded;
    
    if (storedEmail) {
      if (storedOnboarded) {
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding');
      }
    }
  };

  const handleLogin = async () => {
    if (!inputEmail || !inputEmail.includes('@')) {
      Alert.alert('Erro', 'Por favor, insira um e-mail válido');
      return;
    }

    setLoading(true);
    
    try {
      const result = await authAPI.login(inputEmail.toLowerCase().trim());
      
      setEmail(inputEmail.toLowerCase().trim());
      
      if (result.has_onboarding) {
        setOnboarded(true);
        router.replace('/dashboard');
      } else {
        setOnboarded(false);
        router.replace('/onboarding');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Erro de Conexão', 
        'Não foi possível conectar ao servidor. Verifique sua conexão.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo/Icon */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="flash" size={60} color="#FFD700" />
            </View>
            <Text style={styles.title}>PROTOCOLO 7D</Text>
            <Text style={styles.subtitle}>Liberdade Definitiva</Text>
          </View>

          {/* Tagline */}
          <View style={styles.taglineContainer}>
            <Text style={styles.tagline}>
              Destrua seus vícios em 7 dias.
            </Text>
            <Text style={styles.taglineSmall}>
              Método científico. Resultados comprovados.
            </Text>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Seu melhor e-mail"
              placeholderTextColor="#666"
              value={inputEmail}
              onChangeText={setInputEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#0A1929" />
            ) : (
              <Text style={styles.loginButtonText}>COMEÇAR AGORA</Text>
            )}
          </TouchableOpacity>

          {/* Privacy Notice */}
          <Text style={styles.privacyText}>
            Ao continuar, você concorda em receber insights poderosos sobre disciplina.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1929',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A1929',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FF8C00',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
    letterSpacing: 1,
  },
  taglineContainer: {
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  taglineSmall: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    color: '#FFFFFF',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#FF8C00',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A1929',
    letterSpacing: 1,
  },
  privacyText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});
