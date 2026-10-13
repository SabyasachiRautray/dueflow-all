import { api } from './api';

// NOTE: the backend routes shared so far have no auth router. This assumes
// POST /api/auth/login -> { token, user: { id, name, email, role, org_id } }.
export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation({
      query: (body) => ({ url: '/users/login', method: 'POST', body }),
    }),
  }),
});

export const { useLoginMutation } = authApi;
