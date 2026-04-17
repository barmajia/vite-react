import { TemplateProps } from '@/types/template';
import { useCartStore } from '@/hooks/useCart';
import { MinimalistClean } from './MinimalistClean';
import { BoldStreet } from './BoldStreet';
import { TechGadget } from './TechGadget';
import { MarketplaceBazaar } from './MarketplaceBazaar';
import { OrganicFresh } from './OrganicFresh';

const TEMPLATE_MAP: Record<string, React.ComponentType<TemplateProps>> = {
  minimal: MinimalistClean,
  minimalist: MinimalistClean,
  bold: BoldStreet,
  street: BoldStreet,
  tech: TechGadget,
  gadget: TechGadget,
  bazaar: MarketplaceBazaar,
  marketplace: MarketplaceBazaar,
  organic: OrganicFresh,
  fresh: OrganicFresh,
};

export const TemplateRenderer = (props: TemplateProps) => {
  const templateId = props.settings?.template_id || 'minimal';
  const Template = TEMPLATE_MAP[templateId] || MinimalistClean;
  
  const addToCart = useCartStore.getState().addItem;
  
  const handleAddToCart = (productId: string) => {
    const product = props.products.find(p => p.id === productId);
    if (product) {
      addToCart({
        productId: product.id,
        name: product.title,
        price: product.display_price,
        image_url: product.image_url || null,
      });
    }
  };
  
  return <Template {...props} onAddToCart={handleAddToCart} />;
};

export { MinimalistClean, BoldStreet, TechGadget, MarketplaceBazaar, OrganicFresh };