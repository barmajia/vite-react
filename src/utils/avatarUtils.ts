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
 * Generate a consistent HSL color from a name string
 * Same name will always produce the same vibrant color
 * Used for light mode background
 */
export const getAvatarColor = (name: string | null | undefined): string => {
  if (!name) return 'hsl(210, 10%, 85%)'; // Default gray

  // Generate consistent hue from name string
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  
  // Vibrant color (saturation 70%, lightness 60%)
  return `hsl(${hue}, 70%, 60%)`;
};

/**
 * Get white background color for light mode
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
