import { create } from "zustand";

/**
 * Per-device profile (name + avatar). The backend member API doesn't store
 * these, so they live in localStorage — but we mirror them into this store so
 * that saving on the profile page updates the header (and anywhere else) live,
 * without a reload. Keyed by user id.
 */
export type LocalProfile = {
  firstName: string;
  lastName: string;
  avatar: string | null;
};

const EMPTY: LocalProfile = { firstName: "", lastName: "", avatar: null };
const storageKey = (id: string) => `nepa:profile:${id}`;

function read(userId: string): LocalProfile {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as Partial<LocalProfile>) };
  } catch {
    /* ignore malformed cache */
  }
  return EMPTY;
}

interface ProfileState {
  userId: string | null;
  profile: LocalProfile;
  /** Load the stored profile for a user into the store (call on mount). */
  hydrate: (userId: string) => void;
  /** Persist a profile to localStorage and update the store reactively. */
  save: (userId: string, profile: LocalProfile) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  userId: null,
  profile: EMPTY,
  hydrate: (userId) => set({ userId, profile: read(userId) }),
  save: (userId, profile) => {
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(profile));
    } catch {
      /* ignore quota / serialization errors — caller surfaces a toast */
    }
    set({ userId, profile });
  },
}));

/** Full name from a profile, or "" when no name has been set. */
export function fullNameFrom(profile: LocalProfile): string {
  return [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
}
