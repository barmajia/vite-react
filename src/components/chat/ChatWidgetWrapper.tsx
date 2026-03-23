import React from 'react';
import { TradingChatWidget } from './TradingChatWidget';
import { useAuth } from '@/hooks/useAuth';
import { useUserAccountType } from '@/hooks/useUserAccountType';

export const ChatWidgetWrapper: React.FC = () => {
  const { user } = useAuth();
  const { accountType } = useUserAccountType(user?.id || null);

  // Only show chat widget for authenticated users with trading account types
  if (!user || !accountType) {
    return null;
  }

  const tradingAccountTypes = ['seller', 'factory', 'middleman', 'customer', 'user'];
  if (!tradingAccountTypes.includes(accountType)) {
    return null;
  }

  return <TradingChatWidget currentUserId={user.id} />;
};
