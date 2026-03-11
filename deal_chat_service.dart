import 'package:supabase_flutter/supabase_flutter.dart';

/// Deal Chat Service for Aurora E-commerce Platform
/// 
/// Handles deal proposals and negotiations within chat conversations.
/// Factory users can create deal proposals, and sellers can accept/reject them.
class DealChatService {
  final SupabaseClient _supabase = Supabase.instance.client;

  /// Create a deal proposal within a conversation
  /// 
  /// [conversationId] - The conversation ID where the deal is proposed
  /// [recipientId] - The user receiving the proposal
  /// [commissionRate] - Commission percentage (e.g., 15.5 for 15.5%)
  /// [minOrderQuantity] - Optional minimum order quantity
  /// [terms] - Optional terms and conditions
  /// [expiresAt] - Optional expiry date/time
  /// 
  /// Returns the created deal data
  Future<Map<String, dynamic>> createDealProposal({
    required String conversationId,
    required String recipientId,
    required double commissionRate,
    int? minOrderQuantity,
    String? terms,
    DateTime? expiresAt,
  }) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception('Not authenticated');

    // Create deal record
    final dealResponse = await _supabase
        .from('deals')
        .insert({
          'middleman_id': user.id,
          'party_a_id': user.id,
          'party_b_id': recipientId,
          'commission_rate': commissionRate,
          'status': 'pending',
        })
        .select()
        .single();

    // Create conversation_deal proposal
    await _supabase.from('conversation_deals').insert({
      'conversation_id': conversationId,
      'deal_id': dealResponse['id'],
      'proposer_id': user.id,
      'recipient_id': recipientId,
      'proposal_data': {
        'commission_rate': commissionRate,
        'min_order_quantity': minOrderQuantity,
        'terms': terms,
      },
      'expires_at': expiresAt?.toIso8601String(),
    });

    // Send message notification
    await _supabase.from('messages').insert({
      'conversation_id': conversationId,
      'sender_id': user.id,
      'content': '🤝 Deal proposal: ${commissionRate.toStringAsFixed(1)}% commission',
      'message_type': 'text',
      'message_subtype': 'deal_proposal',
    });

    return dealResponse;
  }

  /// Respond to a deal proposal (accept or reject)
  /// 
  /// [dealProposalId] - The conversation_deal ID
  /// [accepted] - True to accept, false to reject
  Future<void> respondToDeal({
    required String dealProposalId,
    required bool accepted,
  }) async {
    // Update conversation_deal status
    await _supabase
        .from('conversation_deals')
        .update({
          'status': accepted ? 'accepted' : 'rejected',
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('id', dealProposalId);

    // Update deal status
    final proposal = await _supabase
        .from('conversation_deals')
        .select('deal_id')
        .eq('id', dealProposalId)
        .single();

    if (proposal['deal_id'] != null) {
      await _supabase
          .from('deals')
          .update({
            'status': accepted ? 'active' : 'cancelled',
          })
          .eq('id', proposal['deal_id']);
    }
  }

  /// Get all deals for a specific conversation
  /// 
  /// [conversationId] - The conversation ID
  /// 
  /// Returns list of deals with proposal data
  Future<List<Map<String, dynamic>>> getConversationDeals(
      String conversationId) async {
    final response = await _supabase
        .from('conversation_deals')
        .select('''
          id,
          conversation_id,
          deal_id,
          proposer_id,
          recipient_id,
          proposal_data,
          status,
          expires_at,
          created_at,
          updated_at,
          deals (
            id,
            commission_rate,
            party_a_id,
            party_b_id,
            middleman_id,
            status
          )
        ''')
        .eq('conversation_id', conversationId)
        .order('created_at', ascending: false);

    return response as List<Map<String, dynamic>>;
  }

  /// Get pending deals for a user (as recipient)
  /// 
  /// [userId] - The user ID to check for pending deals
  /// 
  /// Returns list of pending deals awaiting response
  Future<List<Map<String, dynamic>>> getPendingDeals(String userId) async {
    final response = await _supabase
        .from('conversation_deals')
        .select('''
          id,
          conversation_id,
          deal_id,
          proposer_id,
          proposal_data,
          expires_at,
          created_at,
          deals (
            id,
            commission_rate,
            party_a_id,
            party_b_id
          )
        ''')
        .eq('recipient_id', userId)
        .eq('status', 'pending');

    return response as List<Map<String, dynamic>>;
  }

  /// Get deal statistics for a user
  /// 
  /// [userId] - The user ID
  /// 
  /// Returns map with deal statistics
  Future<Map<String, int>> getDealStats(String userId) async {
    final response = await _supabase
        .from('conversation_deals')
        .select('status')
        .or('proposer_id.eq.$userId,recipient_id.eq.$userId');

    final deals = response as List<Map<String, dynamic>>;

    return {
      'total': deals.length,
      'pending': deals.where((d) => d['status'] == 'pending').length,
      'accepted': deals.where((d) => d['status'] == 'accepted').length,
      'rejected': deals.where((d) => d['status'] == 'rejected').length,
      'expired': deals.where((d) => d['status'] == 'expired').length,
      'cancelled': deals.where((d) => d['status'] == 'cancelled').length,
    };
  }

  /// Cancel a deal proposal (proposer only)
  /// 
  /// [dealProposalId] - The conversation_deal ID
  Future<void> cancelDealProposal(String dealProposalId) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception('Not authenticated');

    // Verify user is the proposer
    final proposal = await _supabase
        .from('conversation_deals')
        .select('proposer_id, deal_id')
        .eq('id', dealProposalId)
        .single();

    if (proposal['proposer_id'] != user.id) {
      throw Exception('Only proposer can cancel the deal');
    }

    // Update conversation_deal status
    await _supabase
        .from('conversation_deals')
        .update({
          'status': 'cancelled',
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('id', dealProposalId);

    // Update deal status
    if (proposal['deal_id'] != null) {
      await _supabase
          .from('deals')
          .update({'status': 'cancelled'})
          .eq('id', proposal['deal_id']);
    }
  }

  /// Subscribe to real-time deal updates for a conversation
  /// 
  /// [conversationId] - The conversation ID to monitor
  /// [onDealUpdate] - Callback when a deal is created/updated
  /// 
  /// Returns the RealtimeChannel subscription
  RealtimeChannel subscribeToDealUpdates({
    required String conversationId,
    required void Function(Map<String, dynamic> deal) onDealUpdate,
  }) {
    return _supabase
        .channel('deals:$conversationId')
        .on(
          'postgres_changes',
          event: '*',
          schema: 'public',
          table: 'conversation_deals',
          filter: 'conversation_id=eq.$conversationId',
        )
        .subscribe((status, {newRecord}) {
          if (status == 'SUBSCRIBED' && newRecord != null) {
            onDealUpdate(newRecord as Map<String, dynamic>);
          }
        });
  }

  /// Unsubscribe from deal updates
  /// 
  /// [channel] - The RealtimeChannel to unsubscribe
  Future<void> unsubscribeFromDealUpdates(RealtimeChannel channel) async {
    await _supabase.removeChannel(channel);
  }
}

/// Deal Proposal Data Model
class DealProposalData {
  final double commissionRate;
  final int? minOrderQuantity;
  final String? terms;
  final DateTime? expiresAt;

  DealProposalData({
    required this.commissionRate,
    this.minOrderQuantity,
    this.terms,
    this.expiresAt,
  });

  /// Create from JSON
  factory DealProposalData.fromJson(Map<String, dynamic> json) {
    return DealProposalData(
      commissionRate: (json['commission_rate'] as num).toDouble(),
      minOrderQuantity: json['min_order_quantity'] as int?,
      terms: json['terms'] as String?,
      expiresAt: json['expires_at'] != null
          ? DateTime.parse(json['expires_at'])
          : null,
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'commission_rate': commissionRate,
      'min_order_quantity': minOrderQuantity,
      'terms': terms,
      'expires_at': expiresAt?.toIso8601String(),
    };
  }
}
