// src/hooks/useAdminAuth.ts
// Admin authentication hook - checks if user has admin privileges

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { getNexusProfile } from "@/utils/secure-profile-storage";

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<{
    user_id: string;
    email: string;
    full_name: string;
    role?: string;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login?redirect=/admin");
        return;
      }

      // Check if user is in admin_users table
      const { data: adminRecord, error } = await supabase
        .from("admin_users")
        .select("admin_users, role")
        .eq("user_id", user.id)
        .maybeSingle();

      // If error or no admin record, user is not an admin
      if (error || !adminRecord) {
        console.info("User is not an admin or admin table not setup:", user.id);
        // Don't redirect - just set isAdmin to false
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Check for cached profile first
      const cached = getNexusProfile();
      if (cached && cached.uuid === user.id) {
         setIsAdmin(cached.account_type === 'admin');
         setAdminData({
           user_id: user.id,
           email: user.email || "",
           full_name: cached.full_name,
           role: adminRecord.role || "admin",
         });
         setLoading(false);
         return;
      }

      // Fallback: Get user profile data from DB
      const { data: userData } = await supabase
        .from("users")
        .select("email, full_name, account_type")
        .eq("user_id", user.id)
        .single();

      setIsAdmin(userData?.account_type === 'admin');
      setAdminData({
        user_id: user.id,
        email: userData?.email || "",
        full_name: userData?.full_name || "",
        role: adminRecord.role || "admin",
      });
    } catch (error) {
      console.error("Admin check failed:", error);
      // On error, assume not admin but don't redirect
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return {
    isAdmin,
    loading,
    adminData,
    signOut,
    refresh: checkAdminStatus,
  };
}
