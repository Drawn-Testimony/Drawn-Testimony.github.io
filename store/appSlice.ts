import { createSlice } from '@reduxjs/toolkit';

export interface AppState {
    mode: 'default' | 'explore';
}

const initialState: AppState = {
  mode: 'default'
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setMode: (state, payload) => {
      state.mode = payload.payload;
    },
  },
});

export const { setMode } = appSlice.actions;
export default appSlice.reducer;
