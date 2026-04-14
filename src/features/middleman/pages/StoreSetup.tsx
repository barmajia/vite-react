import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Check, ChevronRight, Upload, Layout, Palette, Type, Eye, Save, ArrowRight, Store } from "lucide-react";
import { toast } from "sonner";

interface StoreData {
  id: string;
  store_name: string;
  store_slug: string;
  store_description: string;
  store_logo_url: string;
  store_banner_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  custom_css: string;
  custom_html: string;
  is_published: boolean;
}

interface TemplateConfig {
  layout?: string;
  cards?: string;
  header?: string;
  accent_color?: string;
  btn_style?: string;
  show_rating?: boolean;
  show_reviews?: boolean;
  banner?: boolean;
}

const defaultColors = {
  primary: "#0f172a",
  secondary: "#ffffff",
  accent: "#f59e0b",
};

export function StoreSetup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const storeSlug = searchParams.get("store");
  const templateSlug = searchParams.get("template");
  
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [store, setStore] = useState<StoreData>({
    id: "",
    store_name: "",
    store_slug: storeSlug || "",
    store_description: "",
    store_logo_url: "",
    store_banner_url: "",
    primary_color: defaultColors.primary,
    secondary_color: defaultColors.secondary,
    accent_color: defaultColors.accent,
    font_family: "inherit",
    custom_css: "",
    custom_html: "",
    is_published: false,
  });

  const steps = [
    { num: 1, title: "Branding", icon: Palette },
    { num: 2, title: "Logo & Banner", icon: Upload },
    { num: 3, title: "Colors", icon: Palette },
    { num: 4, title: "Content", icon: Type },
    { num: 5, title: "Preview", icon: Eye },
  ];

  const { data: templateConfig } = useQuery({
    queryKey: ["template-config", templateSlug],
    queryFn: async () => {
      const { data } = await supabase
        .from("middleman_templates")
        .select("config")
        .eq("slug", templateSlug)
        .single();
      return data?.config as TemplateConfig | null;
    },
    enabled: !!templateSlug,
  });

  const { data: storeData, isLoading } = useQuery({
    queryKey: ["store-setup", storeSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("middleman_stores")
        .select("*")
        .eq("store_slug", storeSlug)
        .eq("middle_man_id", user?.id)
        .single();
      if (error) throw error;
      return data as StoreData;
    },
    enabled: !!storeSlug && !!user,
  });

  useEffect(() => {
    if (storeData) {
      setStore((prev) => ({
        ...prev,
        ...storeData,
        primary_color: storeData.primary_color || defaultColors.primary,
        secondary_color: storeData.secondary_color || defaultColors.secondary,
        accent_color: storeData.accent_color || defaultColors.accent,
      }));
    }
  }, [storeData]);

  useEffect(() => {
    if (templateConfig?.accent_color) {
      setStore((prev) => ({
        ...prev,
        accent_color: templateConfig.accent_color,
      }));
    }
  }, [templateConfig]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("middleman_stores")
        .update({
          store_name: store.store_name,
          store_description: store.store_description,
          store_logo_url: store.store_logo_url,
          store_banner_url: store.store_banner_url,
          primary_color: store.primary_color,
          secondary_color: store.secondary_color,
          accent_color: store.accent_color,
          font_family: store.font_family,
          custom_html: store.custom_html,
          updated_at: new Date().toISOString(),
        })
        .eq("id", store.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-setup", storeSlug] });
    },
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveMutation.mutateAsync();
      toast.success("Settings saved!");
    } catch (err) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      await saveMutation.mutateAsync();
      await supabase
        .from("middleman_stores")
        .update({ is_published: true })
        .eq("id", store.id);
      toast.success("Store published!");
      navigate(`/middleman/${store.store_slug}`);
    } catch (err) {
      toast.error("Failed to publish");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "logo" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${field}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("stores")
      .upload(`${user?.id}/${fileName}`, file);

    if (uploadError) {
      toast.error("Upload failed");
      return;
    }

    const { data } = supabase.storage
      .from("stores")
      .getPublicUrl(`${user?.id}/${fileName}`);

    if (field === "logo") {
      setStore((prev) => ({ ...prev, store_logo_url: data.publicUrl }));
    } else {
      setStore((prev) => ({ ...prev, store_banner_url: data.publicUrl }));
    }
    toast.success(`${field} uploaded!`);
  };

  const colorInputStyle = (color: string) => ({
    backgroundColor: color,
    border: "2px solid rgba(255,255,255,0.2)",
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-white/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                <Store className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold">Store Setup</h1>
                <p className="text-sm text-muted-foreground">
                  {store.store_name || storeSlug}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? "Edit" : "Preview"}
              </Button>
              {step === 5 ? (
                <Button onClick={handlePublish} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Publish Store
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  step >= s.num
                    ? "bg-amber-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.num ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <s.icon className="h-4 w-4" />
                )}
                <span className="text-sm font-medium hidden sm:inline">
                  {s.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
              )}
            </div>
          ))}
        </div>

        {!previewMode ? (
          <div className="max-w-3xl mx-auto">
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Branding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Store Name</Label>
                    <Input
                      value={store.store_name}
                      onChange={(e) =>
                        setStore((prev) => ({ ...prev, store_name: e.target.value }))
                      }
                      placeholder="My Awesome Store"
                    />
                  </div>
                  <div>
                    <Label>Store Slug</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">aurora.com/</span>
                      <Input
                        value={store.store_slug}
                        onChange={(e) =>
                          setStore((prev) => ({
                            ...prev,
                            store_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                          }))
                        }
                        placeholder="store-slug"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={store.store_description}
                      onChange={(e) =>
                        setStore((prev) => ({
                          ...prev,
                          store_description: e.target.value,
                        }))
                      }
                      placeholder="Tell customers about your store..."
                      rows={4}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      handleSave();
                      setStep(2);
                    }}
                    className="w-full"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Logo & Banner</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Store Logo</Label>
                    <div className="mt-2 flex items-center gap-4">
                      {store.store_logo_url ? (
                        <img
                          src={store.store_logo_url}
                          alt="Logo"
                          className="w-20 h-20 object-contain rounded-lg bg-white p-2"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <Label className="cursor-pointer">
                          <div className="px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                            Upload Logo
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, "logo")}
                          />
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG up to 2MB
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Banner Image</Label>
                    <div className="mt-2">
                      {store.store_banner_url ? (
                        <img
                          src={store.store_banner_url}
                          alt="Banner"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-32 rounded-lg bg-muted flex items-center justify-center">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <Label className="cursor-pointer mt-2 inline-block">
                        <div className="px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                          Upload Banner
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "banner")}
                        />
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: 1200x400px
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        handleSave();
                        setStep(3);
                      }}
                      className="flex-1"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Colors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Primary</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="color"
                          value={store.primary_color}
                          onChange={(e) =>
                            setStore((prev) => ({
                              ...prev,
                              primary_color: e.target.value,
                            }))
                          }
                          className="w-12 h-12 rounded-lg cursor-pointer"
                        />
                        <Input
                          value={store.primary_color}
                          onChange={(e) =>
                            setStore((prev) => ({
                              ...prev,
                              primary_color: e.target.value,
                            }))
                          }
                          className="font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Secondary</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="color"
                          value={store.secondary_color}
                          onChange={(e) =>
                            setStore((prev) => ({
                              ...prev,
                              secondary_color: e.target.value,
                            }))
                          }
                          className="w-12 h-12 rounded-lg cursor-pointer"
                        />
                        <Input
                          value={store.secondary_color}
                          onChange={(e) =>
                            setStore((prev) => ({
                              ...prev,
                              secondary_color: e.target.value,
                            }))
                          }
                          className="font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Accent</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="color"
                          value={store.accent_color}
                          onChange={(e) =>
                            setStore((prev) => ({
                              ...prev,
                              accent_color: e.target.value,
                            }))
                          }
                          className="w-12 h-12 rounded-lg cursor-pointer"
                        />
                        <Input
                          value={store.accent_color}
                          onChange={(e) =>
                            setStore((prev) => ({
                              ...prev,
                              accent_color: e.target.value,
                            }))
                          }
                          className="font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg" style={{ backgroundColor: store.primary_color }}>
                    <h3 className="font-bold" style={{ color: store.secondary_color }}>
                      Preview Heading
                    </h3>
                    <p style={{ color: store.secondary_color }}>
                      This is how your text will look
                    </p>
                    <button
                      className="mt-2 px-4 py-2 rounded-lg font-medium"
                      style={{
                        backgroundColor: store.accent_color,
                        color: store.primary_color,
                      }}
                    >
                      Button Text
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        handleSave();
                        setStep(4);
                      }}
                      className="flex-1"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Custom Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Custom HTML (Footer, etc)</Label>
                    <Textarea
                      value={store.custom_html}
                      onChange={(e) =>
                        setStore((prev) => ({
                          ...prev,
                          custom_html: e.target.value,
                        }))
                      }
                      placeholder="<p>Custom footer content</p>"
                      rows={4}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label>Custom CSS</Label>
                    <Textarea
                      value={store.custom_css}
                      onChange={(e) =>
                        setStore((prev) => ({
                          ...prev,
                          custom_css: e.target.value,
                        }))
                      }
                      placeholder=".custom-class { ... }"
                      rows={4}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(3)}>
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        handleSave();
                        setStep(5);
                      }}
                      className="flex-1"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview & Publish</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg border">
                    <div
                      className="rounded-lg overflow-hidden"
                      style={{ backgroundColor: store.secondary_color }}
                    >
                      {store.store_banner_url && (
                        <img
                          src={store.store_banner_url}
                          alt="Banner"
                          className="w-full h-40 object-cover"
                          style={{ backgroundColor: store.primary_color }}
                        />
                      )}
                      <div className="p-6" style={{ backgroundColor: store.primary_color }}>
                        <div className="flex items-center gap-4">
                          {store.store_logo_url ? (
                            <img
                              src={store.store_logo_url}
                              alt="Logo"
                              className="w-16 h-16 object-contain bg-white rounded-lg p-1"
                            />
                          ) : (
                            <div
                              className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold"
                              style={{ backgroundColor: store.accent_color, color: store.primary_color }}
                            >
                              {store.store_name?.charAt(0) || "S"}
                            </div>
                          )}
                          <div>
                            <h2
                              className="text-2xl font-bold"
                              style={{ color: store.secondary_color }}
                            >
                              {store.store_name || "My Store"}
                            </h2>
                            <p style={{ color: store.secondary_color, opacity: 0.8 }}>
                              {store.store_description || "Welcome to my store"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950">
                    <Badge className="bg-emerald-500">Ready</Badge>
                    <span className="text-emerald-700 dark:text-emerald-400">
                      Your store is ready to publish!
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(4)}>
                      Back
                    </Button>
                    <Button
                      onClick={handlePublish}
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Store className="h-4 w-4 mr-2" />
                          Publish Store
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: store.secondary_color }}>
              {store.store_banner_url && (
                <img
                  src={store.store_banner_url}
                  alt="Banner"
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-8" style={{ backgroundColor: store.primary_color }}>
                <div className="flex items-center gap-6">
                  {store.store_logo_url ? (
                    <img
                      src={store.store_logo_url}
                      alt="Logo"
                      className="w-24 h-24 object-contain bg-white rounded-xl p-2"
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-xl flex items-center justify-center text-4xl font-bold"
                      style={{ backgroundColor: store.accent_color, color: store.primary_color }}
                    >
                      {store.store_name?.charAt(0) || "S"}
                    </div>
                  )}
                  <div>
                    <h1
                      className="text-4xl font-bold"
                      style={{ color: store.secondary_color }}
                    >
                      {store.store_name || "My Store"}
                    </h1>
                    <p style={{ color: store.secondary_color, opacity: 0.8 }}>
                      {store.store_description || "Welcome to my store"}
                    </p>
                    <button
                      className="mt-4 px-6 py-3 rounded-xl font-semibold"
                      style={{
                        backgroundColor: store.accent_color,
                        color: store.primary_color,
                      }}
                    >
                      Shop Now
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-4">Featured Products</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-muted p-4"
                    >
                      <div className="aspect-square bg-muted-foreground/20 rounded-lg mb-2" />
                      <p className="font-medium">Product {i}</p>
                      <p className="text-muted-foreground">$99.99</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-6">
              <Button variant="outline" onClick={() => setPreviewMode(false)}>
                Back to Editor
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}