import { apiSlice } from "./apiSlice";

export const leaveApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLeaves: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/leave/leaves",
        params,
      }),
      providesTags: ["Leaves"],
    }),
    applyLeave: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/leave/leaves/apply",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Leaves"],
    }),
    updateLeaveStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/staff-hrms/leave/leaves/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Leaves"],
    }),
    deleteLeave: builder.mutation({
      query: (id) => ({
        url: `/staff-hrms/leave/leaves/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Leaves"],
    }),
    getLeaveMasters: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/leave/leave-master",
        params,
      }),
      providesTags: ["LeaveMaster"],
    }),
    createLeaveMaster: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/leave/leave-master",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["LeaveMaster"],
    }),
    updateLeaveMaster: builder.mutation({
      query: ({ id, data }) => ({
        url: `/staff-hrms/leave/leave-master/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["LeaveMaster"],
    }),
    deleteLeaveMaster: builder.mutation({
      query: (id) => ({
        url: `/staff-hrms/leave/leave-master/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["LeaveMaster"],
    }),
    getHolidays: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/leave/holidays",
        params,
      }),
      providesTags: ["Holidays"],
    }),
    createHoliday: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/leave/holidays",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Holidays"],
    }),
    deleteHoliday: builder.mutation({
      query: (id) => ({
        url: `/staff-hrms/leave/holidays/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Holidays"],
    }),
  }),
});

export const {
  useGetLeavesQuery,
  useApplyLeaveMutation,
  useUpdateLeaveStatusMutation,
  useDeleteLeaveMutation,
  useGetLeaveMastersQuery,
  useCreateLeaveMasterMutation,
  useUpdateLeaveMasterMutation,
  useDeleteLeaveMasterMutation,
  useGetHolidaysQuery,
  useCreateHolidayMutation,
  useDeleteHolidayMutation,
} = leaveApi;
