import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { DealProposal } from '../hooks/useConversationDeals';

interface DealProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (proposal: DealProposal) => void;
}

export const DealProposalDialog = ({
  open,
  onOpenChange,
  onSubmit,
}: DealProposalDialogProps) => {
  const [commissionRate, setCommissionRate] = useState('');
  const [minOrderQuantity, setMinOrderQuantity] = useState('');
  const [terms, setTerms] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleSubmit = () => {
    if (!commissionRate) return;

    const proposal: DealProposal = {
      commission_rate: parseFloat(commissionRate),
      min_order_quantity: minOrderQuantity ? parseInt(minOrderQuantity) : undefined,
      terms: terms || undefined,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    };

    onSubmit(proposal);
    resetForm();
  };

  const resetForm = () => {
    setCommissionRate('');
    setMinOrderQuantity('');
    setTerms('');
    setExpiresAt('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>🤝 Propose a Deal</DialogTitle>
          <DialogDescription>
            Create a deal proposal for the other party to review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="commission">Commission Rate (%) *</Label>
            <Input
              id="commission"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              placeholder="e.g., 15.5"
            />
            <p className="text-xs text-muted-foreground">
              Your commission percentage for this deal
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minOrder">Minimum Order Quantity</Label>
            <Input
              id="minOrder"
              type="number"
              min="1"
              value={minOrderQuantity}
              onChange={(e) => setMinOrderQuantity(e.target.value)}
              placeholder="e.g., 100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms">Terms and Conditions</Label>
            <Textarea
              id="terms"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Describe the terms, conditions, and any special arrangements..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry">Expiry Date (Optional)</Label>
            <Input
              id="expiry"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Proposal will expire at this date/time
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!commissionRate}
          >
            Send Proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
