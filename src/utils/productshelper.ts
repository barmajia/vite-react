// utils/productHelpers.ts
export const getProductImageUrl = (
  images: any,
  index: number = 0,
): string | null => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return null;
  }

  const img = images[index];
  if (!img) return null;

  // Handle string format
  if (typeof img === "string") {
    return img;
  }

  // Handle object format
  if (typeof img === "object" && img?.url) {
    return img.url;
  }

  return null;
};

export const getProductImageAlt = (
  images: any,
  productTitle: string,
  index: number = 0,
): string => {
  if (!images || !Array.isArray(images) || !images[index]) {
    return productTitle || "Product";
  }

  const img = images[index];
  if (typeof img === "string") {
    return productTitle || "Product";
  }

  return img?.alt || productTitle || "Product";
};
