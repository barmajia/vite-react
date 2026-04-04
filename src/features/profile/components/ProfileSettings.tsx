import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ProfileSettingsProps {
  userId: string;
}

export function ProfileSettings({ userId: _userId }: ProfileSettingsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      // Note: Actual account deletion requires admin privileges or a special RPC function
      // This is a placeholder - you'll need to implement the actual deletion logic
      toast.error("Account deletion requires contacting support");
      // In production, you would:
      // 1. Create a deletion request in a table
      // 2. Send confirmation email
      // 3. Process deletion after grace period
    } catch (_error) {
      toast.error("Failed to process deletion request");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setConfirmText("");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>
            Manage your email notification settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Order Updates</p>
              <p className="text-sm text-muted-foreground">
                Receive emails about your order status
              </p>
            </div>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Promotions</p>
              <p className="text-sm text-muted-foreground">
                Receive emails about deals and promotions
              </p>
            </div>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>
            Control your data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Profile Visibility</p>
              <p className="text-sm text-muted-foreground">
                Make your profile visible to other users
              </p>
            </div>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Data Export</p>
              <p className="text-sm text-muted-foreground">
                Download a copy of your data
              </p>
            </div>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />

          {/* Sign Out */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sign Out</p>
              <p className="text-sm text-muted-foreground">
                Sign out from all devices
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>

          <Separator />

          {/* Delete Account */}
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-destructive">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </Button>
            </div>
          ) : (
            <div className="p-4 border border-destructive rounded-lg space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  This action cannot be undone. This will permanently delete
                  your account and all associated data.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="confirm">Type "DELETE" to confirm</Label>
                <Input
                  id="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setConfirmText("");
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
