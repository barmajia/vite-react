import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui";
import { X, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id?: string;
  title: string;
  description: string | null;
  category: string | null;
  target_role: string | null;
  price: number;
  thumbnail_url: string | null;
  preview_url: string | null;
  is_published: boolean;
  [key: string]: any;
}

interface AddEditTemplateModalProps {
  template: Template | null;
  onClose: () => void;
}

const CATEGORIES = [
  "ecommerce",
  "portfolio",
  "blog",
  "business",
  "restaurant",
  "education",
  "health",
  "real-estate",
  "other",
];

const TARGET_ROLES = [
  "seller",
  "creator",
  "business",
  "freelancer",
  "restaurant",
  "teacher",
  "agent",
  "other",
];

export function AddEditTemplateModal({
  template,
  onClose,
}: AddEditTemplateModalProps) {
  const isEditing = !!template?.id;

  const [formData, setFormData] = useState({
    title: template?.title || "",
    description: template?.description || "",
    category: template?.category || "",
    target_role: template?.target_role || "",
    price: template?.price?.toString() || "0",
    thumbnail_url: template?.thumbnail_url || "",
    preview_url: template?.preview_url || "",
    is_published: template?.is_published || false,
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.category) {
      toast.error("Category is required");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const templateData: any = {
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        target_role: formData.target_role || null,
        price: parseFloat(formData.price) || 0,
        thumbnail_url: formData.thumbnail_url || null,
        preview_url: formData.preview_url || null,
        is_published: formData.is_published,
      };

      if (isEditing && template?.id) {
        // Update existing template
        const { error } = await supabase
          .from("website_marketplace")
          .update(templateData)
          .eq("id", template.id);

        if (error) throw error;
        toast.success("Template updated successfully");
      } else {
        // Create new template
        templateData.seller_id = user.id;

        const { error } = await supabase
          .from("website_marketplace")
          .insert(templateData);

        if (error) throw error;
        toast.success("Template created successfully");
      }

      onClose();
    } catch (err: any) {
      console.error("Error saving template:", err);
      toast.error("Failed to save template", {
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "thumbnail_url" | "preview_url",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `marketplace/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("templates")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("templates").getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, [field]: publicUrl }));
      toast.success("Image uploaded successfully");
    } catch (err: any) {
      console.error("Error uploading image:", err);
      toast.error("Failed to upload image", {
        description: err.message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white rounded-t-lg">
          <h2 className="text-2xl font-bold">
            {isEditing ? "Edit Template" : "Add New Template"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Modern E-commerce Store"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="A clean and modern template for online stores..."
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category and Target Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Target Role
              </label>
              <select
                value={formData.target_role}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    target_role: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select role</option>
                {TARGET_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Price (0 = Free)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, price: e.target.value }))
              }
              placeholder="0"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Thumbnail Image
            </label>
            <div className="flex items-center gap-4">
              {formData.thumbnail_url && (
                <img
                  src={formData.thumbnail_url}
                  alt="Thumbnail"
                  className="w-32 h-24 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  <Upload className="h-4 w-4" />
                  <span>{uploading ? "Uploading..." : "Upload Image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "thumbnail_url")}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 800x600px, max 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Preview URL */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Live Preview URL (optional)
            </label>
            <input
              type="url"
              value={formData.preview_url}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  preview_url: e.target.value,
                }))
              }
              placeholder="https://your-preview-url.com"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL to a live preview of this template
            </p>
          </div>

          {/* Publish Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Publish immediately</p>
              <p className="text-sm text-gray-600">
                {formData.is_published
                  ? "Template will be visible in marketplace"
                  : "Template will be saved as draft"}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_published: e.target.checked,
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Update Template"
              ) : (
                "Create Template"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
