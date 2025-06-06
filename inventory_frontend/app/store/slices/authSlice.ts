import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '@/services/api';
import Cookies from 'js-cookie';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'OWNER' | 'ADMIN' | 'USER';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string }) => {
    const response = await authAPI.login(credentials);
    const { token, user } = response; // response is now the data directly due to interceptor
    // Set cookie with token
    Cookies.set('token', token, { expires: 7 }); // Expires in 7 days
    return { token, user };
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: {
    username: string;
    password: string;
    email: string;
    fullName: string;
  }) => {
    const response = await authAPI.register(userData);
    const { token, user } = response; // response is now the data directly due to interceptor
    // Set cookie with token
    Cookies.set('token', token, { expires: 7 }); // Expires in 7 days
    return { token, user };
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      // Remove cookie
      Cookies.remove('token');
      // Clear all localStorage items that might contain authentication data
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('authToken');
      // Clear all sessionStorage items that might contain authentication data
      sessionStorage.removeItem('isAdmin');
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('userName');
      sessionStorage.removeItem('authToken');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      });
  },
});

export const { setCredentials, logout, clearError } = authSlice.actions;
export default authSlice.reducer; 