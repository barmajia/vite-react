# Product Images - Debug & Fix Guide

## 🖼️ How Images Are Handled

### Database Storage (`products.images` - JSONB)

Images can be stored in **two formats**:

**Format 1: String Array (Simple)**
```json
[
  "https://example.com/image1.jpg",
  "https://example.com/image2.jpg"
]
```

**Format 2: Object Array (Detailed)**
```json
[
  {"url": "https://example.com/image1.jpg", "alt": "Front view"},
  {"url": "https://example.com/image2.jpg", "alt": "Side view"}
]
```

---

## 🔧 Image Normalization

The component now **automatically normalizes** both formats:

```typescript
const normalizeImages = (raw: any) => {
  if (!raw) return [];
  if (!Array.isArray(raw)) return [];
  
  return raw.map((img: any) => {
    if (typeof img === "string") {
      // Convert storage path to public URL
      const url = img.startsWith("http") 
        ? img 
        : supabase.storage.from("product-images").getPublicUrl(img).data?.publicUrl || img;
      return { url, alt: "Product image" };
    }
    if (img?.url) {
      const url = img.url.startsWith("http")
        ? img.url
        : supabase.storage.from("product-images").getPublicUrl(img.url).data?.publicUrl || img.url;
      return { ...img, url };
    }
    return { url: "", alt: "" };
  }).filter((img: any) => img.url);
};
```

**Output:** Always `[{url: string, alt: string}[]`

---

## 🐛 Common Image Issues & Fixes

### Issue 1: Broken Image Icons

**Symptoms:** Gray/white placeholder icons instead of images

**Causes:**
1. Image URL is invalid/broken
2. Supabase Storage bucket is private
3. CORS issues

**Debug:**
```javascript
// Check console for errors
// Should see: "❌ Failed to load image: https://..."
```

**Fix:**
```sql
-- Make storage bucket public (run in Supabase SQL Editor)
CREATE POLICY "Allow public read access to product images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');
```

---

### Issue 2: Images Not Displaying at All

**Symptoms:** No image previews, empty space

**Causes:**
1. `images` field is NULL
2. `images` is not an array
3. Malformed JSON

**Debug:**
```javascript
// In browser console
const { data } = await supabase
  .from('products')
  .select('images')
  .eq('id', 'YOUR_PRODUCT_ID')
  .single();
console.log('Images:', data?.images);
```

**Fix:**
```sql
-- Update product with empty array if NULL
UPDATE products 
SET images = '[]'::jsonb 
WHERE id = 'YOUR_PRODUCT_ID' AND images IS NULL;
```

---

### Issue 3: Supabase Storage Paths Not Resolving

**Symptoms:** Images show as broken, URLs look like `products/abc-123.jpg`

**Cause:** Storage paths need to be converted to public URLs

**Debug:**
```javascript
// Check if URL is a path or full URL
console.log('Image URL:', img.url);
console.log('Starts with http:', img.url.startsWith('http'));
```

**Fix:** Already handled in `normalizeImages()` function - automatically converts storage paths to public URLs

---

### Issue 4: Images Array Has Wrong Type

**Symptoms:** Console shows "⚠️ Images is not an array"

**Cause:** Database has string or object instead of array

**Fix:**
```sql
-- Check actual type
SELECT pg_typeof(images) FROM products WHERE id = 'YOUR_PRODUCT_ID';

-- Fix if needed
UPDATE products 
SET images = '[]'::jsonb 
WHERE id = 'YOUR_PRODUCT_ID';
```

---

## 🧪 Testing Images

### Test 1: Check Database Value
```sql
SELECT id, title, images 
FROM products 
WHERE id = 'YOUR_PRODUCT_ID';
```

Expected output:
```
images: [{"url": "https://...", "alt": "Front view"}]
```

### Test 2: Check Console Logs
Open DevTools → Console, should see:
```
🖼️ Raw images from DB: [{url: "...", alt: "..."}]
🖼️ Images type: object true
✅ Normalized images: [{url: "...", alt: "..."}]
```

### Test 3: Test Image URL Accessibility
```javascript
// In browser console
const testUrl = 'https://your-image-url.jpg';
fetch(testUrl)
  .then(r => console.log('✅ Image accessible:', r.ok, r.status))
  .catch(e => console.error('❌ Image fetch failed:', e));
```

### Test 4: Generate Public URL Manually
```javascript
// In browser console
const { data } = supabase.storage
  .from('product-images')
  .getPublicUrl('products/test.jpg');
console.log('Public URL:', data?.publicUrl);
```

---

## 📊 Image Preview Features

### ✅ What's Implemented

1. **Auto-normalization** - Handles both string[] and object[] formats
2. **Storage URL conversion** - Converts paths to public URLs
3. **Error fallback** - Shows placeholder on broken images
4. **Hover overlay** - Shows alt text on hover
5. **Debug logging** - Logs raw and normalized images
6. **Defensive parsing** - Handles NULL, malformed data

### 🖼️ Preview UI

```tsx
{formData.images && formData.images.length > 0 && (
  <div className="flex gap-2 mt-4 flex-wrap">
    {formData.images.map((img, idx) => (
      <div className="relative w-24 h-24 border rounded overflow-hidden group">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to placeholder
            (e.target as HTMLImageElement).src = 
              "data:image/svg+xml;base64,PHN2Zy4uLj4=";
          }}
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100">
          <span className="text-xs text-white">{imageAlt}</span>
        </div>
      </div>
    ))}
  </div>
)}
```

---

## 🔐 Storage Bucket Setup

### Create Bucket (If Not Exists)

```sql
-- Run in Supabase SQL Editor
-- Or create via Dashboard: Storage → New bucket

-- Bucket name: product-images
-- Public: true
-- File size limit: 10MB
-- Allowed MIME types: image/*
```

### Add RLS Policies

```sql
-- Allow public read (for product images)
CREATE POLICY "Allow public read access to product images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow users to update their own images
CREATE POLICY "Allow users to update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');
```

---

## 📝 Best Practices

1. **Always use object format** - `{url, alt}` for better accessibility
2. **Use public URLs** - Start with `https://` not storage paths
3. **Validate before saving** - Ensure URLs are accessible
4. **Provide alt text** - For accessibility and SEO
5. **Compress images** - Keep file sizes small (<500KB ideal)
6. **Use CDN** - Supabase Storage includes CDN by default

---

## 🎯 Quick Reference

| Format | Example | Handled? |
|--------|---------|----------|
| String array | `["url1", "url2"]` | ✅ Yes |
| Object array | `[{url, alt}]` | ✅ Yes |
| Mixed | `["url1", {url, alt}]` | ✅ Yes |
| NULL | `null` | ✅ Returns [] |
| Empty | `[]` | ✅ Returns [] |
| Invalid JSON | `"invalid"` | ✅ Returns [] |

---

## 🐛 Debug Checklist

- [ ] Console shows "🖼️ Raw images from DB"
- [ ] Console shows "🖼️ Images type: object true"
- [ ] Image URLs start with `http` or `https`
- [ ] Storage bucket `product-images` exists
- [ ] RLS policy allows public read
- [ ] No console errors about failed image loads
- [ ] Image previews visible in edit form

---

**Last Updated:** 2026-03-26  
**Component:** AdminProductEdit.tsx  
**Status:** ✅ Production Ready
