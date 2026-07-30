import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import attendanceReducer from "./slices/attendanceSlice";
import leaveReducer from "./slices/leaveSlice";
import recruitmentReducer from "./slices/recruitmentSlice";
import profileReducer from "./slices/profileSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    attendance: attendanceReducer,
    leave: leaveReducer,
    recruitment: recruitmentReducer,
    profile: profileReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});
