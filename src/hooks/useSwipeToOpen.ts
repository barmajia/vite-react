import { useState, useCallback, useEffect } from "react";

interface SwipeToOpenOptions {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  threshold?: number;
  direction?: "left" | "right";
  edgeWidth?: number;
}

/**
 * Hook to handle swipe-to-open gestures for drawers
 * @param options - Configuration options
 * @returns Touch event handlers and swipe state
 */
export function useSwipeToOpen({
  isOpen,
  onOpen,
  onClose,
  threshold = 100,
  direction = "right",
  edgeWidth = 20,
}: SwipeToOpenOptions) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      const touch = "touches" in e ? e.touches[0] : e;
      const screenWidth = window.innerWidth;
      const touchX = touch.clientX;
      const touchY = touch.clientY;

      // Only trigger from edge when drawer is closed
      if (!isOpen) {
        const isFromLeftEdge = touchX <= edgeWidth;
        const isFromRightEdge = touchX >= screenWidth - edgeWidth;

        // Allow swipe from left edge for right-opening drawers
        // Allow swipe from right edge for left-opening drawers
        if (
          (direction === "right" && isFromLeftEdge) ||
          (direction === "left" && isFromRightEdge)
        ) {
          setTouchStartX(touchX);
          setTouchStartY(touchY);
          setIsSwiping(true);
        }
      }

      // Allow swipe to close when drawer is open (swipe in opposite direction)
      if (isOpen) {
        setTouchStartX(touchX);
        setTouchStartY(touchY);
        setIsSwiping(true);
      }
    },
    [isOpen, direction, edgeWidth]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      if (touchStartX === null || touchStartY === null || !isSwiping) return;

      const touch = "touches" in e ? e.touches[0] : e;
      const currentX = touch.clientX;
      const currentY = touch.clientY;

      const diffX = currentX - touchStartX;
      const diffY = currentY - touchStartY;

      // Check if the movement is primarily horizontal
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Prevent default browser behavior during swipe
        if ("preventDefault" in e) {
          e.preventDefault();
        }
      }
    },
    [touchStartX, touchStartY, isSwiping]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      if (touchStartX === null || touchStartY === null || !isSwiping) {
        setTouchStartX(null);
        setTouchStartY(null);
        setIsSwiping(false);
        return;
      }

      const touch = "changedTouches" in e ? e.changedTouches[0] : e;
      const currentX = touch.clientX;
      const currentY = touch.clientY;

      const diffX = currentX - touchStartX;
      const diffY = currentY - touchStartY;

      // Only consider horizontal swipes
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
        if (!isOpen) {
          // Swipe to open: swipe right for left-edge drawer, swipe left for right-edge drawer
          if (
            (direction === "right" && diffX > threshold) ||
            (direction === "left" && diffX < -threshold)
          ) {
            onOpen();
          }
        } else {
          // Swipe to close: swipe left for left-edge drawer, swipe right for right-edge drawer
          if (
            (direction === "right" && diffX < -threshold) ||
            (direction === "left" && diffX > threshold)
          ) {
            onClose();
          }
        }
      }

      setTouchStartX(null);
      setTouchStartY(null);
      setIsSwiping(false);
    },
    [touchStartX, touchStartY, isSwiping, isOpen, direction, threshold, onOpen, onClose]
  );

  // Add global touch event listeners when drawer is open or when waiting for edge swipe
  useEffect(() => {
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isSwiping) {
        handleTouchMove(e);
      }
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (isSwiping) {
        handleTouchEnd(e);
      }
    };

    if (isSwiping || isOpen) {
      document.addEventListener("touchmove", handleGlobalTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener("touchmove", handleGlobalTouchMove);
      document.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [isSwiping, isOpen, handleTouchMove, handleTouchEnd]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    isSwiping,
  };
}
