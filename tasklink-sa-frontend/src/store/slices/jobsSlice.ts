import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget: number;
  status: 'open' | 'in_progress' | 'completed';
}

interface JobsState {
  jobs: Job[];
  currentJob: Job | null;
  loading: boolean;
  error: string | null;
}

const initialState: JobsState = {
  jobs: [],
  currentJob: null,
  loading: false,
  error: null,
};

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    fetchJobsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchJobsSuccess: (state, action: PayloadAction<Job[]>) => {
      state.jobs = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchJobsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setCurrentJob: (state, action: PayloadAction<Job>) => {
      state.currentJob = action.payload;
    },
  },
});

export const {
  fetchJobsStart,
  fetchJobsSuccess,
  fetchJobsFailure,
  setCurrentJob,
} = jobsSlice.actions;

export default jobsSlice.reducer;