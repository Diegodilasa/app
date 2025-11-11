import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  email: string | null;
  isOnboarded: boolean;
  setEmail: (email: string) => void;
  setOnboarded: (value: boolean) => void;
  loadAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  email: null,
  isOnboarded: false,
  
  setEmail: (email: string) => {
    set({ email });
    AsyncStorage.setItem('userEmail', email);
  },
  
  setOnboarded: (value: boolean) => {
    set({ isOnboarded: value });
    AsyncStorage.setItem('isOnboarded', value.toString());
  },
  
  loadAuth: async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      const onboarded = await AsyncStorage.getItem('isOnboarded');
      
      if (email) {
        set({ 
          email, 
          isOnboarded: onboarded === 'true' 
        });
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    }
  },
  
  logout: async () => {
    await AsyncStorage.multiRemove(['userEmail', 'isOnboarded']);
    set({ email: null, isOnboarded: false });
  },
}));
