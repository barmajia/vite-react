import { supabase } from './supabase';

export interface CheckoutData {
  items: CartItem[];
  shipping: ShippingAddress;
  paymentMethod: 'cod' | 'card' | 'wallet';
}

export interface CartItem {
  asin: string;
  quantity: number;
  price: number;
  seller_id: string;
  title?: string;
  image?: string;
}

export interface ShippingAddress {
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
}

export interface OrderBreakdown {
  subtotal: number;
  platformMargin: number;
  shipping: number;
  total: number;
  sellerReceives: number;
}

export async function createOrder(checkoutData: CheckoutData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const subtotal = checkoutData.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const platformMargin = subtotal * 0.08; // 8% platform fee
  const shipping = subtotal > 500 ? 0 : 50; // Free shipping over 500 EGP
  const total = subtotal + shipping;

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      seller_id: checkoutData.items[0].seller_id,
      subtotal,
      shipping,
      tax: 0,
      discount: 0,
      total,
      payment_method: checkoutData.paymentMethod,
      payment_status: 'pending',
      status: 'pending',
      shipping_address_snapshot: checkoutData.shipping,
      metadata: {
        platform_margin: platformMargin,
        platform_margin_percentage: 8,
        items_count: checkoutData.items.length
      }
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Create order items
  const orderItems = checkoutData.items.map(item => ({
    order_id: order.id,
    asin: item.asin,
    product_name: item.title || '',
    product_image: item.image || '',
    quantity: item.quantity,
    unit_price: item.price,
    total_price: item.price * item.quantity,
    seller_id: item.seller_id
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) throw itemsError;

  // Generate COD verification if COD payment
  let verificationCode: string | null = null;
  if (checkoutData.paymentMethod === 'cod') {
    const { data: codData, error: codError } = await supabase.rpc(
      'generate_cod_verification_key',
      {
        p_order_id: order.id,
        p_key_length: 6,
        p_expiry_hours: 48
      }
    );

    if (codError) {
      console.error('Error generating COD code:', codError);
    } else {
      verificationCode = codData;
    }
  }

  // Clear cart
  await supabase.from('cart').delete().eq('user_id', user.id);

  return {
    order,
    verificationCode,
    breakdown: {
      subtotal,
      platformMargin,
      shipping,
      total,
      sellerReceives: subtotal - platformMargin
    }
  };
}

export async function loadUserCart() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: cart, error } = await supabase
    .from('cart')
    .select(`
      *,
      products:sellers!inner(
        id,
        title,
        price,
        images,
        seller_id
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error loading cart:', error);
    return [];
  }

  return cart?.map(item => ({
    asin: item.asin,
    title: item.products.title,
    price: item.products.price,
    quantity: item.quantity,
    image: item.products.images?.[0],
    seller_id: item.products.seller_id
  })) || [];
}

export async function clearUserCart() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('cart').delete().eq('user_id', user.id);
}
