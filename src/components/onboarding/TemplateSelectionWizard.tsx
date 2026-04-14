/**
 * Template Selection Wizard
 * Allows sellers to choose a storefront template during onboarding
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTemplates, useTemplateSelection } from "@/hooks/useSeller";
import { Button } from "@/components/ui/Button";
import type { Template } from "@/services/storefront";

// ── Template Card Component ──────────────────────────────────────────

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: (templateId: number) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onSelect,
}) => {
  const [isPreviewing, setIsPreviewing] = useState(false);

  return (
    <div
      className={`
        relative rounded-xl border-2 overflow-hidden transition-all duration-300 cursor-pointer
        ${isSelected
          ? "border-blue-600 shadow-xl ring-4 ring-blue-100"
          : "border-gray-200 shadow-md hover:shadow-lg hover:border-gray-300"
        }
      `}
      onClick={() => onSelect(template.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect(template.id);
        }
      }}
    >
      {/* Selection Badge */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-blue-600 text-white rounded-full px-3 py-1 text-sm font-semibold flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Selected
          </div>
        </div>
      )}

      {/* Thumbnail */}
      <div className="aspect-video bg-gray-100 relative">
        {template.thumbnail_url ? (
          <img
            src={template.thumbnail_url}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 bg-white">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {template.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {template.description}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant={isSelected ? "primary" : "outline"}
            size="sm"
            fullWidth
            onClick={(e) => {
              e.stopPropagation();
              onSelect(template.id);
            }}
          >
            {isSelected ? "✓ Selected" : "Select Template"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsPreviewing(true);
            }}
          >
            Preview
          </Button>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">{template.name} Preview</h3>
              <button
                onClick={() => setIsPreviewing(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto" style={{ maxHeight: "calc(90vh - 80px)" }}>
              {template.preview_url ? (
                <iframe
                  src={template.preview_url}
                  className="w-full border-0 rounded"
                  style={{ height: "70vh" }}
                  title={`${template.name} preview`}
                />
              ) : (
                <div className="flex items-center justify-center h-96 text-gray-500">
                  <div className="text-center">
                    <svg
                      className="w-16 h-16 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-lg font-semibold">Preview not available</p>
                    <p className="text-sm mt-2">
                      Select this template to see it in action
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Template Selection Wizard ────────────────────────────────────────

export const TemplateSelectionWizard: React.FC = () => {
  const navigate = useNavigate();
  const { templates, loading: templatesLoading } = useTemplates();
  const { selectTemplate, isSubmitting, error } = useTemplateSelection();
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  const handleSelectTemplate = async (templateId: number) => {
    setSelectedTemplate(templateId);
  };

  const handleConfirmSelection = async () => {
    if (!selectedTemplate) return;

    try {
      await selectTemplate(selectedTemplate);

      // Redirect to dashboard after successful selection
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Failed to select template:", err);
    }
  };

  if (templatesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Storefront Template
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select a template to instantly generate your online store. You can
            customize it later from your dashboard.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-red-800">
                  Error selecting template
                </h3>
                <p className="text-sm text-red-700 mt-1">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplate === template.id}
              onSelect={handleSelectTemplate}
            />
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/")}
            disabled={isSubmitting}
          >
            Skip for Now
          </Button>
          <Button
            variant="primary"
            size="xl"
            onClick={handleConfirmSelection}
            disabled={!selectedTemplate || isSubmitting}
            isLoading={isSubmitting}
            leftIcon={
              selectedTemplate ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : undefined
            }
          >
            {selectedTemplate ? "Create My Store" : "Select a Template"}
          </Button>
        </div>

        {/* Info Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Instant Setup</h3>
            <p className="text-gray-600 text-sm">
              Your store goes live immediately after selecting a template. No
              coding required.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Fully Customizable</h3>
            <p className="text-gray-600 text-sm">
              Change colors, fonts, layout, and content from your dashboard
              anytime.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Secure & Scalable</h3>
            <p className="text-gray-600 text-sm">
              Built with enterprise-grade security and designed to grow with
              your business.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelectionWizard;
