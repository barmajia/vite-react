import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Json } from '@/types/database';

interface ProductGalleryProps {
  images: Json;
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const imageList = Array.isArray(images) ? (images as string[]) : [];
  const allImages = imageList.length > 0 ? imageList : ['/placeholder-product.png'];

  const openFullscreen = (index: number) => {
    setSelectedIndex(index);
    setIsFullscreen(true);
  };

  const navigate = (direction: 'prev' | 'next') => {
    setSelectedIndex((prev) => {
      if (direction === 'prev') {
        return prev === 0 ? allImages.length - 1 : prev - 1;
      }
      return prev === allImages.length - 1 ? 0 : prev + 1;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      if (e.key === 'Escape') setIsFullscreen(false);
      if (e.key === 'ArrowLeft') navigate('prev');
      if (e.key === 'ArrowRight') navigate('next');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  return (
    <>
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <img
          src={allImages[selectedIndex]}
          alt={`${title} - Image ${selectedIndex + 1}`}
          className="h-full w-full object-cover cursor-pointer"
          onClick={() => openFullscreen(selectedIndex)}
        />
        
        {allImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 backdrop-blur"
              onClick={() => navigate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 backdrop-blur"
              onClick={() => navigate('next')}
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
                'relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                index === selectedIndex
                  ? 'border-primary'
                  : 'border-transparent hover:border-muted-foreground'
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
              navigate('prev');
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
              navigate('next');
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
