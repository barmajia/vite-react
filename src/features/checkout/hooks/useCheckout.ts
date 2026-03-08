import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';

interface CheckoutFormData {
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  saveAddress: boolean;
}

export function useCheckout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, clearCart } = useCart();

  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: user?.user_metadata?.full_name || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: '',
    saveAddress: true,
  });

  const calculateOrderTotal = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.product?.price || 0) * item.quantity,
      0
    );
    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.08;
    return {
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax,
    };
  };

  const placeOrderMutation = useMutation({
    mutationFn: async (addressData: CheckoutFormData) => {
      if (!user) throw new Error('User not authenticated');

      const { shipping, tax, total } = calculateOrderTotal();

      if (items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Group items by seller
      const itemsBySeller = new Map<string, typeof items>();
      items.forEach((item) => {
        const sellerId = item.product?.seller_id || 'unknown';
        if (!itemsBySeller.has(sellerId)) {
          itemsBySeller.set(sellerId, []);
        }
        itemsBySeller.get(sellerId)!.push(item);
      });

      const orders: { id: string; seller_id: string }[] = [];

      // Create separate order for each seller
      for (const [sellerId, sellerItems] of itemsBySeller.entries()) {
        const sellerTotal = sellerItems.reduce(
          (sum, item) => sum + (item.product?.price || 0) * item.quantity,
          0
        );
        const sellerShipping = (shipping * (sellerItems.length / items.length));
        const sellerTax = (tax * (sellerItems.length / items.length));

        // Create order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            seller_id: sellerId,
            status: 'pending',
            total: sellerTotal + sellerShipping + sellerTax,
            payment_status: 'pending',
            shipping_address_snapshot: {
              full_name: addressData.fullName,
              address_line1: addressData.addressLine1,
              address_line2: addressData.addressLine2,
              city: addressData.city,
              state: addressData.state,
              postal_code: addressData.postalCode,
              country: addressData.country,
              phone: addressData.phone,
            },
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = sellerItems.map((item) => ({
          order_id: orderData.id,
          product_id: item.asin,
          quantity: item.quantity,
          price: item.product?.price || 0,
          title: item.product?.title || '',
          image_url: Array.isArray(item.product?.images) ? item.product.images[0] : null,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Update product inventory
        for (const item of sellerItems) {
          await supabase.rpc('decrement_product_quantity', {
            product_id: item.asin,
            quantity_to_decrement: item.quantity,
          });
        }

        orders.push({ id: orderData.id, seller_id: sellerId });
      }

      return { orders, total };
    },
    onSuccess: async (data) => {
      await clearCart();
      
      // Save address if requested
      if (formData.saveAddress) {
        await supabase.from('shipping_addresses').insert({
          user_id: user!.id,
          full_name: formData.fullName,
          address_line1: formData.addressLine1,
          address_line2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode,
          country: formData.country,
          phone: formData.phone,
          is_default: false,
        });
      }

      // Navigate to first order success page
      navigate(`/order-success/${data.orders[0].id}`);
    },
  });

  const updateFormData = (updates: Partial<CheckoutFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const placeOrder = async () => {
    // Validate form
    if (
      !formData.fullName ||
      !formData.addressLine1 ||
      !formData.city ||
      !formData.state ||
      !formData.postalCode ||
      !formData.country ||
      !formData.phone
    ) {
      throw new Error('Please fill in all required fields');
    }

    await placeOrderMutation.mutateAsync(formData);
  };

  return {
    formData,
    updateFormData,
    placeOrder,
    isPlacing: placeOrderMutation.isPending,
    error: placeOrderMutation.error,
    ...calculateOrderTotal(),
  };
}
