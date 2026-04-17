export interface TemplateProduct {
  id: string;
  title: string;
  display_price: number;
  image_url?: string;
  description?: string;
}

export interface TemplateProps {
  siteName: string;
  products: TemplateProduct[];
  settings: Record<string, any>;
  onAddToCart?: (productId: string) => void;
}