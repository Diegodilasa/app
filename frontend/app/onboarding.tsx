import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/api';

export default function OnboardingScreen() {
  const router = useRouter();
  const { email, setOnboarded } = useAuthStore();
  const [vicioAlvo, setVicioAlvo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!vicioAlvo || vicioAlvo.trim().length < 3) {
      Alert.alert('Atenção', 'Por favor, descreva o vício que você vai destruir.');
      return;
    }

    if (!email) {
      Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
      router.replace('/');
      return;
    }

    setLoading(true);
    
    try {
      await authAPI.completeOnboarding(email, vicioAlvo.trim());
      setOnboarded(true);
      router.replace('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert(
        'Erro',
        'Não foi possível salvar seus dados. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="target" size={50} color="#FFD700" />
            </View>
            <Text style={styles.title}>PERGUNTA ZERO</Text>
            <View style={styles.divider} />
          </View>

          {/* Main Question */}
          <View style={styles.questionContainer}>
            <Text style={styles.question}>
              Qual vício ou falta de disciplina você irá{' '}
              <Text style={styles.questionHighlight}>DESTRUIR</Text>
              {' '}nos próximos 7 dias?
            </Text>
          </View>

          {/* Examples */}
          <View style={styles.examplesContainer}>
            <Text style={styles.examplesTitle}>Exemplos:</Text>
            <View style={styles.exampleItem}>
              <Ionicons name="ellipse" size={6} color="#FF8C00" />
              <Text style={styles.exampleText}>Procrastinação</Text>
            </View>
            <View style={styles.exampleItem}>
              <Ionicons name="ellipse" size={6} color="#FF8C00" />
              <Text style={styles.exampleText}>Redes Sociais em Excesso</Text>
            </View>
            <View style={styles.exampleItem}>
              <Ionicons name="ellipse" size={6} color="#FF8C00" />
              <Text style={styles.exampleText}>Falta de Exercícios</Text>
            </View>
            <View style={styles.exampleItem}>
              <Ionicons name="ellipse" size={6} color="#FF8C00" />
              <Text style={styles.exampleText}>Alimentação Descontrolada</Text>
            </View>
          </View>

          {/* Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Meu Alvo:</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Parar de rolar Instagram por horas"
              placeholderTextColor="#555"
              value={vicioAlvo}
              onChangeText={setVicioAlvo}
              multiline
              maxLength={200}
              editable={!loading}
              autoFocus
            />
            <Text style={styles.charCount}>{vicioAlvo.length}/200</Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#0A1929" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>INICIAR PROTOCOLO 7D</Text>
                <Ionicons name="arrow-forward" size={20} color="#0A1929" style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>

          {/* Motivational Text */}
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationText}>
              "A disciplina que você constrói hoje define quem você será amanhã."
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1929',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 16,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: '#FF8C00',
  },
  questionContainer: {
    backgroundColor: 'rgba(255, 140, 0, 0.05)',
    padding: 24,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00',
    marginBottom: 24,
  },
  question: {
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 28,
    fontWeight: '600',
  },
  questionHighlight: {
    color: '#FF8C00',
    fontWeight: '800',
  },
  examplesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  examplesTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    fontWeight: '600',
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#CCC',
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.3)',
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#FF8C00',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A1929',
    letterSpacing: 1,
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  motivationContainer: {
    paddingHorizontal: 16,
  },
  motivationText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
