import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAddresses } from '../hooks/useAddresses';
import { AddressCard } from '../components/AddressCard';
import { AddressForm } from '../components/AddressForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, MapPin } from 'lucide-react';

export function AddressesPage() {
  const { user, loading } = useAuth();
  const {
    addresses,
    isLoading,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    isCreating,
    isUpdating,
  } = useAddresses();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSave = async (data: {
    full_name: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone: string;
    is_default: boolean;
  }) => {
    if (editingId) {
      await updateAddress({ id: editingId, updates: data });
      setEditingId(null);
    } else {
      await createAddress(data);
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      await deleteAddress(id);
    }
  };

  if (isAdding || editingId) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          {editingId ? 'Edit Address' : 'Add New Address'}
        </h1>
        <AddressForm
          initialData={editingId ? addresses.find((a) => a.id === editingId) : undefined}
          onSave={handleSave}
          onCancel={() => {
            setIsAdding(false);
            setEditingId(null);
          }}
          isSaving={isCreating || isUpdating}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Addresses</h1>
        <div className="grid gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Addresses</h1>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-6">
            <MapPin className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No addresses yet</h2>
          <p className="text-muted-foreground mb-6">
            Add your first shipping address for faster checkout.
          </p>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Address
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => setEditingId(address.id)}
              onDelete={() => handleDelete(address.id)}
              onSetDefault={() => setDefaultAddress(address.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
