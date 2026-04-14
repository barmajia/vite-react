import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Json } from "@/types/database";

interface ProductGalleryProps {
  images: Json;
  title: string;
}

// Helper function to construct full Supabase storage URL
const getImageUrl = (imageUrl: unknown): string => {
  const placeholderSvg =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
  // Handle null/undefined
  if (!imageUrl) return placeholderSvg;

  // If it's an object, try to extract the URL from common properties
  if (typeof imageUrl === "object") {
    const obj = imageUrl as Record<string, unknown>;
    // Try common property names for URLs
    const url = obj.url || obj.imageUrl || obj.src || obj.path || obj.file_url;
    if (url) {
      return String(url);
    }
    // If no known property, return placeholder
    return placeholderSvg;
  }

  // Convert to string if it's not already
  const urlString = String(imageUrl);

  // If already a full URL, return as is
  if (urlString.startsWith("http://") || urlString.startsWith("https://")) {
    return urlString;
  }

  // Construct Supabase storage URL
  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    "https://ofovfxsfazlwvcakpuer.supabase.co";
  return `${supabaseUrl}/storage/v1/object/public/product-images/${urlString}`;
};

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const placeholderSvg =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const imageList = Array.isArray(images) ? (images as string[]) : [];
  const allImages =
    imageList.length > 0 ? imageList.map(getImageUrl) : [placeholderSvg];

  const openFullscreen = (index: number) => {
    setSelectedIndex(index);
    setIsFullscreen(true);
  };

  const navigate = useCallback((direction: "prev" | "next") => {
    setSelectedIndex((prev) => {
      if (direction === "prev") {
        return prev === 0 ? allImages.length - 1 : prev - 1;
      }
      return prev === allImages.length - 1 ? 0 : prev + 1;
    });
  }, [allImages.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      if (e.key === "Escape") setIsFullscreen(false);
      if (e.key === "ArrowLeft") navigate("prev");
      if (e.key === "ArrowRight") navigate("next");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, navigate]);

  return (
    <>
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <img
          src={allImages[selectedIndex]}
          alt={`${title} - Image ${selectedIndex + 1}`}
          className="h-full w-full object-cover cursor-pointer"
          onClick={() => openFullscreen(selectedIndex)}
          onError={() => setImageLoadError(true)}
        />
        {imageLoadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <p className="text-muted-foreground text-sm">Image not available</p>
          </div>
        )}

        {allImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 backdrop-blur"
              onClick={() => navigate("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 backdrop-blur"
              onClick={() => navigate("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/80 backdrop-blur rounded-full text-xs">
            {selectedIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div
          ref={scrollContainerRef}
          className="flex gap-2 overflow-x-auto py-2 scrollbar-thin"
        >
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                index === selectedIndex
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground",
              )}
            >
              <img
                src={image as string}
                alt={`${title} thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setIsFullscreen(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-10 w-10 text-white"
            onClick={() => setIsFullscreen(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 text-white"
            onClick={(e) => {
              e.stopPropagation();
              navigate("prev");
            }}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 text-white"
            onClick={(e) => {
              e.stopPropagation();
              navigate("next");
            }}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          <img
            src={allImages[selectedIndex]}
            alt={`${title} - Fullscreen`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-background/80 backdrop-blur rounded-full text-sm">
            {selectedIndex + 1} / {allImages.length}
          </div>
        </div>
      )}
    </>
  );
}
