import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useProgressStore } from '../../store/progressStore';
import { progressAPI, userAPI } from '../../services/api';

const EBOOK_URL = 'https://go.hotmart.com/W102844514P?dp=1';

// Day content configuration
const DAY_CONTENT: Record<string, any> = {
  '1': {
    titulo: 'Identificação do Gatilho Secreto',
    icon: 'eye',
    pontos: 100,
    teaser: 'Todo vício tem um GATILHO invisível. Não é o vício em si que te domina, mas sim o momento ANTES dele acontecer. Neste passo crucial, você vai mapear com precisão cirúrgica o que desencadeia sua falta de disciplina.',
    risco: 'Sem identificar o gatilho, você lutará contra o sintoma, não a causa. É por isso que 97% das pessoas falham.',
    ferramenta_titulo: 'Analisador de Gatilhos',
    ferramenta_descricao: 'Preencha abaixo para descobrir o padrão oculto:',
    ferramenta_campos: [
      { key: 'momento', label: 'Quando acontece? (hora, situação)', placeholder: 'Ex: Todo dia às 20h, quando estou sozinho' },
      { key: 'emocao', label: 'O que você sente ANTES?', placeholder: 'Ex: Ansiedade, tédio, frustração' },
      { key: 'ambiente', label: 'Onde você está?', placeholder: 'Ex: No quarto, no sofá, na rua' },
    ],
  },
  '2': {
    titulo: 'A Regra dos 5 Segundos',
    icon: 'timer',
    pontos: 150,
    teaser: 'Existe uma janela de 5 segundos entre o gatilho e a ação. Esta técnica neurocientífica interrompe o ciclo automático do cérebro, dando a VOCÊ o controle de volta.',
    risco: 'A maioria das pessoas espera "sentir vontade" de mudar. Isso NUNCA acontece. Você precisa AGIR antes que seu cérebro te sabote.',
    ferramenta_titulo: 'Contador de Interrupções',
    ferramenta_descricao: 'Registre cada vez que você INTERROMPEU um impulso:',
    ferramenta_campos: [
      { key: 'situacao', label: 'Descreva o impulso que sentiu', placeholder: 'Ex: Vontade de abrir Instagram' },
      { key: 'acao_alternativa', label: 'O que você FEZ no lugar?', placeholder: 'Ex: Respirei fundo 3x, bebi água' },
      { key: 'tempo_resistencia', label: 'Por quanto tempo resistiu?', placeholder: 'Ex: 30 minutos' },
    ],
  },
  '3': {
    titulo: 'Substituição Estratégica',
    icon: 'swap-horizontal',
    pontos: 200,
    teaser: 'Você não pode simplesmente "parar" um vício. A neurociência mostra que você precisa SUBSTITUIR o comportamento por algo que ative os mesmos receptores de dopamina, mas de forma saudável.',
    risco: 'Tentar eliminar sem substituir é o erro fatal. Seu cérebro EXIGIRÁ a dopamina de volta, e você recairá em 72 horas.',
    ferramenta_titulo: 'Mapeador de Alternativas',
    ferramenta_descricao: 'Crie suas substituições estratégicas:',
    ferramenta_campos: [
      { key: 'comportamento_antigo', label: 'Comportamento que você quer eliminar', placeholder: 'Ex: Rolar Instagram por 2h' },
      { key: 'novo_comportamento', label: 'Nova ação (que te dá satisfação)', placeholder: 'Ex: Ler 30 páginas de um livro' },
      { key: 'recompensa', label: 'Qual será sua recompensa?', placeholder: 'Ex: Assistir um episódio da série favorita' },
    ],
    bloqueio: true,
  },
};

export default function DayScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { email } = useAuthStore();
  const { dias_completados, tool_data, completeDay } = useProgressStore();
  
  const dayId = String(id);
  const dayContent = DAY_CONTENT[dayId];
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    loadDayData();
  }, []);

  const loadDayData = async () => {
    setLoading(true);
    try {
      const progress = await userAPI.getProgress(email!);
      
      // Check if day is completed
      setIsCompleted(progress.dias_completados.includes(parseInt(dayId)));
      
      // Load saved tool data
      const savedData = progress.tool_data?.[`dia_${dayId}`];
      if (savedData) {
        setFormData(savedData);
      }
    } catch (error) {
      console.error('Error loading day data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveAndComplete = async () => {
    // Validate all fields are filled
    const allFieldsFilled = dayContent.ferramenta_campos.every(
      (campo: any) => formData[campo.key]?.trim()
    );

    if (!allFieldsFilled) {
      Alert.alert('Atenção', 'Preencha todos os campos para completar este dia.');
      return;
    }

    setSaving(true);
    
    try {
      // Save tool data
      await progressAPI.saveToolData(email!, parseInt(dayId), formData);
      
      // Complete day
      const result = await progressAPI.completeDay(email!, parseInt(dayId), dayContent.pontos);
      
      completeDay(parseInt(dayId));
      setIsCompleted(true);

      // Show success with medals
      let message = `Parabéns! Você ganhou ${dayContent.pontos} pontos!`;
      if (result.novas_medalhas?.length > 0) {
        message += `\n\n🏆 Nova(s) medalha(s): ${result.novas_medalhas.join(', ')}`;
      }

      Alert.alert('✅ Dia Completo!', message, [
        {
          text: 'Continuar',
          onPress: () => {
            if (dayContent.bloqueio) {
              // Show bloqueio alert for day 3
              showBloqueioAlert();
            } else {
              router.back();
            }
          }
        }
      ]);
    } catch (error) {
      console.error('Error completing day:', error);
      Alert.alert('Erro', 'Não foi possível salvar seu progresso.');
    } finally {
      setSaving(false);
    }
  };

  const showBloqueioAlert = () => {
    Alert.alert(
      '🔒 Seu Progresso Está BLOQUEADO',
      'Você completou os 3 primeiros dias e provou que o método funciona!\n\nMas os próximos 4 dias contêm as técnicas MAIS PODEROSAS:\n\n• O Manual Secreto de 15 Técnicas\n• Sistema de Reforço Neural\n• Blindagem Anti-Recaída\n• O Protocolo de Manutenção Vitalício\n\nApenas o Protocolo Completo (no eBook) libera tudo.',
      [
        { text: 'Depois', style: 'cancel', onPress: () => router.back() },
        { 
          text: 'DESBLOQUEAR AGORA', 
          onPress: () => Linking.openURL(EBOOK_URL),
          style: 'default'
        },
      ]
    );
  };

  if (!dayContent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Dia não encontrado</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
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
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <Ionicons name={dayContent.icon} size={20} color="#FFD700" />
              <Text style={styles.headerPoints}>+{dayContent.pontos}pts</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.dayLabel}>DIA {dayId}</Text>
            <Text style={styles.title}>{dayContent.titulo}</Text>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.completedText}>COMPLETO</Text>
              </View>
            )}
          </View>

          {/* Teaser */}
          <View style={styles.teaserContainer}>
            <View style={styles.teaserHeader}>
              <Ionicons name="bulb" size={24} color="#FF8C00" />
              <Text style={styles.teaserTitle}>Por Que Este Passo é Crucial</Text>
            </View>
            <Text style={styles.teaserText}>{dayContent.teaser}</Text>
          </View>

          {/* Risco */}
          <View style={styles.riscoContainer}>
            <View style={styles.riscoHeader}>
              <Ionicons name="warning" size={20} color="#FF5252" />
              <Text style={styles.riscoTitle}>⚠️ ATENÇÃO</Text>
            </View>
            <Text style={styles.riscoText}>{dayContent.risco}</Text>
          </View>

          {/* Ferramenta */}
          <View style={styles.ferramentaContainer}>
            <View style={styles.ferramentaHeader}>
              <Ionicons name="construct" size={24} color="#FFD700" />
              <Text style={styles.ferramentaTitle}>{dayContent.ferramenta_titulo}</Text>
            </View>
            <Text style={styles.ferramentaDescricao}>{dayContent.ferramenta_descricao}</Text>

            {/* Form Fields */}
            {dayContent.ferramenta_campos.map((campo: any, index: number) => (
              <View key={campo.key} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {index + 1}. {campo.label}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={campo.placeholder}
                  placeholderTextColor="#555"
                  value={formData[campo.key] || ''}
                  onChangeText={(value) => handleInputChange(campo.key, value)}
                  multiline
                  editable={!isCompleted}
                />
              </View>
            ))}
          </View>

          {/* Complete Button */}
          {!isCompleted && (
            <TouchableOpacity 
              style={[styles.completeButton, saving && styles.completeButtonDisabled]}
              onPress={handleSaveAndComplete}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#0A1929" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#0A1929" />
                  <Text style={styles.completeButtonText}>COMPLETAR DIA {dayId}</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {isCompleted && (
            <View style={styles.completedInfo}>
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
              <Text style={styles.completedInfoText}>
                Dia completado! Seus dados foram salvos.
              </Text>
            </View>
          )}

          {/* Bottom Padding */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => Linking.openURL(EBOOK_URL)}
        activeOpacity={0.9}
      >
        <Ionicons name="unlock" size={18} color="#0A1929" />
        <Text style={styles.fabText}>EBOOK</Text>
      </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#FF8C00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#0A1929',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backBtn: {
    padding: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
    marginLeft: 6,
  },
  titleContainer: {
    marginBottom: 24,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    marginBottom: 8,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 36,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
    marginLeft: 8,
  },
  teaserContainer: {
    backgroundColor: 'rgba(255, 140, 0, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00',
  },
  teaserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teaserTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8C00',
    marginLeft: 8,
  },
  teaserText: {
    fontSize: 15,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  riscoContainer: {
    backgroundColor: 'rgba(255, 82, 82, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  riscoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  riscoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF5252',
    marginLeft: 8,
  },
  riscoText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 22,
  },
  ferramentaContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  ferramentaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ferramentaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    marginLeft: 8,
  },
  ferramentaDescricao: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 20,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 22,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  completeButton: {
    backgroundColor: '#FF8C00',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A1929',
    marginLeft: 8,
    letterSpacing: 1,
  },
  completedInfo: {
    alignItems: 'center',
    padding: 24,
  },
  completedInfoText: {
    fontSize: 16,
    color: '#4CAF50',
    marginTop: 12,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#FF8C00',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A1929',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
});
