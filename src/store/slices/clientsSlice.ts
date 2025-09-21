import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Client } from '../../types';

interface ClientsState {
  clients: Client[];
  loading: boolean;
  error: string | null;
  selectedClient: Client | null;
}

const initialState: ClientsState = {
  clients: [],
  loading: false,
  error: null,
  selectedClient: null,
};

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setClients: (state, action: PayloadAction<Client[]>) => {
      state.clients = action.payload;
    },
    addClient: (state, action: PayloadAction<Client>) => {
      state.clients.push(action.payload);
    },
    updateClient: (state, action: PayloadAction<Client>) => {
      const index = state.clients.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.clients[index] = action.payload;
      }
    },
    setSelectedClient: (state, action: PayloadAction<Client | null>) => {
      state.selectedClient = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setClients,
  addClient,
  updateClient,
  setSelectedClient,
} = clientsSlice.actions;
export default clientsSlice.reducer;
