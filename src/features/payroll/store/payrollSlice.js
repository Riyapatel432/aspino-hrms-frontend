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

const payrollSlice = createSlice({
  name: "payroll",
  initialState: {
    employees: [],
    salaryStructures: { data: [], total: 0 },
    rentReceipts: { data: [], total: 0 },
    taxDeclarations: { data: [], total: 0 },
    loans: { data: [], total: 0 },
    currentRun: null,
    payslips: { data: [], total: 0 },
    loading: false,
    error: null,
    activeFinancialYear: "2026-2027",
  },
  reducers: {
    clearPayrollError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayrollEmployees.fulfilled, (state, action) => {
        state.employees = action.payload;
      })
      .addCase(fetchSalaryStructures.pending, (state) => { state.loading = true; })
      .addCase(fetchSalaryStructures.fulfilled, (state, action) => {
        state.loading = false;
        // Check if paginated object or array (backward compatibility)
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
      })
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
      })
      .addCase(runMonthlyPayroll.fulfilled, (state, action) => {
        state.currentRun = action.payload;
      })
      .addCase(approvePayrollRun.fulfilled, (state, action) => {
        state.currentRun = action.payload;
      })
      .addCase(fetchPayrollRun.fulfilled, (state, action) => {
        state.currentRun = action.payload;
      })
      .addCase(fetchPayslips.fulfilled, (state, action) => {
        if (action.payload && action.payload.data) {
          state.payslips = action.payload;
        } else {
          state.payslips = { data: action.payload || [], total: (action.payload || []).length };
        }
      })
      .addCase(fetchActiveFinancialYear.fulfilled, (state, action) => {
        state.activeFinancialYear = action.payload;
      });
  },
});

export const { clearPayrollError } = payrollSlice.actions;
export default payrollSlice.reducer;
