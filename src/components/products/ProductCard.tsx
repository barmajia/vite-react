import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Star, Heart, Eye, MessageSquare, Zap, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/database";
import { formatPrice, getProductImage } from "@/lib/utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { initiateProductChat } from "@/lib/chat-product";
import { useAuth } from "@/hooks/useAuth";
import { showToast } from "@/lib/toast";

interface ProductCardProps {
  product: Product & {
    average_rating?: number;
    review_count?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const imageUrl = getProductImage(product.images);

  const hasDiscount = product.price && product.price > 0;

  const handleChatWithSeller = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showToast("info", t("common.loginRequired"), {
        description: t("common.loginToChat") || "Please log in to chat with the seller",
      });
      navigate("/login", { state: { returnTo: `/products/${product.asin}` } });
      return;
    }

    setIsChatLoading(true);
    try {
      const conversationId = await initiateProductChat(
        product.seller_id,
        product.asin,
        product.title,
      );

      if (conversationId) {
        navigate(
          `/chat?id=${user.id}&connectedTo=${product.seller_id}&conversationId=${conversationId}`,
        );
        showToast("success", t("chat.chatStarted") || "Chat Started", {
          description: t("chat.chatWithSeller") || "Chat opened with seller",
        });
      }
    } catch (error) {
       showToast("error", t("common.error"), {
        description: error instanceof Error ? error.message : "Failed to start chat",
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div 
      className="h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        className="group glass-card border-t-white/30 border-l-white/20 border-b-white/5 border-r-white/5 bg-gradient-to-br from-white/10 via-white/5 to-transparent hover:bg-white/10 transition-all duration-1000 hover:-translate-y-4 rounded-[3rem] overflow-hidden flex flex-col h-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_40px_80px_-10px_rgba(0,0,0,0.6),0_0_40px_-10px_rgba(var(--primary),0.3),inset_0_1px_1px_rgba(255,255,255,0.6)] relative z-10"
      >
        {/* Dynamic Background Glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-[90px] -mr-20 -mt-20 pointer-events-none group-hover:bg-primary/40 group-hover:scale-150 transition-all duration-1000" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-[90px] -ml-20 -mb-20 pointer-events-none group-hover:bg-blue-500/30 group-hover:scale-150 transition-all duration-1000" />

        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden m-4 rounded-[2.5rem] ring-1 ring-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] z-20 bg-black/20">
          <Link to={`/products/${product.asin}`} className="block h-full w-full relative">
            <img
              src={imageUrl}
              alt={product.title}
              className="h-full w-full object-cover transition-all duration-1000 group-hover:scale-125 group-hover:rotate-3"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-700" />
          </Link>
          
          {/* Floating Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-30">
            {product.quantity === 0 ? (
              <Badge className="glass bg-rose-500/80 text-white border-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest italic shadow-lg">
                {t("product.outOfStock")}
              </Badge>
            ) : product.quantity && product.quantity < 10 ? (
              <Badge className="glass bg-amber-500/80 text-white border-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest italic shadow-lg">
                {t("product.lowStock")}
              </Badge>
            ) : null}
            {hasDiscount && (
               <Badge className="glass bg-primary text-white border-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest italic shadow-lg flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {t("product.sale")}
               </Badge>
            )}
          </div>

          {/* Quick Interaction Overlay */}
          <div
            className={cn(
              "absolute inset-0 z-40 bg-black/40 backdrop-blur-md opacity-0 transition-all duration-500 flex flex-col items-center justify-center gap-4 px-6",
              isHovered && "opacity-100"
            )}
          >
             <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-14 w-14 glass bg-white/10 hover:bg-rose-500 text-white rounded-2xl transition-all duration-500 hover:scale-110 active:scale-95 group/heart"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsWishlisted(!isWishlisted);
                  }}
                >
                  <Heart className={cn("h-6 w-6 transition-all", isWishlisted ? "fill-white" : "group-hover/heart:scale-125")} />
                </Button>
                <Link 
                  to={`/products/${product.asin}`} 
                  onClick={(e) => e.stopPropagation()}
                  className="h-14 w-14 glass bg-white/10 hover:bg-primary text-white rounded-2xl transition-all duration-500 hover:scale-110 active:scale-95 flex items-center justify-center"
                >
                  <Eye className="h-6 w-6" />
                </Link>
             </div>
             
             <Button
                className="w-full h-14 glass bg-white/20 text-white font-black italic uppercase tracking-widest text-[10px] rounded-2xl hover:bg-primary/80 transition-all duration-500"
                onClick={handleChatWithSeller}
                disabled={isChatLoading}
             >
                <MessageSquare className="h-4 w-4 mr-2" />
                {isChatLoading ? "LOADING..." : "Direct Uplink"}
             </Button>
          </div>
        </div>

        {/* Narrative Section */}
        <CardContent className="p-6 flex flex-col flex-1 gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 italic">
                 {product.category || "General Unit"}
               </span>
               {product.average_rating && (
                  <div className="flex items-center gap-1.5 glass bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                     <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                     <span className="text-[10px] font-black">{product.average_rating}</span>
                  </div>
               )}
            </div>
            <Link to={`/products/${product.asin}`}>
              <h3 className="text-lg font-black tracking-tighter italic leading-tight group-hover:text-primary transition-colors line-clamp-2 uppercase">
                {product.title}
              </h3>
            </Link>
          </div>

          <div className="mt-auto flex items-end justify-between gap-4">
            <div className="space-y-0.5">
              {product.price ? (
                <div className="flex flex-col">
                   {hasDiscount && (
                     <span className="text-[10px] font-black text-muted-foreground/40 line-through italic tracking-tighter">
                       {formatPrice(product.price * 1.2)}
                     </span>
                   )}
                   <span className="text-2xl font-black italic tracking-tighter text-foreground leading-none">
                     {formatPrice(product.price).split('.')[0]}
                     <span className="text-xs opacity-40">.{formatPrice(product.price).split('.')[1] || '00'}</span>
                   </span>
                </div>
              ) : (
                <span className="text-[10px] font-black uppercase text-muted-foreground/60 italic tracking-widest">
                  Negotiable
                </span>
              )}
              <div className="flex items-center gap-1 opacity-40">
                 <ShieldCheck className="h-3 w-3" />
                 <span className="text-[8px] font-black uppercase tracking-widest">Aurora Verified</span>
              </div>
            </div>

            <Button
              size="sm"
              className={cn(
                "h-14 w-14 rounded-2xl shrink-0 transition-all duration-500 glass",
                product.quantity === 0
                  ? "bg-white/5 text-muted-foreground/30 border-white/5 cursor-not-allowed"
                  : "bg-primary text-white shadow-[0_8px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.5)] hover:scale-110 active:scale-95 group/cart"
              )}
              disabled={product.quantity === 0}
              aria-label={t("common.addToCart")}
            >
              <ShoppingCart className={cn("h-6 w-6 transition-transform duration-500", product.quantity !== 0 && "group-hover/cart:-rotate-12 group-hover/cart:scale-110")} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
