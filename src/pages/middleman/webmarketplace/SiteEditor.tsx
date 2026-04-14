import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Template } from './templates/templateData';
import { supabase } from '@/lib/supabase';

interface SiteConfig {
  siteName: string;
  tagline: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    heading: string;
    body: string;
  };
  logo: string | null;
  currency: string;
  language: string;
}

const SiteEditor: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'branding' | 'colors' | 'typography' | 'pages'>('branding');
  const [isSaving, setIsSaving] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  
  const [config, setConfig] = useState<SiteConfig>({
    siteName: '',
    tagline: '',
    colors: {
      primary: '#000000',
      secondary: '#FFFFFF',
      accent: '#0066CC',
      background: '#FFFFFF',
      text: '#333333'
    },
    typography: {
      heading: 'Inter',
      body: 'Inter'
    },
    logo: null,
    currency: 'USD',
    language: 'en'
  });

  useEffect(() => {
    // Get template from navigation state or localStorage
    const stateTemplate = location.state?.template;
    const storedTemplate = localStorage.getItem('selectedTemplate');
    
    if (stateTemplate) {
      setTemplate(stateTemplate);
      initializeConfig(stateTemplate);
    } else if (storedTemplate) {
      const parsed = JSON.parse(storedTemplate);
      setTemplate(parsed);
      initializeConfig(parsed);
    } else {
      // Redirect to marketplace if no template selected
      navigate('/middleman/webmarketplace');
    }
  }, [location.state, navigate]);

  const initializeConfig = (tmpl: Template) => {
    setConfig({
      siteName: `${tmpl.name} Store`,
      tagline: `Welcome to our ${tmpl.category} store`,
      colors: { ...tmpl.colorScheme },
      typography: { ...tmpl.typography },
      logo: null,
      currency: 'USD',
      language: 'en'
    });
  };

  const handleColorChange = (key: keyof typeof config.colors, value: string) => {
    setConfig(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value }
    }));
  };

  const handleTypographyChange = (key: keyof typeof config.typography, value: string) => {
    setConfig(prev => ({
      ...prev,
      typography: { ...prev.typography, [key]: value }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Save to database via Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First, check if profile exists
      const { data: existingProfile } = await supabase
        .from('middleman_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      let siteData;
      
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('middleman_profiles')
          .update({
            site_status: 'active',
            site_url: `https://${config.siteName.toLowerCase().replace(/\s+/g, '-')}.middleman.com`,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // Insert new profile
        const { error: insertError } = await supabase
          .from('middleman_profiles')
          .insert({
            user_id: user.id,
            site_status: 'active',
            site_url: `https://${config.siteName.toLowerCase().replace(/\s+/g, '-')}.middleman.com`,
            company_name: config.siteName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      // Store configuration in localStorage for quick access
      siteData = {
        templateId: template?.id,
        config,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('middlemanSiteConfig', JSON.stringify(siteData));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to dashboard
      navigate('/middleman/dashboard', { 
        state: { 
          siteCreated: true,
          message: 'Your store has been created successfully!' 
        } 
      });
    } catch (error) {
      console.error('Error saving site configuration:', error);
      alert('Failed to save site configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customize Your Store</h1>
              <p className="text-sm text-gray-500">Template: {template.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/middleman/webmarketplace')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Back to Marketplace
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Launch Store
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden sticky top-24">
              <div className="border-b px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
              </div>
              
              {/* Mock Website Preview */}
              <div className="p-6">
                {/* Browser Chrome */}
                <div className="flex items-center space-x-2 mb-4 pb-4 border-b">
                  <div className="flex space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-md px-4 py-1.5 text-sm text-gray-500">
                    your-store.middleman.com
                  </div>
                </div>

                {/* Website Header */}
                <div 
                  className="rounded-lg p-6 mb-4"
                  style={{ 
                    backgroundColor: config.colors.primary,
                    color: config.colors.secondary
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 
                        className="text-2xl font-bold"
                        style={{ fontFamily: config.typography.heading }}
                      >
                        {config.siteName || 'Your Store Name'}
                      </h3>
                      <p className="text-sm opacity-90">{config.tagline}</p>
                    </div>
                    <div className="text-4xl">🛍️</div>
                  </div>
                </div>

                {/* Sample Content */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <div 
                          className="h-24 rounded mb-3"
                          style={{ backgroundColor: config.colors.accent + '40' }}
                        ></div>
                        <div 
                          className="h-4 rounded mb-2"
                          style={{ backgroundColor: config.colors.text + '20' }}
                        ></div>
                        <div 
                          className="h-3 rounded w-2/3"
                          style={{ backgroundColor: config.colors.text + '10' }}
                        ></div>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <div className="text-center pt-4">
                    <button
                      className="px-8 py-3 rounded-lg font-medium transition-transform hover:scale-105"
                      style={{
                        backgroundColor: config.colors.accent,
                        color: config.colors.background
                      }}
                    >
                      Shop Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Editor Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md overflow-hidden sticky top-24">
              {/* Tabs */}
              <div className="border-b">
                <div className="flex">
                  {[
                    { id: 'branding', label: 'Branding', icon: '🏷️' },
                    { id: 'colors', label: 'Colors', icon: '🎨' },
                    { id: 'typography', label: 'Typography', icon: '📝' },
                    { id: 'pages', label: 'Pages', icon: '📄' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 px-3 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <span className="mr-1">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                {/* Branding Tab */}
                {activeTab === 'branding' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Store Name
                      </label>
                      <input
                        type="text"
                        value={config.siteName}
                        onChange={(e) => setConfig(prev => ({ ...prev, siteName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your store name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tagline
                      </label>
                      <input
                        type="text"
                        value={config.tagline}
                        onChange={(e) => setConfig(prev => ({ ...prev, tagline: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter a catchy tagline"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                      </label>
                      <select
                        value={config.currency}
                        onChange={(e) => setConfig(prev => ({ ...prev, currency: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="AUD">AUD ($)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Language
                      </label>
                      <select
                        value={config.language}
                        onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Colors Tab */}
                {activeTab === 'colors' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Customize your store's color scheme to match your brand identity.
                    </p>
                    
                    {Object.entries(config.colors).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                          {key} Color
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => handleColorChange(key as keyof typeof config.colors, e.target.value)}
                            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleColorChange(key as keyof typeof config.colors, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 border-t">
                      <button
                        onClick={() => {
                          if (template) {
                            setConfig(prev => ({
                              ...prev,
                              colors: { ...template.colorScheme }
                            }));
                          }
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Reset to Template Defaults
                      </button>
                    </div>
                  </div>
                )}

                {/* Typography Tab */}
                {activeTab === 'typography' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Choose fonts that reflect your brand personality.
                    </p>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Heading Font
                      </label>
                      <select
                        value={config.typography.heading}
                        onChange={(e) => handleTypographyChange('heading', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        style={{ fontFamily: config.typography.heading }}
                      >
                        <option value="Inter">Inter</option>
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Merriweather">Merriweather</option>
                        <option value="Bebas Neue">Bebas Neue</option>
                        <option value="Cormorant Garamond">Cormorant Garamond</option>
                        <option value="Amatic SC">Amatic SC</option>
                        <option value="Anton">Anton</option>
                        <option value="Quicksand">Quicksand</option>
                        <option value="Didot">Didot</option>
                        <option value="Fredoka One">Fredoka One</option>
                      </select>
                      <p 
                        className="mt-2 text-lg font-medium"
                        style={{ fontFamily: config.typography.heading }}
                      >
                        The quick brown fox jumps over the lazy dog
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Body Font
                      </label>
                      <select
                        value={config.typography.body}
                        onChange={(e) => handleTypographyChange('body', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        style={{ fontFamily: config.typography.body }}
                      >
                        <option value="Inter">Inter</option>
                        <option value="Lato">Lato</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Source Sans Pro">Source Sans Pro</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Nunito">Nunito</option>
                        <option value="Raleway">Raleway</option>
                        <option value="Roboto Condensed">Roboto Condensed</option>
                        <option value="Karla">Karla</option>
                        <option value="Futura">Futura</option>
                        <option value="Varela Round">Varela Round</option>
                      </select>
                      <p 
                        className="mt-2 text-base"
                        style={{ fontFamily: config.typography.body }}
                      >
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                      </p>
                    </div>

                    <div className="pt-4 border-t">
                      <button
                        onClick={() => {
                          if (template) {
                            setConfig(prev => ({
                              ...prev,
                              typography: { ...template.typography }
                            }));
                          }
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Reset to Template Defaults
                      </button>
                    </div>
                  </div>
                )}

                {/* Pages Tab */}
                {activeTab === 'pages' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-4">
                      Configure which pages to include in your store.
                    </p>
                    
                    {[
                      { name: 'Home', enabled: true, locked: true },
                      { name: 'Products', enabled: true, locked: true },
                      { name: 'About Us', enabled: true, locked: false },
                      { name: 'Contact', enabled: true, locked: false },
                      { name: 'Blog', enabled: false, locked: false },
                      { name: 'FAQ', enabled: false, locked: false },
                      { name: 'Reviews', enabled: true, locked: false },
                      { name: 'Shipping Info', enabled: false, locked: false }
                    ].map((page) => (
                      <div 
                        key={page.name}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={page.enabled}
                            disabled={page.locked}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">{page.name}</span>
                        </div>
                        {page.locked && (
                          <span className="text-xs text-gray-400">Required</span>
                        )}
                      </div>
                    ))}

                    <div className="pt-4 border-t">
                      <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
                        + Add Custom Page
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteEditor;
