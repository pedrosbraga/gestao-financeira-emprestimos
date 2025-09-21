import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import clientsSlice from './slices/clientsSlice';
import loansSlice from './slices/loansSlice';
import paymentsSlice from './slices/paymentsSlice';
import summarySlice from './slices/summarySlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    clients: clientsSlice,
    loans: loansSlice,
    payments: paymentsSlice,
    summary: summarySlice,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
