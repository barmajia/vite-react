export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'fashion' | 'electronics' | 'home' | 'sports' | 'beauty' | 'food' | 'general';
  previewImage: string;
  features: string[];
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    heading: string;
    body: string;
  };
  layout: 'minimal' | 'grid' | 'featured' | 'carousel';
  price: number;
  isPremium: boolean;
}

export const templates: Template[] = [
  {
    id: 'template-001',
    name: 'Modern Minimalist',
    description: 'Clean and simple design perfect for fashion and lifestyle brands. Focuses on product imagery with minimal distractions.',
    category: 'fashion',
    previewImage: '/templates/modern-minimalist.png',
    features: [
      'Hero banner with slideshow',
      'Product grid layout',
      'Minimal navigation',
      'Instagram feed integration',
      'Quick view modal',
      'Mobile optimized'
    ],
    colorScheme: {
      primary: '#000000',
      secondary: '#FFFFFF',
      accent: '#D4AF37',
      background: '#FAFAFA',
      text: '#333333'
    },
    typography: {
      heading: 'Playfair Display',
      body: 'Lato'
    },
    layout: 'minimal',
    price: 0,
    isPremium: false
  },
  {
    id: 'template-002',
    name: 'Tech Hub Pro',
    description: 'Advanced template designed for electronics and tech products. Features comparison tables and detailed specifications.',
    category: 'electronics',
    previewImage: '/templates/tech-hub-pro.png',
    features: [
      'Product comparison tool',
      'Technical specs accordion',
      'Review system with ratings',
      'Video product demos',
      'Wishlist functionality',
      'Live chat support'
    ],
    colorScheme: {
      primary: '#0066CC',
      secondary: '#1A1A2E',
      accent: '#00D9FF',
      background: '#F5F7FA',
      text: '#2C3E50'
    },
    typography: {
      heading: 'Roboto',
      body: 'Open Sans'
    },
    layout: 'grid',
    price: 49,
    isPremium: true
  },
  {
    id: 'template-003',
    name: 'Home Comfort',
    description: 'Warm and inviting design for home decor and furniture stores. Emphasizes room settings and lifestyle imagery.',
    category: 'home',
    previewImage: '/templates/home-comfort.png',
    features: [
      'Room visualizer',
      'Size guide interactive',
      'AR preview capability',
      'Collection lookbooks',
      'Interior inspiration blog',
      'Delivery tracker'
    ],
    colorScheme: {
      primary: '#8B7355',
      secondary: '#F5E6D3',
      accent: '#D4A574',
      background: '#FFFBF7',
      text: '#4A4A4A'
    },
    typography: {
      heading: 'Merriweather',
      body: 'Source Sans Pro'
    },
    layout: 'featured',
    price: 0,
    isPremium: false
  },
  {
    id: 'template-004',
    name: 'Sport Elite',
    description: 'Dynamic and energetic template for sports equipment and athletic wear. Built for performance and action.',
    category: 'sports',
    previewImage: '/templates/sport-elite.png',
    features: [
      'Athlete testimonials',
      'Performance metrics display',
      'Training blog integration',
      'Event calendar',
      'Team sponsorship section',
      'Video backgrounds'
    ],
    colorScheme: {
      primary: '#FF4500',
      secondary: '#1C1C1C',
      accent: '#00FF88',
      background: '#FFFFFF',
      text: '#1A1A1A'
    },
    typography: {
      heading: 'Bebas Neue',
      body: 'Montserrat'
    },
    layout: 'carousel',
    price: 39,
    isPremium: true
  },
  {
    id: 'template-005',
    name: 'Beauty Glow',
    description: 'Elegant and sophisticated design for beauty and cosmetics brands. Soft colors and luxurious feel.',
    category: 'beauty',
    previewImage: '/templates/beauty-glow.png',
    features: [
      'Skin type quiz',
      'Ingredient transparency',
      'Before/after gallery',
      'Tutorial videos',
      'Subscription boxes',
      'Loyalty rewards program'
    ],
    colorScheme: {
      primary: '#E8A0BF',
      secondary: '#FFF5F8',
      accent: '#C77D9B',
      background: '#FFFEFF',
      text: '#5D4E60'
    },
    typography: {
      heading: 'Cormorant Garamond',
      body: 'Nunito'
    },
    layout: 'minimal',
    price: 0,
    isPremium: false
  },
  {
    id: 'template-006',
    name: 'Gourmet Market',
    description: 'Fresh and appetizing template for food and beverage businesses. Showcases products with mouth-watering visuals.',
    category: 'food',
    previewImage: '/templates/gourmet-market.png',
    features: [
      'Recipe integration',
      'Nutritional information',
      'Subscription meal plans',
      'Local delivery zones',
      'Chef profiles',
      'Customer reviews with photos'
    ],
    colorScheme: {
      primary: '#2ECC71',
      secondary: '#FDFEFE',
      accent: '#F39C12',
      background: '#FAFAFA',
      text: '#2C3E50'
    },
    typography: {
      heading: 'Amatic SC',
      body: 'Raleway'
    },
    layout: 'grid',
    price: 29,
    isPremium: true
  },
  {
    id: 'template-007',
    name: 'Urban Street',
    description: 'Bold and edgy design for streetwear and urban fashion. Makes a statement with strong typography and contrasts.',
    category: 'fashion',
    previewImage: '/templates/urban-street.png',
    features: [
      'Drop countdown timers',
      'Limited edition badges',
      'Lookbook galleries',
      'Artist collaborations',
      'Social proof notifications',
      'Size recommendation AI'
    ],
    colorScheme: {
      primary: '#FF0055',
      secondary: '#000000',
      accent: '#FFFF00',
      background: '#121212',
      text: '#FFFFFF'
    },
    typography: {
      heading: 'Anton',
      body: 'Roboto Condensed'
    },
    layout: 'featured',
    price: 45,
    isPremium: true
  },
  {
    id: 'template-008',
    name: 'Eco Natural',
    description: 'Sustainable and earthy design for eco-friendly and organic products. Communicates environmental values.',
    category: 'general',
    previewImage: '/templates/eco-natural.png',
    features: [
      'Carbon footprint calculator',
      'Sustainability score',
      'Ethical sourcing info',
      'Donation integration',
      'Eco tips blog',
      'Green certifications display'
    ],
    colorScheme: {
      primary: '#5D8AA8',
      secondary: '#E8F4F8',
      accent: '#8FBC8F',
      background: '#F9FFF9',
      text: '#3D5A4B'
    },
    typography: {
      heading: 'Quicksand',
      body: 'Karla'
    },
    layout: 'minimal',
    price: 0,
    isPremium: false
  },
  {
    id: 'template-009',
    name: 'Luxury Boutique',
    description: 'Premium and exclusive design for high-end products. Exudes sophistication and exclusivity.',
    category: 'fashion',
    previewImage: '/templates/luxury-boutique.png',
    features: [
      'VIP membership access',
      'Private shopping appointments',
      'Concierge service',
      'Exclusive collections',
      'White glove delivery',
      'Personal stylist booking'
    ],
    colorScheme: {
      primary: '#1A1A1A',
      secondary: '#D4AF37',
      accent: '#C0C0C0',
      background: '#FFFEF8',
      text: '#2C2C2C'
    },
    typography: {
      heading: 'Didot',
      body: 'Futura'
    },
    layout: 'featured',
    price: 99,
    isPremium: true
  },
  {
    id: 'template-010',
    name: 'Kids Paradise',
    description: 'Fun and colorful template for children\'s products. Playful design that appeals to both kids and parents.',
    category: 'general',
    previewImage: '/templates/kids-paradise.png',
    features: [
      'Age filter navigation',
      'Gift finder wizard',
      'Character collections',
      'Parent reviews section',
      'Safety certifications',
      'Birthday party planner'
    ],
    colorScheme: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
      background: '#F7FFF7',
      text: '#2D3436'
    },
    typography: {
      heading: 'Fredoka One',
      body: 'Varela Round'
    },
    layout: 'carousel',
    price: 0,
    isPremium: false
  }
];

export const categories = [
  { id: 'all', name: 'All Templates', icon: '🌐' },
  { id: 'fashion', name: 'Fashion', icon: '👗' },
  { id: 'electronics', name: 'Electronics', icon: '💻' },
  { id: 'home', name: 'Home & Decor', icon: '🏠' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'beauty', name: 'Beauty', icon: '💄' },
  { id: 'food', name: 'Food & Beverage', icon: '🍔' },
  { id: 'general', name: 'General', icon: '🛍️' }
];

export const layouts = [
  { id: 'minimal', name: 'Minimal', description: 'Clean and simple' },
  { id: 'grid', name: 'Grid', description: 'Product-focused layout' },
  { id: 'featured', name: 'Featured', description: 'Highlight key products' },
  { id: 'carousel', name: 'Carousel', description: 'Dynamic sliding displays' }
];
