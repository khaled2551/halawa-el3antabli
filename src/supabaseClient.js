import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lbqyrtglpbpdztqovqvi.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0VLUqCy-cTG52KM2QInOvw_uZNp-AME';

// Public Supabase client governed strictly by Row Level Security (RLS)
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Allowed image mime types for security
 */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/jpg'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB max upload limit

/**
 * Extracts storage filename from Supabase public URL
 */
export const extractStoragePath = (url) => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/product-images\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Deletes an image from Supabase Storage bucket using public client
 */
export const deleteProductImage = async (imageUrl) => {
  const filePath = extractStoragePath(imageUrl);
  if (!filePath) return false;
  try {
    const { error } = await supabase.storage
      .from('product-images')
      .remove([filePath]);
    if (error) {
      console.warn('Storage delete warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to delete image from Supabase storage:', err);
    return false;
  }
};

/**
 * Uploads a product image to Supabase Storage with size/type validation,
 * and automatically deletes old image if exists. Falls back safely to Base64 if bucket RLS isn't set.
 */
export const uploadProductImage = async (file, oldImageUrl = null) => {
  if (!file) throw new Error('لم يتم تحديد أي ملف للرفع');

  // Security 1: File size validation (DoS / memory overflow prevention)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('حجم الصورة كبير جداً. الحد الأقصى المسموح به هو 5 ميجابايت.');
  }

  // Security 2: MIME type validation
  if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    throw new Error('نوع الملف غير مدعوم. يرجى رفع صورة بصيغة JPG أو PNG أو WebP فقط.');
  }

  // 1. Delete old image from Supabase if it was hosted there
  if (oldImageUrl) {
    try {
      await deleteProductImage(oldImageUrl);
    } catch (e) {
      console.warn('Old image delete ignored:', e);
    }
  }

  // 2. Sanitize and generate unique filename (prevent path traversal)
  const cleanExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${cleanExt}`;

  try {
    // Upload via standard public supabase client
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (err) {
    console.warn('Supabase storage upload fallback to local Base64:', err);
    // Safe fallback: read as Base64 Data URL so the user is never blocked
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
};

