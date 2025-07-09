import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '@/services/api';
import Cookies from 'js-cookie';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'OWNER' | 'ADMIN' | 'USER';
  department?: string;
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
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      console.log('🔐 Starting login request for username:', credentials.username);
    const response: any = await authAPI.login(credentials);
      console.log('✅ Login response received:', response);
      
      const { token, user, debug, message } = response.data; // Access response.data after interceptor change
      
      // Log debug information if available
      if (debug) {
        console.log('🐛 Login debug info:', debug);
      }
      
      if (message) {
        console.log('📄 Login message:', message);
      }
      
    // Set cookie with token
    Cookies.set('token', token, { expires: 7 }); // Expires in 7 days
      // Store user data in cookie for persistence
      Cookies.set('user', JSON.stringify(user), { expires: 7 });
      
      console.log('✅ Login successful, user:', user.username, 'role:', user.role);
    return { token, user };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      // Extract detailed error information
      let errorMessage = 'Login failed';
      let debugInfo = null;
      
      if (error.response?.data) {
        const errorData = error.response.data;
        console.log('🐛 Backend error response:', errorData);
        
        errorMessage = errorData.message || errorMessage;
        debugInfo = errorData.debug || null;
        
        // Include debug information in error for troubleshooting
        if (debugInfo) {
          errorMessage = `${errorMessage} (Debug: ${debugInfo})`;
        }
        
        // Add specific error details if available
        if (errorData.error) {
          errorMessage = `${errorMessage} - ${errorData.error}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('❌ Final error message:', errorMessage);
      return rejectWithValue({ message: errorMessage, debug: debugInfo });
    }
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
    const response: any = await authAPI.register(userData);
    const { token, user } = response.data; // Access response.data after interceptor change
    // Set cookie with token
    Cookies.set('token', token, { expires: 7 }); // Expires in 7 days
    // Store user data in cookie for persistence
    Cookies.set('user', JSON.stringify(user), { expires: 7 });
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
      // Use the centralized auth clear function
      authAPI.clearAuthData();
    },
    forceLogout: (state, action: PayloadAction<{ reason?: string }>) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = action.payload.reason || 'You have been logged out';
      // Use the centralized auth clear function
      authAPI.clearAuthData();
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
        // Handle enhanced error information
        if (action.payload && typeof action.payload === 'object' && 'message' in action.payload) {
          state.error = action.payload.message as string;
        } else {
        state.error = action.error.message || 'Login failed';
        }
        console.log('🔴 Login rejected, error set to:', state.error);
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

export const { setCredentials, logout, forceLogout, clearError } = authSlice.actions;
export default authSlice.reducer; 