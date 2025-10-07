import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../../services/api';
import { MarketData, MarketState, ComparableProperty } from '../../types';

const initialState: MarketState = {
  data: null,
  comparables: [],
  trends: [],
  loading: false,
  error: null,
};

export const fetchMarketData = createAsyncThunk(
  'market/fetchMarketData',
  async (location: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getMarketData(location);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch market data');
    }
  }
);

export const fetchComparableProperties = createAsyncThunk(
  'market/fetchComparableProperties',
  async (params: { location: string; propertyType?: string; minPrice?: number; maxPrice?: number }, { rejectWithValue }) => {
    try {
      const response = await apiService.getComparableProperties(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch comparables');
    }
  }
);

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    clearMarketData: (state) => {
      state.data = null;
      state.comparables = [];
      state.trends = [];
      state.error = null;
    },
    setMarketError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearMarketError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMarketData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchMarketData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchComparableProperties.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchComparableProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.comparables = action.payload;
      })
      .addCase(fetchComparableProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearMarketData, setMarketError, clearMarketError } = marketSlice.actions;
export default marketSlice.reducer;