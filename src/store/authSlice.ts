import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Employee } from '@/types';

interface AuthState {
  currentUser: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<Employee | null>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
  },
});

export const { setUser, setLoading, logout } = authSlice.actions;
export default authSlice.reducer;
