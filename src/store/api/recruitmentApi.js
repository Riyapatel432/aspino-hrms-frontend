import { apiSlice } from "./apiSlice";

export const recruitmentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRequisitions: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/recruitment/requisitions",
        params,
      }),
      providesTags: ["Requisitions"],
    }),
    createRequisition: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/recruitment/requisitions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Requisitions"],
    }),
    getCandidates: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/recruitment/candidates",
        params,
      }),
      providesTags: ["Candidates"],
    }),
    createCandidate: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/recruitment/candidates",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Candidates"],
    }),
    updateCandidateStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/staff-hrms/recruitment/candidates/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Candidates"],
    }),
    getSchedules: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/recruitment/schedules",
        params,
      }),
      providesTags: ["Schedules"],
    }),
    createSchedule: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/recruitment/schedules",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Schedules"],
    }),
    getOffers: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/recruitment/offers",
        params,
      }),
      providesTags: ["Offers"],
    }),
    createOffer: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/recruitment/offers",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Offers"],
    }),
    acceptOffer: builder.mutation({
      query: (id) => ({
        url: `/staff-hrms/recruitment/offers/${id}/accept`,
        method: "POST",
      }),
      invalidatesTags: ["Offers"],
    }),
    getDepartments: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/recruitment/departments",
        params,
      }),
      providesTags: ["Departments"],
    }),
    getFiscalYears: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/recruitment/fiscal-years",
        params,
      }),
      providesTags: ["FinancialYears"],
    }),
  }),
});

export const {
  useGetRequisitionsQuery,
  useCreateRequisitionMutation,
  useGetCandidatesQuery,
  useCreateCandidateMutation,
  useUpdateCandidateStatusMutation,
  useGetSchedulesQuery,
  useCreateScheduleMutation,
  useGetOffersQuery,
  useCreateOfferMutation,
  useAcceptOfferMutation,
  useGetDepartmentsQuery,
  useGetFiscalYearsQuery,
} = recruitmentApi;
