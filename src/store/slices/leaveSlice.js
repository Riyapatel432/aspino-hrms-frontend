import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch } from "@/lib/api";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function getErrorMsg(res, defaultMsg) {
  try {
    const data = await res.json();
    if (data && data.message) {
      if (Array.isArray(data.message)) {
        return data.message.join(", ");
      }
      return data.message;
    }
  } catch (e) {}
  return defaultMsg;
}

// Leaves
export const fetchLeaves = createAsyncThunk("leave/fetchLeaves", async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);
    if (params.status) query.append("status", params.status);
    if (params.leaveType) query.append("leaveType", params.leaveType);

    const res = await apiFetch(`${backendUrl}/staff-hrms/leave/leaves?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch leaves");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createLeave = createAsyncThunk("leave/createLeave", async (data, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/leave/leaves/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to create leave"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const updateLeaveStatus = createAsyncThunk("leave/updateLeaveStatus", async ({ id, status }, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/leave/leaves/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update leave status");
    return { id, status };
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const deleteLeave = createAsyncThunk("leave/deleteLeave", async (id, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/leave/leaves/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete leave");
    return id;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Leave Master
export const fetchLeaveMasters = createAsyncThunk("leave/fetchLeaveMasters", async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);
    if (params.department) query.append("department", params.department);
    if (params.fiscalYear) query.append("fiscalYear", params.fiscalYear);

    const res = await apiFetch(`${backendUrl}/staff-hrms/leave/leave-master?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch leave masters");
    const data = await res.json();
    return data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createLeaveMaster = createAsyncThunk("leave/createLeaveMaster", async (data, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/leave/leave-master`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to create leave master"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const updateLeaveMaster = createAsyncThunk("leave/updateLeaveMaster", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/leave/leave-master/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to update leave master"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const deleteLeaveMaster = createAsyncThunk("leave/deleteLeaveMaster", async (id, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/leave/leave-master/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete leave master");
    return id;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Holidays
export const fetchHolidays = createAsyncThunk("leave/fetchHolidays", async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);

    const res = await apiFetch(`${backendUrl}/staff-hrms/leave/holidays?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch holidays");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createHoliday = createAsyncThunk("leave/createHoliday", async (data, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/leave/holidays`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to create holiday"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const deleteHoliday = createAsyncThunk("leave/deleteHoliday", async (id, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/leave/holidays/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete holiday");
    return id;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const leaveSlice = createSlice({
  name: "leave",
  initialState: {
    leaves: [],
    totalLeaves: 0,
    leaveMasters: [],
    totalLeaveMasters: 0,
    holidays: [],
    totalHolidays: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Leaves
      .addCase(fetchLeaves.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.leaves = action.payload?.data || (Array.isArray(action.payload) ? action.payload : []);
        state.totalLeaves = action.payload?.pagination?.total || state.leaves.length;
      })
      .addCase(fetchLeaves.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createLeave.fulfilled, (state, action) => {
        const exists = state.leaves.some(l => l.id === action.payload?.id);
        if (!exists && action.payload?.id) {
          state.leaves.unshift(action.payload);
          state.totalLeaves += 1;
        }
      })
      .addCase(updateLeaveStatus.fulfilled, (state, action) => {
        const index = state.leaves.findIndex(l => l.id === action.payload.id);
        if (index !== -1) {
          state.leaves[index] = { ...state.leaves[index], status: action.payload.status };
        }
      })

      .addCase(deleteLeave.fulfilled, (state, action) => { 
        const initialLength = state.leaves.length;
        state.leaves = state.leaves.filter(l => l.id !== action.payload); 
        if (state.leaves.length < initialLength) {
          state.totalLeaves = Math.max(0, state.totalLeaves - 1);
        }
      })

      // Leave Masters
      .addCase(fetchLeaveMasters.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchLeaveMasters.fulfilled, (state, action) => {
        state.loading = false;
        state.leaveMasters = action.payload?.data || (Array.isArray(action.payload) ? action.payload : []);
        state.totalLeaveMasters = action.payload?.pagination?.total || state.leaveMasters.length;
      })
      .addCase(fetchLeaveMasters.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createLeaveMaster.fulfilled, (state, action) => { 
        state.leaveMasters.push(action.payload); 
        state.totalLeaveMasters += 1;
      })
      .addCase(updateLeaveMaster.fulfilled, (state, action) => {
        const idx = state.leaveMasters.findIndex(lm => lm.id === action.payload.id);
        if (idx !== -1) state.leaveMasters[idx] = action.payload;
      })
      .addCase(deleteLeaveMaster.fulfilled, (state, action) => { 
        const initialLength = state.leaveMasters.length;
        state.leaveMasters = state.leaveMasters.filter(lm => lm.id !== action.payload); 
        if (state.leaveMasters.length < initialLength) {
          state.totalLeaveMasters = Math.max(0, state.totalLeaveMasters - 1);
        }
      })

      // Holidays
      .addCase(fetchHolidays.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHolidays.fulfilled, (state, action) => {
        state.loading = false;
        state.holidays = action.payload?.data || (Array.isArray(action.payload) ? action.payload : []);
        state.totalHolidays = action.payload?.pagination?.total || state.holidays.length;
      })
      .addCase(fetchHolidays.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createHoliday.fulfilled, (state, action) => { 
        state.holidays.push(action.payload); 
        state.totalHolidays += 1;
      })
      .addCase(deleteHoliday.fulfilled, (state, action) => { 
        const initialLength = state.holidays.length;
        state.holidays = state.holidays.filter(h => h.id !== action.payload); 
        if (state.holidays.length < initialLength) {
          state.totalHolidays = Math.max(0, state.totalHolidays - 1);
        }
      });
  }
});

export default leaveSlice.reducer;
