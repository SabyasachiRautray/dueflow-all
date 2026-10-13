import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'dueflow.auth';
const EMPTY = { token: null, user: null };

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || EMPTY;
  } catch {
    return EMPTY;
  }
};

const persist = (state) => {
  try {
    if (state.token) localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: state.token, user: state.user }));
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* storage unavailable */ }
};

const authSlice = createSlice({
  name: 'auth',
  initialState: load(),
  reducers: {
    setCredentials: (state, { payload }) => {
      state.token = payload.token;
      state.user = payload.user;
      persist(state);
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      persist(state);
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
export const selectUser = (s) => s.auth.user;
export const selectToken = (s) => s.auth.token;
