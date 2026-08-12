import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/store/authSlice";
import attendanceReducer from "../features/attendance/store/attendanceSlice";
import leaveReducer from "../features/leave/store/leaveSlice";
import recruitmentReducer from "../features/recruitment/store/recruitmentSlice";
import profileReducer from "../features/profile/store/profileSlice";
import payrollReducer from "../features/payroll/store/payrollSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    attendance: attendanceReducer,
    leave: leaveReducer,
    recruitment: recruitmentReducer,
    profile: profileReducer,
    payroll: payrollReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});
