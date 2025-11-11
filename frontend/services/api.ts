import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authAPI = {
  login: async (email: string) => {
    const response = await api.post('/auth/login', { email });
    return response.data;
  },
  
  completeOnboarding: async (email: string, vicio_alvo: string) => {
    const response = await api.post('/auth/onboarding', { email, vicio_alvo });
    return response.data;
  },
};

export const userAPI = {
  getUser: async (email: string) => {
    const response = await api.get(`/user/${email}`);
    return response.data;
  },
  
  getProgress: async (email: string) => {
    const response = await api.get(`/progress/${email}`);
    return response.data;
  },
};

export const progressAPI = {
  completeDay: async (email: string, dia: number, pontos: number) => {
    const response = await api.post('/progress/complete-day', { email, dia, pontos });
    return response.data;
  },
  
  saveToolData: async (email: string, dia: number, data: any) => {
    const response = await api.post('/progress/save-tool-data', { email, dia, data });
    return response.data;
  },
};

export default api;
