import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { api } from "./api";
import { authSlice } from "./auth-slice";

/**
 * Built once, when this module loads. Redux's combineReducers calls Math.random() (to probe the reducers),
 * and Next's prerender (cacheComponents) rejects Math.random() during rendering. Passing configureStore a
 * ready-made reducer means creating a store - which happens while rendering - never calls it.
 */
const rootReducer = combineReducers({ auth: authSlice.reducer, [api.reducerPath]: api.reducer });

/** One store per browser tab / per server render (created in StoreProvider, never shared between requests). */
export const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefault) => getDefault().concat(api.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
