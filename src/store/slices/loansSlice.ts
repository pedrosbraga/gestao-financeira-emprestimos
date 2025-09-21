import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Loan } from '../../types';

interface LoansState {
  loans: Loan[];
  loading: boolean;
  error: string | null;
  selectedLoan: Loan | null;
}

const initialState: LoansState = {
  loans: [],
  loading: false,
  error: null,
  selectedLoan: null,
};

const loansSlice = createSlice({
  name: 'loans',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setLoans: (state, action: PayloadAction<Loan[]>) => {
      state.loans = action.payload;
    },
    addLoan: (state, action: PayloadAction<Loan>) => {
      state.loans.push(action.payload);
    },
    updateLoan: (state, action: PayloadAction<Loan>) => {
      const index = state.loans.findIndex(l => l.id === action.payload.id);
      if (index !== -1) {
        state.loans[index] = action.payload;
      }
    },
    setSelectedLoan: (state, action: PayloadAction<Loan | null>) => {
      state.selectedLoan = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setLoans,
  addLoan,
  updateLoan,
  setSelectedLoan,
} = loansSlice.actions;
export default loansSlice.reducer;
