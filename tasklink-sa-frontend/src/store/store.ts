import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import authReducer from './slices/authSlice';
import jobsReducer from './slices/jobsSlice';
import uiReducer from './slices/uiSlice';
import chatReducer from './slices/chatSlice';
import locationReducer from './slices/locationSlice';
import notificationsReducer from './slices/notificationsSlice';

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    jobs: jobsReducer,
    ui: uiReducer,
    chat: chatReducer,
    location: locationReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(sagaMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;