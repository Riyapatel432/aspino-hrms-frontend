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
export const fetchLeaves = createAsyncThunk("leave/fetchLeaves", async (_, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/leave/leaves`);
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
export const fetchLeaveMasters = createAsyncThunk("leave/fetchLeaveMasters", async (_, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/leave/leave-master`);
    if (!res.ok) throw new Error("Failed to fetch leave masters");
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.data || []);
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
export const fetchHolidays = createAsyncThunk("leave/fetchHolidays", async (_, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/leave/holidays`);
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
    leaveMasters: [],
    holidays: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Leaves
      .addCase(fetchLeaves.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchLeaves.fulfilled, (state, action) => { state.loading = false; state.leaves = action.payload; })
      .addCase(fetchLeaves.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createLeave.fulfilled, (state, action) => { state.leaves.push(action.payload); })
      .addCase(updateLeaveStatus.fulfilled, (state, action) => {
        const index = state.leaves.findIndex(l => l.id === action.payload.id);
        if (index !== -1) state.leaves[index].status = action.payload.status;
      })

      .addCase(deleteLeave.fulfilled, (state, action) => { state.leaves = state.leaves.filter(l => l.id !== action.payload); })

      // Leave Masters
      .addCase(fetchLeaveMasters.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchLeaveMasters.fulfilled, (state, action) => { state.loading = false; state.leaveMasters = action.payload; })
      .addCase(fetchLeaveMasters.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createLeaveMaster.fulfilled, (state, action) => { state.leaveMasters.push(action.payload); })
      .addCase(deleteLeaveMaster.fulfilled, (state, action) => { state.leaveMasters = state.leaveMasters.filter(lm => lm.id !== action.payload); })

      // Holidays
      .addCase(fetchHolidays.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHolidays.fulfilled, (state, action) => { state.loading = false; state.holidays = action.payload; })
      .addCase(fetchHolidays.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createHoliday.fulfilled, (state, action) => { state.holidays.push(action.payload); })
      .addCase(deleteHoliday.fulfilled, (state, action) => { state.holidays = state.holidays.filter(h => h.id !== action.payload); });
  }
});

export default leaveSlice.reducer;
