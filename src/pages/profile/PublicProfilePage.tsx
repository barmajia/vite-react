// src/pages/profile/PublicProfilePage.tsx
// Universal Public Profile Page - supports all account types

import { useParams, useNavigate } from "react-router-dom";
import { PublicProfile as UniversalPublicProfile } from "@/components/profiles/PublicProfile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui";
import { ArrowLeft } from "lucide-react";

export const PublicProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            User ID Required
          </h1>
          <p className="text-gray-600 mb-4">
            Please provide a valid user ID to view the profile
          </p>
          <Button onClick={() => navigate("/profiles")}>Browse Profiles</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <Button
          variant="outline"
          onClick={() => navigate("/profiles")}
          className="gap-2"
        >
          <ArrowLeft size={18} />
          Back to Profiles
        </Button>
      </div>

      {/* Universal Public Profile Component */}
      <UniversalPublicProfile
        userId={userId}
        currentUserId={user?.id || undefined}
        className="px-4"
      />
    </div>
  );
};
