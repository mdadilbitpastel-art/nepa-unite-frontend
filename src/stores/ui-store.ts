import { create } from "zustand";

export type AuthView = "login" | "register" | "forgot" | "reset";

/** Global UI state: sidebar, command palette, notification drawer, auth modal. */
interface UiState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  commandOpen: boolean;
  notificationsOpen: boolean;
  authOpen: boolean;
  authView: AuthView;
  /** Where to send a buyer after a successful popup login (e.g. /buyer/checkout). */
  authCallbackUrl?: string;
  /** Reset-link credentials when the popup opens in "reset" view. */
  authResetUid?: string;
  authResetToken?: string;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setMobileSidebarOpen: (v: boolean) => void;
  setCommandOpen: (v: boolean) => void;
  toggleCommand: () => void;
  setNotificationsOpen: (v: boolean) => void;
  /** Open the login/signup popup, optionally on a specific tab + post-login target. */
  openAuth: (view?: AuthView, callbackUrl?: string) => void;
  /** Open the popup in "reset password" view with email-link credentials. */
  openReset: (uid: string, token: string) => void;
  setAuthOpen: (v: boolean) => void;
  setAuthView: (v: AuthView) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  commandOpen: false,
  notificationsOpen: false,
  authOpen: false,
  authView: "login",
  authCallbackUrl: undefined,
  toggleSidebar: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setMobileSidebarOpen: (v) => set({ mobileSidebarOpen: v }),
  setCommandOpen: (v) => set({ commandOpen: v }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
  setNotificationsOpen: (v) => set({ notificationsOpen: v }),
  openAuth: (view = "login", callbackUrl) =>
    set({ authOpen: true, authView: view, authCallbackUrl: callbackUrl }),
  openReset: (uid, token) =>
    set({
      authOpen: true,
      authView: "reset",
      authResetUid: uid,
      authResetToken: token,
    }),
  setAuthOpen: (v) => set({ authOpen: v }),
  setAuthView: (v) => set({ authView: v }),
}));
