import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, MapPin, User } from 'lucide-react';
import { NearbySellersDialog } from './NearbySellersDialog';
import { getOrCreateConversation } from '@/features/messaging/lib/messaging-utils';
import type { ConversationType } from '@/types/database';

interface StartConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated?: (conversationId: string) => void;
}

export const StartConversationDialog = ({
  open,
  onOpenChange,
  onConversationCreated,
}: StartConversationDialogProps) => {
  const [showNearby, setShowNearby] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [conversationType, setConversationType] = useState<ConversationType>('general');
  const navigate = useNavigate();

  const handleStartByUserId = async () => {
    if (!targetUserId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    setIsCreating(true);

    try {
      // Verify the user exists
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('user_id, full_name, email')
        .eq('user_id', targetUserId.trim())
        .single();

      if (userError || !targetUser) {
        toast.error('User not found');
        return;
      }

      // Create conversation
      const conversationId = await getOrCreateConversation(
        targetUserId.trim(),
        undefined,
        conversationType
      );

      if (conversationId) {
        toast.success(`Starting conversation with ${targetUser.full_name || targetUser.email}`);
        onConversationCreated?.(conversationId);
        navigate(`/messages/${conversationId}`);
        setTargetUserId('');
      } else {
        toast.error('Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Start New Conversation
            </DialogTitle>
            <DialogDescription>
              Choose how you want to start a conversation
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="nearby" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="nearby" className="gap-2">
                <MapPin className="h-4 w-4" />
                Nearby Sellers
              </TabsTrigger>
              <TabsTrigger value="userid" className="gap-2">
                <User className="h-4 w-4" />
                User ID
              </TabsTrigger>
            </TabsList>

            <TabsContent value="nearby" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Find and chat with sellers near your location
              </p>
              <Button
                className="w-full gap-2"
                onClick={() => {
                  setShowNearby(true);
                }}
              >
                <MapPin className="h-4 w-4" />
                Find Nearby Sellers
              </Button>
            </TabsContent>

            <TabsContent value="userid" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  placeholder="Enter user ID or email"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStartByUserId()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conversationType">Conversation Type</Label>
                <Tabs
                  defaultValue="general"
                  className="w-full"
                  onValueChange={(value) => setConversationType(value as ConversationType)}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="deal_negotiation">Deal</TabsTrigger>
                    <TabsTrigger value="order_support">Support</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleStartByUserId}
                disabled={isCreating || !targetUserId.trim()}
              >
                {isCreating ? (
                  <>Starting...</>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4" />
                    Start Conversation
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

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
