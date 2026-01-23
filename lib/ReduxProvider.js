"use client";
import { makeStore } from "./store";
import { Provider } from "react-redux";
import React, { useRef, useEffect } from "react";

export default function ReduxProvider({ children }) {
  const storeRef = useRef();
  if (!storeRef.current) {
    storeRef.current = makeStore();
    console.log('[ReduxProvider] Store created. Initial cart state:', storeRef.current.getState().cart);
  }
  useEffect(() => {
    console.log('[ReduxProvider] useEffect running - about to rehydrate');
    console.log('[ReduxProvider] Cart state BEFORE rehydrate:', storeRef.current.getState().cart);
    // Rehydrate cart from localStorage on mount once
    storeRef.current.dispatch({ type: "cart/rehydrateCart" });
    console.log('[ReduxProvider] Cart state AFTER rehydrate:', storeRef.current.getState().cart);
  }, []);
  return <Provider store={storeRef.current}>{children}</Provider>;
}
