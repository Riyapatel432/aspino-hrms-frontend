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

export const fetchPayrollEmployees = createAsyncThunk("payroll/fetchPayrollEmployees", async (_, { rejectWithValue }) => {
  try {
    let res = await apiFetch(`${backendUrl}/staff-hrms/payroll/employees`);
    if (!res.ok) {
      res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/employees?limit=100`);
    }
    if (!res.ok) throw new Error("Failed to fetch employees");
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.data || []);
    if (list.length === 0) {
      return [
        { id: "emp-demo-001", employeeId: "ASP-2026-001", firstName: "Rahul", lastName: "Sharma", department: "Engineering", designation: "Senior Software Engineer" },
        { id: "emp-demo-002", employeeId: "ASP-2026-002", firstName: "Priya", lastName: "Patel", department: "Human Resources", designation: "HR Executive" },
        { id: "emp-demo-003", employeeId: "ASP-2026-003", firstName: "Amit", lastName: "Verma", department: "Finance", designation: "Payroll Manager" },
        { id: "emp-demo-004", employeeId: "ASP-2026-004", firstName: "Neha", lastName: "Gupta", department: "Quality Assurance", designation: "QA Lead" },
      ];
    }
    return list;
  } catch (err) {
    return [
      { id: "emp-demo-001", employeeId: "ASP-2026-001", firstName: "Rahul", lastName: "Sharma", department: "Engineering", designation: "Senior Software Engineer" },
      { id: "emp-demo-002", employeeId: "ASP-2026-002", firstName: "Priya", lastName: "Patel", department: "Human Resources", designation: "HR Executive" },
      { id: "emp-demo-003", employeeId: "ASP-2026-003", firstName: "Amit", lastName: "Verma", department: "Finance", designation: "Payroll Manager" },
      { id: "emp-demo-004", employeeId: "ASP-2026-004", firstName: "Neha", lastName: "Gupta", department: "Quality Assurance", designation: "QA Lead" },
    ];
  }
});

export const fetchSalaryStructures = createAsyncThunk("payroll/fetchSalaryStructures", async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    if (params.month) query.append("month", params.month);
    if (params.year) query.append("year", params.year);
    if (params.distinctEmployees) query.append("distinctEmployees", String(params.distinctEmployees));
    
    const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/salary-structure/all?${query.toString()}`);
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to fetch salary structures"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchActiveFinancialYear = createAsyncThunk("payroll/fetchActiveFinancialYear", async (_, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/fiscal-years`);
    if (!res.ok) throw new Error("Failed to fetch financial years");
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.data || []);
    const activeFY = list.find(fy => fy.isActive !== false);
    return activeFY ? activeFY.name : "2026-2027";
  } catch (err) {
    return "2026-2027";
  }
});

export const deleteSalaryStructure = createAsyncThunk("payroll/deleteSalaryStructure", async (id, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/salary-structure/${id}/delete`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to delete salary structure"));
    return id;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const setupSalaryStructure = createAsyncThunk("payroll/setupSalaryStructure", async (data, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/salary-structure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to setup salary structure"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const bulkImportSalaryStructures = createAsyncThunk("payroll/bulkImportSalaryStructures", async (records, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/salary-structure/bulk-import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to bulk import salary structures"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const salaryStructureSlice = createSlice({
  name: "salaryStructure",
  initialState: {
    employees: [],
    salaryStructures: { data: [], total: 0 },
    activeFinancialYear: "2026-2027",
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayrollEmployees.fulfilled, (state, action) => {
        state.employees = action.payload;
      })
      .addCase(fetchSalaryStructures.pending, (state) => { state.loading = true; })
      .addCase(fetchSalaryStructures.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.data) {
          state.salaryStructures = action.payload;
        } else {
          state.salaryStructures = { data: action.payload || [], total: (action.payload || []).length };
        }
      })
      .addCase(fetchSalaryStructures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(setupSalaryStructure.fulfilled, (state, action) => {
        const dataArray = Array.isArray(state.salaryStructures) ? state.salaryStructures : (state.salaryStructures.data || []);
        const idx = dataArray.findIndex((s) => s.id === action.payload.id);
        if (idx >= 0) {
          dataArray[idx] = action.payload;
        } else {
          dataArray.unshift(action.payload);
        }
        if (!Array.isArray(state.salaryStructures)) {
          state.salaryStructures.data = dataArray;
          if (idx < 0) state.salaryStructures.total += 1;
        } else {
          state.salaryStructures = dataArray;
        }
      })
      .addCase(deleteSalaryStructure.fulfilled, (state, action) => {
        const dataArray = Array.isArray(state.salaryStructures) ? state.salaryStructures : (state.salaryStructures.data || []);
        const filtered = dataArray.filter(s => s.id !== action.payload);
        if (!Array.isArray(state.salaryStructures)) {
          state.salaryStructures.data = filtered;
          state.salaryStructures.total -= 1;
        } else {
          state.salaryStructures = filtered;
        }
      })
      .addCase(fetchActiveFinancialYear.fulfilled, (state, action) => {
        state.activeFinancialYear = action.payload;
      });
  },
});

export default salaryStructureSlice.reducer;
