import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { templates, categories, layouts, Template } from './templates/templateData';
import { motion } from 'framer-motion';

const WebMarketplace: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLayout = !selectedLayout || template.layout === selectedLayout;
    return matchesCategory && matchesSearch && matchesLayout;
  });

  const handleSelectTemplate = (template: Template) => {
    // Store selected template in localStorage or context for the next step
    localStorage.setItem('selectedTemplate', JSON.stringify(template));
    navigate('/middleman/editor', { state: { template } });
  };

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">E-Commerce Marketplace</h1>
              <p className="mt-2 text-gray-600">Choose the perfect template for your online store</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {filteredTemplates.length} templates available
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Category Filters */}
            <div className="flex items-center space-x-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Layout Filters */}
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-sm text-gray-600 font-medium">Layout:</span>
            <button
              onClick={() => setSelectedLayout(null)}
              className={`px-3 py-1 rounded-md text-sm ${
                !selectedLayout ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {layouts.map((layout) => (
              <button
                key={layout.id}
                onClick={() => setSelectedLayout(layout.id)}
                className={`px-3 py-1 rounded-md text-sm ${
                  selectedLayout === layout.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {layout.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No templates found</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                {/* Preview Image Placeholder */}
                <div 
                  className="h-48 bg-gradient-to-br relative cursor-pointer"
                  style={{ 
                    background: `linear-gradient(135deg, ${template.colorScheme.primary}, ${template.colorScheme.secondary})`
                  }}
                  onClick={() => handlePreview(template)}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-6xl opacity-30">🛍️</span>
                  </div>
                  {template.isPremium && (
                    <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      PREMIUM
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700">
                    {template.layout.charAt(0).toUpperCase() + template.layout.slice(1)} Layout
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      template.price === 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {template.price === 0 ? 'FREE' : `$${template.price}`}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Features */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Features</h4>
                    <ul className="space-y-1">
                      {template.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                          <svg className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                      {template.features.length > 3 && (
                        <li className="text-sm text-blue-600 font-medium">
                          +{template.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Color Scheme Preview */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Color Scheme</h4>
                    <div className="flex space-x-2">
                      {Object.entries(template.colorScheme).map(([name, color]) => (
                        <div
                          key={name}
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: color }}
                          title={name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handlePreview(template)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleSelectTemplate(template)}
                      className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      Select Template
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {previewTemplate && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewTemplate(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">{previewTemplate.name}</h2>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Full Preview Area */}
              <div 
                className="h-96 rounded-xl mb-6 flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${previewTemplate.colorScheme.primary}, ${previewTemplate.colorScheme.secondary})`
                }}
              >
                <div className="text-center text-white">
                  <span className="text-8xl opacity-30">🌐</span>
                  <p className="mt-4 text-xl font-medium">Full Template Preview</p>
                  <p className="text-sm opacity-80">Interactive preview would be implemented here</p>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-600">{previewTemplate.description}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Typography</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Heading:</span>
                      <p className="font-medium" style={{ fontFamily: previewTemplate.typography.heading }}>
                        {previewTemplate.typography.heading}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Body:</span>
                      <p className="font-medium" style={{ fontFamily: previewTemplate.typography.body }}>
                        {previewTemplate.typography.body}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">All Features</h3>
                  <ul className="space-y-2">
                    {previewTemplate.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-gray-600">
                        <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Color Palette</h3>
                  <div className="space-y-3">
                    {Object.entries(previewTemplate.colorScheme).map(([name, color]) => (
                      <div key={name} className="flex items-center space-x-3">
                        <div
                          className="w-12 h-12 rounded-lg shadow-sm border"
                          style={{ backgroundColor: color }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">{name}</p>
                          <p className="text-xs text-gray-500 font-mono">{color}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-4">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleSelectTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="px-6 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700"
              >
                Select This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebMarketplace;
