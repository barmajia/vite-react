// src/utils/avatarUtils.ts

/**
 * Extract initials from a full name
 * Takes first letter of first name and first letter of second name
 */
export const getInitials = (fullName: string | null | undefined): string => {
  if (!fullName || typeof fullName !== "string") return "?";

  // Trim and split by spaces
  const names = fullName.trim().split(/\s+/);

  if (names.length === 0) return "?";

  // Get first letter of the first name
  const firstInitial = names[0][0];

  // Get first letter of the second name (only second word, not last)
  const secondInitial = names.length > 1 ? names[1][0] : "";

  return `${firstInitial}${secondInitial}`.toUpperCase();
};

/**
 * Generate a consistent color from a name string
 * Returns colored text for white background
 */
export const getColorFromName = (name: string | null | undefined): string => {
  if (!name) return "#64748b"; // Default slate-500

  // Simple hash function to generate consistent color from string
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Map to a set of pleasant colors (darker for white background)
  const colors = [
    "#2563EB", // Blue-600
    "#059669", // Green-600
    "#D97706", // Amber-600
    "#DC2626", // Red-600
    "#7C3AED", // Violet-600
    "#DB2777", // Pink-600
    "#0891B2", // Cyan-600
    "#65A30D", // Lime-600
    "#EA580C", // Orange-600
    "#0D9488", // Teal-600
  ];

  // Use absolute value of hash to pick a color
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Get white background color
 */
export const getBackgroundColor = (): string => {
  return "#ffffff"; // Pure white
};

/**
 * Determine if text should be black or white based on background brightness
 * Returns 'black' for light backgrounds, 'white' for dark backgrounds
 */
export const getContrastingTextColor = (bgColor: string): string => {
  // Convert hex to RGB
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light backgrounds, white for dark
  return luminance > 0.5 ? "#000000" : "#ffffff";
};
