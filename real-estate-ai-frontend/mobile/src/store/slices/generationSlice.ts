import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../../services/api';
import { PropertyData, GenerationOptions, GeneratedResult, GenerationState } from '../../types';

const initialState: GenerationState = {
  isGenerating: false,
  progress: 0,
  currentStep: '',
  result: null,
  error: null,
};

export const generateDescription = createAsyncThunk(
  'generation/generateDescription',
  async (
    { propertyData, options }: { propertyData: PropertyData; options: GenerationOptions },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.generateDescription(propertyData, options);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Generation failed');
    }
  }
);

export const saveGeneration = createAsyncThunk(
  'generation/saveGeneration',
  async (result: GeneratedResult, { rejectWithValue }) => {
    try {
      const response = await apiService.saveGeneration(result);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Save failed');
    }
  }
);

const generationSlice = createSlice({
  name: 'generation',
  initialState,
  reducers: {
    clearResult: (state) => {
      state.result = null;
      state.error = null;
    },
    setProgress: (state, action: PayloadAction<{ progress: number; step: string }>) => {
      state.progress = action.payload.progress;
      state.currentStep = action.payload.step;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateDescription.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
        state.progress = 0;
      })
      .addCase(generateDescription.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.result = action.payload;
        state.progress = 100;
        state.currentStep = 'Complete!';
      })
      .addCase(generateDescription.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
      })

      .addCase(saveGeneration.pending, (state) => {
        // Don't change isGenerating state for save operations
      })
      .addCase(saveGeneration.fulfilled, (state, action) => {
        // Update result with saved status if needed
      })
      .addCase(saveGeneration.rejected, (state, action) => {
        // Handle save error
      });
  },
});

export const { clearResult, setProgress, clearError } = generationSlice.actions;
export default generationSlice.reducer;