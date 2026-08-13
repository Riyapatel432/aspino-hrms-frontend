import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL, TOKEN_COOKIE_NAME } from "@/constants/api.constants";

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers) => {
      const token = getCookie(TOKEN_COOKIE_NAME);
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    "Auth",
    "Users",
    "Attendance",
    "Shifts",
    "Rosters",
    "Leaves",
    "LeaveMaster",
    "Holidays",
    "Employees",
    "Banks",
    "Departments",
    "FinancialYears",
    "Payroll",
    "SalaryStructures",
    "RentReceipts",
    "TaxDeclarations",
    "Loans",
    "Payslips",
    "AppraisalCycles",
    "Goals",
    "Reviews",
    "Trainings",
    "TrainingTypes",
    "Requisitions",
    "Candidates",
    "Schedules",
    "Offers",
    "Audit",
    "Exits"
  ],
  endpoints: () => ({}),
});
