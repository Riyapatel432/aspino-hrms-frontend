import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const fetchShifts = createAsyncThunk("attendance/fetchShifts", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/attendance/shifts`);
    if (!res.ok) throw new Error("Failed to fetch shifts");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchEmployees = createAsyncThunk("attendance/fetchEmployees", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/onboarding/employees?limit=1000`);
    if (!res.ok) throw new Error("Failed to fetch employees");
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.data || []);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createShift = createAsyncThunk("attendance/createShift", async (data, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/attendance/shifts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create shift");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const deleteShift = createAsyncThunk("attendance/deleteShift", async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/attendance/shifts/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete shift");
    return id;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchRosters = createAsyncThunk("attendance/fetchRosters", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/attendance/rosters`);
    if (!res.ok) throw new Error("Failed to fetch rosters");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createRoster = createAsyncThunk("attendance/createRoster", async (data, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/attendance/rosters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create roster");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const deleteRoster = createAsyncThunk("attendance/deleteRoster", async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/attendance/rosters/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete roster");
    return id;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchAttendance = createAsyncThunk("attendance/fetchAttendance", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/attendance/attendance`);
    if (!res.ok) throw new Error("Failed to fetch attendance");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createAttendance = createAsyncThunk("attendance/createAttendance", async (data, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/attendance/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create attendance");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const attendanceSlice = createSlice({
  name: "attendance",
  initialState: {
    shifts: [],
    rosters: [],
    attendance: [],
    employees: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Employees
      .addCase(fetchEmployees.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEmployees.fulfilled, (state, action) => { state.loading = false; state.employees = action.payload; })
      .addCase(fetchEmployees.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Shifts
      .addCase(fetchShifts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchShifts.fulfilled, (state, action) => { state.loading = false; state.shifts = action.payload; })
      .addCase(fetchShifts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createShift.fulfilled, (state, action) => { state.shifts.push(action.payload); })
      .addCase(deleteShift.fulfilled, (state, action) => { state.shifts = state.shifts.filter(s => s.id !== action.payload); })
      
      // Rosters
      .addCase(fetchRosters.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchRosters.fulfilled, (state, action) => { state.loading = false; state.rosters = action.payload; })
      .addCase(fetchRosters.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createRoster.fulfilled, (state, action) => { state.rosters.push(action.payload); })
      .addCase(deleteRoster.fulfilled, (state, action) => { state.rosters = state.rosters.filter(r => r.id !== action.payload); })
      
      // Attendance
      .addCase(fetchAttendance.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAttendance.fulfilled, (state, action) => { state.loading = false; state.attendance = action.payload; })
      .addCase(fetchAttendance.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createAttendance.fulfilled, (state, action) => { state.attendance.push(action.payload); });
  }
});

export default attendanceSlice.reducer;
