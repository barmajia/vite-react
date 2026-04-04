// src/components/profiles/PublicProfile.tsx
// Universal Public Profile Component for all account types

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePublicProfile } from "../../hooks/usePublicProfile";
import { PROFILE_CONFIG } from "../../lib/profileConfig";
import { AccountType, ProfileTab } from "../../types/public-profile";
import {
  User,
  Store,
  Factory,
  Handshake,
  Laptop,
  Briefcase,
  Truck,
  Stethoscope,
  Heart,
  Pill,
  Shield,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Star,
  CheckCircle,
  MessageCircle,
  Clock,
  Award,
  Package,
  FileText,
  Briefcase as PortfolioIcon,
  Share2,
  Edit,
  Globe,
  DollarSign,
  TrendingUp,
} from "lucide-react";

interface PublicProfileProps {
  userId: string;
  accountType?: AccountType;
  currentUserId?: string;
  className?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  User,
  Store,
  Factory,
  Handshake,
  Laptop,
  Briefcase,
  Truck,
  Stethoscope,
  Heart,
  Pill,
  Shield,
};

export const PublicProfile: React.FC<PublicProfileProps> = ({
  userId,
  accountType,
  currentUserId,
  className = "",
}) => {
  const navigate = useNavigate();
  const { profile, loading, error } = usePublicProfile(userId, accountType);
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center text-red-500">
          <p className="text-lg font-semibold">Profile not found</p>
          <p className="text-sm mt-2">
            {error || "This profile may not be accessible"}
          </p>
        </div>
      </div>
    );
  }

  const config = PROFILE_CONFIG[profile.account_type as AccountType];
  const IconComponent = ICON_MAP[config.icon] || User;

  const getDisplayName = () => {
    if (profile.full_name) return profile.full_name;
    if ((profile as any).store_name) return (profile as any).store_name;
    if ((profile as any).company_name) return (profile as any).company_name;
    if ((profile as any).provider_name) return (profile as any).provider_name;
    if ((profile as any).pharmacy_name) return (profile as any).pharmacy_name;
    if ((profile as any).display_name) return (profile as any).display_name;
    return "Anonymous User";
  };

  const renderVerificationBadge = () => {
    if (!profile.is_verified) return null;
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
        <CheckCircle size={14} />
        Verified
      </span>
    );
  };

  const renderRating = () => {
    const avgRating = (profile as any).average_rating;
    const reviewCount = (profile as any).review_count;
    if (!avgRating) return null;
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Star size={18} className="text-yellow-500 fill-yellow-500" />
          <span className="font-semibold text-lg">{avgRating.toFixed(1)}</span>
        </div>
        {reviewCount && (
          <span className="text-gray-500">({reviewCount} reviews)</span>
        )}
      </div>
    );
  };

  const renderActionButtons = () => {
    const isOwnProfile = currentUserId === userId;

    // Show edit button for own profile
    if (isOwnProfile) {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate(`/profile/${userId}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit size={18} />
            <span>Edit Profile</span>
          </button>
          <button
            className="p-2 border rounded-lg hover:bg-gray-100 transition-colors"
            title="Share"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
          >
            <Share2 size={18} className="text-gray-600" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {config.canMessage && (
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <MessageCircle size={18} />
            <span>Message</span>
          </button>
        )}
        {config.canCall && profile.phone && (
          <a
            href={`tel:${profile.phone}`}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Phone size={18} />
            <span>Call</span>
          </a>
        )}
        {config.canBookAppointment && (
          <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            <Calendar size={18} />
            <span>Book Appointment</span>
          </button>
        )}
        {config.canPurchase && (
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <Package size={18} />
            <span>View Products</span>
          </button>
        )}
        <button
          className="p-2 border rounded-lg hover:bg-gray-100 transition-colors"
          title="Share"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
          }}
        >
          <Share2 size={18} className="text-gray-600" />
        </button>
      </div>
    );
  };

  const renderTabs = () => {
    const tabIcons: Record<ProfileTab, React.ElementType> = {
      overview: User,
      products: Package,
      services: Briefcase,
      reviews: Star,
      portfolio: PortfolioIcon,
      about: FileText,
      contact: Mail,
      appointments: Calendar,
      medicines: Pill,
    };

    const tabs: ProfileTab[] = [
      "overview",
      ...(config.availableTabs.filter((t) => t !== "overview") as ProfileTab[]),
    ];

    return (
      <div className="border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-px">
          {tabs.map((tab) => {
            const TabIcon = tabIcons[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap rounded-t-lg ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                <TabIcon size={18} />
                <span className="capitalize">{tab}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStats = () => {
    const stats: {
      label: string;
      value: string | number;
      icon: React.ElementType;
    }[] = [];

    if ((profile as any).total_products) {
      stats.push({
        label: "Products",
        value: (profile as any).total_products,
        icon: Package,
      });
    }
    if (
      (profile as any).total_jobs_completed ||
      (profile as any).total_deliveries
    ) {
      stats.push({
        label: "Completed",
        value:
          (profile as any).total_jobs_completed ||
          (profile as any).total_deliveries,
        icon: Award,
      });
    }
    if ((profile as any).total_sales) {
      stats.push({
        label: "Sales",
        value: (profile as any).total_sales,
        icon: TrendingUp,
      });
    }
    if ((profile as any).total_appointments) {
      stats.push({
        label: "Appointments",
        value: (profile as any).total_appointments,
        icon: Calendar,
      });
    }
    if ((profile as any).total_deals) {
      stats.push({
        label: "Deals",
        value: (profile as any).total_deals,
        icon: Handshake,
      });
    }
    if ((profile as any).total_medicines) {
      stats.push({
        label: "Medicines",
        value: (profile as any).total_medicines,
        icon: Pill,
      });
    }

    if (stats.length === 0) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const StatIcon = stat.icon;
          return (
            <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
              <StatIcon size={24} className="mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>
    );
  };

  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Main Info */}
      <div className="md:col-span-2 space-y-6">
        {/* About Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">About</h3>
          <p className="text-gray-600 leading-relaxed">
            {(profile as any).biography ||
              (profile as any).description ||
              (profile as any).bio ||
              `${config.description} based in ${profile.location || "Unknown location"}.`}
          </p>
        </div>

        {/* Specialties/Skills */}
        {((profile as any).skills || (profile as any).specialties) && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              {(profile as any).skills ? "Skills" : "Specialties"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(
                (profile as any).skills ||
                (profile as any).specialties ||
                []
              ).map((item: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {renderStats()}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Contact Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Contact Information
          </h3>
          <div className="space-y-3">
            {profile.location && (
              <div className="flex items-start gap-3 text-gray-600">
                <MapPin size={18} className="mt-0.5 flex-shrink-0" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.phone && config.publicFields.includes("phone") && (
              <a
                href={`tel:${profile.phone}`}
                className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Phone size={18} className="flex-shrink-0" />
                <span>{profile.phone}</span>
              </a>
            )}
            {profile.email && config.publicFields.includes("email") && (
              <a
                href={`mailto:${profile.email}`}
                className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Mail size={18} className="flex-shrink-0" />
                <span>{profile.email}</span>
              </a>
            )}
            {(profile as any).website_url && (
              <a
                href={(profile as any).website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Globe size={18} className="flex-shrink-0" />
                <span>Visit Website</span>
              </a>
            )}
            {(profile as any).response_time_hours && (
              <div className="flex items-center gap-3 text-gray-600">
                <Clock size={18} className="flex-shrink-0" />
                <span>Responds in {(profile as any).response_time_hours}h</span>
              </div>
            )}
          </div>
        </div>

        {/* Availability */}
        {(profile as any).is_available !== undefined && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Availability
            </h3>
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  (profile as any).is_available ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span
                className={
                  (profile as any).is_available
                    ? "text-green-600 font-medium"
                    : "text-red-600 font-medium"
                }
              >
                {(profile as any).is_available
                  ? "Available for work"
                  : "Currently unavailable"}
              </span>
            </div>
          </div>
        )}

        {/* Pricing Info */}
        {((profile as any).hourly_rate ||
          (profile as any).consultation_fee) && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Pricing
            </h3>
            <div className="flex items-center gap-2 text-gray-900">
              <DollarSign size={20} className="text-green-600" />
              <span className="text-2xl font-bold">
                {(profile as any).hourly_rate ||
                  (profile as any).consultation_fee}
              </span>
              <span className="text-gray-500">
                /{(profile as any).hourly_rate ? "hour" : "consultation"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPlaceholderTab = (tabName: string) => (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
        <Package size={32} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {tabName} Coming Soon
      </h3>
      <p className="text-gray-500 max-w-md mx-auto">
        This section is under development and will be available soon.
      </p>
    </div>
  );

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        {/* Cover Image */}
        {(profile as any).cover_image_url && (
          <div className="h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
            <img
              src={(profile as any).cover_image_url}
              alt="Cover"
              className="w-full h-full object-cover opacity-90"
            />
          </div>
        )}

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 gap-4">
            <div className="flex items-end gap-4">
              <div
                className={`w-32 h-32 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-4xl ${config.color}`}
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={getDisplayName()}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <IconComponent size={48} />
                )}
              </div>
              <div className="mb-2 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {getDisplayName()}
                  </h1>
                  {renderVerificationBadge()}
                </div>
                <p className="text-gray-600">{config.label}</p>
                {renderRating()}
              </div>
            </div>
            {renderActionButtons()}
          </div>
        </div>

        {/* Tabs */}
        {renderTabs()}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === "overview" && renderOverviewTab()}
        {activeTab === "products" && renderPlaceholderTab("Products")}
        {activeTab === "services" && renderPlaceholderTab("Services")}
        {activeTab === "portfolio" && renderPlaceholderTab("Portfolio")}
        {activeTab === "reviews" && renderPlaceholderTab("Reviews")}
        {activeTab === "appointments" && renderPlaceholderTab("Appointments")}
        {activeTab === "medicines" && renderPlaceholderTab("Medicines")}
        {activeTab === "about" && renderPlaceholderTab("About")}
        {activeTab === "contact" && renderPlaceholderTab("Contact")}
      </div>
    </div>
  );
};
