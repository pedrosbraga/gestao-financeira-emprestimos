import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Payment, MonthlyPayment } from '../../types';

interface PaymentsState {
  payments: Payment[];
  monthlyPayments: MonthlyPayment[];
  loading: boolean;
  error: string | null;
}

const initialState: PaymentsState = {
  payments: [],
  monthlyPayments: [],
  loading: false,
  error: null,
};

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setPayments: (state, action: PayloadAction<Payment[]>) => {
      state.payments = action.payload;
    },
    addPayment: (state, action: PayloadAction<Payment>) => {
      state.payments.push(action.payload);
    },
    setMonthlyPayments: (state, action: PayloadAction<MonthlyPayment[]>) => {
      state.monthlyPayments = action.payload;
    },
    updateMonthlyPayment: (state, action: PayloadAction<MonthlyPayment>) => {
      const index = state.monthlyPayments.findIndex(
        p => p.id === action.payload.id
      );
      if (index !== -1) {
        state.monthlyPayments[index] = action.payload;
      }
    },
  },
});

export const {
  setLoading,
  setError,
  setPayments,
  addPayment,
  setMonthlyPayments,
  updateMonthlyPayment,
} = paymentsSlice.actions;
export default paymentsSlice.reducer;
