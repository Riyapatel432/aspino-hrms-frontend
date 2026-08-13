"use client";

import { Provider } from "react-redux";
import { store } from "./index";
import { useEffect } from "react";
import { initializeAuthFromCookies } from "./slices/authSlice";

export function ReduxProvider({ children }) {
  useEffect(() => {
    store.dispatch(initializeAuthFromCookies());
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
