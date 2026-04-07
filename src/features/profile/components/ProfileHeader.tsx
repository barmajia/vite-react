import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Edit, Calendar, ShieldCheck } from "lucide-react";
import type { UserProfile, AccountType } from "@/types/profile";

interface ProfileHeaderProps {
  user: UserProfile;
  isOwnProfile?: boolean;
  onEdit?: () => void;
}

const roleConfig: Partial<Record<
  AccountType,
  { label: string; icon: string; color: string }
>> = {
  factory: { label: "Factory", icon: "🏭", color: "from-blue-600 to-indigo-600" },
  seller: { label: "Seller", icon: "🏪", color: "from-emerald-600 to-teal-600" },
  middleman: { label: "Middleman", icon: "🤝", color: "from-amber-600 to-orange-600" },
  user: { label: "User", icon: "👤", color: "from-gray-600 to-slate-600" },
  admin: { label: "Admin", icon: "⚙️", color: "from-rose-600 to-pink-600" },
};

export function ProfileHeader({
  user,
  isOwnProfile,
  onEdit,
}: ProfileHeaderProps) {
  const role = roleConfig[user.account_type] || { label: user.account_type || "User", icon: "👤", color: "from-gray-600 to-slate-600" };

  return (
    <div className="glass-card overflow-hidden border-white/20 dark:border-white/10 shadow-2xl relative">
      {/* Dynamic Cover Backdrop */}
      <div className={`h-48 bg-gradient-to-br ${role.color} opacity-80 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {isOwnProfile && onEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute bottom-6 right-6 glass border-white/20 text-white hover:bg-white/20 transition-all font-bold backdrop-blur-md"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="px-8 pb-8 relative">
        <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 relative z-10">
          {/* Avatar with Ring */}
          <div className="relative group">
            <div className={`absolute -inset-1 bg-gradient-to-r ${role.color} rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200`} />
            <Avatar
              name={user.full_name || user.email}
              src={user.avatar_url}
              size="xl"
              className="h-32 w-32 border-4 border-background ring-4 ring-white/10 shadow-2xl relative"
            />
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground drop-shadow-sm">
                {user.full_name || "Unnamed User"}
              </h1>
              {user.is_verified && (
                <ShieldCheck className="h-6 w-6 text-primary fill-primary/20" />
              )}
            </div>

            <div className="flex items-center gap-2">
              <Badge className={`glass border-none py-1 px-3 text-xs font-black uppercase tracking-widest bg-gradient-to-r ${role.color} text-white shadow-lg`}>
                <span className="mr-1">{role.icon}</span> {role.label}
              </Badge>
            </div>

            {/* Premium Contact Badges */}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="glass px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-muted-foreground border-white/10">
                <Mail className="h-3.5 w-3.5 text-primary/70" />
                <span>{user.email}</span>
              </div>
              
              {user.phone && (
                <div className="glass px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-muted-foreground border-white/10">
                  <Phone className="h-3.5 w-3.5 text-emerald-500/70" />
                  <span>{user.phone}</span>
                </div>
              )}
              
              <div className="glass px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-muted-foreground border-white/10">
                <Calendar className="h-3.5 w-3.5 text-amber-500/70" />
                <span>Since {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
