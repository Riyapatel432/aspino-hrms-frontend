import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      // Also clear cookies
      document.cookie = "hrToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "hrUser=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    },
    initializeAuthFromCookies: (state) => {
      if (typeof document !== "undefined") {
        const getCookie = (name) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop().split(';').shift();
          return null;
        };
        const userCookie = getCookie("hrUser");
        if (userCookie) {
          try {
            state.user = JSON.parse(decodeURIComponent(userCookie));
            state.isAuthenticated = true;
          } catch (e) {
            console.error("Failed to parse hrUser cookie", e);
          }
        }
      }
    }
  },
});

export const { setCredentials, logout, initializeAuthFromCookies } = authSlice.actions;

export default authSlice.reducer;
