import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, Edit, Calendar } from 'lucide-react';
import type { UserProfile, AccountType } from '@/types/profile';

interface ProfileHeaderProps {
  user: UserProfile;
  isOwnProfile?: boolean;
  onEdit?: () => void;
}

const roleConfig: Record<AccountType, { label: string; icon: string; color: string }> = {
  factory: { label: 'Factory', icon: '🏭', color: 'bg-blue-500' },
  seller: { label: 'Seller', icon: '🏪', color: 'bg-green-500' },
  middleman: { label: 'Middleman', icon: '🤝', color: 'bg-purple-500' },
  customer: { label: 'Customer', icon: '👤', color: 'bg-gray-500' },
  delivery: { label: 'Delivery', icon: '🚚', color: 'bg-orange-500' },
};

export function ProfileHeader({ user, isOwnProfile, onEdit }: ProfileHeaderProps) {
  const role = roleConfig[user.account_type];

  return (
    <Card className="overflow-hidden">
      {/* Cover Image */}
      <div className={`h-32 ${role.color} relative`}>
        {isOwnProfile && onEdit && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-2 right-4"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit Profile
          </Button>
        )}
      </div>

      <CardContent className="relative pt-16 pb-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar
            name={user.full_name || user.email}
            src={user.avatar_url}
            size="xl"
            className="border-4 border-background -mt-12"
          />

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{user.full_name || 'Unnamed User'}</h1>
            </div>

            <Badge className={`mt-1 ${role.color} text-white`}>
              {role.icon} {role.label}
            </Badge>

            {/* Contact Info */}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
              {user.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {user.phone}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Member since {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
