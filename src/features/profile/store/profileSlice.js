import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch } from "@/lib/api";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const fetchProfile = createAsyncThunk("profile/fetchProfile", async (_, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`${backendUrl}/auth/profile`);
    if (!res.ok) throw new Error("Failed to fetch profile");
    const data = await res.json();
    return data?.data || data || {};
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const profileSlice = createSlice({
  name: "profile",
  initialState: {
    user: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProfile.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(fetchProfile.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  }
});

export default profileSlice.reducer;
