import { apiSlice } from "./apiSlice";

export const payrollApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSalaryStructures: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/payroll/salary-structure/all",
        params,
      }),
      providesTags: ["SalaryStructures"],
    }),
    setupSalaryStructure: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/payroll/salary-structure",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SalaryStructures"],
    }),
    deleteSalaryStructure: builder.mutation({
      query: (id) => ({
        url: `/staff-hrms/payroll/salary-structure/${id}/delete`,
        method: "POST",
      }),
      invalidatesTags: ["SalaryStructures"],
    }),
    getRentReceipts: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/payroll/hra/rent-receipt",
        params: typeof params === "string" ? { employeeId: params } : params,
      }),
      providesTags: ["RentReceipts"],
    }),
    submitRentReceipt: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/payroll/hra/rent-receipt",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["RentReceipts"],
    }),
    verifyRentReceipt: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/staff-hrms/payroll/hra/rent-receipt/${id}/verify`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["RentReceipts"],
    }),
    getTaxDeclarations: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/payroll/tax-declaration",
        params,
      }),
      providesTags: ["TaxDeclarations"],
    }),
    submitTaxDeclaration: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/payroll/tax-declaration",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["TaxDeclarations"],
    }),
    getLoans: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/payroll/loan",
        params: typeof params === "string" ? { employeeId: params } : params,
      }),
      providesTags: ["Loans"],
    }),
    createLoan: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/payroll/loan",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Loans"],
    }),
    recordLoanRepayment: builder.mutation({
      query: ({ id, amount }) => ({
        url: `/staff-hrms/payroll/loan/${id}/repay`,
        method: "POST",
        body: { amount },
      }),
      invalidatesTags: ["Loans"],
    }),
    runMonthlyPayroll: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/payroll/run",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Payroll", "Payslips"],
    }),
    approvePayrollRun: builder.mutation({
      query: ({ month, year, approvedBy }) => ({
        url: `/staff-hrms/payroll/run/approve?month=${month}&year=${year}`,
        method: "POST",
        body: { approvedBy },
      }),
      invalidatesTags: ["Payroll", "Payslips"],
    }),
    getPayrollRun: builder.query({
      query: ({ month, year }) => `/staff-hrms/payroll/run?month=${month}&year=${year}`,
      providesTags: ["Payroll"],
    }),
    getPayslips: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/payroll/payslips",
        params,
      }),
      providesTags: ["Payslips"],
    }),
  }),
});

export const {
  useGetSalaryStructuresQuery,
  useSetupSalaryStructureMutation,
  useDeleteSalaryStructureMutation,
  useGetRentReceiptsQuery,
  useSubmitRentReceiptMutation,
  useVerifyRentReceiptMutation,
  useGetTaxDeclarationsQuery,
  useSubmitTaxDeclarationMutation,
  useGetLoansQuery,
  useCreateLoanMutation,
  useRecordLoanRepaymentMutation,
  useRunMonthlyPayrollMutation,
  useApprovePayrollRunMutation,
  useGetPayrollRunQuery,
  useGetPayslipsQuery,
} = payrollApi;
