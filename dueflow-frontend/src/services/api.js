// Base RTK Query API. Every service file injects endpoints into this one.
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout } from '../features/auth/authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

// Logs the user out automatically when the token is rejected.
const baseQuery = async (args, api, extra) => {
  const result = await rawBaseQuery(args, api, extra);
  if (result.error?.status === 401) api.dispatch(logout());
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Resource'],
  endpoints: () => ({}),
});

export const errorMessage = (err) =>
  err?.data?.error || err?.data?.message || err?.error || 'Something went wrong';
