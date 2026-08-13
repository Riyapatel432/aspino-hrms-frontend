import { apiSlice } from "./apiSlice";

export const attendanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getShifts: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/attendance/shifts",
        params,
      }),
      providesTags: ["Shifts"],
    }),
    createShift: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/attendance/shifts",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Shifts"],
    }),
    deleteShift: builder.mutation({
      query: (id) => ({
        url: `/staff-hrms/attendance/shifts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Shifts"],
    }),
    getRosters: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/attendance/rosters",
        params,
      }),
      providesTags: ["Rosters"],
    }),
    createRoster: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/attendance/rosters",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Rosters"],
    }),
    deleteRoster: builder.mutation({
      query: (id) => ({
        url: `/staff-hrms/attendance/rosters/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Rosters"],
    }),
    getAttendance: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/attendance/attendance",
        params,
      }),
      providesTags: ["Attendance"],
    }),
    createAttendance: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/attendance/attendance",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Attendance"],
    }),
    bulkImportAttendance: builder.mutation({
      query: (records) => ({
        url: "/staff-hrms/attendance/attendance/bulk-import",
        method: "POST",
        body: { records },
      }),
      invalidatesTags: ["Attendance"],
    }),
  }),
});

export const {
  useGetShiftsQuery,
  useCreateShiftMutation,
  useDeleteShiftMutation,
  useGetRostersQuery,
  useCreateRosterMutation,
  useDeleteRosterMutation,
  useGetAttendanceQuery,
  useCreateAttendanceMutation,
  useBulkImportAttendanceMutation,
} = attendanceApi;
