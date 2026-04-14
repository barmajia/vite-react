import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, Sparkles, ArrowRight, Store, Palette, Layout, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnail_url?: string;
  category: string;
  is_premium: boolean;
  price: number;
  config: Record<string, unknown>;
}

export function TemplateSelection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<"templates" | "details">("templates");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("middleman_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Template[];
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleStoreNameChange = (name: string) => {
    setStoreName(name);
    setStoreSlug(generateSlug(name));
  };

  const handleContinue = () => {
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }
    setStep("details");
  };

  const handleCreateStore = async () => {
    if (!user || !selectedTemplate || !storeName || !storeSlug) {
      toast.error("Please fill all fields");
      return;
    }

    setIsCreating(true);
    try {
      const { data: storeData, error: storeError } = await supabase
        .from("middleman_stores")
        .insert({
          middle_man_id: user.id,
          store_name: storeName,
          store_slug: storeSlug,
          primary_color: selectedTemplate.config?.accent_color || "#000000",
        })
        .select()
        .single();

      if (storeError) throw storeError;

      await supabase.from("middleman_store_setup").insert({
        user_id: user.id,
        current_step: 1,
        total_steps: 5,
        template_id: selectedTemplate.id,
        store_name: storeName,
        store_slug: storeSlug,
        completed_steps: [1],
      });

      toast.success("Store created! Setting up your template...");
      navigate(`/middleman/store-setup?template=${selectedTemplate.slug}&store=${storeSlug}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create store";
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const categoryColors: Record<string, string> = {
    retail: "bg-slate-100 text-slate-700",
    luxury: "bg-amber-100 text-amber-700",
    fashion: "bg-pink-100 text-pink-700",
    electronics: "bg-blue-100 text-blue-700",
    general: "bg-violet-100 text-violet-700",
    b2b: "bg-purple-100 text-purple-700",
  };

  if (step === "details") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-950 to-orange-950 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 mb-4">
              <Store className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Name Your Store</h1>
            <p className="text-white/60 mt-2">
              Choose a name for your e-commerce store
            </p>
          </div>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label className="text-white/80">Store Name</Label>
                <Input
                  value={storeName}
                  onChange={(e) => handleStoreNameChange(e.target.value)}
                  placeholder="My Awesome Store"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 mt-1"
                />
              </div>
              <div>
                <Label className="text-white/80">Store URL</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white/60">aurora.com/</span>
                  <Input
                    value={storeSlug}
                    onChange={(e) => setStoreSlug(generateSlug(e.target.value))}
                    placeholder="store-slug"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  {selectedTemplate && (
                    <>
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <Palette className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {selectedTemplate.name} Template
                        </p>
                        <p className="text-white/60 text-sm">
                          {selectedTemplate.description}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("templates")}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateStore}
                  disabled={isCreating || !storeName || !storeSlug}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Continue to Setup
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-950 to-orange-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            <span>Choose Your Design</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Select a Template
          </h1>
          <p className="text-white/60 mt-3 max-w-2xl mx-auto">
            Pick a template that fits your brand. You can customize colors, fonts, and content
            after setup.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates?.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all duration-300 ${
                  selectedTemplate?.id === template.id
                    ? "ring-2 ring-amber-500 bg-amber-500/10"
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="aspect-video rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 mb-4 flex items-center justify-center overflow-hidden">
                    <div
                      className="w-full h-full flex flex-col"
                      style={{
                        background:
                          template.config?.layout === "grid"
                            ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
                            : template.config?.layout === "carousel"
                            ? "linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)"
                            : template.config?.category === "luxury"
                            ? "linear-gradient(135deg, #292524 0%, #1c1917 100%)"
                            : "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                      }}
                    >
                      <div className="h-8 w-full flex items-center justify-center border-b border-white/10">
                        <div className="w-20 h-2 rounded bg-white/20" />
                      </div>
                      <div className="flex-1 p-2 grid grid-cols-2 gap-2">
                        <div className="rounded bg-white/10" />
                        <div className="rounded bg-white/10" />
                        <div className="rounded bg-white/10" />
                        <div className="rounded bg-white/10" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white">
                          {template.name}
                        </h3>
                        {template.is_premium && (
                          <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                            PRO
                          </Badge>
                        )}
                      </div>
                      <p className="text-white/60 text-sm mb-2">
                        {template.description}
                      </p>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          categoryColors[template.category] || "bg-slate-100"
                        }`}
                      >
                        {template.category}
                      </span>
                    </div>
                    {selectedTemplate?.id === template.id && (
                      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-10">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selectedTemplate}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-lg px-10"
          >
            Continue
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}