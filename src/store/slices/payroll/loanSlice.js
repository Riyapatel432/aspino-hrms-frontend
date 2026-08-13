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

export const fetchLoans = createAsyncThunk("payroll/fetchLoans", async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (typeof params === "string") {
      query.append("employeeId", params);
    } else {
      if (params.page) query.append("page", params.page);
      if (params.limit) query.append("limit", params.limit);
      if (params.search) query.append("search", params.search);
      if (params.month) query.append("month", params.month);
      if (params.year) query.append("year", params.year);
      if (params.employeeId) query.append("employeeId", params.employeeId);
    }
    const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/loan?${query.toString()}`);
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to fetch loans"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createLoan = createAsyncThunk("payroll/createLoan", async (data, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/loan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to create loan"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const recordLoanRepayment = createAsyncThunk("payroll/recordLoanRepayment", async ({ id, amount }, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/loan/${id}/repay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to record loan repayment"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const loanSlice = createSlice({
  name: "loan",
  initialState: {
    loans: { data: [], total: 0 },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLoans.fulfilled, (state, action) => {
        if (action.payload && action.payload.data) {
          state.loans = action.payload;
        } else {
          state.loans = { data: action.payload || [], total: (action.payload || []).length };
        }
      })
      .addCase(createLoan.fulfilled, (state, action) => {
        const dataArray = state.loans.data || [];
        const idx = dataArray.findIndex((l) => l.id === action.payload.id);
        if (idx >= 0) {
          dataArray[idx] = action.payload;
        } else {
          dataArray.unshift(action.payload);
          state.loans.total += 1;
        }
        state.loans.data = dataArray;
      });
  },
});

export default loanSlice.reducer;
