import { useState } from 'react';
import { NearbySellersDialog } from './NearbySellersDialog';

interface StartConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated?: (conversationId: string) => void;
}

export const StartConversationDialog = ({
  onOpenChange,
  onConversationCreated,
}: StartConversationDialogProps) => {
  const [showNearby, setShowNearby] = useState(false);

  return (
    <>
      {/* Nearby Sellers Dialog (Primary) */}
      <NearbySellersDialog
        open={showNearby}
        onOpenChange={(open) => {
          setShowNearby(open);
          if (!open) {
            // When closing nearby dialog, also close parent if no conversation created
            onOpenChange(false);
          }
        }}
        onConversationCreated={(conversationId) => {
          onConversationCreated?.(conversationId);
          setShowNearby(false);
          onOpenChange(false);
        }}
      />
    </>
  );
};
