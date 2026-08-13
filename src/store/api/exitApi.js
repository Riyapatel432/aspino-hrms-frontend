import { apiSlice } from "./apiSlice";

export const exitApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getExits: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/exit/exits",
        params,
      }),
      providesTags: ["Exits"],
    }),
    initiateExit: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/exit/exits/initiate",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Exits"],
    }),
    processSettlement: builder.mutation({
      query: ({ id, data }) => ({
        url: `/staff-hrms/exit/exits/${id}/settlement`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Exits"],
    }),
  }),
});

export const {
  useGetExitsQuery,
  useInitiateExitMutation,
  useProcessSettlementMutation,
} = exitApi;
