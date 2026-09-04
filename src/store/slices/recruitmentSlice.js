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

// Requisitions
export const fetchRequisitions = createAsyncThunk("recruitment/fetchRequisitions", async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);
    if (params.status) query.append("status", params.status);

    const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/requisitions?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch requisitions");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createRequisition = createAsyncThunk("recruitment/createRequisition", async (data, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/requisitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to create requisition"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Candidates
export const fetchCandidates = createAsyncThunk("recruitment/fetchCandidates", async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);
    if (params.status) query.append("status", params.status);

    const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/candidates?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch candidates");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createCandidate = createAsyncThunk("recruitment/createCandidate", async (data, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to create candidate"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const updateCandidateStatus = createAsyncThunk("recruitment/updateCandidateStatus", async ({ id, status }, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/candidates/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update candidate status");
    return { id, status };
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Schedules
export const fetchSchedules = createAsyncThunk("recruitment/fetchSchedules", async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);
    if (params.status) query.append("status", params.status);
    if (params.date) query.append("date", params.date);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);

    const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/schedules?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch schedules");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createSchedule = createAsyncThunk("recruitment/createSchedule", async (data, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/schedules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to create schedule"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Offers
export const fetchOffers = createAsyncThunk("recruitment/fetchOffers", async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);
    if (params.status) query.append("status", params.status);

    const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/offers?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch offers");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createOffer = createAsyncThunk("recruitment/createOffer", async (data, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/offers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to create offer"));
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const updateOfferStatus = createAsyncThunk("recruitment/updateOfferStatus", async ({ id, status }, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/offers/${id}/accept`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(await getErrorMsg(res, "Failed to accept offer"));
    return { id, status: 'ACCEPTED' };
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Departments
export const fetchDepartments = createAsyncThunk("recruitment/fetchDepartments", async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);

    const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/departments?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch departments");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const recruitmentSlice = createSlice({
  name: "recruitment",
  initialState: {
    requisitions: [],
    totalRequisitions: 0,
    candidates: [],
    totalCandidates: 0,
    schedules: [],
    totalSchedules: 0,
    offers: [],
    totalOffers: 0,
    departments: [],
    totalDepartments: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Requisitions
      .addCase(fetchRequisitions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchRequisitions.fulfilled, (state, action) => {
        state.loading = false;
        state.requisitions = action.payload?.data || (Array.isArray(action.payload) ? action.payload : []);
        state.totalRequisitions = action.payload?.pagination?.total ?? action.payload?.total ?? state.requisitions.length;
      })
      .addCase(fetchRequisitions.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createRequisition.fulfilled, (state, action) => {
        if (action.payload) {
          state.requisitions.unshift(action.payload);
          state.totalRequisitions = (state.totalRequisitions || 0) + 1;
        }
      })
      
      // Candidates
      .addCase(fetchCandidates.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.loading = false;
        state.candidates = action.payload?.data || (Array.isArray(action.payload) ? action.payload : []);
        state.totalCandidates = action.payload?.pagination?.total ?? action.payload?.total ?? state.candidates.length;
      })
      .addCase(fetchCandidates.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createCandidate.fulfilled, (state, action) => {
        if (action.payload) {
          state.candidates.unshift(action.payload);
          state.totalCandidates = (state.totalCandidates || 0) + 1;
        }
      })
      .addCase(updateCandidateStatus.fulfilled, (state, action) => {
        const idx = state.candidates.findIndex(c => c.id === action.payload.id);
        if (idx !== -1) state.candidates[idx].status = action.payload.status;
      })

      // Schedules
      .addCase(fetchSchedules.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        state.loading = false;
        state.schedules = action.payload?.data || (Array.isArray(action.payload) ? action.payload : []);
        state.totalSchedules = action.payload?.pagination?.total ?? action.payload?.total ?? state.schedules.length;
      })
      .addCase(fetchSchedules.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createSchedule.fulfilled, (state, action) => {
        if (action.payload) {
          state.schedules.unshift(action.payload);
          state.totalSchedules = (state.totalSchedules || 0) + 1;
        }
      })

      // Offers
      .addCase(fetchOffers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchOffers.fulfilled, (state, action) => {
        state.loading = false;
        state.offers = action.payload?.data || (Array.isArray(action.payload) ? action.payload : []);
        state.totalOffers = action.payload?.pagination?.total ?? action.payload?.total ?? state.offers.length;
      })
      .addCase(fetchOffers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createOffer.fulfilled, (state, action) => {
        if (action.payload) {
          state.offers.unshift(action.payload);
          state.totalOffers = (state.totalOffers || 0) + 1;
        }
      })
      .addCase(updateOfferStatus.fulfilled, (state, action) => {
        const idx = state.offers.findIndex(o => o.id === action.payload.id);
        if (idx !== -1) state.offers[idx].status = action.payload.status;
      })

      // Departments
      .addCase(fetchDepartments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload?.data || (Array.isArray(action.payload) ? action.payload : []);
        state.totalDepartments = action.payload?.pagination?.total ?? action.payload?.total ?? state.departments.length;
      })
      .addCase(fetchDepartments.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  }
});

export default recruitmentSlice.reducer;
