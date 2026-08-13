import { apiSlice } from "./apiSlice";

export const onboardingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/onboarding/employees",
        params,
      }),
      providesTags: ["Employees"],
    }),
    createEmployee: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/onboarding/employees",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Employees"],
    }),
    updateEmployee: builder.mutation({
      query: ({ id, data }) => ({
        url: `/staff-hrms/onboarding/employees/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Employees"],
    }),
    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `/staff-hrms/onboarding/employees/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Employees"],
    }),
    getBanks: builder.query({
      query: () => "/staff-hrms/onboarding/banks",
      providesTags: ["Banks"],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetBanksQuery,
} = onboardingApi;
