import { apiSlice } from "./apiSlice";

export const performanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAppraisalCycles: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/performance/appraisal-cycles",
        params,
      }),
      providesTags: ["AppraisalCycles"],
    }),
    createAppraisalCycle: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/performance/appraisal-cycles",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["AppraisalCycles"],
    }),
    deleteAppraisalCycle: builder.mutation({
      query: (id) => ({
        url: `/staff-hrms/performance/appraisal-cycles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AppraisalCycles"],
    }),
    getGoals: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/performance/goals",
        params,
      }),
      providesTags: ["Goals"],
    }),
    createGoal: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/performance/goals",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Goals"],
    }),
    deleteGoal: builder.mutation({
      query: (id) => ({
        url: `/staff-hrms/performance/goals/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Goals"],
    }),
    getReviews: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/performance/reviews",
        params,
      }),
      providesTags: ["Reviews"],
    }),
    createReview: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/performance/reviews",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Reviews"],
    }),
    deleteReview: builder.mutation({
      query: (id) => ({
        url: `/staff-hrms/performance/reviews/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Reviews"],
    }),
  }),
});

export const {
  useGetAppraisalCyclesQuery,
  useCreateAppraisalCycleMutation,
  useDeleteAppraisalCycleMutation,
  useGetGoalsQuery,
  useCreateGoalMutation,
  useDeleteGoalMutation,
  useGetReviewsQuery,
  useCreateReviewMutation,
  useDeleteReviewMutation,
} = performanceApi;
