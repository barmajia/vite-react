// FactoryStartChat Page - Start New Conversations for Factory Users
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Search,
  User,
  MessageSquare,
  Building2,
  Handshake,
  Package,
  CheckCircle2,
} from 'lucide-react';

interface SearchResult {
  user_id: string;
  full_name: string | null;
  email: string | null;
  account_type: string;
  location: string | null;
  is_verified: boolean;
  avatar_url?: string | null;
}

type ConversationType = 'product_inquiry' | 'custom_request' | 'b2b_sourcing' | 'middleman_restock';

export function FactoryStartChat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [conversationType, setConversationType] = useState<ConversationType>('product_inquiry');
  const [initialMessage, setInitialMessage] = useState('');
  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState<string | null>(null);

  // Prefill from URL params
  useEffect(() => {
    const pid = searchParams.get('product_id');
    const pname = searchParams.get('product_name');
    const targetId = searchParams.get('target_user_id');
    
    if (pid) {
      setProductId(pid);
      setProductName(pname);
    }
    
    if (targetId) {
      fetchTargetUser(targetId);
    }
  }, [searchParams]);

  const fetchTargetUser = async (targetId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, full_name, email, account_type, location, is_verified, avatar_url')
        .eq('user_id', targetId)
        .single();
      
      if (error) throw error;
      if (data) {
        setSelectedUser(data);
      }
    } catch (error) {
      console.error('Error fetching target user:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }
    
    setSearching(true);
    try {
      // Search in users table
      const { data, error } = await supabase
        .from('users')
        .select('user_id, full_name, email, account_type, location, is_verified, avatar_url')
        .ilike('full_name', `%${searchQuery}%`)
        .or(`email.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`)
        .in('account_type', ['seller', 'middleman', 'factory'])
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
      
      if (data?.length === 0) {
        toast.info('No users found');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || 'Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleStartConversation = async () => {
    if (!selectedUser) {
      toast.error('Please select a user to chat with');
      return;
    }

    if (!user) {
      toast.error('You must be logged in');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // Create or get conversation using RPC function
      const { data: conversationId, error: convError } = await supabase.rpc(
        'create_direct_conversation',
        {
          p_target_user_id: selectedUser.user_id,
          p_context: 'trading',
          p_product_id: productId,
          p_appointment_id: null,
          p_listing_id: null
        }
      );

      if (convError) throw convError;
      if (!conversationId) {
        throw new Error('Failed to create conversation');
      }

      // Send initial message if provided
      if (initialMessage.trim()) {
        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: initialMessage.trim(),
            message_type: 'text',
            is_deleted: false
          });
        
        if (msgError) throw msgError;
      }

      toast.success('Conversation started!');
      navigate(`/chat/${conversationId}`);
    } catch (error: any) {
      console.error('Start chat error:', error);
      toast.error(error.message || 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  const getConversationTypeLabel = (type: ConversationType) => {
    const labels: Record<ConversationType, { label: string; icon: any }> = {
      product_inquiry: { label: 'Product Inquiry', icon: Package },
      custom_request: { label: 'Custom Request', icon: Building2 },
      b2b_sourcing: { label: 'B2B Sourcing', icon: Handshake },
      middleman_restock: { label: 'Middleman Restock', icon: Package },
    };
    return labels[type];
  };

  const getTypeIcon = (accountType: string) => {
    switch (accountType) {
      case 'seller':
        return <Package className="h-4 w-4" />;
      case 'middleman':
        return <Handshake className="h-4 w-4" />;
      case 'factory':
        return <Building2 className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 py-8 pt-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/factory/dashboard')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Start New Conversation</h1>
            <p className="text-muted-foreground">
              Connect with sellers, middlemen, or other factories
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Find User</CardTitle>
              <CardDescription>
                Search for sellers or middlemen to contact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name, email, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={searching} size="icon">
                  {searching ? (
                    <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Search Results */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {searching ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                    </div>
                  ) : searchResults.length === 0 && searchQuery ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No users found</p>
                      <p className="text-sm">Try different keywords</p>
                    </div>
                  ) : (
                    searchResults.map((result) => (
                      <div
                        key={result.user_id}
                        onClick={() => setSelectedUser(result)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          selectedUser?.user_id === result.user_id
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={result.full_name}
                            src={result.avatar_url}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold truncate">
                                {result.full_name || 'Unnamed User'}
                              </p>
                              {result.is_verified && (
                                <Badge
                                  variant="secondary"
                                  className="h-5 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="capitalize flex items-center gap-1">
                                {getTypeIcon(result.account_type)}
                                {result.account_type.replace('_', ' ')}
                              </span>
                              {result.location && (
                                <>
                                  <span>•</span>
                                  <span>{result.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Setup Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation Details</CardTitle>
              <CardDescription>
                Configure your new conversation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected User */}
              {selectedUser ? (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar
                      name={selectedUser.full_name}
                      src={selectedUser.avatar_url}
                      size="lg"
                    />
                    <div>
                      <p className="font-semibold">{selectedUser.full_name || 'Unnamed User'}</p>
                      <p className="text-sm text-muted-foreground capitalize flex items-center gap-1">
                        {getTypeIcon(selectedUser.account_type)}
                        {selectedUser.account_type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {selectedUser.is_verified && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                        Verified
                      </Badge>
                    )}
                    {selectedUser.location && (
                      <Badge variant="outline" className="text-xs">
                        {selectedUser.location}
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-muted/30 rounded-lg border border-dashed text-center">
                  <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    Select a user from search results
                  </p>
                  <p className="text-sm mt-1">
                    Search for sellers, middlemen, or other factories
                  </p>
                </div>
              )}

              {/* Conversation Type */}
              <div>
                <Label>Conversation Type</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(['product_inquiry', 'custom_request', 'b2b_sourcing', 'middleman_restock'] as ConversationType[]).map(
                    (type) => {
                      const Icon = getConversationTypeLabel(type).icon;
                      return (
                        <Button
                          key={type}
                          variant={conversationType === type ? 'default' : 'outline'}
                          className="h-auto py-3 justify-start"
                          onClick={() => setConversationType(type)}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          <span className="text-sm">{getConversationTypeLabel(type).label}</span>
                        </Button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Product Context */}
              {productId && (
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <Label className="text-xs">Product Context</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {productName || 'Product'}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    ID: {productId.slice(0, 8)}...
                  </p>
                </div>
              )}

              {/* Initial Message */}
              <div>
                <Label>Initial Message (Optional)</Label>
                <Textarea
                  placeholder="Hi, I'm interested in discussing..."
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be sent as the first message
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => navigate('/factory/dashboard')}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartConversation}
                  disabled={loading || !selectedUser}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start Conversation
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
