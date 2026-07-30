import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Requisitions
export const fetchRequisitions = createAsyncThunk("recruitment/fetchRequisitions", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/recruitment/requisitions?limit=1000`);
    if (!res.ok) throw new Error("Failed to fetch requisitions");
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.data || []);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createRequisition = createAsyncThunk("recruitment/createRequisition", async (data, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/recruitment/requisitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create requisition");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Candidates
export const fetchCandidates = createAsyncThunk("recruitment/fetchCandidates", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/recruitment/candidates?limit=1000`);
    if (!res.ok) throw new Error("Failed to fetch candidates");
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.data || []);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createCandidate = createAsyncThunk("recruitment/createCandidate", async (data, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/recruitment/candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create candidate");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const updateCandidateStatus = createAsyncThunk("recruitment/updateCandidateStatus", async ({ id, status }, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/recruitment/candidates/${id}/status`, {
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
export const fetchSchedules = createAsyncThunk("recruitment/fetchSchedules", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/recruitment/schedules`);
    if (!res.ok) throw new Error("Failed to fetch schedules");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createSchedule = createAsyncThunk("recruitment/createSchedule", async (data, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/recruitment/schedules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create schedule");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Offers
export const fetchOffers = createAsyncThunk("recruitment/fetchOffers", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/recruitment/offers`);
    if (!res.ok) throw new Error("Failed to fetch offers");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createOffer = createAsyncThunk("recruitment/createOffer", async (data, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/recruitment/offers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create offer");
    return await res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const updateOfferStatus = createAsyncThunk("recruitment/updateOfferStatus", async ({ id, status }, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/recruitment/offers/${id}/accept`, {
      method: "POST", // The backend uses accept but let's pass status generically or assume accept
    });
    if (!res.ok) throw new Error("Failed to accept offer");
    return { id, status: 'ACCEPTED' };
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Departments
export const fetchDepartments = createAsyncThunk("recruitment/fetchDepartments", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${backendUrl}/staff-hrms/recruitment/departments`);
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
    candidates: [],
    schedules: [],
    offers: [],
    departments: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Requisitions
      .addCase(fetchRequisitions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchRequisitions.fulfilled, (state, action) => { state.loading = false; state.requisitions = action.payload; })
      .addCase(fetchRequisitions.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createRequisition.fulfilled, (state, action) => { state.requisitions.push(action.payload); })
      
      // Candidates
      .addCase(fetchCandidates.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCandidates.fulfilled, (state, action) => { state.loading = false; state.candidates = action.payload; })
      .addCase(fetchCandidates.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createCandidate.fulfilled, (state, action) => { state.candidates.push(action.payload); })
      .addCase(updateCandidateStatus.fulfilled, (state, action) => {
        const idx = state.candidates.findIndex(c => c.id === action.payload.id);
        if (idx !== -1) state.candidates[idx].status = action.payload.status;
      })

      // Schedules
      .addCase(fetchSchedules.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSchedules.fulfilled, (state, action) => { state.loading = false; state.schedules = action.payload; })
      .addCase(fetchSchedules.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createSchedule.fulfilled, (state, action) => { state.schedules.push(action.payload); })

      // Offers
      .addCase(fetchOffers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchOffers.fulfilled, (state, action) => { state.loading = false; state.offers = action.payload; })
      .addCase(fetchOffers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createOffer.fulfilled, (state, action) => { state.offers.push(action.payload); })
      .addCase(updateOfferStatus.fulfilled, (state, action) => {
        const idx = state.offers.findIndex(o => o.id === action.payload.id);
        if (idx !== -1) state.offers[idx].status = action.payload.status;
      })

      // Departments
      .addCase(fetchDepartments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDepartments.fulfilled, (state, action) => { state.loading = false; state.departments = action.payload; })
      .addCase(fetchDepartments.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  }
});

export default recruitmentSlice.reducer;
