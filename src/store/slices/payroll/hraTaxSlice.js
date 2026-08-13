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

export const fetchRentReceipts = createAsyncThunk("payroll/fetchRentReceipts", async (params = {}, { rejectWithValue }) => {
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
    const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/hra/rent-receipt?${query.toString()}`);
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to fetch rent receipts"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const submitRentReceipt = createAsyncThunk("payroll/submitRentReceipt", async (data, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/hra/rent-receipt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to submit rent receipt"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const verifyRentReceipt = createAsyncThunk("payroll/verifyRentReceipt", async ({ id, status, verifiedBy }, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/hra/rent-receipt/${id}/verify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, verifiedBy }),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to verify rent receipt"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchTaxDeclarations = createAsyncThunk("payroll/fetchTaxDeclarations", async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    if (params.month) query.append("month", params.month);
    if (params.year) query.append("year", params.year);
    if (params.employeeId) query.append("employeeId", params.employeeId);
    if (params.financialYear) query.append("financialYear", params.financialYear);
    const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/tax-declaration?${query.toString()}`);
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to fetch tax declarations"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const submitTaxDeclaration = createAsyncThunk("payroll/submitTaxDeclaration", async (data, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/tax-declaration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to submit tax declaration"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const hraTaxSlice = createSlice({
  name: "hraTax",
  initialState: {
    rentReceipts: { data: [], total: 0 },
    taxDeclarations: { data: [], total: 0 },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRentReceipts.fulfilled, (state, action) => {
        if (action.payload && action.payload.data) {
          state.rentReceipts = action.payload;
        } else {
          state.rentReceipts = { data: action.payload || [], total: (action.payload || []).length };
        }
      })
      .addCase(submitRentReceipt.fulfilled, (state, action) => {
        const dataArray = state.rentReceipts.data || [];
        const idx = dataArray.findIndex((r) => r.id === action.payload.id);
        if (idx >= 0) {
          dataArray[idx] = action.payload;
        } else {
          dataArray.unshift(action.payload);
          state.rentReceipts.total += 1;
        }
        state.rentReceipts.data = dataArray;
      })
      .addCase(verifyRentReceipt.fulfilled, (state, action) => {
        const dataArray = state.rentReceipts.data || [];
        const idx = dataArray.findIndex((r) => r.id === action.payload.id);
        if (idx >= 0) {
          dataArray[idx] = action.payload;
          state.rentReceipts.data = dataArray;
        }
      })
      .addCase(fetchTaxDeclarations.fulfilled, (state, action) => {
        if (action.payload && action.payload.data) {
          state.taxDeclarations = action.payload;
        } else {
          state.taxDeclarations = { data: action.payload || [], total: (action.payload || []).length };
        }
      });
  },
});

export default hraTaxSlice.reducer;
