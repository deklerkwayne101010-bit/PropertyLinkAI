import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import generationReducer from './slices/generationSlice';
import uiReducer from './slices/uiSlice';
import marketReducer from './slices/marketSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    generation: generationReducer,
    ui: uiReducer,
    market: marketReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;