// Feature flags for quick-flip behaviors like marking pages as coming soon
export const COMING_SOON_FLAGS = {
  COMING_SOON_CHAT: true, // Set to true to display Coming Soon for chat route (demo/testing)
  // Add more flags as needed, e.g. COMING_SOON_MARKETPLACE, COMING_SOON_WALLET, etc.
} as const;

export type ComingSoonFlagKey = keyof typeof COMING_SOON_FLAGS;
