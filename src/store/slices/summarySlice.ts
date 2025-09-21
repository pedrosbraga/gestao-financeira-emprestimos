import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SummaryData, MonthlySummary } from '../../types';

interface SummaryState extends SummaryData {
  loading: boolean;
  error: string | null;
  selectedPeriod: {
    month: number;
    year: number;
  } | null;
}

const initialState: SummaryState = {
  summaries: [],
  totalInvestido: 0,
  totalEmprestado: 0,
  totalRecebido: 0,
  loading: false,
  error: null,
  selectedPeriod: null,
};

const summarySlice = createSlice({
  name: 'summary',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSummaryData: (state, action: PayloadAction<SummaryData>) => {
      state.summaries = action.payload.summaries;
      state.totalInvestido = action.payload.totalInvestido;
      state.totalEmprestado = action.payload.totalEmprestado;
      state.totalRecebido = action.payload.totalRecebido;
    },
    addMonthlySummary: (state, action: PayloadAction<MonthlySummary>) => {
      const existingIndex = state.summaries.findIndex(
        s => s.month === action.payload.month && s.year === action.payload.year
      );
      if (existingIndex !== -1) {
        state.summaries[existingIndex] = action.payload;
      } else {
        state.summaries.push(action.payload);
      }
    },
    setSelectedPeriod: (
      state,
      action: PayloadAction<{ month: number; year: number } | null>
    ) => {
      state.selectedPeriod = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setSummaryData,
  addMonthlySummary,
  setSelectedPeriod,
} = summarySlice.actions;
export default summarySlice.reducer;
