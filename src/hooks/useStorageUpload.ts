import { supabase } from '@/lib/supabase';

export const useStorageUpload = () => {
  const upload = async (file: File, userId: string, path: string): Promise<string> => {
    const fileName = `${userId}/${path}/${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('website_assets')
      .upload(fileName, file, { upsert: true });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('website_assets')
      .getPublicUrl(data.path);
    
    return publicUrl;
  };

  return { upload };
};