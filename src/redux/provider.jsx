"use client";

import { Provider } from "react-redux";
import { store } from "./store";
import { useEffect } from "react";
import { initializeAuthFromCookies } from "../features/auth/store/authSlice";

export function ReduxProvider({ children }) {
  useEffect(() => {
    store.dispatch(initializeAuthFromCookies());
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
