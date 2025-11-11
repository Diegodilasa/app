import { create } from 'zustand';

interface ProgressState {
  dia_atual: number;
  dias_completados: number[];
  pontos_totais: number;
  tempo_limpo_inicio: string | null;
  medalhas: string[];
  tool_data: Record<string, any>;
  setProgress: (progress: Partial<ProgressState>) => void;
  completeDay: (dia: number) => void;
  reset: () => void;
}

export const useProgressStore = create<ProgressState>((set) => ({
  dia_atual: 1,
  dias_completados: [],
  pontos_totais: 0,
  tempo_limpo_inicio: null,
  medalhas: [],
  tool_data: {},
  
  setProgress: (progress) => set((state) => ({ ...state, ...progress })),
  
  completeDay: (dia) => set((state) => ({
    dias_completados: [...new Set([...state.dias_completados, dia])],
    dia_atual: Math.max(state.dia_atual, dia + 1),
  })),
  
  reset: () => set({
    dia_atual: 1,
    dias_completados: [],
    pontos_totais: 0,
    tempo_limpo_inicio: null,
    medalhas: [],
    tool_data: {},
  }),
}));
