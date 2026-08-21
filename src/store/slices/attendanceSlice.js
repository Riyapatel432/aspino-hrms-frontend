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

export const fetchShifts = createAsyncThunk("attendance/fetchShifts", async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);

    const res = await apiFetch(`${backendUrl}/staff-hrms/attendance/shifts?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch shifts");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchEmployees = createAsyncThunk("attendance/fetchEmployees", async (_, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/employees?limit=1000`);
    if (!res.ok) throw new Error("Failed to fetch employees");
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.data || []);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createShift = createAsyncThunk("attendance/createShift", async (data, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/attendance/shifts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to create shift"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const updateShift = createAsyncThunk("attendance/updateShift", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/attendance/shifts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to update shift"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const deleteShift = createAsyncThunk("attendance/deleteShift", async (id, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/attendance/shifts/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete shift");
    return id;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchRosters = createAsyncThunk("attendance/fetchRosters", async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);
    if (params.employeeId) query.append("employeeId", params.employeeId);
    if (params.shiftId) query.append("shiftId", params.shiftId);
    if (params.departmentId) query.append("departmentId", params.departmentId);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.month) query.append("month", params.month);
    if (params.year) query.append("year", params.year);

    const res = await apiFetch(`${backendUrl}/staff-hrms/attendance/rosters?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch rosters");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createRoster = createAsyncThunk("attendance/createRoster", async (data, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/attendance/rosters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to create roster"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const updateRoster = createAsyncThunk("attendance/updateRoster", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/attendance/rosters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to update roster"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const deleteRoster = createAsyncThunk("attendance/deleteRoster", async (id, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/attendance/rosters/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete roster");
    return id;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const bulkAssignRosters = createAsyncThunk("attendance/bulkAssignRosters", async (data, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/attendance/rosters/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to bulk assign shifts"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const changeEmployeeShift = createAsyncThunk("attendance/changeEmployeeShift", async ({ rosterId, data }, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/attendance/rosters/${rosterId}/change-shift`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to change shift"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchShiftAuditLogs = createAsyncThunk("attendance/fetchShiftAuditLogs", async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);
    if (params.employeeId) query.append("employeeId", params.employeeId);
    if (params.departmentId) query.append("departmentId", params.departmentId);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);

    const res = await apiFetch(`${backendUrl}/staff-hrms/attendance/rosters/audit-history?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch shift change history");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchAttendance = createAsyncThunk("attendance/fetchAttendance", async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);
    if (params.employeeId) query.append("employeeId", params.employeeId);
    if (params.date) query.append("date", params.date);
    if (params.month) query.append("month", params.month);
    if (params.year) query.append("year", params.year);

    const res = await apiFetch(`${backendUrl}/staff-hrms/attendance/attendance?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch attendance");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createAttendance = createAsyncThunk("attendance/createAttendance", async (data, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/attendance/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to create attendance"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const bulkImportAttendance = createAsyncThunk("attendance/bulkImportAttendance", async (records, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/attendance/attendance/bulk-import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to import attendance"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const attendanceSlice = createSlice({
  name: "attendance",
  initialState: {
    shifts: [],
    totalShifts: 0,
    rosters: [],
    totalRosters: 0,
    shiftAuditLogs: [],
    totalShiftAuditLogs: 0,
    attendance: [],
    totalAttendance: 0,
    employees: [],
    loading: false,
    shiftsLoading: false,
    rostersLoading: false,
    attendanceLoading: false,
    employeesLoading: false,
    bulkLoading: false,
    auditLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Employees
      .addCase(fetchEmployees.pending, (state) => { state.employeesLoading = true; state.error = null; })
      .addCase(fetchEmployees.fulfilled, (state, action) => { state.employeesLoading = false; state.employees = action.payload; })
      .addCase(fetchEmployees.rejected, (state, action) => { state.employeesLoading = false; state.error = action.payload; })
      // Shifts
      .addCase(fetchShifts.pending, (state) => { state.shiftsLoading = true; state.error = null; })
      .addCase(fetchShifts.fulfilled, (state, action) => {
        state.shiftsLoading = false;
        state.shifts = action.payload?.data || (Array.isArray(action.payload) ? action.payload : []);
        state.totalShifts = action.payload?.pagination?.total || state.shifts.length;
      })
      .addCase(fetchShifts.rejected, (state, action) => { state.shiftsLoading = false; state.error = action.payload; })
      .addCase(createShift.fulfilled, (state, action) => { 
        state.shifts.push(action.payload); 
        state.totalShifts += 1;
      })
      .addCase(updateShift.fulfilled, (state, action) => {
        const index = state.shifts.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.shifts[index] = action.payload;
        }
      })
      .addCase(deleteShift.fulfilled, (state, action) => { 
        const initialLength = state.shifts.length;
        state.shifts = state.shifts.filter(s => s.id !== action.payload); 
        if (state.shifts.length < initialLength) {
          state.totalShifts = Math.max(0, state.totalShifts - 1);
        }
      })
      
      // Rosters
      .addCase(fetchRosters.pending, (state) => { state.rostersLoading = true; state.error = null; })
      .addCase(fetchRosters.fulfilled, (state, action) => {
        state.rostersLoading = false;
        state.rosters = action.payload?.data || (Array.isArray(action.payload) ? action.payload : []);
        state.totalRosters = action.payload?.pagination?.total || state.rosters.length;
      })
      .addCase(fetchRosters.rejected, (state, action) => { state.rostersLoading = false; state.error = action.payload; })
      .addCase(createRoster.fulfilled, (state, action) => { 
        const idx = state.rosters.findIndex(r => r.id === action.payload.id);
        if (idx !== -1) {
          state.rosters[idx] = action.payload;
        } else {
          state.rosters.unshift(action.payload);
          state.totalRosters += 1;
        }
      })
      .addCase(updateRoster.fulfilled, (state, action) => {
        const idx = state.rosters.findIndex(r => r.id === action.payload.id);
        if (idx !== -1) {
          state.rosters[idx] = action.payload;
        }
      })
      .addCase(changeEmployeeShift.fulfilled, (state, action) => {
        const updated = action.payload?.updatedRoster;
        if (updated) {
          const idx = state.rosters.findIndex(r => r.id === updated.id);
          if (idx !== -1) {
            state.rosters[idx] = updated;
          }
        }
        if (action.payload?.auditLog) {
          state.shiftAuditLogs.unshift(action.payload.auditLog);
          state.totalShiftAuditLogs += 1;
        }
      })
      .addCase(deleteRoster.fulfilled, (state, action) => { 
        const initialLength = state.rosters.length;
        state.rosters = state.rosters.filter(r => r.id !== action.payload); 
        if (state.rosters.length < initialLength) {
          state.totalRosters = Math.max(0, state.totalRosters - 1);
        }
      })

      // Shift Audit Logs
      .addCase(fetchShiftAuditLogs.pending, (state) => { state.auditLoading = true; })
      .addCase(fetchShiftAuditLogs.fulfilled, (state, action) => {
        state.auditLoading = false;
        state.shiftAuditLogs = action.payload?.data || (Array.isArray(action.payload) ? action.payload : []);
        state.totalShiftAuditLogs = action.payload?.pagination?.total || state.shiftAuditLogs.length;
      })
      .addCase(fetchShiftAuditLogs.rejected, (state, action) => { state.auditLoading = false; })
      
      // Attendance
      .addCase(fetchAttendance.pending, (state) => { state.attendanceLoading = true; state.error = null; })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.attendanceLoading = false;
        state.attendance = action.payload?.data || (Array.isArray(action.payload) ? action.payload : []);
        state.totalAttendance = action.payload?.pagination?.total || state.attendance.length;
      })
      .addCase(fetchAttendance.rejected, (state, action) => { state.attendanceLoading = false; state.error = action.payload; })
      .addCase(createAttendance.fulfilled, (state, action) => { 
        state.attendance.push(action.payload); 
        state.totalAttendance += 1;
      });
  }
});

export default attendanceSlice.reducer;
