import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/lib/types";

/** Who is signed in, plus the CSRF token every state-changing request must send. */
export interface AuthState {
  status: "unknown" | "signed-in" | "signed-out";
  user: User | null;
  csrf: string | null;
  canShowWindow: boolean;
}

const initialState: AuthState = { status: "unknown", user: null, csrf: null, canShowWindow: false };

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionLoaded(state, action: PayloadAction<{ user: User | null; csrf?: string | null; canShowWindow?: boolean }>) {
      const { user, csrf, canShowWindow } = action.payload;
      state.user = user;
      state.status = user ? "signed-in" : "signed-out";
      if (csrf) state.csrf = csrf;
      if (canShowWindow !== undefined) state.canShowWindow = canShowWindow;
    },
    userUpdated(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    csrfUpdated(state, action: PayloadAction<string>) {
      state.csrf = action.payload;
    },
    signedOut(state, action: PayloadAction<string | undefined>) {
      state.user = null;
      state.status = "signed-out";
      if (action.payload) state.csrf = action.payload;
    },
  },
});

export const { sessionLoaded, userUpdated, csrfUpdated, signedOut } = authSlice.actions;
