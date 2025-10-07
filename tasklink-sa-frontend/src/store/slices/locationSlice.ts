import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LocationState {
  currentLocation: {
    latitude: number;
    longitude: number;
    address: string;
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: LocationState = {
  currentLocation: null,
  loading: false,
  error: null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setCurrentLocation: (state, action: PayloadAction<{ latitude: number; longitude: number; address: string }>) => {
      state.currentLocation = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLocationLoading: (state) => {
      state.loading = true;
      state.error = null;
    },
    setLocationError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { setCurrentLocation, setLocationLoading, setLocationError } = locationSlice.actions;
export default locationSlice.reducer;