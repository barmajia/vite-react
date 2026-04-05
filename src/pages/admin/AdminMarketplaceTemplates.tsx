import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button, Card } from "@/components/ui";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AddEditTemplateModal } from "@/components/marketplace/AddEditTemplateModal";

interface Template {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  target_role: string | null;
  price: number;
  thumbnail_url: string | null;
  preview_url: string | null;
  is_published: boolean;
  download_count?: number | null;
  total_sales?: number | null;
  rating?: number | null;
  created_at: string;
  [key: string]: any;
}

export function AdminMarketplaceTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("website_marketplace")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      console.error("Error loading templates:", err);
      toast.error("Failed to load templates", {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const { error } = await supabase
        .from("website_marketplace")
        .delete()
        .eq("id", templateId);

      if (error) throw error;

      toast.success("Template deleted");
      loadTemplates();
    } catch (err: any) {
      toast.error("Failed to delete template", {
        description: err.message,
      });
    }
  };

  const handleTogglePublish = async (
    templateId: string,
    currentStatus: boolean,
  ) => {
    try {
      const { error } = await supabase
        .from("website_marketplace")
        .update({ is_published: !currentStatus })
        .eq("id", templateId);

      if (error) throw error;

      toast.success(
        `Template ${!currentStatus ? "published" : "unpublished"}`,
      );
      loadTemplates();
    } catch (err: any) {
      toast.error("Failed to update template", {
        description: err.message,
      });
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingTemplate(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingTemplate(null);
    loadTemplates();
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.target_role?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Marketplace Templates</h1>
          <p className="text-gray-600 mt-1">
            Manage website templates available in the marketplace
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates by title, category, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </Card>

      {/* Templates Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Downloads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No templates found</p>
                    <Button onClick={handleAddNew} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Template
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {template.thumbnail_url ? (
                          <img
                            src={template.thumbnail_url}
                            alt={template.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{template.title}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {template.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {template.category || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-medium ${
                          template.price === 0
                            ? "text-green-600"
                            : "text-blue-600"
                        }`}
                      >
                        {template.price === 0
                          ? "Free"
                          : `$${template.price.toFixed(2)}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {template.download_count || template.total_sales || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          template.is_published
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {template.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleTogglePublish(
                              template.id,
                              template.is_published,
                            )
                          }
                          title={
                            template.is_published
                              ? "Unpublish"
                              : "Publish"
                          }
                        >
                          {template.is_published ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDelete(template.id, template.title)
                          }
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <AddEditTemplateModal
          template={editingTemplate}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
