import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch } from "@/lib/api";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function getErrorMsg(res, defaultMsg) {
  try {
    const data = await res.json();
    if (data && data.message) {
      return Array.isArray(data.message) ? data.message.join(", ") : data.message;
    }
  } catch (e) {}
  return defaultMsg;
}

export const runMonthlyPayroll = createAsyncThunk("payroll/runMonthlyPayroll", async ({ month, year }, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year }),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to execute monthly payroll run"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const approvePayrollRun = createAsyncThunk("payroll/approvePayrollRun", async ({ month, year, approvedBy }, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/run/approve?month=${month}&year=${year}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvedBy }),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to approve payroll run"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchPayrollRun = createAsyncThunk("payroll/fetchPayrollRun", async ({ month, year }, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/run?month=${month}&year=${year}`);
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to fetch payroll run"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchPayslips = createAsyncThunk("payroll/fetchPayslips", async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    if (params.employeeId) query.append("employeeId", params.employeeId);
    if (params.month) query.append("month", params.month);
    if (params.year) query.append("year", params.year);
    const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/payslips?${query.toString()}`);
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to fetch payslips"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const payrollRunSlice = createSlice({
  name: "payrollRun",
  initialState: {
    currentRun: null,
    payslips: { data: [], total: 0 },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(runMonthlyPayroll.fulfilled, (state, action) => {
        state.currentRun = action.payload;
        if (action.payload && Array.isArray(action.payload.payslips)) {
          state.payslips = {
            data: action.payload.payslips,
            total: action.payload.payslips.length,
          };
        }
      })
      .addCase(approvePayrollRun.fulfilled, (state, action) => {
        state.currentRun = action.payload;
        if (action.payload && Array.isArray(action.payload.payslips)) {
          state.payslips = {
            data: action.payload.payslips,
            total: action.payload.payslips.length,
          };
        }
      })
      .addCase(fetchPayrollRun.fulfilled, (state, action) => {
        state.currentRun = action.payload;
        if (action.payload && Array.isArray(action.payload.payslips)) {
          state.payslips = {
            data: action.payload.payslips,
            total: action.payload.payslips.length,
          };
        }
      })
      .addCase(fetchPayslips.fulfilled, (state, action) => {
        if (action.payload && action.payload.data) {
          state.payslips = action.payload;
        } else {
          state.payslips = { data: action.payload || [], total: (action.payload || []).length };
        }
      });
  },
});

export default payrollRunSlice.reducer;
