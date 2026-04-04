import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  TradingAccountType,
  ChatPermissionResult,
  ProductWithChatPermission,
} from "../types/trading-chat";
import {
  ALLOWED_CONVERSATION_FLOWS,
  TRADING_ACCOUNT_CONFIG,
} from "../lib/tradingConfig";

export const useChatPermission = (
  currentUserId: string,
  currentUserType: TradingAccountType,
  targetUserId: string,
  targetUserType: TradingAccountType,
  productId?: string,
) => {
  const [permission, setPermission] = useState<ChatPermissionResult>({
    allowed: false,
  });
  const [product, setProduct] = useState<ProductWithChatPermission | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, currentUserType, targetUserId, targetUserType, productId]);

  const checkPermission = async () => {
    setLoading(true);

    // 1. Check if conversation flow is allowed
    const allowedTargets = ALLOWED_CONVERSATION_FLOWS[currentUserType];
    if (!allowedTargets.includes(targetUserType)) {
      setPermission({
        allowed: false,
        reason: "Chat not allowed between these account types",
      });
      setLoading(false);
      return;
    }

    // 2. If customer initiating chat with product, check product permission
    if (
      productId &&
      TRADING_ACCOUNT_CONFIG[currentUserType].requiresProductPermission
    ) {
      const { data: productData, error } = await supabase
        .from("products")
        .select("id, asin, title, price, seller_id, allow_chat, images")
        .eq("id", productId)
        .single();

      if (error || !productData) {
        setPermission({
          allowed: false,
          reason: "Product not found",
          requiresProductPermission: true,
        });
        setLoading(false);
        return;
      }

      setProduct(productData);

      if (!productData.allow_chat) {
        setPermission({
          allowed: false,
          reason: "Seller has disabled chat for this product",
          requiresProductPermission: true,
          productAllowsChat: false,
        });
        setLoading(false);
        return;
      }
    }

    // 3. Permission granted
    setPermission({
      allowed: true,
      requiresProductPermission:
        TRADING_ACCOUNT_CONFIG[currentUserType].requiresProductPermission,
      productAllowsChat: product?.allow_chat ?? true,
    });

    setLoading(false);
  };

  return { permission, product, loading, refresh: checkPermission };
};
