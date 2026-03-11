import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ConversationDeal } from '../hooks/useConversationDeals';

interface DealProposalCardProps {
  proposal: ConversationDeal;
  isProposer: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

const statusColors = {
  pending: 'bg-yellow-500 hover:bg-yellow-600',
  accepted: 'bg-green-500 hover:bg-green-600',
  rejected: 'bg-red-500 hover:bg-red-600',
  expired: 'bg-gray-500 hover:bg-gray-600',
  cancelled: 'bg-gray-500 hover:bg-gray-600',
};

const statusLabels = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export const DealProposalCard = ({
  proposal,
  isProposer,
  onAccept,
  onReject,
}: DealProposalCardProps) => {
  const status = proposal.status;
  const canRespond = !isProposer && status === 'pending';

  return (
    <Card className="my-4 border-primary/20 bg-muted/50">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <span>🤝</span> Deal Proposal
          </CardTitle>
          <Badge className={statusColors[status]}>
            {statusLabels[status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Commission Rate:</span>
            <span className="font-semibold text-lg">
              {proposal.proposal_data?.commission_rate || 0}%
            </span>
          </div>

          {proposal.proposal_data?.min_order_quantity && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Min Order:</span>
              <span className="font-medium">
                {proposal.proposal_data.min_order_quantity} units
              </span>
            </div>
          )}

          {proposal.proposal_data?.products && proposal.proposal_data.products.length > 0 && (
            <div className="pt-2">
              <span className="text-muted-foreground">Products:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {proposal.proposal_data.products.map((productId, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    Product {productId.slice(0, 8)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {proposal.proposal_data?.terms && (
            <div className="pt-2">
              <span className="text-muted-foreground">Terms:</span>
              <p className="mt-1 text-foreground bg-background p-2 rounded-md text-sm">
                {proposal.proposal_data.terms}
              </p>
            </div>
          )}

          {proposal.expires_at && (
            <div className="text-xs text-muted-foreground pt-2 border-t mt-2">
              <span>⏱️ Expires: </span>
              <span>
                {new Date(proposal.expires_at).toLocaleDateString()} at{' '}
                {new Date(proposal.expires_at).toLocaleTimeString()}
              </span>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-2 border-t mt-2">
            <span>📅 Created: </span>
            <span>{new Date(proposal.created_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {canRespond && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button
              onClick={onAccept}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              ✅ Accept Deal
            </Button>
            <Button
              onClick={onReject}
              variant="outline"
              size="sm"
              className="flex-1 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
            >
              ❌ Reject
            </Button>
          </div>
        )}

        {isProposer && status === 'pending' && (
          <div className="text-xs text-muted-foreground mt-4 pt-4 border-t flex items-center gap-1">
            <span>⏳</span>
            <span>Awaiting response from other party</span>
          </div>
        )}

        {status === 'accepted' && (
          <div className="text-sm text-green-600 mt-4 pt-4 border-t flex items-center gap-1">
            <span>✅</span>
            <span>Deal accepted and active</span>
          </div>
        )}

        {status === 'rejected' && (
          <div className="text-sm text-red-600 mt-4 pt-4 border-t flex items-center gap-1">
            <span>❌</span>
            <span>Deal rejected</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
