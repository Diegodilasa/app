import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useProgressStore } from '../store/progressStore';
import { userAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EBOOK_URL = 'https://go.hotmart.com/W102844514P?dp=1';

const DAY_DATA = [
  { dia: 1, titulo: 'Identificação do Gatilho Secreto', icon: 'eye', pontos: 100 },
  { dia: 2, titulo: 'A Regra dos 5 Segundos', icon: 'timer', pontos: 150 },
  { dia: 3, titulo: 'Substituição Estratégica', icon: 'swap-horizontal', pontos: 200 },
  { dia: 4, titulo: 'BLOQUEADO', icon: 'lock-closed', pontos: 0, locked: true },
  { dia: 5, titulo: 'BLOQUEADO', icon: 'lock-closed', pontos: 0, locked: true },
  { dia: 6, titulo: 'BLOQUEADO', icon: 'lock-closed', pontos: 0, locked: true },
  { dia: 7, titulo: 'BLOQUEADO', icon: 'lock-closed', pontos: 0, locked: true },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { email, logout } = useAuthStore();
  const { 
    dia_atual, 
    dias_completados, 
    pontos_totais, 
    tempo_limpo_inicio,
    medalhas,
    setProgress 
  } = useProgressStore();
  
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [tempoLimpo, setTempoLimpo] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (tempo_limpo_inicio) {
      updateTempoLimpo();
      const interval = setInterval(updateTempoLimpo, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [tempo_limpo_inicio]);

  const updateTempoLimpo = () => {
    if (tempo_limpo_inicio) {
      try {
        const distance = formatDistanceToNow(new Date(tempo_limpo_inicio), {
          locale: ptBR,
          addSuffix: false,
        });
        setTempoLimpo(distance);
      } catch (error) {
        console.error('Error formatting date:', error);
      }
    }
  };

  const loadDashboardData = async () => {
    if (!email) {
      router.replace('/');
      return;
    }

    try {
      const [user, progress] = await Promise.all([
        userAPI.getUser(email),
        userAPI.getProgress(email),
      ]);

      setUserData(user);
      setProgress(progress);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (day: typeof DAY_DATA[0]) => {
    if (day.locked) {
      Alert.alert(
        '🔒 Conteúdo Bloqueado',
        'Apenas o Protocolo Completo (no eBook) desbloqueia os dias 4-7 e o Manual Secreto de 15 Técnicas.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'DESBLOQUEAR TUDO', 
            onPress: () => Linking.openURL(EBOOK_URL),
            style: 'default'
          },
        ]
      );
      return;
    }

    router.push(`/day/${day.dia}`);
  };

  const handleEbookPress = () => {
    Linking.openURL(EBOOK_URL);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, Guerreiro!</Text>
            <Text style={styles.vicioText}>
              Alvo: <Text style={styles.vicioHighlight}>{userData?.vicio_alvo}</Text>
            </Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#FF8C00" />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.statValue}>{pontos_totais}</Text>
            <Text style={styles.statLabel}>Pontos</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{dias_completados.length}/7</Text>
            <Text style={styles.statLabel}>Dias</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#2196F3" />
            <Text style={styles.statValue}>{tempoLimpo || '0m'}</Text>
            <Text style={styles.statLabel}>Limpo</Text>
          </View>
        </View>

        {/* Medals */}
        {medalhas.length > 0 && (
          <View style={styles.medalsContainer}>
            <Text style={styles.medalsTitle}>
              <Ionicons name="trophy" size={16} color="#FFD700" /> Medalhas
            </Text>
            <View style={styles.medalsList}>
              {medalhas.includes('primeira_vitoria') && (
                <View style={styles.medalBadge}>
                  <Text style={styles.medalEmoji}>🏆</Text>
                  <Text style={styles.medalText}>Primeira Vitória</Text>
                </View>
              )}
              {medalhas.includes('guerreiro_3_dias') && (
                <View style={styles.medalBadge}>
                  <Text style={styles.medalEmoji}>💪</Text>
                  <Text style={styles.medalText}>Guerreiro 3 Dias</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>SEU PROGRESSO</Text>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${(dias_completados.length / 7) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {dias_completados.length} de 7 dias completados
          </Text>
        </View>

        {/* Days Grid */}
        <View style={styles.daysSection}>
          <Text style={styles.daysSectionTitle}>OS 7 PASSOS</Text>
          {DAY_DATA.map((day) => {
            const isCompleted = dias_completados.includes(day.dia);
            const isLocked = day.locked;
            const isCurrent = day.dia === dia_atual && !isCompleted;

            return (
              <TouchableOpacity
                key={day.dia}
                style={[
                  styles.dayCard,
                  isCompleted && styles.dayCardCompleted,
                  isLocked && styles.dayCardLocked,
                  isCurrent && styles.dayCardCurrent,
                ]}
                onPress={() => handleDayPress(day)}
                activeOpacity={0.7}
              >
                <View style={styles.dayCardLeft}>
                  <View style={[
                    styles.dayIcon,
                    isCompleted && styles.dayIconCompleted,
                    isLocked && styles.dayIconLocked,
                    isCurrent && styles.dayIconCurrent,
                  ]}>
                    <Ionicons 
                      name={isCompleted ? 'checkmark' : day.icon as any} 
                      size={24} 
                      color={isCompleted ? '#4CAF50' : isLocked ? '#666' : '#FF8C00'} 
                    />
                  </View>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayNumber}>DIA {day.dia}</Text>
                    <Text style={[
                      styles.dayTitle,
                      isLocked && styles.dayTitleLocked
                    ]}>
                      {day.titulo}
                    </Text>
                  </View>
                </View>
                
                {!isLocked && (
                  <View style={styles.dayCardRight}>
                    {isCompleted ? (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>COMPLETO</Text>
                      </View>
                    ) : (
                      <Text style={styles.pontosText}>+{day.pontos}pts</Text>
                    )}
                  </View>
                )}
                
                {isLocked && (
                  <View style={styles.lockedBadge}>
                    <Ionicons name="lock-closed" size={16} color="#666" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleEbookPress}
        activeOpacity={0.9}
      >
        <View style={styles.fabContent}>
          <Ionicons name="unlock" size={20} color="#0A1929" />
          <Text style={styles.fabText}>DESBLOQUEAR TUDO</Text>
        </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  vicioText: {
    fontSize: 14,
    color: '#888',
  },
  vicioHighlight: {
    color: '#FF8C00',
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  medalsContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  medalsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 12,
  },
  medalsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  medalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  medalEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  medalText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 32,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    marginBottom: 12,
    letterSpacing: 1,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  progressText: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  daysSection: {
    marginBottom: 24,
  },
  daysSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 1,
  },
  dayCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dayCardCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  dayCardLocked: {
    opacity: 0.6,
  },
  dayCardCurrent: {
    borderColor: '#FF8C00',
    borderWidth: 2,
  },
  dayCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dayIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dayIconCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  dayIconLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dayIconCurrent: {
    backgroundColor: 'rgba(255, 140, 0, 0.2)',
  },
  dayInfo: {
    flex: 1,
  },
  dayNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
    marginBottom: 2,
    letterSpacing: 1,
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dayTitleLocked: {
    color: '#666',
  },
  dayCardRight: {
    marginLeft: 12,
  },
  pontosText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
  },
  completedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4CAF50',
    letterSpacing: 0.5,
  },
  lockedBadge: {
    marginLeft: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#FF8C00',
    borderRadius: 12,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  fabContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  fabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A1929',
    marginLeft: 8,
    letterSpacing: 1,
  },
});
