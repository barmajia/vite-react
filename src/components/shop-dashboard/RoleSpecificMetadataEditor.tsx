import { useState } from "react";
import { Save, Loader2, Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface MetadataEditorProps {
  shopId: string;
  shopType: string;
  metadata: Record<string, any>;
  onSave?: () => void;
}

export function RoleSpecificMetadataEditor({
  shopId,
  shopType,
  metadata,
  onSave,
}: MetadataEditorProps) {
  const [saving, setSaving] = useState(false);
  const [localMetadata, setLocalMetadata] = useState(metadata);
  const [newTag, setNewTag] = useState("");

  const updateField = (key: string, value: any) => {
    setLocalMetadata((prev) => ({ ...prev, [key]: value }));
  };

  const addTag = (field: string) => {
    if (!newTag.trim()) return;
    const tags = localMetadata[field] ?? [];
    updateField(field, [...tags, newTag.trim()]);
    setNewTag("");
  };

  const removeTag = (field: string, index: number) => {
    const tags = [...(localMetadata[field] ?? [])];
    tags.splice(index, 1);
    updateField(field, tags);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("shops")
      .update({ metadata: localMetadata })
      .eq("id", shopId);
    setSaving(false);

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      onSave?.();
    }
  };

  // Doctor-specific fields
  if (shopType === "doctor") {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Doctor Profile Details</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Professional Bio
              </label>
              <textarea
                value={localMetadata.bio ?? ""}
                onChange={(e) => updateField("bio", e.target.value)}
                rows={4}
                className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                placeholder="Describe your experience, specialties, and approach..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Services Offered
              </label>
              <TagInput
                tags={localMetadata.services ?? []}
                onAdd={(tag) => {
                  const tags = localMetadata.services ?? [];
                  updateField("services", [...tags, tag]);
                }}
                onRemove={(index) => removeTag("services", index)}
                placeholder="e.g., General Consultation, Cardiology..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Certifications & Qualifications
              </label>
              <TagInput
                tags={localMetadata.certifications ?? []}
                onAdd={(tag) => {
                  const tags = localMetadata.certifications ?? [];
                  updateField("certifications", [...tags, tag]);
                }}
                onRemove={(index) => removeTag("certifications", index)}
                placeholder="e.g., MD Cardiology, Board Certified..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Working Hours
              </label>
              <input
                type="text"
                value={localMetadata.working_hours ?? ""}
                onChange={(e) => updateField("working_hours", e.target.value)}
                className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                placeholder="e.g., Mon-Fri 9AM-5PM, Sat 9AM-1PM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Clinic Location
              </label>
              <input
                type="text"
                value={localMetadata.location ?? ""}
                onChange={(e) => updateField("location", e.target.value)}
                className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                placeholder="e.g., Cairo, Dokki - 15 El Tahrir St"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                value={localMetadata.phone ?? ""}
                onChange={(e) => updateField("phone", e.target.value)}
                className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                placeholder="e.g., +20 123 456 7890"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Profile
            </>
          )}
        </button>
      </div>
    );
  }

  // Factory-specific fields
  if (shopType === "factory") {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Factory Details</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Company Bio
              </label>
              <textarea
                value={localMetadata.bio ?? ""}
                onChange={(e) => updateField("bio", e.target.value)}
                rows={4}
                className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                placeholder="Describe your factory, history, and capabilities..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Production Capacity
              </label>
              <input
                type="text"
                value={localMetadata.production_capacity ?? ""}
                onChange={(e) =>
                  updateField("production_capacity", e.target.value)
                }
                className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                placeholder="e.g., 10,000 units/month"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Certifications
              </label>
              <TagInput
                tags={localMetadata.factory_certifications ?? []}
                onAdd={(tag) => {
                  const tags = localMetadata.factory_certifications ?? [];
                  updateField("factory_certifications", [...tags, tag]);
                }}
                onRemove={(index) => removeTag("factory_certifications", index)}
                placeholder="e.g., ISO 9001, CE, FDA..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Working Hours
              </label>
              <input
                type="text"
                value={localMetadata.working_hours ?? ""}
                onChange={(e) => updateField("working_hours", e.target.value)}
                className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                placeholder="e.g., Sun-Thu 8AM-6PM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Factory Location
              </label>
              <input
                type="text"
                value={localMetadata.location ?? ""}
                onChange={(e) => updateField("location", e.target.value)}
                className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                placeholder="e.g., 10th of Ramadan City, Industrial Zone"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                value={localMetadata.phone ?? ""}
                onChange={(e) => updateField("phone", e.target.value)}
                className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                placeholder="e.g., +20 123 456 7890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Website URL
              </label>
              <input
                type="url"
                value={localMetadata.website ?? ""}
                onChange={(e) => updateField("website", e.target.value)}
                className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                placeholder="https://yourfactory.com"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Details
            </>
          )}
        </button>
      </div>
    );
  }

  // Middleman-specific fields
  if (shopType === "middleman") {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Middleman Curation Details
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Bio</label>
              <textarea
                value={localMetadata.bio ?? ""}
                onChange={(e) => updateField("bio", e.target.value)}
                rows={4}
                className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                placeholder="Describe your curation philosophy and expertise..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Curation Tags
              </label>
              <TagInput
                tags={localMetadata.curation_tags ?? []}
                onAdd={(tag) => {
                  const tags = localMetadata.curation_tags ?? [];
                  updateField("curation_tags", [...tags, tag]);
                }}
                onRemove={(index) => removeTag("curation_tags", index)}
                placeholder="e.g., Premium, Handpicked, Electronics..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Number of Partners
              </label>
              <input
                type="number"
                value={localMetadata.partner_count ?? ""}
                onChange={(e) =>
                  updateField(
                    "partner_count",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                placeholder="e.g., 25"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Working Hours
              </label>
              <input
                type="text"
                value={localMetadata.working_hours ?? ""}
                onChange={(e) => updateField("working_hours", e.target.value)}
                className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                placeholder="e.g., Mon-Sat 10AM-8PM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={localMetadata.location ?? ""}
                onChange={(e) => updateField("location", e.target.value)}
                className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                placeholder="e.g., Alexandria, Egypt"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                value={localMetadata.phone ?? ""}
                onChange={(e) => updateField("phone", e.target.value)}
                className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                placeholder="e.g., +20 123 456 7890"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Details
            </>
          )}
        </button>
      </div>
    );
  }

  // Seller (default) fields
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Store Details</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Bio</label>
            <textarea
              value={localMetadata.bio ?? ""}
              onChange={(e) => updateField("bio", e.target.value)}
              rows={4}
              className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              placeholder="Tell customers about your store..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Working Hours
            </label>
            <input
              type="text"
              value={localMetadata.working_hours ?? ""}
              onChange={(e) => updateField("working_hours", e.target.value)}
              className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              placeholder="e.g., Mon-Sat 9AM-9PM"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Location
            </label>
            <input
              type="text"
              value={localMetadata.location ?? ""}
              onChange={(e) => updateField("location", e.target.value)}
              className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              placeholder="e.g., Cairo, Egypt"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Contact Phone
            </label>
            <input
              type="text"
              value={localMetadata.phone ?? ""}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              placeholder="e.g., +20 123 456 7890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Website URL
            </label>
            <input
              type="url"
              value={localMetadata.website ?? ""}
              onChange={(e) => updateField("website", e.target.value)}
              className="w-full p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              placeholder="https://yourstore.com"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            Saving...
          </>
        ) : (
          <>
            <Save size={18} />
            Save Details
          </>
        )}
      </button>
    </div>
  );
}

// Reusable tag input component
function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      onAdd(input.trim());
      setInput("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium"
          >
            {tag}
            <button
              onClick={() => onRemove(index)}
              className="hover:text-red-500 transition"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
          placeholder={placeholder ?? "Type and press Enter to add..."}
        />
        <button
          type="button"
          onClick={() => {
            if (input.trim()) {
              onAdd(input.trim());
              setInput("");
            }
          }}
          className="px-3 py-2.5 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
