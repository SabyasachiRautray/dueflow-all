// Generic CRUD endpoints matching the backend's makeCrudController contract:
//   GET    /:resource?page&limit&id  -> { totalItems, totalPages, currentPage, pageSize, data }
//   GET    /:resource/:id            -> record
//   POST   /:resource                -> { message, data }
//   PUT    /:resource/:id            -> { message, data }
//   DELETE /:resource/:id            -> { message }
import { api } from './api';

const listTag = (resource) => ({ type: 'Resource', id: `LIST-${resource}` });
const itemTag = (resource, id) => ({ type: 'Resource', id: `${resource}-${id}` });

export const crudApi = api.injectEndpoints({
  endpoints: (build) => ({
    getList: build.query({
      query: ({ resource, page = 1, limit = 10, ...rest }) => ({ url: `/${resource}`, params: { page, limit, ...rest } }),
      providesTags: (res, _e, { resource }) => [
        listTag(resource),
        ...(res?.data || []).map((row) => itemTag(resource, row.id)),
      ],
    }),
    getOne: build.query({
      query: ({ resource, id }) => `/${resource}/${id}`,
      providesTags: (_r, _e, { resource, id }) => [itemTag(resource, id)],
    }),
    createOne: build.mutation({
      query: ({ resource, body }) => ({ url: `/${resource}`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { resource }) => [listTag(resource)],
    }),
    updateOne: build.mutation({
      query: ({ resource, id, body }) => ({ url: `/${resource}/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { resource, id }) => [listTag(resource), itemTag(resource, id)],
    }),
    deleteOne: build.mutation({
      query: ({ resource, id }) => ({ url: `/${resource}/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { resource, id }) => [listTag(resource), itemTag(resource, id)],
    }),
  }),
});

export const {
  useGetListQuery,
  useGetOneQuery,
  useCreateOneMutation,
  useUpdateOneMutation,
  useDeleteOneMutation,
} = crudApi;
