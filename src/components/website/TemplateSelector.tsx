import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';

interface Template {
  id: string;
  name: string;
  thumbnail: string;
  description: string;
}

interface TemplateSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

export function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('webtemplates')
          .list();
        
        if (error) {
          setTemplates([
            { id: 'minimal', name: 'Minimal', thumbnail: '', description: 'Clean, minimalist design' },
            { id: 'grid', name: 'Product Grid', thumbnail: '', description: 'Grid-based layout for catalogs' },
            { id: 'showcase', name: 'Showcase', thumbnail: '', description: 'Large hero images' },
          ]);
        } else {
          setTemplates(data?.map(t => ({
            id: t.name,
            name: t.name,
            thumbnail: '',
            description: 'Template',
          })) || []);
        }
      } catch (err) {
        setTemplates([
          { id: 'minimal', name: 'Minimal', thumbnail: '', description: 'Clean, minimalist design' },
          { id: 'grid', name: 'Product Grid', thumbnail: '', description: 'Grid-based layout for catalogs' },
          { id: 'showcase', name: 'Showcase', thumbnail: '', description: 'Large hero images' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  if (loading) {
    return <div className="p-4">Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select Template</h3>
      <div className="grid grid-cols-2 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`p-4 cursor-pointer transition-all ${
              selected === template.id
                ? 'ring-2 ring-primary border-primary'
                : 'hover:border-gray-300'
            }`}
            onClick={() => onSelect(template.id)}
          >
            <div className="aspect-video bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
              {template.thumbnail ? (
                <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover rounded" />
              ) : (
                <span className="text-4xl">📄</span>
              )}
            </div>
            <h4 className="font-medium">{template.name}</h4>
            <p className="text-sm text-gray-500">{template.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}