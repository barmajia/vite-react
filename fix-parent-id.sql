-- Check if parent_id column exists and add it if missing
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'categories' AND column_name = 'parent_id';

-- Add parent_id column if it doesn't exist
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id uuid;

-- Add foreign key constraint
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_parent_id_fkey;
ALTER TABLE public.categories ADD CONSTRAINT categories_parent_id_fkey 
  FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'categories' 
ORDER BY ordinal_position;
