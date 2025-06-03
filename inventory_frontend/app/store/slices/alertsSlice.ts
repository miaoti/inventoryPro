import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Alert {
  id: number;
  message: string;
  resolved: boolean;
  read: boolean;
  createdAt: string;
  resolvedAt?: string;
  readAt?: string;
  alertType?: string;
  item?: {
    id: number;
    name: string;
    code: string;
    barcode: string;
    location?: string;
  };
  currentInventory?: number;
  pendingPO?: number;
  usedInventory?: number;
  safetyStockThreshold?: number;
}

interface AlertsState {
  alerts: Alert[];
  unreadAlerts: number;
  activeAlerts: number;
}

const initialState: AlertsState = {
  alerts: [],
  unreadAlerts: 0,
  activeAlerts: 0,
};

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    setAlerts: (state, action: PayloadAction<Alert[]>) => {
      state.alerts = action.payload;
      state.unreadAlerts = action.payload.filter(alert => !alert.resolved && !alert.read).length;
      state.activeAlerts = action.payload.filter(alert => !alert.resolved).length;
    },
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.alerts.push(action.payload);
      if (!action.payload.resolved) {
        state.activeAlerts += 1;
        if (!action.payload.read) {
          state.unreadAlerts += 1;
        }
      }
    },
    markAlertAsRead: (state, action: PayloadAction<number>) => {
      const alert = state.alerts.find(a => a.id === action.payload);
      if (alert && !alert.read && !alert.resolved) {
        alert.read = true;
        alert.readAt = new Date().toISOString();
        state.unreadAlerts -= 1;
      }
    },
    resolveAlert: (state, action: PayloadAction<number>) => {
      const alert = state.alerts.find(a => a.id === action.payload);
      if (alert && !alert.resolved) {
        alert.resolved = true;
        alert.resolvedAt = new Date().toISOString();
        state.activeAlerts -= 1;
        if (!alert.read) {
          state.unreadAlerts -= 1;
        }
      }
    },
    updateAlertCounts: (state, action: PayloadAction<{ unreadAlerts: number; activeAlerts: number }>) => {
      state.unreadAlerts = action.payload.unreadAlerts;
      state.activeAlerts = action.payload.activeAlerts;
    },
  },
});

export const { setAlerts, addAlert, markAlertAsRead, resolveAlert, updateAlertCounts } = alertsSlice.actions;
export default alertsSlice.reducer; 