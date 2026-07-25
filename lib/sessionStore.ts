import { create } from 'zustand';

interface SessionState {
  vaultUnlocked: boolean;
  unlockVault: () => void;
  lockVault: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  vaultUnlocked: false,
  unlockVault: () => set({ vaultUnlocked: true }),
  lockVault: () => set({ vaultUnlocked: false }),
}));
