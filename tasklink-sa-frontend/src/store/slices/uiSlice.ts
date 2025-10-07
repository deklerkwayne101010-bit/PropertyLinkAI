import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  loading: boolean;
  modal: {
    open: boolean;
    type: string | null;
    data: any;
  };
}

const initialState: UiState = {
  sidebarOpen: false,
  loading: false,
  modal: {
    open: false,
    type: null,
    data: null,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    openModal: (state, action: PayloadAction<{ type: string; data?: any }>) => {
      state.modal.open = true;
      state.modal.type = action.payload.type;
      state.modal.data = action.payload.data || null;
    },
    closeModal: (state) => {
      state.modal.open = false;
      state.modal.type = null;
      state.modal.data = null;
    },
  },
});

export const { toggleSidebar, setLoading, openModal, closeModal } = uiSlice.actions;
export default uiSlice.reducer;