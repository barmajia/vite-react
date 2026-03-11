import { useState } from 'react';
import { useQuoteRequests, useUpdateQuoteRequest } from '../hooks/useQuoteRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { QuoteStatus } from '../types/factory';

const statusColors: Record<QuoteStatus, string> = {
  pending: 'bg-yellow-500',
  quoted: 'bg-blue-500',
  accepted: 'bg-green-500',
  rejected: 'bg-red-500',
  expired: 'bg-gray-500',
};

export const QuoteRequestsList = () => {
  const { quotes, isLoading } = useQuoteRequests('received');
  const updateQuote = useUpdateQuoteRequest();
  const [selectedQuote, setSelectedQuote] = useState<typeof quotes[0] | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [quotedPrice, setQuotedPrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const handleQuote = (quote: typeof quotes[0]) => {
    setSelectedQuote(quote);
    setQuotedPrice(quote.target_price?.toString() || '');
    setShowDialog(true);
  };

  const handleSubmitQuote = () => {
    if (selectedQuote && quotedPrice) {
      updateQuote.mutate({
        quoteId: selectedQuote.id,
        updates: {
          status: 'quoted',
          quoted_price: parseFloat(quotedPrice),
          expires_at: expiryDate ? new Date(expiryDate).toISOString() : undefined,
        },
      });
      setShowDialog(false);
      setSelectedQuote(null);
    }
  };

  const handleAcceptReject = (quoteId: string, status: 'accepted' | 'rejected') => {
    updateQuote.mutate({
      quoteId,
      updates: { status },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">No quote requests yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {quotes.map((quote) => (
        <Card key={quote.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {quote.product?.title || 'Custom Order Request'}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  From: {quote.buyer?.full_name || 'Buyer'} • {new Date(quote.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge className={statusColors[quote.status]}>
                {quote.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quote.notes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{quote.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Quantity:</span>
                  <p className="font-medium">{quote.quantity} units</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Target Price:</span>
                  <p className="font-medium">
                    {quote.target_price ? `$${quote.target_price}` : 'Not specified'}
                  </p>
                </div>
                {quote.quoted_price && (
                  <>
                    <div>
                      <span className="text-muted-foreground">Quoted Price:</span>
                      <p className="font-medium">${quote.quoted_price}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quoted At:</span>
                      <p className="font-medium">
                        {quote.quoted_at ? new Date(quote.quoted_at).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {quote.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleQuote(quote)}
                    className="flex-1"
                  >
                    Send Quote
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAcceptReject(quote.id, 'accepted')}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAcceptReject(quote.id, 'rejected')}
                  >
                    Reject
                  </Button>
                </div>
              )}

              {quote.status === 'quoted' && (
                <div className="text-sm text-muted-foreground pt-2">
                  Waiting for buyer response...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Quote Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Quote</DialogTitle>
            <DialogDescription>
              Provide your quote for "{selectedQuote?.product?.title || 'this order'}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="price">Quoted Price ($)</Label>
              <Input
                id="price"
                type="number"
                value={quotedPrice}
                onChange={(e) => setQuotedPrice(e.target.value)}
                placeholder="Enter your price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry">Quote Expiry Date</Label>
              <Input
                id="expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Quote will expire at the end of this day
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitQuote} disabled={!quotedPrice}>
              Send Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
