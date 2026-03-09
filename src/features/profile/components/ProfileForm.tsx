import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import type { User } from '@supabase/supabase-js';

interface ProfileFormProps {
  user: User | null;
  formData: {
    fullName: string;
    email: string;
    phone: string;
    avatarUrl: string;
  };
  updateFormData: (updates: { fullName?: string; email?: string; phone?: string; avatarUrl?: string }) => void;
  onSave: () => void;
  isSaving: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

export function ProfileForm({
  user,
  formData,
  updateFormData,
  onSave,
  isSaving,
  isEditing,
  onEdit,
  onCancel,
}: ProfileFormProps) {
  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar
          name={formData.fullName || user?.email}
          src={formData.avatarUrl || user?.user_metadata?.avatar_url}
          size="lg"
        />
        <div>
          <h3 className="font-semibold text-lg">{formData.fullName || 'User'}</h3>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => updateFormData({ fullName: e.target.value })}
            disabled={!isEditing}
            placeholder="Your full name"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            disabled={!isEditing}
            placeholder="your@email.com"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            disabled={!isEditing}
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing ? (
        <div className="flex gap-2">
          <Button onClick={onSave} disabled={isSaving} className="flex-1">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button onClick={onEdit} className="w-full">
          Edit Profile
        </Button>
      )}
    </div>
  );
}
